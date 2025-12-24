import type { SelectHTMLAttributes } from "react";

const selectClasses =
  "w-full bg-transparent pr-8 text-sm text-slate-100 outline-none transition-colors duration-200 ease-out";

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
};

export default function SelectInput({ className, ...props }: SelectInputProps) {
  return (
    <select className={`${selectClasses}${className ? ` ${className}` : ""}`} {...props} />
  );
}
