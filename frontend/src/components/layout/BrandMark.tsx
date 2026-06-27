type BrandMarkProps = {
  size?: number;
  className?: string;
};

export function BrandMark({ size = 28, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <rect x="2" y="4" width="24" height="4" rx="0.5" />
      <rect x="11" y="8" width="6" height="16" rx="0.5" />
    </svg>
  );
}
