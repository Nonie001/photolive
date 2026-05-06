export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-5 w-16" />
      <div className="skeleton h-8 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
      </div>
      <div className="skeleton h-48 rounded-2xl" />
    </div>
  );
}
