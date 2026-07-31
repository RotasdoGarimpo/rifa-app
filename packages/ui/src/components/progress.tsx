import { cn } from "@rifa-app/ui/lib/utils";
import type * as React from "react";

/**
 * How full a raffle is. Kept as a plain element rather than a Base UI
 * primitive: it is presentational, and the accessible value lives on the
 * surrounding copy ("58 de 200 números tomados").
 */
function Progress({
	value,
	max = 100,
	className,
	barClassName,
	...props
}: React.ComponentProps<"div"> & {
	value: number;
	max?: number;
	barClassName?: string;
}) {
	const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

	return (
		<div
			data-slot="progress"
			role="progressbar"
			aria-valuenow={Math.round(percent)}
			aria-valuemin={0}
			aria-valuemax={100}
			className={cn(
				"h-2.5 w-full overflow-hidden rounded-pill bg-neutral-300",
				className,
			)}
			{...props}
		>
			<div
				className={cn(
					"h-full rounded-pill bg-primary transition-[width] duration-700 ease-out",
					barClassName,
				)}
				style={{ width: `${percent}%` }}
			/>
		</div>
	);
}

export { Progress };
