"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ModeToggle from "@/components/ModeToggle";
import { LayoutDashboard, BarChart3, User, Search, Menu, X, LogOut, Flame, Star } from "lucide-react";

function SearchFormInner() {
	const { t } = useI18n();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [query, setQuery] = React.useState(searchParams.get("q") || "");

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!query.trim()) return;
		router.push(`/app/search?q=${encodeURIComponent(query)}`);
	};

	return (
		<form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
			<div className="relative w-full">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="search"
					placeholder={t("app.search.placeholder")}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="pl-9 h-9"
				/>
			</div>
		</form>
	);
}

function SearchForm() {
	return (
		<Suspense fallback={<div className="flex-1" />}>
			<SearchFormInner />
		</Suspense>
	);
}

const NAV_ITEMS = [
	{ href: "/app", icon: LayoutDashboard, labelKey: "nav.dashboard" },
	{ href: "/app/stats", icon: BarChart3, labelKey: "nav.stats" },
	{ href: "/app/profile", icon: User, labelKey: "nav.profile" },
] as const;

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const { user, loading, logout } = useAuth();
	const { t } = useI18n();
	const router = useRouter();
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

	React.useEffect(() => {
		if (!loading && !user) {
			router.replace("/login");
		}
	}, [loading, user, router]);

	React.useEffect(() => {
		setMobileMenuOpen(false);
	}, [pathname]);

	async function handleLogout() {
		await logout();
		router.push("/");
	}

	if (loading || !user) {
		return (
			<div className="flex min-h-dvh items-center justify-center bg-background">
				<p className="text-sm text-muted-foreground animate-pulse">{t("app.decks.loading")}</p>
			</div>
		);
	}

	const isActive = (href: string) => {
		if (href === "/app") return pathname === "/app";
		return pathname.startsWith(href);
	};

	const navLinks = NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => (
		<Link
			key={href}
			href={href}
			className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${isActive(href)
				? "bg-sidebar-accent text-sidebar-accent-foreground"
				: "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
				}`}
		>
			<Icon className="h-4 w-4" />
			{t(labelKey)}
		</Link>
	));

	return (
		<div className="min-h-dvh bg-background flex">
			{/* Desktop sidebar */}
			<aside className="hidden md:flex flex-col w-60 border-r border-sidebar-border bg-sidebar shrink-0 sticky top-0 h-dvh">
				<div className="flex h-14 items-center border-b border-sidebar-border px-4">
					<Link href="/app" className="flex items-center gap-2 font-semibold">
						<div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">D</div>
						<span className="text-base tracking-tight text-foreground">Druido</span>
					</Link>
				</div>

				<nav className="flex-1 p-3 space-y-1">{navLinks}</nav>

				<div className="p-4 border-t border-sidebar-border space-y-3">
					<div className="flex items-center gap-4 text-sm font-medium text-foreground">
						<span className="flex items-center gap-1.5">
							<Flame className="h-4 w-4 text-orange-500" />
							{user.streak}
						</span>
						<span className="flex items-center gap-1.5">
							<Star className="h-4 w-4 text-amber-500" />
							{user.xp} XP
						</span>
					</div>
					<div className="flex items-center justify-between gap-2">
						<span className="text-xs font-medium text-muted-foreground truncate">{user.name || user.email}</span>
						<button
							onClick={handleLogout}
							className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
						>
							<LogOut className="h-3.5 w-3.5" />
							{t("profile.logout")}
						</button>
					</div>
				</div>
			</aside>

			{/* Main content area */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Mobile header */}
				<header className="md:hidden border-b border-border bg-background px-4 py-3 sticky top-0 z-30">
					<div className="flex items-center gap-3">
						<button
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="p-1 text-foreground"
							aria-label="Menu"
						>
							{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
						</button>
						<Link href="/app" className="flex items-center gap-2 font-semibold">
							<div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">D</div>
						</Link>
						<div className="flex-1">
							<SearchForm />
						</div>
						<ModeToggle />
					</div>

					{mobileMenuOpen && (
						<nav className="mt-3 pb-1 space-y-1">
							{navLinks}
							<div className="flex items-center justify-between px-3 pt-3 border-t border-border mt-2">
								<span className="flex items-center gap-3 text-sm font-medium">
									<span className="flex items-center gap-1">
										<Flame className="h-4 w-4 text-orange-500" />
										{user.streak}
									</span>
									<span className="flex items-center gap-1">
										<Star className="h-4 w-4 text-amber-500" />
										{user.xp} XP
									</span>
								</span>
								<button
									onClick={handleLogout}
									className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
								>
									<LogOut className="h-3.5 w-3.5" />
									{t("profile.logout")}
								</button>
							</div>
						</nav>
					)}
				</header>

				{/* Desktop top bar */}
				<header className="hidden md:flex h-14 items-center gap-4 border-b border-border bg-background px-6 sticky top-0 z-30">
					<div className="flex-1 max-w-sm">
						<SearchForm />
					</div>
					<div className="ml-auto flex items-center gap-3">
						<span className="text-sm text-muted-foreground hidden lg:inline">{user.name || user.email}</span>
						<ModeToggle />
					</div>
				</header>

				{/* Demo account notice */}
				{user.isDemo && (
					<div className="border-b border-border bg-muted/60 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
						<p className="text-xs text-muted-foreground">{t("demo.banner")}</p>
						<Link href="/register" className="text-xs font-medium text-primary hover:underline">
							{t("demo.banner.cta")}
						</Link>
					</div>
				)}

				<main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 sm:py-8">{children}</main>
			</div>
		</div>
	);
}
