"use client";

import { cn } from "@rifa-app/ui/lib/utils";

/**
 * The pill toggle used for "Combos prontos / Escolher na mão". Built on native
 * radios so it works without JavaScript and is keyboard-navigable by default.
 */
function Segmented<T extends string>({
	options,
	value,
	onValueChange,
	name,
	className,
}: {
	options: ReadonlyArray<{ value: T; label: string }>;
	value: T;
	onValueChange: (value: T) => void;
	name: string;
	className?: string;
}) {
	return (
		<div
			data-slot="segmented"
			className={cn("flex w-full gap-1.5", className)}
			role="radiogroup"
		>
			{options.map((option) => {
				const selected = option.value === value;

				return (
					<label
						key={option.value}
						className={cn(
							"flex flex-1 cursor-pointer items-center justify-center rounded-pill px-3 py-2.5 text-center font-semibold text-[13px] transition-colors",
							"has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-offset-2",
							selected
								? "bg-primary text-primary-foreground"
								: "bg-card text-neutral-800 hover:bg-neutral-300",
						)}
					>
						<input
							type="radio"
							name={name}
							value={option.value}
							checked={selected}
							onChange={() => onValueChange(option.value)}
							className="sr-only"
						/>
						{option.label}
					</label>
				);
			})}
		</div>
	);
}

export { Segmented };
