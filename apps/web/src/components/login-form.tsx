"use client";

import { isDefinedError } from "@orpc/client";
import { Button } from "@rifa-app/ui/components/button";
import { Input } from "@rifa-app/ui/components/input";
import { Label } from "@rifa-app/ui/components/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Screen } from "@/components/screen";
import { orpc } from "@/utils/orpc";

export function LoginForm() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [shake, setShake] = useState(false);
	const queryClient = useQueryClient();

	const login = useMutation(
		orpc.auth.login.mutationOptions({
			onSuccess: () => {
				setPassword("");
				queryClient.invalidateQueries({ queryKey: orpc.auth.key() });
			},
			onError: (error) => {
				setShake(true);
				setTimeout(() => {
					setShake(false);
					setPassword("");
				}, 400);

				if (isDefinedError(error) && error.code === "TOO_MANY_ATTEMPTS") {
					const minutes = Math.ceil(error.data.retryAfterSeconds / 60);
					toast.error(`Muitas tentativas. Tente em ${minutes} min.`);
					return;
				}
				toast.error("Usuário ou senha incorretos.");
			},
		}),
	);

	function submit() {
		if (login.isPending) return;

		login.mutate({ username: username.trim(), password });
	}

	const canSubmit = username.trim().length > 0 && password.length > 0;

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
					Entre com seu usuário e senha
				</p>

				<form
					onSubmit={(event) => {
						event.preventDefault();
						submit();
					}}
					className="mt-7 flex w-full max-w-75 flex-col gap-3.5 text-left"
					style={{
						animation: shake ? "login-shake 0.4s ease-in-out" : undefined,
					}}
				>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="username" className="px-1 text-neutral-700">
							Usuário
						</Label>
						<Input
							id="username"
							name="username"
							value={username}
							onChange={(event) => setUsername(event.target.value)}
							autoComplete="username"
							autoCapitalize="none"
							autoCorrect="off"
							spellCheck={false}
							disabled={login.isPending}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="password" className="px-1 text-neutral-700">
							Senha
						</Label>
						<Input
							id="password"
							name="password"
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							autoComplete="current-password"
							disabled={login.isPending}
						/>
					</div>

					<Button
						type="submit"
						block
						className="mt-1.5"
						disabled={!canSubmit || login.isPending}
					>
						{login.isPending ? "Entrando…" : "Entrar"}
					</Button>
				</form>
			</div>

			<style>{`
				@keyframes login-shake {
					0%, 100% { transform: translateX(0); }
					25% { transform: translateX(-8px); }
					75% { transform: translateX(8px); }
				}
			`}</style>
		</Screen>
	);
}
