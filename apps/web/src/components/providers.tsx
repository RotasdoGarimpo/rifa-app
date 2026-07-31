"use client";

import { Toaster } from "@rifa-app/ui/components/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

import { ServiceWorker } from "@/components/service-worker";
import { getQueryClient } from "@/utils/orpc";

export default function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(getQueryClient);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<ServiceWorker />
			<Toaster richColors position="top-center" />
			<ReactQueryDevtools />
		</QueryClientProvider>
	);
}
