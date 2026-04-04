import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-10 w-full rounded-[0.75rem] bg-[#edeef0] px-3.5 py-2 text-sm text-[#191c1e] placeholder:text-[#9ca3af] outline-none transition-all",
        "border-b-2 border-b-transparent focus:border-b-[#EA580C]",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
