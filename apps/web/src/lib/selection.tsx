"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

/**
 * The numbers a buyer has picked, kept per raffle and mirrored into
 * sessionStorage so the selection survives navigation between the grid,
 * checkout and summary — and the round trip out to WhatsApp and back.
 */
type SelectionContextValue = {
	numbers: number[];
	toggle: (number: number) => void;
	add: (numbers: number[]) => void;
	replace: (numbers: number[]) => void;
	remove: (number: number) => void;
	clear: () => void;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

const storageKey = (slug: string) => `rifa:selection:${slug}`;

function readStored(slug: string): number[] {
	if (typeof window === "undefined") return [];

	try {
		const raw = window.sessionStorage.getItem(storageKey(slug));
		if (!raw) return [];

		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed)
			? parsed.filter((n): n is number => Number.isInteger(n))
			: [];
	} catch {
		return [];
	}
}

export function SelectionProvider({
	slug,
	children,
}: {
	slug: string;
	children: React.ReactNode;
}) {
	// Starts empty so the server and first client render agree; the stored
	// selection is adopted in the effect below.
	const [numbers, setNumbers] = useState<number[]>([]);

	useEffect(() => {
		setNumbers(readStored(slug));
	}, [slug]);

	useEffect(() => {
		window.sessionStorage.setItem(storageKey(slug), JSON.stringify(numbers));
	}, [slug, numbers]);

	const sortUnique = (values: number[]) =>
		[...new Set(values)].sort((a, b) => a - b);

	const toggle = useCallback((value: number) => {
		setNumbers((current) =>
			current.includes(value)
				? current.filter((n) => n !== value)
				: sortUnique([...current, value]),
		);
	}, []);

	const add = useCallback((values: number[]) => {
		setNumbers((current) => sortUnique([...current, ...values]));
	}, []);

	const replace = useCallback((values: number[]) => {
		setNumbers(sortUnique(values));
	}, []);

	const remove = useCallback((value: number) => {
		setNumbers((current) => current.filter((n) => n !== value));
	}, []);

	const clear = useCallback(() => setNumbers([]), []);

	const value = useMemo(
		() => ({ numbers, toggle, add, replace, remove, clear }),
		[numbers, toggle, add, replace, remove, clear],
	);

	return (
		<SelectionContext.Provider value={value}>
			{children}
		</SelectionContext.Provider>
	);
}

export function useSelection() {
	const context = useContext(SelectionContext);

	if (!context) {
		throw new Error("useSelection must be used inside a SelectionProvider");
	}

	return context;
}
