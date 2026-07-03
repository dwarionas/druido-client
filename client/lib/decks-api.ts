import { api } from './api-client';

// ----- Types -----

export interface DeckSummary {
	id: string;
	name: string;
	description: string | null;
	language: string;
	tags: string[];
	color: string;
	totalCards: number;
	dueCards: number;
	createdAt: string;
	updatedAt: string;
}

export interface Deck {
	id: string;
	name: string;
	description: string | null;
	language: string;
	tags: string[];
	color: string;
	createdAt: string;
	updatedAt: string;
}

export interface Card {
	id: string;
	deckId: string;
	question: string;
	answer: string;
	notes: string | null;
	tags: string[];
	stability: number | null;
	difficulty: number | null;
	elapsedDays: number;
	scheduledDays: number;
	reps: number;
	lapses: number;
	state: number;
	due: string;
	lastReviewedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ReviewResult {
	card: Card;
	schedule: Record<number, string>;
}

// ----- Decks API -----

export function listDecks(q?: string) {
	const query = q ? `?q=${encodeURIComponent(q)}` : '';
	return api.get<Deck[]>(`/decks${query}`);
}

export function getDecksSummary(q?: string) {
	const query = q ? `?q=${encodeURIComponent(q)}` : '';
	return api.get<DeckSummary[]>(`/decks/summary${query}`);
}

export function getDeck(id: string) {
	return api.get<Deck>(`/decks/${id}`);
}

export function createDeck(data: { name: string; description?: string; language?: string; tags?: string[]; color?: string }) {
	return api.post<Deck>('/decks', data);
}

export function updateDeck(id: string, data: Partial<{ name: string; description: string; language: string; tags: string[]; color: string }>) {
	return api.patch<Deck>(`/decks/${id}`, data);
}

export function deleteDeck(id: string) {
	return api.del<void>(`/decks/${id}`);
}

// ----- Cards API -----

export interface CardListResult {
	items: Card[];
	total: number;
}

export function listCards(options: { deckId?: string; q?: string; tag?: string; skip?: number; take?: number } = {}) {
	const params = new URLSearchParams();
	if (options.deckId) params.set('deckId', options.deckId);
	if (options.q) params.set('q', options.q);
	if (options.tag) params.set('tag', options.tag);
	if (options.skip) params.set('skip', String(options.skip));
	if (options.take) params.set('take', String(options.take));
	const query = params.toString() ? `?${params}` : '';
	return api.get<CardListResult>(`/cards${query}`);
}

export function getDueCards(deckId?: string) {
	return api.get<Card[]>(deckId ? `/cards/due?deckId=${deckId}` : '/cards/due');
}

export function getCard(id: string) {
	return api.get<Card>(`/cards/${id}`);
}

export function getSchedulePreview(id: string) {
	return api.get<Record<number, string>>(`/cards/${id}/schedule`);
}

export function createCard(data: { deckId: string; question: string; answer: string; notes?: string; tags?: string[] }) {
	return api.post<Card>('/cards', data);
}

export function bulkCreateCards(cards: { deckId: string; question: string; answer: string; notes?: string; tags?: string[] }[]) {
	return api.post<{ count: number }>('/cards/bulk', { cards });
}

export function updateCard(id: string, data: Partial<{ question: string; answer: string; notes: string; tags: string[] }>) {
	return api.patch<Card>(`/cards/${id}`, data);
}

export function reviewCard(id: string, rating: number) {
	return api.post<ReviewResult>(`/cards/${id}/review`, { rating });
}

export function deleteCard(id: string) {
	return api.del<void>(`/cards/${id}`);
}

export function bulkDeleteCards(deckId: string) {
	return api.del<void>(`/cards/bulk?deckId=${deckId}`);
}

// ----- Stats API -----

export interface StatsOverview {
	xp: number;
	streak: number;
	dailyGoal: number;
	lastStudiedAt: string | null;
	memberSince: string;
	totalDecks: number;
	totalCards: number;
	reviewedToday: number;
}

export interface DailyStats {
	date: string;
	cardsReviewed: number;
	xpEarned: number;
}

export interface DeckStats {
	deckId: string;
	deckName: string;
	total: number;
	mature: number;
	learning: number;
	new: number;
	masteryPercent: number;
}

export function getStatsOverview() {
	return api.get<StatsOverview>('/stats/overview');
}

export function getStatsHeatmap() {
	return api.get<Record<string, number>>('/stats/heatmap');
}

export function getStatsDaily(days: number = 30) {
	return api.get<DailyStats[]>(`/stats/daily?days=${days}`);
}

export function getStatsByDeck() {
	return api.get<DeckStats[]>('/stats/decks');
}

// ----- Profile API -----

export function updateProfile(data: { name?: string; dailyGoal?: number }) {
	return api.patch<any>('/auth/profile', data);
}

export function changePassword(data: { currentPassword: string; newPassword: string }) {
	return api.post<{ success: boolean }>('/auth/change-password', data);
}
