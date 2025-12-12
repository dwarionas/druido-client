"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SearchFormInner() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [query, setQuery] = React.useState(searchParams.get("q") || "");

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		router.push(`/app/search?q=${encodeURIComponent(query)}`);
	};

	return (
		<form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
			<Input
				type="search"
				placeholder="Search cards or decks..."
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				className="bg-background"
			/>
			<Button type="submit" variant="outline">
				Search
			</Button>
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

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const { user, loading, logout } = useAuth();
	const router = useRouter();

	React.useEffect(() => {
		if (!loading && !user) {
			router.push("/login");
		}
	}, [loading, user, router]);

	if (loading || !user) {
		return (
			<div className="flex min-h-dvh items-center justify-center">
				<p className="text-muted-foreground">Loading your workspace...</p>
			</div>
		);
	}

	return (
		<div className="min-h-dvh bg-background">
			<header className="border-b bg-muted/40">
				<div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-2">
					<Link href={"/app"} className="font-semibold">
						Druido
					</Link>
					<SearchForm />
					<span className="text-sm text-muted-foreground hidden sm:inline">{user.name}</span>
					<Button variant="destructive" size="sm" onClick={() => logout().then(() => router.push("/login"))}>
						Logout
					</Button>
				</div>
			</header>
			<main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
		</div>
	);
}
