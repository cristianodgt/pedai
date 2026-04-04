import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[0.75rem] text-sm font-medium whitespace-nowrap transition-all outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-[#a33900] to-[#cc4900] text-white hover:opacity-90",
        destructive:
          "bg-red-500/10 text-red-700 hover:bg-red-500/20",
        outline:
          "border border-[rgba(226,191,178,0.3)] bg-transparent text-[#191c1e] hover:bg-[#edeef0]",
        secondary:
          "bg-[#edeef0] text-[#5a4138] hover:bg-[#e2e3e5]",
        ghost:
          "hover:bg-[#edeef0] text-[#5a4138]",
        link: "text-[#EA580C] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        xs: "h-6 gap-1 px-2 text-xs",
        sm: "h-8 gap-1.5 px-3",
        lg: "h-11 px-6 text-base",
        xl: "h-12 px-8 text-base font-semibold",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
