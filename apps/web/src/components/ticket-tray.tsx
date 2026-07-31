"use client";

import { formatMoney, padNumber } from "@rifa-app/api/lib/format";
import { Button } from "@rifa-app/ui/components/button";
import { useRouter } from "next/navigation";

import { useSelection } from "@/lib/selection";

/**
 * The bottom tray. Slides up once anything is selected and carries the running
 * total, removable chips, and the way forward.
 */
export function TicketTray({
	slug,
	priceCents,
	totalTickets,
}: {
	slug: string;
	priceCents: number;
	totalTickets: number;
}) {
	const router = useRouter();
	const { numbers, remove } = useSelection();

	const total = numbers.length * priceCents;
	const summary =
		numbers.length === 0
			? "Nenhum número ainda"
			: `${numbers.length} ${numbers.length === 1 ? "número escolhido" : "números escolhidos"}`;

	return (
		<div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[62%] from-background to-transparent px-4 pt-3.5 pb-5">
			<div
				className="transition-[transform,opacity] duration-300 ease-[cubic-bezier(.2,.9,.2,1)]"
				style={{
					transform: numbers.length ? "translateY(0)" : "translateY(135%)",
					opacity: numbers.length ? 1 : 0,
				}}
			>
				<div className="pointer-events-auto rounded-lg bg-neutral-900 px-3.5 py-3 text-neutral-100 shadow-md">
					<div className="flex gap-1.5 overflow-x-auto pb-2.5">
						{numbers.map((number) => (
							<button
								key={number}
								type="button"
								onClick={() => remove(number)}
								className="tabular flex-none rounded-pill bg-primary px-2.5 py-1 font-bold text-[11.5px] text-primary-foreground"
							>
								{padNumber(number, totalTickets)} ×
							</button>
						))}
					</div>

					<div className="flex items-center gap-3">
						<div className="min-w-0 flex-1">
							<div className="font-heading text-[21px] leading-[1.1]">
								{formatMoney(total)}
							</div>
							<div className="text-[11.5px] opacity-75">{summary}</div>
						</div>
						<Button
							onClick={() => router.push(`/r/${slug}/checkout`)}
							disabled={numbers.length === 0}
						>
							Continuar
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
