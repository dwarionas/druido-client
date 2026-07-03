"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { CallToActionButton } from "@/components/CallToActionButton";
import ModeToggle from "@/components/ModeToggle";

export function Header() {
	const { user, loading } = useAuth();
	const { t } = useI18n();

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
			<nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
				<Link href="/" className="flex items-center gap-2 font-semibold">
					<div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
						D
					</div>
					<span className="text-base tracking-tight">Druido</span>
				</Link>

				<div className="flex items-center gap-2">
					<ModeToggle />
					{!loading && !user && (
						<Link
							href="/login"
							className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
						>
							{t("header.signin")}
						</Link>
					)}
					<CallToActionButton />
				</div>
			</nav>
		</header>
	);
}
