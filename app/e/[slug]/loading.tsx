export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-9 w-32 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="skeleton aspect-square rounded-md" />
        ))}
      </div>
    </div>
  );
}
