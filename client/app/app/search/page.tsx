"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { listCards, getDecksSummary, type Card, type DeckSummary } from "@/lib/decks-api";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

function SearchContent() {
	const searchParams = useSearchParams();
	const query = searchParams.get("q") || "";
	const [cards, setCards] = React.useState<Card[]>([]);
	const [decks, setDecks] = React.useState<DeckSummary[]>([]);
	const [loading, setLoading] = React.useState(false);
	const { t } = useI18n();

	React.useEffect(() => {
		if (!query) {
			setDecks([]);
			setCards([]);
			return;
		}
		let cancelled = false;
		setLoading(true);
		Promise.all([getDecksSummary(query), listCards({ q: query })])
			.then(([deckData, cardData]) => {
				if (!cancelled) {
					setDecks(deckData);
					setCards(cardData.items);
				}
			})
			.catch(() => { })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [query]);

	const noResults = !loading && query && decks.length === 0 && cards.length === 0;

	return (
		<div className="space-y-6 animate-fade-in-up">
			<section>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("app.search.title")}</h1>
				{query && <p className="text-sm text-muted-foreground mt-1">«{query}»</p>}
			</section>

			{loading && (
				<div className="space-y-2 animate-pulse">
					{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl" />)}
				</div>
			)}

			{noResults && (
				<div className="bg-card border border-border rounded-xl p-8 text-center">
					<p className="text-muted-foreground">{t("app.search.empty")} «{query}»</p>
				</div>
			)}

			{!loading && decks.length > 0 && (
				<section className="space-y-3">
					<h2 className="text-base font-semibold text-muted-foreground">{t("app.search.decks")}</h2>
					<div className="space-y-2">
						{decks.map((deck) => (
							<Link
								key={deck.id}
								href={`/app/decks/${deck.id}`}
								className="flex items-center justify-between gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors group"
							>
								<div className="min-w-0">
									<p className="font-semibold truncate">{deck.name}</p>
									{deck.description && <p className="text-sm text-muted-foreground truncate">{deck.description}</p>}
								</div>
								<div className="flex items-center gap-3 shrink-0">
									<span className="text-xs text-muted-foreground">{deck.totalCards} {t("app.deck.total")}</span>
									<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
								</div>
							</Link>
						))}
					</div>
				</section>
			)}

			{!loading && cards.length > 0 && (
				<section className="space-y-3">
					<h2 className="text-base font-semibold text-muted-foreground">{t("app.search.cards")}</h2>
					<div className="space-y-2">
						{cards.map((card) => (
							<Link
								key={card.id}
								href={`/app/decks/${card.deckId}`}
								className="block bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors"
							>
								<p className="font-medium text-sm truncate">{card.question}</p>
								<p className="text-xs text-muted-foreground mt-1 line-clamp-1">{card.answer}</p>
								{card.tags.length > 0 && (
									<div className="flex gap-1.5 mt-2">
										{card.tags.map((tg) => <Badge key={tg} variant="secondary" className="text-[10px] px-1.5 py-0">{tg}</Badge>)}
									</div>
								)}
							</Link>
						))}
					</div>
				</section>
			)}
		</div>
	);
}

export default function SearchPage() {
	return (
		<Suspense fallback={<div className="h-32" />}>
			<SearchContent />
		</Suspense>
	);
}
