"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Upload, RotateCcw, Loader2, Lock } from "lucide-react";
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
  const cancelRef = useRef(false);

  useEffect(() => {
    loadFaceApi().catch((e) => setError(`โหลดโมเดล AI ไม่สำเร็จ: ${e.message}`));
    return () => {
      stopCamera();
      cancelRef.current = true;
    };
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
    cancelRef.current = false;
    setStage("scanning");
    setProgress({ done: 0, total: photos.length });
    const matched: PhotoRow[] = [];
    let done = 0;
    let lastFlush = 0;
    const CONCURRENCY = 4;
    const queue = [...photos];

    function flush() {
      setProgress({ done, total: photos.length });
      setMatches(matched.slice());
      lastFlush = Date.now();
    }

    async function worker() {
      while (queue.length > 0 && !cancelRef.current) {
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
          }
        } catch {
          // skip
        }
        done++;
        if (Date.now() - lastFlush >= 150 || done === photos.length) {
          flush();
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, photos.length) }, worker));
    if (!cancelRef.current) {
      flush();
      setStage("done");
    }
  }

  function reset() {
    cancelRef.current = true;
    stopCamera();
    setStage("idle");
    setError(null);
    setMatches([]);
    setSelfiePreview(null);
    setProgress({ done: 0, total: 0 });
  }

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-10 pt-2">
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-red-950/40 p-4 text-sm text-red-300">
          <span className="text-base leading-tight">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ─── IDLE ─── */}
      {stage === "idle" && (
        <div className="flex flex-col items-center gap-6">
          {/* hero */}
          <div className="flex flex-col items-center gap-3 pt-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60 p-3 shadow-lg shadow-fuchsia-500/10 ring-1 ring-border">
              <Image src="/icon.png" width={56} height={56} alt="PhotoLive" className="h-14 w-14" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">ค้นหารูปของคุณ</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                ถ่าย selfie แล้วระบบจะหารูปที่มีคุณให้อัตโนมัติ
              </p>
            </div>
          </div>

          {/* steps */}
          <div className="w-full space-y-2">
            {[
              { n: "1", label: "ถ่าย selfie หรือเลือกรูปจากเครื่อง" },
              { n: "2", label: "AI ค้นหาใบหน้าของคุณในอัลบั้ม" },
              { n: "3", label: "ดู และดาวน์โหลดรูปที่พบได้เลย" },
            ].map(({ n, label }) => (
              <div key={n} className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-orange-400 text-xs font-bold text-white">
                  {n}
                </span>
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={startCamera}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 text-[15px] font-bold text-white shadow-lg shadow-fuchsia-500/20 transition-transform active:scale-[0.97] hover:scale-[1.01]"
            >
              <Camera className="h-5 w-5" />
              ถ่าย Selfie ด้วยกล้อง
            </button>

            <label className="flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-border bg-muted/20 text-[15px] font-medium transition-colors hover:bg-muted/40 active:scale-[0.97]">
              <Upload className="h-4 w-4 text-muted-foreground" />
              เลือกรูปจากเครื่อง
              <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
            </label>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            อัลบั้มมี {photos.length} รูป
            <span className="text-border">·</span>
            <Lock className="h-3 w-3" />
            ประมวลผลบนอุปกรณ์ของคุณเท่านั้น
          </p>
        </div>
      )}

      {/* ─── CAPTURING ─── */}
      {stage === "capturing" && (
        <div className="flex flex-col gap-4">
          <p className="text-center text-sm text-muted-foreground">จัดให้ใบหน้าอยู่กลางกรอบ แล้วกดถ่าย</p>
          <div className="relative overflow-hidden rounded-3xl bg-black shadow-xl">
            <video ref={videoRef} playsInline muted className="h-auto w-full -scale-x-100" />
            {/* face guide overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-52 w-40 rounded-full border-2 border-white/40" />
            </div>
          </div>
          <button
            type="button"
            onClick={captureSelfie}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition-transform active:scale-95"
            aria-label="ถ่ายรูป"
          >
            <span className="h-12 w-12 rounded-full border-2 border-zinc-400 bg-white" />
          </button>
          <button type="button" onClick={reset} className="mt-1 w-full text-sm text-muted-foreground">
            ยกเลิก
          </button>
        </div>
      )}

      {/* ─── PROCESSING ─── */}
      {(stage === "computing-self" || stage === "scanning") && (
        <div className="flex flex-col items-center gap-6 py-12">
          <div className="relative">
            {selfiePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selfiePreview}
                alt="selfie"
                className="h-28 w-28 rounded-full object-cover shadow-md"
              />
            )}
            <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow">
              <Loader2 className="h-4 w-4 animate-spin" />
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <p className="font-semibold">
              {stage === "computing-self" ? "กำลังวิเคราะห์ใบหน้า…" : "กำลังค้นหารูปของคุณ…"}
            </p>
            {stage === "scanning" && (
              <>
                <p className="text-sm text-muted-foreground">
                  {progress.done} / {progress.total} รูป
                  {matches.length > 0 && ` · เจอแล้ว ${matches.length} รูป`}
                </p>
                <div className="mt-1 h-1.5 w-64 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 transition-all duration-300"
                    style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── DONE ─── */}
      {stage === "done" && (
        <div className="space-y-5">
          {/* result header */}
          <div className="flex items-center justify-between">
            {matches.length > 0 ? (
              <div>
                <p className="text-2xl font-bold">{matches.length} รูป</p>
                <p className="text-sm text-muted-foreground">ที่พบว่ามีคุณอยู่</p>
              </div>
            ) : (
              <p className="font-semibold">ไม่พบรูปที่ตรงกัน</p>
            )}
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-muted/20 px-4 text-sm font-medium transition-colors hover:bg-muted/40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              ลองใหม่
            </button>
          </div>

          {/* selfie + status */}
          {selfiePreview && (
            <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selfiePreview} alt="selfie" className="h-14 w-14 rounded-full object-cover shadow" />
              <div>
                <p className="text-sm font-medium">
                  {matches.length > 0 ? `พบ ${matches.length} รูปที่มีคุณ 🎉` : "ไม่พบรูปที่ตรงกัน"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {matches.length > 0 ? "แตะรูปเพื่อดูหรือดาวน์โหลด" : "ลองถ่ายใหม่ที่แสงดีขึ้น"}
                </p>
              </div>
            </div>
          )}

          {/* photo grid */}
          {matches.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-border py-16 text-center">
              <span className="text-4xl">😔</span>
              <p className="text-sm text-muted-foreground">ไม่พบรูปที่ตรงกับใบหน้าของคุณ</p>
              <button
                type="button"
                onClick={reset}
                className="mt-1 h-10 rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 px-6 text-sm font-bold text-white shadow-md shadow-fuchsia-500/20"
              >
                ลองถ่ายใหม่
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-2xl sm:grid-cols-4">
              {matches.map((photo, i) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="relative aspect-square overflow-hidden bg-muted transition-opacity active:opacity-80"
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