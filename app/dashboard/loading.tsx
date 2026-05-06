export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-10 w-32 rounded-full" />
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </ul>
    </div>
  );
}
