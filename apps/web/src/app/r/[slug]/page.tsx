"use client";

import { formatMoney, padNumber } from "@rifa-app/api/lib/format";
import { Button } from "@rifa-app/ui/components/button";
import { Input } from "@rifa-app/ui/components/input";
import { Progress } from "@rifa-app/ui/components/progress";
import { Segmented } from "@rifa-app/ui/components/segmented";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import { toast } from "sonner";

import { PrizeImage } from "@/components/prize-image";
import { Screen } from "@/components/screen";
import { TicketTray } from "@/components/ticket-tray";
import { formatDrawDate } from "@/lib/dates";
import { useSelection } from "@/lib/selection";
import { orpc } from "@/utils/orpc";

const PER_PAGE = 100;

const PACKS = [
	{ count: 3, title: "Trinca", subtitle: "três chances", badge: "" },
	{
		count: 5,
		title: "Combo cinco",
		subtitle: "o mais escolhido",
		badge: "mais escolhido",
	},
	{ count: 10, title: "Dezena", subtitle: "melhor chance", badge: "" },
] as const;

type Mode = "packs" | "manual";

export default function RafflePage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = use(params);
	const [mode, setMode] = useState<Mode>("packs");
	const [page, setPage] = useState(0);
	const [search, setSearch] = useState("");

	const { numbers, toggle, replace, add } = useSelection();
	const { data: raffle, isPending } = useQuery(
		orpc.raffle.bySlug.queryOptions({ input: { slug } }),
	);

	const randomTickets = useMutation(
		orpc.raffle.randomTickets.mutationOptions({
			onError: () => toast.error("Não há números livres suficientes."),
		}),
	);

	const status = useMemo(() => {
		const map = new Map<number, "reserved" | "paid">();
		for (const n of raffle?.reserved ?? []) map.set(n, "reserved");
		for (const n of raffle?.paid ?? []) map.set(n, "paid");
		return map;
	}, [raffle?.reserved, raffle?.paid]);

	if (isPending || !raffle) {
		return (
			<Screen>
				<div className="space-y-3 p-4">
					<div className="h-11 animate-pulse rounded-pill bg-card" />
					<div className="grid grid-cols-5 gap-2.5">
						{Array.from({ length: 25 }, (_, i) => (
							<div
								key={i}
								className="aspect-square animate-pulse rounded-pill bg-card"
							/>
						))}
					</div>
				</div>
			</Screen>
		);
	}

	const pages = Math.ceil(raffle.totalTickets / PER_PAGE);
	const digits = search.replace(/\D/g, "");
	const from = digits ? 1 : page * PER_PAGE + 1;
	const to = digits
		? raffle.totalTickets
		: Math.min((page + 1) * PER_PAGE, raffle.totalTickets);

	const cells: number[] = [];
	for (let n = from; n <= to && cells.length < 200; n++) {
		if (digits && !String(n).startsWith(digits)) continue;
		cells.push(n);
	}

	const freeCount = raffle.totalTickets - raffle.takenCount;
	const takenPercent = Math.round(
		(raffle.takenCount / raffle.totalTickets) * 100,
	);

	async function pickRandom(count: number, mergeWithSelection: boolean) {
		const result = await randomTickets.mutateAsync({ slug, count });
		if (mergeWithSelection) {
			add(result.numbers);
		} else {
			replace(result.numbers);
		}
		const first = result.numbers[0];
		if (first !== undefined) setPage(Math.floor((first - 1) / PER_PAGE));
	}

	return (
		<Screen>
			<div className="flex flex-none items-center gap-2.5 px-4 pt-0.5 pb-3">
				<Link
					href="/"
					aria-label="Voltar"
					className="grid size-10 flex-none place-items-center rounded-pill border border-border"
				>
					<ChevronLeft className="size-[17px]" strokeWidth={2.75} />
				</Link>
				<div className="size-11 flex-none overflow-hidden rounded-pill bg-neutral-300">
					<PrizeImage src={raffle.imageUrl} alt={raffle.title} />
				</div>
				<div className="min-w-0 flex-1">
					<div className="truncate font-heading text-[16px] leading-[1.15]">
						{raffle.title}
					</div>
					<div className="text-[11.5px] text-neutral-700">
						{formatMoney(raffle.priceCents)} o número · sorteio{" "}
						{formatDrawDate(raffle.drawDate)}
					</div>
				</div>
			</div>

			<div className="flex-none px-4 pb-3">
				<Progress
					value={raffle.takenCount}
					max={raffle.totalTickets}
					className="h-2"
				/>
				<div className="mt-1.5 flex justify-between">
					<span className="font-semibold text-[11.5px] text-neutral-700">
						{takenPercent}% já tomados
					</span>
					<span className="font-bold text-[11.5px] text-brand-700">
						{freeCount} números livres
					</span>
				</div>
			</div>

			<div className="flex-none px-4 pb-3">
				<Segmented
					name="pick-mode"
					value={mode}
					onValueChange={setMode}
					options={[
						{ value: "packs", label: "Combos prontos" },
						{ value: "manual", label: "Escolher na mão" },
					]}
				/>
			</div>

			{mode === "packs" ? (
				<div className="flex-1 overflow-y-auto px-4 pb-[150px]">
					<p className="mb-3 text-[13px] text-neutral-700">
						A gente sorteia os números livres pra você. É o jeito mais rápido —
						dá na mesma na hora do sorteio.
					</p>
					<div className="flex flex-col gap-2.5">
						{PACKS.map((pack) => {
							const active = numbers.length === pack.count;

							return (
								<button
									key={pack.count}
									type="button"
									onClick={() => pickRandom(pack.count, false)}
									disabled={randomTickets.isPending}
									className={`flex w-full items-center gap-3.5 rounded-lg p-3.5 text-left transition-shadow ${
										active
											? "bg-brand-200 ring-2 ring-primary"
											: "bg-card shadow-sm"
									}`}
								>
									<span
										className={`grid size-[52px] flex-none place-items-center rounded-pill font-heading text-[20px] ${
											active
												? "bg-primary text-primary-foreground"
												: "bg-brand-200 text-brand-800"
										}`}
									>
										{pack.count}
									</span>
									<span className="flex-1">
										<span className="block font-heading text-[17px]">
											{pack.title}
										</span>
										<span className="mt-0.5 block text-[12px] text-neutral-700">
											{pack.subtitle}
										</span>
									</span>
									<span className="flex-none text-right">
										<span className="block font-heading text-[18px]">
											{formatMoney(pack.count * raffle.priceCents)}
										</span>
										{pack.badge ? (
											<span className="mt-1 inline-block rounded-pill bg-sage-200 px-2 py-0.5 font-bold text-[9.5px] text-sage-800 uppercase tracking-[0.04em]">
												{pack.badge}
											</span>
										) : null}
									</span>
								</button>
							);
						})}
					</div>
					<Button
						variant="ghost"
						block
						className="mt-3.5 text-[13px]"
						onClick={() => setMode("manual")}
					>
						Prefiro escolher na mão →
					</Button>
				</div>
			) : (
				<div className="flex min-h-0 flex-1 flex-col">
					<div className="flex flex-none gap-2 px-4 pb-3">
						<Input
							placeholder="Buscar número"
							inputMode="numeric"
							value={search}
							onChange={(event) => {
								setSearch(event.target.value.replace(/\D/g, ""));
								setPage(0);
							}}
						/>
						<Button
							variant="secondary"
							className="whitespace-nowrap"
							disabled={randomTickets.isPending}
							onClick={() => pickRandom(5, true)}
						>
							+5 aleatórios
						</Button>
					</div>

					{pages > 1 && !digits ? (
						<div className="flex flex-none gap-1.5 overflow-x-auto px-4 pb-3">
							{Array.from({ length: pages }, (_, index) => (
								<button
									key={index}
									type="button"
									onClick={() => setPage(index)}
									className={`tabular flex-none rounded-pill px-3.5 py-1.5 font-semibold text-[11.5px] ${
										page === index
											? "bg-primary text-primary-foreground"
											: "bg-card text-neutral-800"
									}`}
								>
									{padNumber(index * PER_PAGE + 1, raffle.totalTickets)}–
									{padNumber(
										Math.min((index + 1) * PER_PAGE, raffle.totalTickets),
										raffle.totalTickets,
									)}
								</button>
							))}
						</div>
					) : null}

					<div className="flex flex-none gap-3 px-4 pb-2.5 text-[11px] text-neutral-700">
						<Legend
							className="bg-card ring-1 ring-neutral-400 ring-inset"
							label="livre"
						/>
						<Legend className="bg-primary" label="seu" />
						<Legend className="bg-neutral-300" label="reservado" />
						<Legend className="bg-sage-500" label="pago" />
					</div>

					<div className="flex-1 overflow-y-auto px-4 pt-0.5 pb-[150px]">
						<div className="grid grid-cols-5 gap-2.5">
							{cells.map((number) => {
								const state = numbers.includes(number)
									? "selected"
									: (status.get(number) ?? "free");
								const disabled = state === "reserved" || state === "paid";

								return (
									<button
										key={number}
										type="button"
										disabled={disabled}
										onClick={() => toggle(number)}
										className={`tabular grid aspect-square place-items-center rounded-pill font-semibold transition-[background-color,color,transform] ${
											raffle.totalTickets > 999
												? "text-[10px]"
												: raffle.totalTickets > 99
													? "text-[12px]"
													: "text-[14px]"
										} ${
											state === "selected"
												? "bg-primary text-primary-foreground shadow-md"
												: state === "reserved"
													? "cursor-default bg-neutral-300 text-neutral-600"
													: state === "paid"
														? "cursor-default bg-sage-500 text-sage-100"
														: "bg-card text-neutral-800 ring-1 ring-neutral-400 ring-inset"
										}`}
									>
										{padNumber(number, raffle.totalTickets)}
									</button>
								);
							})}
						</div>
						{cells.length === 0 ? (
							<p className="py-7 text-center text-[13px] text-neutral-700">
								Nenhum número livre com esse filtro.
							</p>
						) : null}
					</div>
				</div>
			)}

			<TicketTray
				slug={slug}
				priceCents={raffle.priceCents}
				totalTickets={raffle.totalTickets}
			/>
		</Screen>
	);
}

function Legend({ className, label }: { className: string; label: string }) {
	return (
		<span className="flex items-center gap-1.5">
			<i className={`size-2.5 rounded-pill ${className}`} />
			{label}
		</span>
	);
}
