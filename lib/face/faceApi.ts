"use client";

/**
 * Lazy-loads @vladmandic/face-api models from /public/models.
 * Models total ~6MB; we only load on the /find route.
 *
 * Models used:
 *  - tinyFaceDetector  (fast face detection)
 *  - faceLandmark68Net (alignment)
 *  - faceRecognitionNet (128-d descriptor)
 */

import type * as FaceApi from "@vladmandic/face-api";

let modulePromise: Promise<typeof FaceApi> | null = null;
let loadPromise: Promise<typeof FaceApi> | null = null;

const MODEL_URL = "/models";

async function getModule(): Promise<typeof FaceApi> {
  if (!modulePromise) {
    modulePromise = import("@vladmandic/face-api");
  }
  return modulePromise;
}

export async function loadFaceApi(): Promise<typeof FaceApi> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const faceapi = await getModule();
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    return faceapi;
  })();
  return loadPromise;
}

/** Return the 128-d descriptor of the most prominent face, or null. */
export async function describeFromImage(
  img: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
): Promise<Float32Array | null> {
  const faceapi = await loadFaceApi();
  const det = await faceapi
    .detectSingleFace(
      img,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }),
    )
    .withFaceLandmarks()
    .withFaceDescriptor();
  return det?.descriptor ?? null;
}

/** Return descriptors of ALL faces detected in an image. */
export async function describeAllFromImage(
  img: HTMLImageElement | HTMLCanvasElement,
): Promise<Float32Array[]> {
  const faceapi = await loadFaceApi();
  const dets = await faceapi
    .detectAllFaces(
      img,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }),
    )
    .withFaceLandmarks()
    .withFaceDescriptors();
  return dets.map((d) => d.descriptor);
}

/** Euclidean distance between two 128-d descriptors. */
export function distance(a: Float32Array, b: Float32Array | number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - (b[i] ?? 0);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/** Load an <img> from a URL (must be CORS-enabled). Returns ready element. */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}
