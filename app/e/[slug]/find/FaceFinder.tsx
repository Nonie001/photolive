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

const MATCH_THRESHOLD = 0.55;

type Stage = "idle" | "capturing" | "computing-self" | "scanning" | "done";

export function FaceFinder({ photos }: { photos: PhotoRow[] }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [matches, setMatches] = useState<PhotoRow[]>([]);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (e) {
      setError(`เปิดกล้องไม่ได้: ${e instanceof Error ? e.message : "permission denied"}`);
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
        setError(`ประมวลผลล้มเหลว: ${err instanceof Error ? err.message : "error"}`);
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
    let done = 0;
    const CONCURRENCY = 4;
    const queue = [...photos];

    async function worker() {
      while (queue.length > 0) {
        const photo = queue.shift();
        if (!photo) break;
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
          // skip
        }
        done++;
        setProgress({ done, total: photos.length });
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, photos.length) }, worker));
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
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          <span className="mt-0.5 text-base">&#9888;</span>
          <span>{error}</span>
        </div>
      )}

      {stage === "idle" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">วิธีใช้</p>
            <div className="space-y-2.5">
              {[
                "ถ่าย selfie หรือเลือกรูปใบหน้าตัวเอง",
                "ระบบค้นหารูปที่มีคุณในอัลบั้มทั้งหมด",
                "ใบหน้าไม่ส่งออกเซิร์ฟเวอร์ ประมวลผลในเครื่องเท่านั้น",
              ].map((text) => (
                <div key={text} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={startCamera}
            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-foreground text-sm font-semibold text-background shadow-sm transition-transform active:scale-[0.98]"
          >
            <Camera className="h-5 w-5" />
            ถ่าย Selfie ด้วยกล้อง
          </button>

          <label className="flex h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-2 border-border text-sm font-semibold transition-colors hover:bg-muted active:scale-[0.98]">
            <Upload className="h-5 w-5" />
            เลือกรูปจากเครื่อง
            <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </label>

          <p className="text-center text-xs text-muted-foreground">อัลบั้มมี {photos.length} รูป</p>
        </div>
      )}

      {stage === "capturing" && (
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-2xl bg-black shadow-lg">
            <video ref={videoRef} playsInline muted className="h-auto w-full -scale-x-100" />
          </div>
          <button
            type="button"
            onClick={captureSelfie}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-foreground text-sm font-semibold text-background transition-transform active:scale-[0.98]"
          >
            <Camera className="h-5 w-5" />
            ถ่ายรูป
          </button>
          <button type="button" onClick={reset} className="h-10 w-full text-sm text-muted-foreground">
            ยกเลิก
          </button>
        </div>
      )}

      {(stage === "computing-self" || stage === "scanning") && (
        <div className="flex flex-col items-center gap-5 py-10">
          {selfiePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selfiePreview} alt="selfie" className="h-24 w-24 rounded-full object-cover ring-4 ring-border shadow" />
          )}
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm font-medium">
              {stage === "computing-self" ? "กำลังวิเคราะห์ใบหน้า..." : `กำลังค้นหา ${progress.done} / ${progress.total}`}
            </p>
            {stage === "scanning" && (
              <>
                <div className="h-1.5 w-56 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-300"
                    style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                  />
                </div>
                {matches.length > 0 && (
                  <p className="text-xs text-muted-foreground">เจอแล้ว {matches.length} รูป</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {stage === "done" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-2xl font-bold">{matches.length}</span>
              <span className="ml-1.5 text-sm text-muted-foreground">รูป จาก {photos.length} รูป</span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              ค้นใหม่
            </button>
          </div>

          {selfiePreview && (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selfiePreview} alt="selfie" className="h-12 w-12 rounded-full object-cover" />
              <p className="text-sm text-muted-foreground">
                {matches.length === 0 ? "ไม่พบรูปที่ตรงกัน" : `พบ ${matches.length} รูปที่มีคุณอยู่`}
              </p>
            </div>
          )}

          {matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="mb-2 text-sm text-muted-foreground">ไม่พบรูปที่ตรงกับใบหน้าของคุณ</p>
              <p className="mt-1 text-xs text-muted-foreground">ลองถ่าย selfie ใหม่ที่แสงชัดขึ้น</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 sm:grid-cols-4 sm:gap-1">
              {matches.map((photo, i) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="photo-in relative aspect-square overflow-hidden bg-muted"
                >
                  <Image
                    src={thumbUrl(photo)}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 33vw, 25vw"
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

async function loadImageFromBlob(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}