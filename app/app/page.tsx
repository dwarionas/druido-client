"use client";

import React from "react";
import Link from "next/link";
import { decksApi, DeckSummary } from "@/lib/decks-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card as UICard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppPage() {
	const [decks, setDecks] = React.useState<DeckSummary[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");

	async function loadDecks(query?: string) {
		setLoading(true);
		try {
			const data = await decksApi.list(query);
			setDecks(data);
		} finally {
			setLoading(false);
		}
	}

	React.useEffect(() => {
		void loadDecks();
	}, []);

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) return;
		await decksApi.create({ name, description: description || undefined });
		setName("");
		setDescription("");
		await loadDecks();
	}

	return (
		<div className="space-y-6">
			<section>
				<h1 className="text-2xl font-semibold mb-2">Your decks</h1>
				<p className="text-muted-foreground text-sm">Create decks and manage your collections of cards.</p>
			</section>

			<section className="grid gap-4 md:grid-cols-[2fr,3fr]">
				<form onSubmit={handleCreate} className="space-y-3">
					<h2 className="text-sm font-medium">Create a new deck</h2>
					<Input placeholder="Deck name" value={name} onChange={(e) => setName(e.target.value)} />
					<Input placeholder="Optional description" value={description} onChange={(e) => setDescription(e.target.value)} />
					<Button type="submit" disabled={!name.trim()}>
						Create deck
					</Button>
				</form>
			</section>

			<section className="grid gap-4 md:grid-cols-2">
				{loading && <p className="text-muted-foreground">Loading decks...</p>}
				{!loading && decks.length === 0 && <p className="text-muted-foreground">You have no decks yet. Create your first one above.</p>}
				{decks.map((deck) => (
					<UICard key={deck.id} className="flex flex-col justify-between">
						<CardHeader>
							<CardTitle className="flex items-center justify-between gap-2">
								<span>{deck.name}</span>
								<span className="text-xs font-normal text-muted-foreground">{deck.totalCards} cards</span>
							</CardTitle>
						</CardHeader>
						<CardContent>
							{deck.description && <p className="text-sm text-muted-foreground mb-2">{deck.description}</p>}
							<Button variant="outline" size="sm" asChild>
								<Link href={`/app/decks/${deck.id}`}>Open deck</Link>
							</Button>
						</CardContent>
					</UICard>
				))}
			</section>
		</div>
	);
}
