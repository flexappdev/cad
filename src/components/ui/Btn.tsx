import { cn } from "@/lib/cn";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANT: Record<Variant, string> = {
  primary:   "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "bg-surface-2 text-foreground hover:bg-surface-3 border border-border",
  ghost:     "text-foreground hover:bg-surface-2",
  outline:   "border border-border bg-background text-foreground hover:bg-surface-2",
};

const SIZE: Record<Size, string> = {
  sm:   "h-7 px-2.5 text-xs gap-1.5 rounded-md",
  md:   "h-9 px-3.5 text-sm gap-2 rounded-lg",
  lg:   "h-10 px-5 text-sm gap-2 rounded-lg",
  icon: "h-9 w-9 rounded-lg",
};

export interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Btn = forwardRef<HTMLButtonElement, BtnProps>(function Btn(
  { variant = "primary", size = "md", className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      {...rest}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
    >
      {children}
    </button>
  );
});
