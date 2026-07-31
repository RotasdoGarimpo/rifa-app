import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@rifa-app/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * Organic buttons: pill-shaped, set in the display face, with generous padding.
 * States come from the brand ramp rather than opacity tricks.
 */
const buttonVariants = cva(
	// Note: no border-colour class here. `buttonVariants()` is exported for use
	// directly on links, where it is not passed through twMerge, so a base
	// `border-transparent` would compete with a variant's `border-border` at
	// equal specificity and win or lose by stylesheet order. Each variant owns
	// its border colour instead.
	"inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-pill border font-heading leading-tight outline-none transition-[background-color,color,box-shadow,transform] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-primary-foreground hover:bg-brand-600 active:bg-brand-700",
				secondary:
					"border-border bg-transparent text-foreground hover:bg-foreground/[0.07] active:bg-foreground/[0.14]",
				surface:
					"border-transparent bg-card text-foreground hover:bg-neutral-300 active:bg-neutral-400",
				sage: "border-transparent bg-sage-600 text-sage-100 hover:bg-sage-700 active:bg-sage-800",
				ghost:
					"border-transparent text-primary hover:bg-primary/10 active:bg-primary/[0.18]",
				destructive:
					"border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/30",
				link: "border-transparent text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-10 px-4 text-sm",
				// xs / icon-xs are kept for the inherited chat components
				// (input-group, attachment), which are not part of this design.
				xs: "h-6 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
				sm: "h-8 px-3 text-xs",
				lg: "h-13 px-6 text-base",
				icon: "size-10",
				"icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
				"icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
				"icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
			},
			block: {
				true: "w-full",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	block,
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, block, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
