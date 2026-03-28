const inputClass =
  'w-full rounded-xl bg-black/35 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-500/30 outline-none transition-colors';

export function TextField({ label, id, className = '', ...props }) {
  const cid = id || (typeof label === 'string' ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      )}
      <input id={cid} className={`${inputClass} ${label ? 'mt-1' : ''}`} {...props} />
    </label>
  );
}

export function SelectField({ label, id, children, className = '', ...props }) {
  const cid = id || 'select';
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      )}
      <select
        id={cid}
        className={`${inputClass} ${label ? 'mt-1' : ''} cursor-pointer`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
