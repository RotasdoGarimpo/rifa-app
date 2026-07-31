import { cn } from "@rifa-app/ui/lib/utils";
import type * as React from "react";

/**
 * Organic cards: surface-filled, over-rounded, no ring. Elevation is opt-in via
 * the `elevated` prop rather than baked in, because the design uses flat
 * surfaces far more often than raised ones.
 */
function Card({
	className,
	size = "default",
	elevated = false,
	...props
}: React.ComponentProps<"div"> & {
	size?: "default" | "sm";
	elevated?: boolean;
}) {
	return (
		<div
			data-slot="card"
			data-size={size}
			className={cn(
				"group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-lg bg-card p-(--card-spacing) text-card-foreground [--card-spacing:--spacing(4)]",
				"data-[size=sm]:[--card-spacing:--spacing(3)]",
				"has-[>img:first-child]:pt-0 *:[img:first-child]:-mx-(--card-spacing) *:[img:first-child]:-mt-(--card-spacing)",
				elevated && "shadow-sm",
				className,
			)}
			{...props}
		/>
	);
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-header"
			className={cn(
				"@container/card-header grid auto-rows-min items-start gap-1 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
				className,
			)}
			{...props}
		/>
	);
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-title"
			className={cn(
				"font-heading text-lg leading-tight group-data-[size=sm]/card:text-base",
				className,
			)}
			{...props}
		/>
	);
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-description"
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-action"
			className={cn("col-start-2 row-span-2 row-start-1 self-start", className)}
			{...props}
		/>
	);
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-content"
			className={cn("text-sm", className)}
			{...props}
		/>
	);
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-footer"
			className={cn("flex items-center gap-2", className)}
			{...props}
		/>
	);
}

export {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
};
