export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center">
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {description && (
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
