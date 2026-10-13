import type { ComponentProps, ElementType, ReactNode } from "react";

// One level only: a card never contains another bordered card. Group inside
// with spacing or <Divider />.
export function Card<T extends ElementType = "div">({
  as,
  className = "",
  children,
  ...props
}: { as?: T; className?: string; children: ReactNode } & Omit<ComponentProps<T>, "as" | "className" | "children">) {
  const Component = as ?? "div";
  return (
    <Component className={`card ${className}`} {...props}>
      {children}
    </Component>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`divider ${className}`} />;
}
