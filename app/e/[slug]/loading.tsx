import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center">
      {/* background image */}
      <Image
        src="/bg.jpg"
        alt=""
        fill
        className="object-cover object-center"
        style={{ filter: "blur(3px)", transform: "scale(1.05)" }}
        priority
      />
      {/* overlay */}
      <div className="absolute inset-0 bg-black/55" />

      {/* center content */}
      <div className="relative z-10 flex flex-col items-center gap-5 text-center px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md shadow-2xl">
          <Image src="/icon.png" width={44} height={44} alt="PhotoLive" className="h-11 w-11" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/45">
            PhotoLive
          </p>
          <div className="h-7 w-32 rounded-lg bg-white/10 animate-pulse" />
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
