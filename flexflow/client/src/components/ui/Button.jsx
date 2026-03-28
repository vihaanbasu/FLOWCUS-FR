const variants = {
  primary:
    'bg-indigo-500 hover:bg-indigo-400 text-white shadow-soft border border-indigo-400/30',
  secondary:
    'bg-white/10 hover:bg-white/15 border border-white/15 text-slate-100',
  ghost: 'bg-transparent hover:bg-white/10 border border-transparent text-slate-300',
  danger:
    'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200',
  success:
    'bg-emerald-500/90 hover:bg-emerald-400 text-white border border-emerald-400/40',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-sm rounded-2xl font-semibold',
};

/**
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'|'success'} [props.variant]
 * @param {'sm'|'md'|'lg'} [props.size]
 */
export function Button({
  children,
  className = '',
  variant = 'secondary',
  size = 'md',
  type = 'button',
  disabled,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-45 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400/80 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
