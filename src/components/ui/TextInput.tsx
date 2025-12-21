import type { InputHTMLAttributes } from "react";

const inputClasses =
  "w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export default function TextInput({ className, ...props }: TextInputProps) {
  return <input className={`${inputClasses}${className ? ` ${className}` : ""}`} {...props} />;
}
