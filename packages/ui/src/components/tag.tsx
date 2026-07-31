import { cn } from "@rifa-app/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

/** Small pill labels: price, "faltam N", reservation status. */
const tagVariants = cva(
	"inline-flex items-center gap-1 whitespace-nowrap rounded-pill px-2.5 py-1 font-semibold text-xs leading-none tracking-[0.02em]",
	{
		variants: {
			variant: {
				brand: "bg-brand-100 text-brand-800",
				sage: "bg-sage-100 text-sage-800",
				neutral: "bg-neutral-100 text-neutral-800",
				solid: "bg-primary text-primary-foreground",
				outline: "border border-primary text-primary",
			},
		},
		defaultVariants: {
			variant: "neutral",
		},
	},
);

function Tag({
	className,
	variant,
	...props
}: React.ComponentProps<"span"> & VariantProps<typeof tagVariants>) {
	return (
		<span
			data-slot="tag"
			className={cn(tagVariants({ variant, className }))}
			{...props}
		/>
	);
}

export { Tag, tagVariants };
