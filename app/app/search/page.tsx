"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { cardsApi, Card, decksApi, DeckSummary } from "@/lib/decks-api";
import { Card as UICard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SearchPage() {
	const searchParams = useSearchParams();
	const initialQ = searchParams.get("q") || "";
	const [query, setQuery] = React.useState(initialQ);
	const [cards, setCards] = React.useState<Card[]>([]);
	const [decks, setDecks] = React.useState<DeckSummary[]>([]);
	const [loading, setLoading] = React.useState(false);

	React.useEffect(() => {
		if (!initialQ) return;
		void runSearch(initialQ);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialQ]);

	async function runSearch(q: string) {
		setLoading(true);
		try {
			const [deckData, cardData] = await Promise.all([decksApi.list(q), cardsApi.list({ q })]);
			setDecks(deckData);
			setCards(cardData);
		} finally {
			setLoading(false);
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!query.trim()) return;
		await runSearch(query.trim());
	}

	return (
		<div className="space-y-4">
			<section>
				<h1 className="text-2xl font-semibold mb-2">Search</h1>
				<p className="text-sm text-muted-foreground">Search across all your cards by question or answer.</p>
			</section>

			<form onSubmit={handleSubmit} className="flex gap-2">
				<input
					className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
					placeholder="Search cards..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
				<button className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" type="submit">
					Search
				</button>
			</form>

			{loading && <p className="text-muted-foreground">Searching...</p>}

			{!loading && decks.length === 0 && cards.length === 0 && initialQ && (
				<p className="text-muted-foreground">No results for "{initialQ}".</p>
			)}

			{!loading && decks.length > 0 && (
				<section className="space-y-2">
					<h2 className="text-sm font-medium">Decks</h2>
					{decks.map((deck) => (
						<UICard key={deck.id}>
							<CardHeader>
								<CardTitle className="flex items-center justify-between gap-2 text-sm">
									<span>{deck.name}</span>
									<span className="text-xs font-normal text-muted-foreground">{deck.totalCards} cards</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								{deck.description && <p className="text-xs text-muted-foreground mb-1">{deck.description}</p>}
								<a href={`/app/decks/${deck.id}`} className="text-xs font-medium text-primary underline underline-offset-4">
									Open deck
								</a>
							</CardContent>
						</UICard>
					))}
				</section>
			)}

			{!loading && cards.length > 0 && (
				<section className="space-y-2">
					<h2 className="text-sm font-medium">Cards</h2>
					{cards.map((card) => (
						<UICard key={card.id}>
							<CardHeader>
								<CardTitle className="text-sm">{card.question}</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">{card.answer}</p>
							</CardContent>
						</UICard>
					))}
				</section>
			)}
		</div>
	);
}
