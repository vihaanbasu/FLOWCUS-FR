import { motion } from 'framer-motion';

/**
 * @param {object} props
 * @param {React.ReactNode} [props.actions]
 */
export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </motion.div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
