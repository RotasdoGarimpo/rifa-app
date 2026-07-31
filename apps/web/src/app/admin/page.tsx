import Link from "next/link";

import { Screen } from "@/components/screen";

// Placeholder entry point. Phase 5 replaces this with the PIN keypad and the
// server-verified session; Phase 6 adds the reservations list behind it.
export default function AdminPage() {
	return (
		<Screen>
			<div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
				<h4 className="text-[22px]">Área da organização</h4>
				<p className="m-0 text-[12.5px] text-neutral-700">
					Em breve: acompanhe as reservas e confirme os pagamentos.
				</p>
				<Link href="/" className="mt-2 text-primary text-sm underline">
					Voltar ao início
				</Link>
			</div>
		</Screen>
	);
}
