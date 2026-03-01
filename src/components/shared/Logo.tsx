import { cn } from "@/lib/cn";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className }: LogoProps) {
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <span
      className={cn(
        "font-mono font-bold tracking-tight select-none",
        sizes[size],
        className
      )}
    >
      <span className="gradient-text">any</span>
      <span className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700">claw</span>
    </span>
  );
}
