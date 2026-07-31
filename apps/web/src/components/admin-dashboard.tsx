"use client";

import { formatMoney, formatPhone, padNumber } from "@rifa-app/api/lib/format";
import { Button, buttonVariants } from "@rifa-app/ui/components/button";
import { Input } from "@rifa-app/ui/components/input";
import { Tag } from "@rifa-app/ui/components/tag";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { NewRaffleDialog } from "@/components/new-raffle-dialog";
import { Screen } from "@/components/screen";
import { orpc } from "@/utils/orpc";

const TABS = [
	{ value: undefined, label: "Ordem de chegada" },
	{ value: "PENDING", label: "Pendentes" },
	{ value: "PAID", label: "Pagas" },
	{ value: "EXPIRED", label: "Expiradas" },
	{ value: "CANCELLED", label: "Canceladas" },
] as const;

const STATUS_LABEL = {
	PENDING: "aguardando PIX",
	PAID: "pago ✓",
	EXPIRED: "expirou",
	CANCELLED: "cancelado",
} as const;

const STATUS_VARIANT = {
	PENDING: "brand",
	PAID: "sage",
	EXPIRED: "neutral",
	CANCELLED: "neutral",
} as const;

export function AdminDashboard() {
	const [status, setStatus] =
		useState<(typeof TABS)[number]["value"]>(undefined);
	const [query, setQuery] = useState("");
	const queryClient = useQueryClient();

	const invalidateAll = () => {
		queryClient.invalidateQueries({ queryKey: orpc.admin.key() });
		queryClient.invalidateQueries({ queryKey: orpc.raffle.key() });
	};

	const { data: stats } = useQuery(orpc.admin.stats.queryOptions());
	const { data: reservations, isPending } = useQuery(
		orpc.admin.reservations.queryOptions({ input: { status, query } }),
	);

	const markPaid = useMutation(
		orpc.admin.markPaid.mutationOptions({
			onSuccess: () => {
				toast.success("Reserva marcada como paga.");
				invalidateAll();
			},
			onError: () => toast.error("Não deu para marcar como paga."),
		}),
	);

	const cancel = useMutation(
		orpc.admin.cancel.mutationOptions({
			onSuccess: () => {
				toast.success("Reserva cancelada. Números liberados.");
				invalidateAll();
			},
			onError: () => toast.error("Não deu para cancelar."),
		}),
	);

	const logout = useMutation(
		orpc.auth.logout.mutationOptions({
			onSuccess: () =>
				queryClient.invalidateQueries({ queryKey: orpc.auth.key() }),
		}),
	);

	const exportCsv = useMutation(
		orpc.admin.exportCsv.mutationOptions({
			onSuccess: (result) => {
				const url = URL.createObjectURL(
					new Blob([result.csv], { type: "text/csv;charset=utf-8" }),
				);
				const anchor = document.createElement("a");
				anchor.href = url;
				anchor.download = result.filename;
				anchor.click();
				URL.revokeObjectURL(url);
			},
		}),
	);

	return (
		<Screen>
			<header className="flex flex-none items-center justify-between px-[18px] pt-0.5">
				<span className="font-heading text-[18px]">Reservas</span>
				<Button variant="ghost" size="sm" onClick={() => logout.mutate({})}>
					Sair
				</Button>
			</header>

			<div className="flex-1 overflow-y-auto px-[18px] pt-3 pb-7">
				<div className="flex gap-2">
					<Stat
						label="Arrecadado"
						value={formatMoney(stats?.collectedCents ?? 0)}
						sub={`${stats?.paidCount ?? 0} pagas`}
						className="bg-sage-200"
					/>
					<Stat
						label="Aguardando"
						value={formatMoney(stats?.pendingCents ?? 0)}
						sub={`${stats?.pendingCount ?? 0} pedidos`}
						className="bg-brand-200"
					/>
					<Stat
						label="Números"
						value={String(stats?.ticketsInPlay ?? 0)}
						sub="em jogo"
						className="bg-card"
					/>
				</div>

				<div className="mt-3.5 mb-2.5 flex gap-2">
					<Input
						placeholder="Nome, telefone ou número"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
					<Button
						variant="secondary"
						className="text-[12px]"
						onClick={() => exportCsv.mutate({})}
					>
						CSV
					</Button>
				</div>

				<div className="flex gap-1.5 overflow-x-auto pb-3">
					{TABS.map((tab) => (
						<button
							key={tab.label}
							type="button"
							onClick={() => setStatus(tab.value)}
							className={`flex-none rounded-pill px-3.5 py-1.5 font-semibold text-[12px] ${
								status === tab.value
									? "bg-primary text-primary-foreground"
									: "bg-card text-neutral-800"
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>

				{isPending ? (
					<div className="space-y-2.5">
						{Array.from({ length: 3 }, (_, i) => (
							<div key={i} className="h-32 animate-pulse rounded-lg bg-card" />
						))}
					</div>
				) : reservations && reservations.length > 0 ? (
					<div className="flex flex-col gap-2.5">
						{reservations.map((reservation) => (
							<div
								key={reservation.code}
								className="flex flex-col gap-2 rounded-lg bg-card p-3.5 shadow-sm"
							>
								<div className="flex items-center gap-2.5">
									<span className="grid size-6.5 flex-none place-items-center rounded-pill bg-neutral-900 font-bold text-[11px] text-neutral-100">
										{reservation.sequence}
									</span>
									<span className="flex-1 truncate font-heading text-[16px]">
										{reservation.name}
									</span>
									<Tag variant={STATUS_VARIANT[reservation.status]}>
										{STATUS_LABEL[reservation.status]}
									</Tag>
								</div>

								<div className="text-[11.5px] text-neutral-700">
									{formatPhone(reservation.phone)} ·{" "}
									{reservation.raffleTitle.split(" ")[0]} · #{reservation.code}
								</div>

								<div className="flex items-baseline justify-between gap-2">
									<span className="tabular font-semibold text-[12px] text-neutral-800">
										{reservation.numbers
											.map((n) => padNumber(n, reservation.raffleTotalTickets))
											.join(" · ")}
									</span>
									<span className="font-heading text-[17px]">
										{formatMoney(reservation.totalCents)}
									</span>
								</div>

								<div className="flex flex-wrap items-center gap-1.5">
									<a
										href={reservation.chargeHref}
										target="_blank"
										rel="noreferrer"
										className={buttonVariants({
											variant: "secondary",
											size: "sm",
										})}
									>
										Cobrar no zap
									</a>
									<Button
										size="sm"
										disabled={
											reservation.status === "PAID" || markPaid.isPending
										}
										onClick={() => markPaid.mutate({ code: reservation.code })}
									>
										Marcar pago
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="ml-auto text-neutral-600"
										disabled={cancel.isPending}
										onClick={() => cancel.mutate({ code: reservation.code })}
									>
										Cancelar
									</Button>
								</div>
							</div>
						))}
					</div>
				) : (
					<p className="py-8 text-center text-[13px] text-neutral-700">
						Nada por aqui com esse filtro.
					</p>
				)}

				<div className="mt-5 flex items-center justify-between rounded-lg bg-card px-4 py-3.5">
					<div>
						<div className="font-heading text-[17px]">Rifas</div>
						<div className="text-[11.5px] text-neutral-700">
							{stats?.raffleCount ?? 0} rifas ativas agora
						</div>
					</div>
					<NewRaffleDialog onCreated={invalidateAll} />
				</div>
			</div>
		</Screen>
	);
}

function Stat({
	label,
	value,
	sub,
	className,
}: {
	label: string;
	value: string;
	sub: string;
	className: string;
}) {
	return (
		<div className={`flex-1 rounded-md px-3 py-2.5 ${className}`}>
			<div className="font-semibold text-[10.5px] opacity-70">{label}</div>
			<div className="mt-1 font-heading text-[17px] leading-[1.15]">
				{value}
			</div>
			<div className="text-[10.5px] opacity-70">{sub}</div>
		</div>
	);
}
