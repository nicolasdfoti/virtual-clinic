import type { HTMLAttributes } from 'react';

export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, type CardProps } from './Card';
export { CTA, TrustIndicators, type CTAProps, type TrustIndicatorsProps } from './CTA';

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  className = '',
}: SectionHeaderProps) {
  return (
    <header className={`mx-auto max-w-3xl ${align === 'center' ? 'text-center' : ''} ${className}`}>
      {eyebrow && (
        <p className="font-semibold text-sky-600 tracking-wide uppercase text-sm">
          {eyebrow}
        </p>
      )}
      <h2 className={`mt-2 text-3xl font-bold text-sky-900 sm:text-4xl lg:text-5xl ${eyebrow ? '' : 'mt-0'}`}>
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          {description}
        </p>
      )}
    </header>
  );
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger';
  size?: 'sm' | 'md';
  dot?: boolean;
}

const badgeVariantStyles = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-sky-100 text-sky-700',
  danger: 'bg-red-100 text-red-700',
};

const badgeSizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${badgeVariantStyles[variant]}
        ${badgeSizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
}

const avatarSizeStyles = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-xl',
  '2xl': 'h-32 w-32 text-2xl',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ src, alt, name, size = 'md', shape = 'circle', className = '', ...props }: AvatarProps) {
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={`${avatarSizeStyles[size]} ${shapeClass} object-cover ${className}`}
        {...props}
      />
    );
  }

  const bgColors = [
    'bg-sky-100 text-sky-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-violet-100 text-violet-700',
    'bg-rose-100 text-rose-700',
    'bg-teal-100 text-teal-700',
  ];

  const colorIndex = name ? name.charCodeAt(0) % bgColors.length : 0;

  return (
    <div
      className={`${avatarSizeStyles[size]} ${shapeClass} flex items-center justify-center font-semibold ${bgColors[colorIndex]} ${className}`}
      {...props}
      aria-label={name || 'Avatar'}
    >
      {name ? getInitials(name) : '?'}
    </div>
  );
}

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  variant?: 'default' | 'dashed' | 'gradient';
  withText?: string;
}

export function Divider({ variant = 'default', withText, className = '', ...props }: DividerProps) {
  const variantStyles = {
    default: 'border-slate-200',
    dashed: 'border-slate-200 border-dashed',
    gradient: 'bg-gradient-to-r from-transparent via-sky-300 to-transparent border-0 h-px',
  };

  if (withText) {
    return (
      <div className={`flex items-center gap-4 ${className}`} role="separator" {...props}>
        <hr className="flex-1 border-slate-200" />
        <span className="px-4 text-sm font-medium text-slate-500 whitespace-nowrap">{withText}</span>
        <hr className="flex-1 border-slate-200" />
      </div>
    );
  }

  return <hr className={`${variantStyles[variant]} ${className}`} {...props} />;
}