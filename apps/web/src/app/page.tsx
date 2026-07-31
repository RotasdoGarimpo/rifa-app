"use client";

import { formatMoney } from "@rifa-app/api/lib/format";
import { buttonVariants } from "@rifa-app/ui/components/button";
import { Progress } from "@rifa-app/ui/components/progress";
import { Tag } from "@rifa-app/ui/components/tag";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

import { PrizeImage } from "@/components/prize-image";
import { Screen } from "@/components/screen";
import { formatDrawDate } from "@/lib/dates";
import { orpc } from "@/utils/orpc";

const STEPS = [
	"Escolha seus números — na mão ou no combo pronto.",
	"Confirme nome e WhatsApp e toque no botão verde.",
	"A conversa abre com o valor certo. Pague o PIX e pronto.",
];

export default function HomePage() {
	const { data: raffles, isPending } = useQuery(
		orpc.raffle.list.queryOptions(),
	);

	if (isPending) {
		return (
			<Screen>
				<div className="space-y-4 p-[18px]">
					<div className="h-[236px] animate-pulse rounded-lg bg-card" />
					<div className="h-8 w-2/3 animate-pulse rounded-pill bg-card" />
					<div className="h-4 w-1/2 animate-pulse rounded-pill bg-card" />
				</div>
			</Screen>
		);
	}

	const [hero, ...others] = raffles ?? [];

	if (!hero) {
		return (
			<Screen>
				<div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
					<h2 className="text-2xl">Nenhuma rifa aberta</h2>
					<p className="text-neutral-700 text-sm">
						Volte em breve — estamos preparando a próxima.
					</p>
				</div>
			</Screen>
		);
	}

	const remaining = hero.totalTickets - hero.takenCount;

	return (
		<Screen>
			<header className="flex flex-none items-center justify-between px-[18px] pt-0.5 pb-2">
				<span className="flex items-center gap-1.5">
					<Image
						src="/logo.png"
						alt=""
						width={28}
						height={28}
						className="rounded-md"
					/>
					<span className="font-heading text-[19px]">Rifa da Viola</span>
				</span>
				<Link
					href="/admin"
					className={buttonVariants({ variant: "secondary", size: "sm" })}
				>
					Admin
				</Link>
			</header>

			<div className="flex-1 overflow-y-auto pb-7">
				<div className="px-[18px]">
					<div className="relative h-[236px] overflow-hidden rounded-lg bg-card">
						<PrizeImage src={hero.imageUrl} alt={hero.title} />
						<div className="pointer-events-none absolute top-3 left-3 flex gap-1.5">
							<Tag variant="solid">Sorteio {formatDrawDate(hero.drawDate)}</Tag>
							<Tag variant="neutral">
								{formatMoney(hero.priceCents)} o número
							</Tag>
						</div>
					</div>

					<h2 className="mt-4 mb-1 text-[29px] leading-[1.05]">{hero.title}</h2>
					{hero.subtitle ? (
						<p className="m-0 text-[13.5px] text-neutral-700">
							{hero.subtitle}
						</p>
					) : null}

					<div className="mt-4">
						<Progress value={hero.takenCount} max={hero.totalTickets} />
						<div className="mt-2 flex items-center justify-between">
							<span className="font-semibold text-[12.5px]">
								{hero.takenCount} de {hero.totalTickets} números tomados
							</span>
							<Tag variant="sage">faltam {remaining}</Tag>
						</div>
					</div>

					<Link
						href={`/r/${hero.slug}`}
						className={buttonVariants({
							block: true,
							size: "lg",
							className: "mt-4",
						})}
					>
						Quero meus números
					</Link>

					<div className="mt-2.5 flex justify-center gap-2.5 font-semibold text-[11px] text-neutral-600">
						<span>Loteria Federal</span>
						<span>·</span>
						<span>PIX na hora</span>
						<span>·</span>
						<span>reserva imediata</span>
					</div>
				</div>

				{others.length > 0 ? (
					<section className="mt-6">
						<div className="flex items-baseline justify-between px-[18px]">
							<h4 className="m-0 text-[19px]">Outras rifas abertas</h4>
							<span className="font-semibold text-[12px] text-neutral-600">
								arraste →
							</span>
						</div>
						<div className="flex snap-x gap-3 overflow-x-auto px-[18px] pt-3 pb-1">
							{others.map((raffle) => (
								<Link
									key={raffle.slug}
									href={`/r/${raffle.slug}`}
									className="flex w-[212px] flex-none snap-start flex-col gap-2 rounded-lg bg-card p-2 shadow-sm"
								>
									<div className="h-[104px] overflow-hidden rounded-md bg-neutral-300">
										<PrizeImage src={raffle.imageUrl} alt={raffle.title} />
									</div>
									<div className="font-heading text-[16px] leading-[1.1]">
										{raffle.title}
									</div>
									<div className="flex flex-wrap gap-1.5">
										<Tag variant="brand">{formatMoney(raffle.priceCents)}</Tag>
										<Tag variant="neutral">
											faltam {raffle.totalTickets - raffle.takenCount}
										</Tag>
									</div>
								</Link>
							))}
						</div>
					</section>
				) : null}

				<section className="mx-[18px] mt-[22px] rounded-lg bg-card p-[18px]">
					<h5 className="mb-3.5 font-heading text-[17px]">Como funciona</h5>
					<div className="flex flex-col gap-3">
						{STEPS.map((step, index) => (
							<div key={step} className="flex items-center gap-3">
								<span className="grid size-[34px] flex-none place-items-center rounded-pill bg-sage-600 font-heading text-[16px] text-sage-100">
									{index + 1}
								</span>
								<span className="text-[13px] text-neutral-800">{step}</span>
							</div>
						))}
					</div>
				</section>

				<p className="mt-[18px] px-[26px] text-center font-semibold text-[11px] text-neutral-600 leading-[1.6]">
					Reserva vale até o pagamento do PIX. Sorteio pela Loteria Federal, com
					o resultado publicado aqui.
				</p>
			</div>
		</Screen>
	);
}
