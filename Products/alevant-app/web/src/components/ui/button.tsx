import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "brass" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "bg-indigo text-parchment hover:bg-indigo-deep border-indigo",
  ghost: "bg-transparent text-indigo border-indigo hover:bg-indigo hover:text-parchment",
  brass: "bg-brass text-ink hover:bg-brass-deep hover:text-parchment border-brass",
  danger: "bg-error text-parchment hover:opacity-90 border-error",
  subtle: "bg-bone text-ink hover:bg-mist border-mist",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-2 text-[10px] tracking-[0.18em]",
  md: "px-6 py-3 text-[11px] tracking-[0.18em]",
  lg: "px-8 py-4 text-xs tracking-[0.2em]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-medium uppercase border transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
