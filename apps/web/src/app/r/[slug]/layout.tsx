import { SelectionProvider } from "@/lib/selection";

export default async function RaffleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;

	return <SelectionProvider slug={slug}>{children}</SelectionProvider>;
}
