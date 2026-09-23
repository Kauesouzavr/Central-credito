import { twMerge } from 'tailwind-merge';

export function GlassPanel({ strong = false, as = 'div', className, children, ...rest }) {
  const Tag = as;
  return (
    <Tag className={twMerge(strong ? 'glass-strong' : 'glass', 'rounded-3xl', className)} {...rest}>
      {children}
    </Tag>
  );
}
