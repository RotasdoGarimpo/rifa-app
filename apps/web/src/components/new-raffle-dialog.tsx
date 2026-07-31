"use client";

import { isDefinedError } from "@orpc/client";
import { Button } from "@rifa-app/ui/components/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from "@rifa-app/ui/components/dialog";
import { Input } from "@rifa-app/ui/components/input";
import { Label } from "@rifa-app/ui/components/label";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/utils/orpc";

export function NewRaffleDialog({ onCreated }: { onCreated: () => void }) {
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState("");
	const [price, setPrice] = useState("10");
	const [total, setTotal] = useState("200");
	const [drawDate, setDrawDate] = useState("");

	const createRaffle = useMutation(
		orpc.admin.createRaffle.mutationOptions({
			onSuccess: () => {
				toast.success("Rifa criada.");
				setOpen(false);
				setTitle("");
				setPrice("10");
				setTotal("200");
				setDrawDate("");
				onCreated();
			},
			onError: (error) => {
				if (isDefinedError(error) && error.code === "SLUG_TAKEN") {
					toast.error("Já existe uma rifa com esse nome.");
					return;
				}
				toast.error("Não deu para criar a rifa.");
			},
		}),
	);

	const priceNumber = Number(price);
	const totalNumber = Number(total);
	const invalid =
		title.trim().length < 3 ||
		!Number.isFinite(priceNumber) ||
		priceNumber <= 0 ||
		!Number.isFinite(totalNumber) ||
		totalNumber < 10;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button size="sm" className="text-[12.5px]">
						Nova rifa
					</Button>
				}
			/>
			<DialogContent>
				<DialogTitle>Nova rifa</DialogTitle>

				<form
					className="flex flex-col gap-3"
					onSubmit={(event) => {
						event.preventDefault();
						createRaffle.mutate({
							title: title.trim(),
							// The form takes reais; the API stores cents.
							priceCents: Math.round(priceNumber * 100),
							totalTickets: totalNumber,
							drawDate: drawDate || undefined,
						});
					}}
				>
					<div className="flex flex-col gap-1.5">
						<Label
							htmlFor="raffle-title"
							className="font-semibold text-[12.5px]"
						>
							Prêmio
						</Label>
						<Input
							id="raffle-title"
							placeholder="Violão Tagima"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
						/>
					</div>

					<div className="flex gap-2.5">
						<div className="flex flex-1 flex-col gap-1.5">
							<Label
								htmlFor="raffle-price"
								className="font-semibold text-[12.5px]"
							>
								Preço (R$)
							</Label>
							<Input
								id="raffle-price"
								inputMode="decimal"
								value={price}
								onChange={(event) =>
									setPrice(
										event.target.value
											.replace(/[^\d.,]/g, "")
											.replace(",", "."),
									)
								}
							/>
						</div>
						<div className="flex flex-1 flex-col gap-1.5">
							<Label
								htmlFor="raffle-total"
								className="font-semibold text-[12.5px]"
							>
								Qtd. números
							</Label>
							<Input
								id="raffle-total"
								inputMode="numeric"
								value={total}
								onChange={(event) =>
									setTotal(event.target.value.replace(/\D/g, ""))
								}
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label
							htmlFor="raffle-date"
							className="font-semibold text-[12.5px]"
						>
							Data do sorteio
						</Label>
						<Input
							id="raffle-date"
							type="date"
							value={drawDate}
							onChange={(event) => setDrawDate(event.target.value)}
						/>
					</div>

					<DialogFooter>
						<DialogClose
							render={
								<Button type="button" variant="secondary">
									Cancelar
								</Button>
							}
						/>
						<Button type="submit" disabled={invalid || createRaffle.isPending}>
							{createRaffle.isPending ? "Criando…" : "Criar rifa"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
