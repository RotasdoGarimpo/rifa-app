import type { Metadata } from "next";
import { Caprasimo, Figtree } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";

const figtree = Figtree({
	variable: "--font-figtree",
	subsets: ["latin"],
	weight: ["400", "600", "700"],
	display: "swap",
});

const caprasimo = Caprasimo({
	variable: "--font-caprasimo",
	subsets: ["latin"],
	weight: "400",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Rifa da Viola",
	description: "Garanta seus números e concorra pela Loteria Federal.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="pt-BR">
			<body className={`${figtree.variable} ${caprasimo.variable}`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
