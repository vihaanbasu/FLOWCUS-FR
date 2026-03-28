export function Spinner({ className = '' }) {
  return (
    <div
      className={`h-12 w-12 rounded-full border-2 border-white/15 border-t-indigo-400 animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
