"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Upload, RotateCcw, Loader2 } from "lucide-react";
import {
  describeAllFromImage,
  describeFromImage,
  distance,
  loadFaceApi,
  loadImage,
} from "@/lib/face/faceApi";
import { getCachedFaces, setCachedFaces } from "@/lib/face/cache";
import { thumbUrl } from "@/lib/storage";
import type { PhotoRow } from "@/lib/types";
import { Lightbox } from "../Lightbox";

const MATCH_THRESHOLD = 0.55; // lower = stricter; 0.5–0.6 is typical

type Stage = "idle" | "capturing" | "computing-self" | "scanning" | "done";

export function FaceFinder({ photos }: { photos: PhotoRow[] }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [matches, setMatches] = useState<PhotoRow[]>([]);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Webcam refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Pre-warm models on mount.
  useEffect(() => {
    loadFaceApi().catch((e) => setError(`โหลดโมเดล AI ไม่สำเร็จ: ${e.message}`));
    return () => stopCamera();
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      setStage("capturing");
      // Wait next tick for video element to mount.
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (e) {
      setError(
        `เปิดกล้องไม่ได้: ${e instanceof Error ? e.message : "permission denied"}`,
      );
    }
  }

  async function captureSelfie() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth, video.videoHeight) || 480;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror selfie horizontally (more natural).
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setSelfiePreview(dataUrl);
    stopCamera();
    await processSelfie(canvas);
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelfiePreview(url);
    try {
      const img = await loadImageFromBlob(url);
      await processSelfie(img);
    } catch (err) {
      setError(`อ่านรูปไม่ได้: ${err instanceof Error ? err.message : "error"}`);
    }
  }

  const processSelfie = useCallback(
    async (input: HTMLImageElement | HTMLCanvasElement) => {
      setStage("computing-self");
      setError(null);
      try {
        const selfDesc = await describeFromImage(input);
        if (!selfDesc) {
          setError("ไม่พบใบหน้าในรูป selfie กรุณาลองใหม่");
          setStage("idle");
          setSelfiePreview(null);
          return;
        }
        await scanAllPhotos(selfDesc);
      } catch (err) {
        setError(
          `ประมวลผลล้มเหลว: ${err instanceof Error ? err.message : "error"}`,
        );
        setStage("idle");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photos],
  );

  async function scanAllPhotos(selfDesc: Float32Array) {
    setStage("scanning");
    setProgress({ done: 0, total: photos.length });
    const matched: PhotoRow[] = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      try {
        let faces = await getCachedFaces(photo.id);
        if (!faces) {
          const img = await loadImage(thumbUrl(photo));
          const detected = await describeAllFromImage(img);
          faces = detected;
          await setCachedFaces(photo.id, faces);
        }

        const best = faces.reduce<number>(
          (min, f) => Math.min(min, distance(selfDesc, f)),
          Infinity,
        );
        if (best <= MATCH_THRESHOLD) {
          matched.push(photo);
          setMatches([...matched]);
        }
      } catch {
        // skip this photo
      }
      setProgress({ done: i + 1, total: photos.length });
    }

    setStage("done");
  }

  function reset() {
    stopCamera();
    setStage("idle");
    setError(null);
    setMatches([]);
    setSelfiePreview(null);
    setProgress({ done: 0, total: 0 });
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">
      {error && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {stage === "idle" && (
        <div className="mx-auto max-w-md space-y-5 py-6">
          <div className="rounded-2xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">วิธีใช้</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>ถ่าย selfie หรือเลือกรูปใบหน้าตัวเอง</li>
              <li>ระบบจะค้นหารูปที่มีคุณในงานทั้งหมด</li>
              <li>ใบหน้าไม่ส่งออกเซิร์ฟเวอร์ ประมวลผลในเครื่องคุณเอง</li>
            </ol>
          </div>

          <button
            type="button"
            onClick={startCamera}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground"
          >
            <Camera className="h-4 w-4" />
            ถ่าย Selfie ด้วยกล้อง
          </button>

          <label className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border text-sm font-medium">
            <Upload className="h-4 w-4" />
            หรือเลือกรูปจากเครื่อง
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onUpload}
            />
          </label>

          <p className="text-center text-xs text-muted-foreground">
            อัลบั้มมี {photos.length} รูป
          </p>
        </div>
      )}

      {stage === "capturing" && (
        <div className="mx-auto max-w-md space-y-4">
          <div className="overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-auto w-full -scale-x-100"
            />
          </div>
          <button
            type="button"
            onClick={captureSelfie}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground"
          >
            <Camera className="h-4 w-4" />
            ถ่ายรูป
          </button>
          <button
            type="button"
            onClick={reset}
            className="h-10 w-full text-sm text-muted-foreground"
          >
            ยกเลิก
          </button>
        </div>
      )}

      {(stage === "computing-self" || stage === "scanning") && (
        <div className="mx-auto max-w-md space-y-4 py-6 text-center">
          {selfiePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selfiePreview}
              alt="selfie"
              className="mx-auto h-32 w-32 rounded-full object-cover"
            />
          )}
          <div className="flex items-center justify-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {stage === "computing-self"
              ? "กำลังวิเคราะห์ใบหน้า..."
              : `กำลังค้นหา (${progress.done}/${progress.total})`}
          </div>
          {stage === "scanning" && (
            <>
              <div className="mx-auto h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              {matches.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  เจอแล้ว {matches.length} รูป
                </p>
              )}
            </>
          )}
        </div>
      )}

      {stage === "done" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">
              พบ <span className="font-semibold">{matches.length}</span> รูป
              จากทั้งหมด {photos.length} รูป
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              ค้นใหม่
            </button>
          </div>

          {matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
              ไม่เจอรูปที่ตรงกับใบหน้าของคุณในอัลบั้มนี้
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:grid-cols-5">
              {matches.map((photo, i) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="photo-in relative aspect-square overflow-hidden rounded-md bg-muted"
                >
                  <Image
                    src={thumbUrl(photo)}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={matches}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  );
}

function loadImageFromBlob(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load error"));
    img.src = url;
  });
}
