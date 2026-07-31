"use client";

import { generateReactHelpers } from "@uploadthing/react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import type { UploadRouter } from "@/app/api/uploadthing/core";

/**
 * Headless on purpose: UploadThing's prebuilt components ship their own
 * stylesheet, which would need a Tailwind v4 @source entry and would still
 * look nothing like the Organic system. This is a plain file input styled
 * with our own tokens.
 */
const { useUploadThing } = generateReactHelpers<UploadRouter>();

export function ImageUpload({
	value,
	onChange,
}: {
	value: string | null;
	onChange: (url: string | null) => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);

	const { startUpload, isUploading } = useUploadThing("raffleImage", {
		onClientUploadComplete: (files) => {
			const url = files[0]?.serverData.url;
			if (url) onChange(url);
		},
		onUploadError: (error) => {
			toast.error(
				error.message.includes("autorizado")
					? "Sessão expirada. Entre de novo."
					: "Não deu para enviar a imagem.",
			);
		},
	});

	if (value) {
		return (
			<div className="relative h-28 overflow-hidden rounded-md bg-neutral-300">
				{/* biome-ignore lint/performance/noImgElement: arbitrary remote host */}
				<img
					src={value}
					alt="Prévia do prêmio"
					className="washed size-full object-cover"
				/>
				<button
					type="button"
					onClick={() => onChange(null)}
					aria-label="Remover imagem"
					className="absolute top-2 right-2 grid size-7 place-items-center rounded-pill bg-neutral-900/80 text-neutral-100"
				>
					<X className="size-4" />
				</button>
			</div>
		);
	}

	return (
		<>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={(event) => {
					const file = event.target.files?.[0];
					if (file) startUpload([file]);
					event.target.value = "";
				}}
			/>
			<button
				type="button"
				disabled={isUploading}
				onClick={() => inputRef.current?.click()}
				className="flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-md border border-border border-dashed bg-card text-neutral-600 transition-colors hover:bg-neutral-300 disabled:pointer-events-none"
			>
				{isUploading ? (
					<>
						<Loader2 className="size-5 animate-spin" />
						<span className="text-[12px]">Enviando…</span>
					</>
				) : (
					<>
						<ImagePlus className="size-5" />
						<span className="text-[12px]">Foto do prêmio</span>
					</>
				)}
			</button>
		</>
	);
}
