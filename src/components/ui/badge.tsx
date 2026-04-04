import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#EA580C] text-white",
        secondary: "bg-[#edeef0] text-[#5a4138]",
        success: "bg-[#dcfce7] text-[#166534]",
        warning: "bg-[#fff7ed] text-[#9a3412]",
        danger: "bg-[#fef2f2] text-[#991b1b]",
        info: "bg-[#eff6ff] text-[#1e40af]",
        outline: "border-[rgba(226,191,178,0.3)] text-[#5a4138]",
        whatsapp: "bg-[#dcfce7] text-[#166534]",
        pdv: "bg-[#dbeafe] text-[#1e40af]",
        ifood: "bg-[#fee2e2] text-[#991b1b]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
