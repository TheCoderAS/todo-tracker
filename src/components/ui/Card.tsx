import type { ReactNode } from "react";

const baseClasses = "surface-card p-8 shadow-pop";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className }: CardProps) {
  return (
    <div className={`${baseClasses}${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
