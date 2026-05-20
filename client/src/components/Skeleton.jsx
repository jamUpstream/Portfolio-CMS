export default function Skeleton({ lines = 6 }) {
  return (
    <div className="space-y-3" aria-label="Loading">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="h-5 animate-pulse rounded bg-current/10" style={{ width: `${92 - index * 7}%` }} />
      ))}
    </div>
  );
}
