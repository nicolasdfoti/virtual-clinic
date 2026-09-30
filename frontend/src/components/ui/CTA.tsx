import { Link } from 'react-router-dom';
import type { ButtonProps } from './Button';
import { buttonClasses } from './buttonStyles';

export interface CTAProps {
  title: string;
  description?: string;
  primaryAction: {
    label: string;
    href: string;
    variant?: ButtonProps['variant'];
    size?: ButtonProps['size'];
    external?: boolean;
  };
  secondaryAction?: {
    label: string;
    href: string;
    variant?: ButtonProps['variant'];
    size?: ButtonProps['size'];
    external?: boolean;
  };
  align?: 'left' | 'center';
  className?: string;
  background?: 'none' | 'sky' | 'slate' | 'white' | 'emerald';
}

const backgroundStyles = {
  none: '',
  sky: 'bg-sky-50',
  slate: 'bg-slate-950 text-white',
  white: 'bg-white',
  emerald: 'bg-emerald-50',
};

function ActionButton({
  href,
  children,
  variant = 'primary',
  size = 'lg',
  external = false,
  isDark = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  external?: boolean;
  isDark?: boolean;
}) {
  const resolvedVariant = variant || (isDark ? 'outline' : 'primary');
  const className = buttonClasses({ variant: resolvedVariant, size });

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

export function CTA({
  title,
  description,
  primaryAction,
  secondaryAction,
  align = 'center',
  className = '',
  background = 'none',
}: CTAProps) {
  const isDark = background === 'slate';

  return (
    <section
      className={`
        py-16 sm:py-24
        ${backgroundStyles[background]}
        ${className}
      `}
      aria-labelledby="cta-title"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`max-w-3xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
          <h2 id="cta-title" className={`text-3xl font-bold sm:text-4xl ${isDark ? 'text-white' : 'text-sky-900'}`}>
            {title}
          </h2>
          {description && (
            <p className={`mt-4 text-lg leading-relaxed ${isDark ? 'text-sky-100' : 'text-slate-600'}`}>
              {description}
            </p>
          )}
          <div className={`mt-8 flex flex-col gap-4 sm:flex-row ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
            <ActionButton
              href={primaryAction.href}
              variant={primaryAction.variant}
              size={primaryAction.size}
              external={primaryAction.external}
              isDark={isDark}
            >
              {primaryAction.label}
            </ActionButton>
            {secondaryAction && (
              <ActionButton
                href={secondaryAction.href}
                variant={secondaryAction.variant}
                size={secondaryAction.size}
                external={secondaryAction.external}
                isDark={isDark}
              >
                {secondaryAction.label}
              </ActionButton>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export interface TrustIndicatorsProps {
  items: Array<{
    icon: string;
    label: string;
  }>;
  className?: string;
}

export function TrustIndicators({ items, className = '' }: TrustIndicatorsProps) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 ${className}`}>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          <span aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  );
}