"use client";

import { isDefinedError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Screen } from "@/components/screen";
import { orpc } from "@/utils/orpc";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"];

export function PinPad() {
	const [pin, setPin] = useState("");
	const [shake, setShake] = useState(false);
	const queryClient = useQueryClient();

	const login = useMutation(
		orpc.auth.login.mutationOptions({
			onSuccess: () => {
				setPin("");
				queryClient.invalidateQueries({ queryKey: orpc.auth.key() });
			},
			onError: (error) => {
				setShake(true);
				setTimeout(() => {
					setShake(false);
					setPin("");
				}, 400);

				if (isDefinedError(error) && error.code === "TOO_MANY_ATTEMPTS") {
					const minutes = Math.ceil(error.data.retryAfterSeconds / 60);
					toast.error(`Muitas tentativas. Tente em ${minutes} min.`);
					return;
				}
				toast.error("PIN incorreto.");
			},
		}),
	);

	function press(key: string) {
		if (key === "" || login.isPending) return;

		if (key === "←") {
			setPin((current) => current.slice(0, -1));
			return;
		}

		const next = (pin + key).slice(0, 6);
		setPin(next);

		if (next.length === 6) {
			login.mutate({ pin: next });
		}
	}

	return (
		<Screen>
			<div className="flex flex-none px-6 pt-2">
				<Link href="/" className="text-[12.5px] text-primary">
					← Sair
				</Link>
			</div>

			<div className="flex flex-1 flex-col items-center justify-center px-6 pb-7 text-center">
				<span className="grid size-12 place-items-center rounded-pill bg-brand-200 text-brand-800">
					<Lock className="size-[22px]" strokeWidth={2.75} />
				</span>
				<h4 className="mt-4 mb-1 text-[22px]">Área da organização</h4>
				<p className="m-0 text-[12.5px] text-neutral-700">
					Digite o PIN de 6 dígitos
				</p>

				<div
					className="my-7 flex gap-3.5"
					style={{
						animation: shake ? "pin-shake 0.4s ease-in-out" : undefined,
					}}
				>
					{[0, 1, 2, 3, 4, 5].map((index) => (
						<i
							key={index}
							className={`size-3.5 rounded-pill transition-colors ${
								index < pin.length ? "bg-primary" : "bg-neutral-300"
							}`}
						/>
					))}
				</div>

				<div className="grid grid-cols-3 gap-3">
					{KEYS.map((key, index) => (
						<button
							key={`${key}-${index}`}
							type="button"
							onClick={() => press(key)}
							disabled={key === "" || login.isPending}
							className={`h-13 w-[66px] rounded-pill border border-border font-semibold text-lg transition-colors hover:bg-foreground/[0.07] active:bg-foreground/[0.14] disabled:pointer-events-none ${
								key === "" ? "invisible" : ""
							}`}
						>
							{key}
						</button>
					))}
				</div>

				<p className="mt-5 text-[12px] text-neutral-600">
					{login.isPending ? "Verificando…" : "Demo: o PIN é 457313"}
				</p>
			</div>

			<style>{`
				@keyframes pin-shake {
					0%, 100% { transform: translateX(0); }
					25% { transform: translateX(-8px); }
					75% { transform: translateX(8px); }
				}
			`}</style>
		</Screen>
	);
}
