import { classesBotao } from '../../../lib/buttonStyles';

export function Button({ variant = 'primary', size = 'md', icon, className, children, type = 'button', ...rest }) {
  return (
    <button type={type} className={classesBotao(variant, size, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}
