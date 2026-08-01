"use client";

import { useQuery } from "@tanstack/react-query";

import { AdminDashboard } from "@/components/admin-dashboard";
import { LoginForm } from "@/components/login-form";
import { Screen } from "@/components/screen";
import { orpc } from "@/utils/orpc";

/**
 * The login-or-dashboard switch is a convenience, not the security boundary —
 * every admin procedure is a protectedProcedure and answers 401 on its own.
 */
export default function AdminPage() {
	const { data, isPending } = useQuery(orpc.auth.me.queryOptions());

	if (isPending) {
		return (
			<Screen>
				<div className="flex flex-1 items-center justify-center">
					<div className="size-12 animate-pulse rounded-pill bg-card" />
				</div>
			</Screen>
		);
	}

	return data?.authenticated ? <AdminDashboard /> : <LoginForm />;
}
