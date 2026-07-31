"use client";

import { isDefinedError } from "@orpc/client";
import { formatMoney, formatPhone } from "@rifa-app/api/lib/format";
import { Button } from "@rifa-app/ui/components/button";
import { Input } from "@rifa-app/ui/components/input";
import { Label } from "@rifa-app/ui/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";

import { PrizeImage } from "@/components/prize-image";
import { Screen } from "@/components/screen";
import { useSelection } from "@/lib/selection";
import { orpc } from "@/utils/orpc";

export default function CheckoutPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = use(params);
	const router = useRouter();
	const queryClient = useQueryClient();
	const { numbers, clear } = useSelection();

	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");

	const { data: raffle } = useQuery(
		orpc.raffle.bySlug.queryOptions({ input: { slug } }),
	);

	const createReservation = useMutation(
		orpc.reservation.create.mutationOptions({
			onSuccess: (reservation) => {
				clear();
				queryClient.invalidateQueries({ queryKey: orpc.raffle.key() });
				router.push(`/r/${slug}/summary/${reservation.code}`);
			},
			onError: (error) => {
				if (isDefinedError(error) && error.code === "TICKETS_UNAVAILABLE") {
					// Tell them exactly which numbers went, then send them back to
					// re-pick rather than leaving them on a dead form.
					toast.error(
						`Alguém garantiu ${error.data.numbers.join(", ")} antes de você.`,
					);
					queryClient.invalidateQueries({ queryKey: orpc.raffle.key() });
					router.push(`/r/${slug}`);
					return;
				}
				toast.error("Não deu para reservar agora. Tente de novo.");
			},
		}),
	);

	const phoneDigits = phone.replace(/\D/g, "");
	const invalid = name.trim().length < 3 || phoneDigits.length < 10;

	// Someone landing here directly (or after their hold expired) has nothing to
	// buy; send them back to the grid instead of showing an empty form.
	if (numbers.length === 0) {
		return (
			<Screen>
				<div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
					<h3 className="text-2xl">Nenhum número escolhido</h3>
					<p className="text-neutral-700 text-sm">
						Volte e escolha seus números para continuar.
					</p>
					<Link href={`/r/${slug}`} className="mt-2 text-primary underline">
						Escolher números
					</Link>
				</div>
			</Screen>
		);
	}

	return (
		<Screen>
			<form
				className="flex-1 overflow-y-auto px-[18px] pt-1 pb-7"
				onSubmit={(event) => {
					event.preventDefault();
					createReservation.mutate({ slug, numbers, name, phone: phoneDigits });
				}}
			>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.push(`/r/${slug}`)}
					type="button"
				>
					← Números
				</Button>

				{raffle ? (
					<div className="mt-3 flex items-center gap-3 rounded-lg bg-card p-2.5">
						<div className="size-14 flex-none overflow-hidden rounded-md bg-neutral-300">
							<PrizeImage src={raffle.imageUrl} alt={raffle.title} />
						</div>
						<div className="min-w-0">
							<div className="font-heading text-[15px] leading-[1.15]">
								{raffle.title}
							</div>
							<div className="mt-0.5 text-[12px] text-neutral-700">
								{numbers.length} {numbers.length === 1 ? "número" : "números"} ·{" "}
								{formatMoney(numbers.length * raffle.priceCents)}
							</div>
						</div>
					</div>
				) : null}

				<h3 className="mt-5 mb-1.5 text-[26px]">Pra quem vão esses números?</h3>
				<p className="m-0 max-w-[260px] text-[13.5px] text-neutral-700">
					Usamos o WhatsApp só pra combinar o PIX e te avisar do resultado.
				</p>

				<div className="mt-5 flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="name" className="font-semibold text-[12.5px]">
							Seu nome
						</Label>
						<Input
							id="name"
							name="name"
							autoComplete="name"
							placeholder="Ana Beatriz Melo"
							value={name}
							onChange={(event) => setName(event.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="phone" className="font-semibold text-[12.5px]">
							WhatsApp
						</Label>
						<Input
							id="phone"
							name="phone"
							inputMode="tel"
							autoComplete="tel"
							placeholder="(00) 00000-0000"
							value={phone}
							onChange={(event) => setPhone(formatPhone(event.target.value))}
						/>
					</div>
				</div>

				<Button
					type="submit"
					block
					size="lg"
					className="mt-6"
					disabled={invalid || createReservation.isPending}
				>
					{createReservation.isPending ? "Reservando…" : "Ver resumo"}
				</Button>

				<p className="mt-2.5 text-center font-semibold text-[11px] text-neutral-600">
					Seus dados ficam só com a organização da rifa.
				</p>
			</form>
		</Screen>
	);
}
