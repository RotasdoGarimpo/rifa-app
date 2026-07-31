import { WifiOff } from "lucide-react";

import { Screen } from "@/components/screen";

export const metadata = { title: "Sem conexão · Rifa da Viola" };

export default function OfflinePage() {
	return (
		<Screen>
			<div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
				<span className="grid size-14 place-items-center rounded-pill bg-brand-200 text-brand-800">
					<WifiOff className="size-6" strokeWidth={2.75} />
				</span>
				<h3 className="mt-1 text-[24px]">Você está sem internet</h3>
				<p className="m-0 text-[13.5px] text-neutral-700">
					Seus números continuam guardados. Assim que a conexão voltar, é só
					recarregar a página.
				</p>
			</div>
		</Screen>
	);
}
