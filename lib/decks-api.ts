import { apiClient } from "@/lib/api-client";

export interface DeckSummary {
	id: string;
	name: string;
	description?: string;
	language?: "uk" | "en" | "de";
	tags: string[];
	totalCards: number;
	createdAt: string;
	updatedAt: string;
}

export interface Deck {
	id: string;
	name: string;
	description?: string;
	language?: "uk" | "en" | "de";
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

export interface Card {
	id: string;
	deck: string;
	question: string;
	answer: string;
	notes?: string;
	tags: string[];
	fsrsState?: any;
	createdAt: string;
	updatedAt: string;
}

export const decksApi = {
	list: (q?: string) => apiClient.get<DeckSummary[]>(q ? `/decks/summary?q=${encodeURIComponent(q)}` : "/decks/summary"),
	create: (data: { name: string; description?: string; language?: "uk" | "en" | "de"; tags?: string[] }) => apiClient.post<Deck>("/decks", data),
};

export const cardsApi = {
	list: (params: { deckId?: string; q?: string; tag?: string }) => {
		const search = new URLSearchParams();
		if (params.deckId) search.set("deckId", params.deckId);
		if (params.q) search.set("q", params.q);
		if (params.tag) search.set("tag", params.tag);
		const qs = search.toString();
		return apiClient.get<Card[]>(`/cards${qs ? `?${qs}` : ""}`);
	},
	create: (data: { deckId: string; question: string; answer: string; notes?: string; tags?: string[]; fsrsState?: any }) =>
		apiClient.post<Card>("/cards", data),
	update: (id: string, data: Partial<{ deckId: string; question: string; answer: string; notes: string; tags: string[]; fsrsState: any }>) =>
		apiClient.patch<Card>(`/cards/${id}`, data),
	delete: (id: string) => apiClient.delete<void>(`/cards/${id}`),
};
