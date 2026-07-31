import { cn } from "@rifa-app/ui/lib/utils";
import { ImageIcon } from "lucide-react";

/**
 * Prize photography. Always goes through `.washed` so it sits back into the
 * warm ground rather than on top of it, per the design system.
 *
 * Uses a plain <img> rather than next/image: raffle photos come from
 * UploadThing at arbitrary sizes and are always rendered at a fixed box, so
 * the optimizer earns nothing here and would need a remote-pattern entry per
 * storage host.
 */
export function PrizeImage({
	src,
	alt,
	className,
}: {
	src: string | null;
	alt: string;
	className?: string;
}) {
	if (!src) {
		return (
			<div
				className={cn(
					"grid size-full place-items-center bg-neutral-300 text-neutral-500",
					className,
				)}
			>
				<ImageIcon className="size-8" aria-hidden />
				<span className="sr-only">Sem foto do prêmio</span>
			</div>
		);
	}

	return (
		<img
			src={src}
			alt={alt}
			className={cn("washed size-full object-cover", className)}
			loading="lazy"
		/>
	);
}
