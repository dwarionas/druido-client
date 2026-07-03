"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getSharedDeck, cloneSharedDeck, type SharedDeck } from "@/lib/decks-api";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Layers } from "lucide-react";

export default function SharedDeckPage() {
	const params = useParams<{ shareId: string }>();
	const shareId = params.shareId;
	const router = useRouter();
	const { user, loading: authLoading } = useAuth();
	const { t } = useI18n();

	const [deck, setDeck] = React.useState<SharedDeck | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [notFound, setNotFound] = React.useState(false);
	const [cloning, setCloning] = React.useState(false);

	React.useEffect(() => {
		let cancelled = false;
		getSharedDeck(shareId)
			.then((data) => { if (!cancelled) setDeck(data); })
			.catch(() => { if (!cancelled) setNotFound(true); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [shareId]);

	async function handleClone() {
		if (!user) {
			router.push("/login");
			return;
		}
		setCloning(true);
		try {
			const result = await cloneSharedDeck(shareId);
			toast.success(t("shared.cloned", { n: result.count }));
			router.push(`/app/decks/${result.deck.id}`);
		} catch {
			toast.error(t("toast.import.failed"));
			setCloning(false);
		}
	}

	return (
		<div className="flex flex-col min-h-dvh bg-background">
			<Header />

			<main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-10">
				{loading && (
					<div className="space-y-3 animate-pulse">
						<div className="h-8 w-64 bg-muted rounded-md" />
						<div className="h-24 bg-muted rounded-xl" />
					</div>
				)}

				{notFound && (
					<div className="bg-card border border-border rounded-xl p-10 text-center">
						<p className="text-muted-foreground">{t("shared.not_found")}</p>
						<Button className="mt-6" asChild>
							<Link href="/">Druido</Link>
						</Button>
					</div>
				)}

				{deck && (
					<div className="space-y-6 animate-fade-in-up">
						<section>
							<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
								{t("shared.title")}
							</p>
							<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{deck.name}</h1>
							{deck.description && <p className="text-muted-foreground mt-2">{deck.description}</p>}
							<p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-3">
								<Layers className="h-4 w-4" />
								{deck.totalCards} {t("app.deck.total")}
							</p>
						</section>

						<section className="flex flex-col sm:flex-row gap-3">
							<Button onClick={handleClone} disabled={cloning || authLoading}>
								{cloning ? "..." : t("shared.clone")}
							</Button>
							{!authLoading && !user && (
								<p className="text-sm text-muted-foreground self-center">{t("shared.login_hint")}</p>
							)}
						</section>

						<section className="space-y-2">
							{deck.preview.map((card, i) => (
								<div key={i} className="bg-card border border-border rounded-lg p-4">
									<p className="font-medium text-sm">{card.question}</p>
									<p className="text-xs text-muted-foreground mt-1">{card.answer}</p>
									{card.tags.length > 0 && (
										<div className="flex gap-1.5 mt-2">
											{card.tags.map((tg) => <Badge key={tg} variant="secondary" className="text-[10px] px-1.5 py-0">{tg}</Badge>)}
										</div>
									)}
								</div>
							))}
							{deck.totalCards > deck.preview.length && (
								<p className="text-xs text-muted-foreground text-center pt-2">
									{t("shared.preview_note", { n: deck.preview.length })}
								</p>
							)}
						</section>
					</div>
				)}
			</main>
		</div>
	);
}
