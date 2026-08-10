import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "outline" | "ghost";
type ButtonSize = "sm" | "md";

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-accent text-bg hover:bg-accent/90",
  outline: "border border-accent/40 text-accent hover:bg-accent/10",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150",
        "disabled:pointer-events-none disabled:opacity-40",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
}
