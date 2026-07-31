import { cn } from "@rifa-app/ui/lib/utils";

/**
 * The phone-shaped canvas every screen sits in. The design is drawn at 390px;
 * on wider viewports it stays centred rather than stretching, because the
 * layouts (number grid, bottom tray) are composed for a thumb.
 */
export function Screen({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<main
			className={cn(
				// Exactly one viewport tall, never taller: children scroll their own
				// regions instead. This is what keeps the bottom tray pinned and
				// visible rather than pushed below the fold by a growing page.
				"relative mx-auto flex h-svh w-full max-w-[430px] flex-col overflow-hidden bg-background pt-2",
				className,
			)}
		>
			{children}
		</main>
	);
}
