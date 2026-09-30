import type { ButtonSize, ButtonVariant } from './Button';

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500 shadow-md',
  secondary: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-700',
  outline: 'border-2 border-sky-600 text-sky-600 hover:bg-sky-50 focus:ring-sky-500',
  ghost: 'text-sky-600 hover:bg-sky-50 focus:ring-sky-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
  xl: 'px-9 py-4 text-xl',
};

const baseStyles =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * Clases compartidas para que los enlaces con apariencia de botón
 * (CTA final, cards, etc.) reutilicen los mismos estilos que `<Button>`.
 */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
}
