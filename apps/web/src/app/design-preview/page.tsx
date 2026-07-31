"use client";

import { Button } from "@rifa-app/ui/components/button";
import { Card, CardTitle } from "@rifa-app/ui/components/card";
import { Input } from "@rifa-app/ui/components/input";
import { Progress } from "@rifa-app/ui/components/progress";
import { Segmented } from "@rifa-app/ui/components/segmented";
import { Tag } from "@rifa-app/ui/components/tag";
import { useState } from "react";

const CELL =
	"grid aspect-square place-items-center rounded-pill font-semibold text-xs tabular transition-colors";

export default function PreviewPage() {
	const [mode, setMode] = useState<"packs" | "manual">("packs");

	return (
		<main className="mx-auto flex w-[390px] flex-col gap-6 p-5">
			<header className="flex items-center justify-between">
				<span className="font-heading text-[19px]">Rifa da Viola</span>
				<Button variant="secondary" size="sm">
					Admin
				</Button>
			</header>

			<h2 className="text-[29px]">Viola Caipira Rozini Master</h2>
			<p className="-mt-4 text-neutral-700 text-sm">
				Viola de 10 cordas + case e afinador
			</p>

			<div>
				<Progress value={69} max={200} />
				<div className="mt-2 flex items-center justify-between">
					<span className="font-semibold text-[12.5px]">
						69 de 200 números tomados
					</span>
					<Tag variant="sage">faltam 131</Tag>
				</div>
			</div>

			<div className="flex flex-wrap gap-2">
				<Tag variant="solid">Sorteio 20/08</Tag>
				<Tag variant="brand">R$ 10,00 o número</Tag>
				<Tag variant="neutral">PIX na hora</Tag>
				<Tag variant="outline">Loteria Federal</Tag>
			</div>

			<Button block size="lg">
				Quero meus números
			</Button>

			<div className="flex flex-wrap gap-2">
				<Button>Primary</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="surface">Surface</Button>
				<Button variant="sage">Sage</Button>
				<Button variant="ghost">Ghost</Button>
			</div>

			<Segmented
				name="preview-mode"
				value={mode}
				onValueChange={setMode}
				options={[
					{ value: "packs", label: "Combos prontos" },
					{ value: "manual", label: "Escolher na mão" },
				]}
			/>

			<Input placeholder="(00) 00000-0000" />

			<Card elevated>
				<CardTitle>Combo cinco</CardTitle>
				<p className="text-neutral-700 text-xs">o mais escolhido</p>
			</Card>

			<div className="grid grid-cols-5 gap-2">
				{[
					{ n: "001", s: "free" },
					{ n: "002", s: "sel" },
					{ n: "003", s: "reserved" },
					{ n: "004", s: "paid" },
					{ n: "005", s: "free" },
					{ n: "006", s: "sel" },
					{ n: "007", s: "reserved" },
					{ n: "008", s: "paid" },
					{ n: "009", s: "free" },
					{ n: "010", s: "free" },
				].map((cell) => (
					<div
						key={cell.n}
						className={`${CELL} ${
							cell.s === "sel"
								? "bg-primary text-primary-foreground shadow-md"
								: cell.s === "reserved"
									? "bg-neutral-300 text-neutral-600"
									: cell.s === "paid"
										? "bg-sage-500 text-sage-100"
										: "bg-card text-neutral-800 ring-1 ring-neutral-400 ring-inset"
						}`}
					>
						{cell.n}
					</div>
				))}
			</div>
		</main>
	);
}
