import { motion } from 'framer-motion';

/**
 * @param {object} props
 * @param {boolean} [props.lift] - subtle hover lift
 */
export function Card({
  children,
  className = '',
  lift = false,
  ...rest
}) {
  return (
    <motion.div
      className={`rounded-2xl glass border border-white/10 ${className}`}
      whileHover={lift ? { y: -2 } : undefined}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        {title && (
          <h2 className="font-display font-semibold text-base sm:text-lg">{title}</h2>
        )}
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
