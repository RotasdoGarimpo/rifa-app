"use client";

import { formatMoney, formatPhone, padNumber } from "@rifa-app/api/lib/format";
import { Button, buttonVariants } from "@rifa-app/ui/components/button";
import { Tag } from "@rifa-app/ui/components/tag";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use, useState } from "react";

import { PrizeImage } from "@/components/prize-image";
import { Screen } from "@/components/screen";
import { formatDrawDate } from "@/lib/dates";
import { orpc } from "@/utils/orpc";

export default function SummaryPage({
	params,
}: {
	params: Promise<{ slug: string; code: string }>;
}) {
	const { slug, code } = use(params);
	const [messageOpen, setMessageOpen] = useState(false);

	const { data: reservation, isPending } = useQuery(
		orpc.reservation.byCode.queryOptions({ input: { code } }),
	);

	if (isPending || !reservation) {
		return (
			<Screen>
				<div className="space-y-3 p-[18px]">
					<div className="h-40 animate-pulse rounded-lg bg-card" />
					<div className="h-16 animate-pulse rounded-lg bg-card" />
				</div>
			</Screen>
		);
	}

	const { raffle } = reservation;

	return (
		<Screen>
			<div className="flex-1 overflow-y-auto px-[18px] pt-1 pb-7">
				<Link
					href={`/r/${slug}`}
					className={buttonVariants({ variant: "ghost", size: "sm" })}
				>
					← Números
				</Link>
				<h3 className="mt-3 mb-3.5 text-[26px]">Confirma pra pedir o PIX</h3>

				<div className="overflow-hidden rounded-lg bg-card shadow-sm">
					<div className="h-[150px] bg-neutral-300">
						<PrizeImage src={raffle.imageUrl} alt={raffle.title} />
					</div>
					<div className="flex flex-col gap-2 p-3.5">
						<div className="font-heading text-[18px] leading-[1.15]">
							{raffle.title}
						</div>
						<div className="flex flex-wrap gap-1.5">
							{reservation.numbers.map((number) => (
								<Tag key={number} variant="solid" className="tabular">
									{padNumber(number, raffle.totalTickets)}
								</Tag>
							))}
						</div>
						<Row label="Reserva" value={`#${reservation.code}`} />
						<Row label="Nome" value={reservation.name} />
						<Row label="WhatsApp" value={formatPhone(reservation.phone)} />
						<Row
							label="Sorteio"
							value={`${formatDrawDate(raffle.drawDate)} · ${raffle.drawChannel}`}
						/>
					</div>
				</div>

				<div className="mt-3.5 flex items-center justify-between rounded-lg bg-brand-200 px-4.5 py-4">
					<div>
						<div className="font-semibold text-[12px] text-brand-800">
							{reservation.numbers.length} × {formatMoney(raffle.priceCents)}
						</div>
						<div className="text-[12px] text-brand-800">Total no PIX</div>
					</div>
					<div className="font-heading text-[31px] text-brand-800 leading-none">
						{formatMoney(reservation.totalCents)}
					</div>
				</div>

				<Button
					variant="secondary"
					block
					className="mt-3 text-[12.5px]"
					onClick={() => setMessageOpen((open) => !open)}
				>
					{messageOpen
						? "Esconder a mensagem"
						: "Ver a mensagem que vai pro admin"}
				</Button>

				{messageOpen ? (
					<pre className="mt-2.5 max-h-[200px] overflow-auto whitespace-pre-wrap rounded-lg bg-card px-4 py-3.5 font-mono text-[11.5px] text-neutral-800 leading-[1.6]">
						{reservation.whatsappMessage}
					</pre>
				) : null}

				{/*
				 * A plain anchor, not a mutation-then-redirect: the reservation was
				 * already created at checkout, so there is nothing async between the
				 * tap and the navigation for a popup blocker to eat.
				 */}
				<a
					href={reservation.whatsappHref}
					target="_blank"
					rel="noreferrer"
					className={buttonVariants({
						block: true,
						size: "lg",
						className: "mt-3.5",
					})}
				>
					Pedir PIX no WhatsApp
				</a>

				<Link
					href={`/r/${slug}/done/${reservation.code}`}
					className={buttonVariants({
						variant: "ghost",
						block: true,
						className: "mt-2 text-[12.5px]",
					})}
				>
					Já pedi — ver minha reserva
				</Link>

				<p className="mt-2.5 text-center font-semibold text-[11px] text-neutral-600 leading-[1.6]">
					A conversa abre já com nome, números e valor. Seus números ficam
					guardados até o pagamento.
				</p>
			</div>
		</Screen>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex justify-between text-[13px]">
			<span className="text-neutral-700">{label}</span>
			<span className="font-semibold">{value}</span>
		</div>
	);
}
