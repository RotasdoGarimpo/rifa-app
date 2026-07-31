import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@rifa-app/ui/lib/utils";
import type * as React from "react";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<InputPrimitive
			type={type}
			data-slot="input"
			className={cn(
				"h-11 w-full min-w-0 rounded-pill border border-input bg-card px-4 text-foreground text-sm caret-primary outline-none transition-colors",
				"placeholder:text-muted-foreground/70",
				"hover:border-foreground/45",
				"focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
				"disabled:pointer-events-none disabled:opacity-45",
				"aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
