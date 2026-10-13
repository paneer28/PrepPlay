import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export type ButtonVariant = "primary" | "success" | "danger" | "secondary" | "ghost" | "streak";
export type ButtonSize = "sm" | "md" | "lg";

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function buttonClass({ variant = "primary", size = "md", block = false, className = "" }: Omit<Common, "children">) {
  return [
    "btn",
    variant === "primary" ? "" : `btn-${variant}`,
    size === "md" ? "" : `btn-${size}`,
    block ? "btn-block" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant,
  size,
  block,
  icon,
  iconRight,
  className,
  children,
  type = "button",
  ...props
}: Common & Omit<ComponentProps<"button">, "children" | "className">) {
  return (
    <button type={type} className={buttonClass({ variant, size, block, className })} {...props}>
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  block,
  icon,
  iconRight,
  className,
  children,
  ...props
}: Common & Omit<ComponentProps<typeof Link>, "children" | "className">) {
  return (
    <Link className={buttonClass({ variant, size, block, className })} {...props}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}
