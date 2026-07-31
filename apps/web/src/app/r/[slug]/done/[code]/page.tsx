"use client";

import { formatMoney, padNumber } from "@rifa-app/api/lib/format";
import { buttonVariants } from "@rifa-app/ui/components/button";
import { Tag } from "@rifa-app/ui/components/tag";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import Link from "next/link";
import { use } from "react";

import { PrizeImage } from "@/components/prize-image";
import { Screen } from "@/components/screen";
import { orpc } from "@/utils/orpc";

export default function DonePage({
	params,
}: {
	params: Promise<{ slug: string; code: string }>;
}) {
	const { code } = use(params);

	const { data: reservation, isPending } = useQuery(
		orpc.reservation.byCode.queryOptions({ input: { code } }),
	);

	if (isPending || !reservation) {
		return (
			<Screen>
				<div className="space-y-3 p-[18px]">
					<div className="size-[74px] animate-pulse rounded-pill bg-card" />
					<div className="h-8 w-2/3 animate-pulse rounded-pill bg-card" />
				</div>
			</Screen>
		);
	}

	const { raffle } = reservation;
	const paid = reservation.status === "PAID";

	return (
		<Screen>
			<div className="flex flex-1 flex-col justify-center overflow-y-auto px-[18px] py-5">
				<div className="grid size-[74px] place-items-center rounded-pill bg-sage-600 text-sage-100">
					<Check className="size-8" strokeWidth={2.75} />
				</div>

				<h3 className="mt-5 mb-2 text-[27px]">
					Reserva #{reservation.code} feita!
				</h3>
				<p className="m-0 mb-4 text-[13.5px] text-neutral-700">
					{paid
						? "Pagamento confirmado. Seus números estão garantidos. Boa sorte! 🍀"
						: "Já abrimos a conversa com a organização, com o valor certinho. Quando o PIX cair, seus números ficam verdes na grade. Boa sorte! 🍀"}
				</p>

				<div className="flex flex-col gap-2 rounded-lg bg-card p-3.5 shadow-sm">
					<div className="flex items-center gap-3">
						<div className="size-12 flex-none overflow-hidden rounded-md bg-neutral-300">
							<PrizeImage src={raffle.imageUrl} alt={raffle.title} />
						</div>
						<div className="min-w-0">
							<div className="font-heading text-[15px] leading-[1.15]">
								{raffle.title}
							</div>
							<div className="text-[12px] text-neutral-700">
								{reservation.numbers.length} × {formatMoney(raffle.priceCents)}{" "}
								· {formatMoney(reservation.totalCents)}
							</div>
						</div>
					</div>
					<div className="flex flex-wrap gap-1.5">
						{reservation.numbers.map((number) => (
							<Tag
								key={number}
								variant={paid ? "sage" : "solid"}
								className="tabular"
							>
								{padNumber(number, raffle.totalTickets)}
							</Tag>
						))}
					</div>
				</div>

				<a
					href={reservation.whatsappHref}
					target="_blank"
					rel="noreferrer"
					className={buttonVariants({
						variant: "secondary",
						block: true,
						className: "mt-4",
					})}
				>
					Abrir a conversa de novo
				</a>

				<Link
					href="/"
					className={buttonVariants({
						variant: "ghost",
						block: true,
						className: "mt-2",
					})}
				>
					Voltar ao início
				</Link>
			</div>
		</Screen>
	);
}
