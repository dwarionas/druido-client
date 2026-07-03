"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
	listCards, createCard, updateCard, deleteCard, bulkDeleteCards, getDeck, bulkCreateCards, updateDeck,
	setDeckSharing, getStatsByDeck, type Card, type Deck, type DeckStats,
} from "@/lib/decks-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Download, Upload, FileArchive, ArrowLeft, Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import {
	AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
	AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import Lernground from "@/components/app/Lernground";
import { useI18n } from "@/lib/i18n";
import { parseApkg } from "@/lib/apkg-parser";
import { parseCardsCsv, serializeCardsCsv } from "@/lib/csv";

const PAGE_SIZE = 50;

const DECK_COLORS: Record<string, string> = {
	yellow: "bg-yellow-500",
	peach: "bg-orange-400",
	orange: "bg-orange-500",
	green: "bg-green-500",
	blue: "bg-blue-500",
	purple: "bg-purple-500",
};

type Tab = "study" | "cards" | "stats";

export default function DeckDetailPage() {
	const params = useParams<{ deckId: string }>();
	const deckId = params.deckId;
	const { t } = useI18n();

	const [deck, setDeck] = React.useState<Deck | null>(null);
	const [cards, setCards] = React.useState<Card[]>([]);
	const [totalCards, setTotalCards] = React.useState(0);
	const [loading, setLoading] = React.useState(true);
	const [loadingMore, setLoadingMore] = React.useState(false);
	const [tagFilter, setTagFilter] = React.useState<string | null>(null);
	const [allTags, setAllTags] = React.useState<string[]>([]);
	const [activeTab, setActiveTab] = React.useState<Tab>("study");
	const [reviewVersion, setReviewVersion] = React.useState(0);

	// card form
	const [question, setQuestion] = React.useState("");
	const [answer, setAnswer] = React.useState("");
	const [tags, setTags] = React.useState("");
	const [editingCard, setEditingCard] = React.useState<Card | null>(null);
	const [isCardSheetOpen, setIsCardSheetOpen] = React.useState(false);
	const [saving, setSaving] = React.useState(false);

	// deck edit form
	const [isDeckSheetOpen, setIsDeckSheetOpen] = React.useState(false);
	const [deckName, setDeckName] = React.useState("");
	const [deckDescription, setDeckDescription] = React.useState("");
	const [deckColor, setDeckColor] = React.useState("yellow");
	const [savingDeck, setSavingDeck] = React.useState(false);

	// deck stats tab
	const [deckStats, setDeckStats] = React.useState<DeckStats | null>(null);

	// sharing
	const [isShareSheetOpen, setIsShareSheetOpen] = React.useState(false);
	const [togglingShare, setTogglingShare] = React.useState(false);

	const loadCards = React.useCallback(async (tag: string | null) => {
		const data = await listCards({ deckId, tag: tag ?? undefined, take: PAGE_SIZE });
		setCards(data.items);
		setTotalCards(data.total);
		if (!tag) {
			const tagSet = new Set<string>();
			data.items.forEach((c) => c.tags.forEach((tg) => tagSet.add(tg)));
			setAllTags(Array.from(tagSet).sort());
		}
	}, [deckId]);

	React.useEffect(() => {
		let cancelled = false;
		async function init() {
			try {
				const [deckData] = await Promise.all([getDeck(deckId), loadCards(null)]);
				if (!cancelled) setDeck(deckData);
			} catch { }
			finally { if (!cancelled) setLoading(false); }
		}
		init();
		return () => { cancelled = true; };
	}, [deckId, loadCards]);

	React.useEffect(() => {
		if (activeTab !== "stats") return;
		let cancelled = false;
		getStatsByDeck()
			.then((all) => {
				if (!cancelled) setDeckStats(all.find((s) => s.deckId === deckId) ?? null);
			})
			.catch(() => { });
		return () => { cancelled = true; };
	}, [activeTab, deckId, reviewVersion]);

	async function handleTagFilter(tag: string | null) {
		setTagFilter(tag);
		try {
			await loadCards(tag);
		} catch { }
	}

	async function handleLoadMore() {
		setLoadingMore(true);
		try {
			const data = await listCards({ deckId, tag: tagFilter ?? undefined, skip: cards.length, take: PAGE_SIZE });
			setCards((prev) => [...prev, ...data.items]);
			setTotalCards(data.total);
		} finally {
			setLoadingMore(false);
		}
	}

	function resetCardForm() {
		setEditingCard(null);
		setQuestion("");
		setAnswer("");
		setTags("");
	}

	async function handleSaveCard(e: React.FormEvent) {
		e.preventDefault();
		if (!question.trim() || !answer.trim()) return;
		setSaving(true);
		const parsedTags = tags.split(",").map((s) => s.trim()).filter(Boolean);
		try {
			if (editingCard) {
				await updateCard(editingCard.id, { question, answer, tags: parsedTags });
				toast.success(t("toast.card.updated"));
			} else {
				await createCard({ deckId, question, answer, tags: parsedTags });
				toast.success(t("toast.card.added"));
			}
			resetCardForm();
			setIsCardSheetOpen(false);
			await loadCards(tagFilter);
		} catch { toast.error(t("toast.card.save_failed")); }
		finally { setSaving(false); }
	}

	async function handleDeleteCard(cardId: string) {
		try {
			await deleteCard(cardId);
			toast.success(t("toast.card.deleted"));
			await loadCards(tagFilter);
		}
		catch { toast.error(t("toast.card.delete_failed")); }
	}

	async function handleDeleteAllCards() {
		try {
			await bulkDeleteCards(deckId);
			toast.success(t("toast.cards.deleted_all"));
			await loadCards(null);
			setTagFilter(null);
			setReviewVersion((v) => v + 1);
		}
		catch { toast.error(t("toast.card.delete_failed")); }
	}

	async function handleSaveDeck(e: React.FormEvent) {
		e.preventDefault();
		if (!deckName.trim()) return;
		setSavingDeck(true);
		try {
			const updated = await updateDeck(deckId, {
				name: deckName.trim(),
				description: deckDescription.trim() || undefined,
				color: deckColor,
			});
			setDeck(updated);
			setIsDeckSheetOpen(false);
			toast.success(t("profile.saved"));
		} catch {
			toast.error(t("toast.deck.create_failed"));
		} finally {
			setSavingDeck(false);
		}
	}

	async function handleExport() {
		if (totalCards === 0) return;
		try {
			// export the whole deck, not just the loaded page
			const data = await listCards({ deckId, take: totalCards });
			const csv = serializeCardsCsv(data.items);
			const blob = new Blob([csv], { type: "text/csv" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `${deck?.name || "cards"}.csv`;
			link.click();
			URL.revokeObjectURL(url);
			toast.success(t("toast.export.success", { n: data.items.length }));
		} catch {
			toast.error(t("toast.import.failed"));
		}
	}

	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const apkgInputRef = React.useRef<HTMLInputElement>(null);

	async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			const text = await file.text();
			const parsed = parseCardsCsv(text);
			if (parsed.length === 0) {
				toast.info(t("toast.import.empty"));
				return;
			}
			const res = await bulkCreateCards(parsed.map((c) => ({ deckId, ...c })));
			toast.success(t("toast.import.success", { n: res.count }));
			await loadCards(tagFilter);
			setReviewVersion((v) => v + 1);
		} catch {
			toast.error(t("toast.import.failed"));
		} finally {
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	}

	async function handleApkgImport(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			const parsed = await parseApkg(file);
			if (parsed.length === 0) {
				toast.info(t("toast.import.empty"));
				return;
			}
			const res = await bulkCreateCards(parsed.map((c) => ({ deckId, question: c.question, answer: c.answer, tags: [] })));
			toast.success(t("toast.import.success", { n: res.count }));
			await loadCards(tagFilter);
			setReviewVersion((v) => v + 1);
		} catch (err) {
			console.error(err);
			toast.error(t("toast.import.failed"));
		} finally {
			if (apkgInputRef.current) apkgInputRef.current.value = "";
		}
	}

	async function handleToggleSharing() {
		if (!deck) return;
		setTogglingShare(true);
		try {
			const updated = await setDeckSharing(deckId, !deck.isPublic);
			setDeck(updated);
		} catch {
			toast.error(t("toast.import.failed"));
		} finally {
			setTogglingShare(false);
		}
	}

	const shareUrl = deck?.shareId && typeof window !== "undefined"
		? `${window.location.origin}/decks/shared/${deck.shareId}`
		: "";

	async function handleCopyShareLink() {
		if (!shareUrl) return;
		await navigator.clipboard.writeText(shareUrl);
		toast.success(t("share.copied"));
	}

	function openDeckSheet() {
		if (!deck) return;
		setDeckName(deck.name);
		setDeckDescription(deck.description ?? "");
		setDeckColor(deck.color || "yellow");
		setIsDeckSheetOpen(true);
	}

	const deckDot = DECK_COLORS[deck?.color ?? ""] || DECK_COLORS.yellow;

	const TABS: { key: Tab; labelKey: string }[] = [
		{ key: "study", labelKey: "deck.tab.study" },
		{ key: "cards", labelKey: "deck.tab.cards" },
		{ key: "stats", labelKey: "deck.tab.stats" },
	];

	return (
		<div className="space-y-6 animate-fade-in-up">
			{/* Header */}
			<section className="bg-card border border-border rounded-xl p-5">
				<div className="flex items-center gap-3 mb-4">
					<Link href="/app" className="p-2 rounded-lg border border-border hover:bg-accent transition-colors" aria-label={t("deck.detail.back")}>
						<ArrowLeft className="h-4 w-4" />
					</Link>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<span className={`w-2.5 h-2.5 rounded-full shrink-0 ${deckDot}`} />
							<h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{deck?.name ?? "…"}</h1>
							<button
								onClick={openDeckSheet}
								className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
								aria-label={t("deck.edit")}
							>
								<Pencil className="h-3.5 w-3.5" />
							</button>
							<button
								onClick={() => setIsShareSheetOpen(true)}
								className={`p-1.5 rounded-lg transition-colors hover:bg-accent ${deck?.isPublic ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
								aria-label={t("share.title")}
							>
								<Share2 className="h-3.5 w-3.5" />
							</button>
						</div>
						<p className="text-sm text-muted-foreground">{totalCards} {t("app.deck.total")}</p>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex gap-1 bg-muted rounded-lg p-1">
					{TABS.map(({ key, labelKey }) => (
						<button
							key={key}
							onClick={() => setActiveTab(key)}
							className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === key
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
								}`}
						>
							{t(labelKey)}
						</button>
					))}
				</div>
			</section>

			{/* Deck edit sheet */}
			<Sheet open={isDeckSheetOpen} onOpenChange={setIsDeckSheetOpen}>
				<SheetContent side="bottom" className="flex flex-col">
					<SheetHeader>
						<SheetTitle>{t("deck.edit")}</SheetTitle>
						<SheetDescription></SheetDescription>
					</SheetHeader>
					<form onSubmit={handleSaveDeck} className="flex flex-col gap-3 px-4 pb-4 pt-2">
						<Input placeholder={t("app.deck.create.name")} value={deckName} onChange={(e) => setDeckName(e.target.value)} />
						<Input placeholder={t("app.deck.create.desc")} value={deckDescription} onChange={(e) => setDeckDescription(e.target.value)} />
						<div className="flex items-center gap-2">
							<span className="text-xs font-medium text-muted-foreground mr-2">{t("app.deck.create.color")}</span>
							{Object.keys(DECK_COLORS).map((c) => (
								<button
									key={c}
									type="button"
									aria-label={c}
									onClick={() => setDeckColor(c)}
									className={`w-6 h-6 rounded-full transition-all ${DECK_COLORS[c]} ${deckColor === c ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "opacity-50 hover:opacity-100"}`}
								/>
							))}
						</div>
						<div className="flex justify-end gap-2">
							<Button type="button" variant="outline" size="sm" onClick={() => setIsDeckSheetOpen(false)}>{t("deck.detail.cancel")}</Button>
							<Button type="submit" size="sm" disabled={!deckName.trim() || savingDeck}>
								{savingDeck ? t("deck.detail.saving") : t("profile.save")}
							</Button>
						</div>
					</form>
				</SheetContent>
			</Sheet>

			{/* Share sheet */}
			<Sheet open={isShareSheetOpen} onOpenChange={setIsShareSheetOpen}>
				<SheetContent side="bottom" className="flex flex-col">
					<SheetHeader>
						<SheetTitle>{t("share.title")}</SheetTitle>
						<SheetDescription>{t("share.desc")}</SheetDescription>
					</SheetHeader>
					<div className="flex flex-col gap-4 px-4 pb-6 pt-2">
						<label className="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								checked={deck?.isPublic ?? false}
								onChange={handleToggleSharing}
								disabled={togglingShare}
								className="h-4 w-4 accent-primary"
							/>
							<span className="text-sm font-medium">{t("share.public_label")}</span>
						</label>
						{deck?.isPublic && shareUrl && (
							<div className="flex gap-2">
								<Input readOnly value={shareUrl} className="text-xs" onFocus={(e) => e.target.select()} />
								<Button type="button" variant="outline" size="icon" onClick={handleCopyShareLink} aria-label={t("share.copy")}>
									<Copy className="h-4 w-4" />
								</Button>
							</div>
						)}
					</div>
				</SheetContent>
			</Sheet>

			{/* Study tab */}
			{activeTab === "study" && (
				<section className="bg-card border border-border rounded-xl p-5 md:p-6">
					<Lernground deckId={deckId} version={reviewVersion} />
				</section>
			)}

			{/* Cards tab */}
			{activeTab === "cards" && (
				<section className="space-y-4">
					{/* Toolbar */}
					<div className="flex items-center gap-2 flex-wrap">
						<Sheet open={isCardSheetOpen} onOpenChange={(open) => { setIsCardSheetOpen(open); if (!open) resetCardForm(); }}>
							<SheetTrigger asChild>
								<Button size="sm">{t("deck.detail.add")}</Button>
							</SheetTrigger>
							<SheetContent side="bottom" className="flex flex-col">
								<SheetHeader>
									<SheetTitle>{editingCard ? t("deck.detail.edit") : t("deck.detail.add")}</SheetTitle>
									<SheetDescription></SheetDescription>
								</SheetHeader>
								<form onSubmit={handleSaveCard} className="flex flex-col gap-3 px-4 pb-4 pt-2">
									<Input placeholder={t("deck.detail.question")} value={question} onChange={(e) => setQuestion(e.target.value)} />
									<Textarea placeholder={t("deck.detail.answer")} value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} />
									<Input placeholder={t("deck.detail.tags")} value={tags} onChange={(e) => setTags(e.target.value)} className="text-sm" />
									<div className="flex justify-end gap-2">
										<Button type="button" variant="outline" size="sm" onClick={() => { resetCardForm(); setIsCardSheetOpen(false); }}>{t("deck.detail.cancel")}</Button>
										<Button type="submit" size="sm" disabled={!question.trim() || !answer.trim() || saving}>
											{saving ? t("deck.detail.saving") : editingCard ? t("deck.detail.edit.save") : t("deck.detail.save")}
										</Button>
									</div>
								</form>
							</SheetContent>
						</Sheet>

						<Button variant="outline" size="sm" onClick={handleExport} disabled={totalCards === 0}><Download className="h-4 w-4 mr-1" />CSV</Button>
						<Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-1" />{t("deck.detail.import")}</Button>
						<input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
						<Button variant="outline" size="sm" onClick={() => apkgInputRef.current?.click()}><FileArchive className="h-4 w-4 mr-1" />APKG</Button>
						<input ref={apkgInputRef} type="file" accept=".apkg" className="hidden" onChange={handleApkgImport} />

						{totalCards > 0 && (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto">{t("deck.detail.delete_all")}</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>{t("deck.detail.delete_all")}?</AlertDialogTitle>
										<AlertDialogDescription>{t("deck.detail.delete_all.desc")}</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>{t("deck.detail.delete_all.cancel")}</AlertDialogCancel>
										<AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteAllCards}>{t("deck.detail.delete_all.confirm")}</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}
					</div>

					{/* Tag filters */}
					{allTags.length > 0 && (
						<div className="flex flex-wrap gap-1">
							<button onClick={() => handleTagFilter(null)} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${!tagFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{t("deck.detail.tag_all")}</button>
							{allTags.map((tag) => (
								<button key={tag} onClick={() => handleTagFilter(tagFilter === tag ? null : tag)} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${tagFilter === tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{tag}</button>
							))}
						</div>
					)}

					{/* Card list */}
					{!loading && totalCards === 0 && (
						<div className="text-center py-12 bg-card border border-border rounded-xl">
							<p className="text-muted-foreground">{t("deck.detail.due")}</p>
						</div>
					)}
					<div className="space-y-2">
						{cards.map((card) => (
							<div key={card.id} className="bg-card border border-border rounded-lg p-4 flex items-start justify-between gap-3 group hover:border-primary/40 transition-colors">
								<div className="min-w-0 flex-1">
									<div className="font-medium text-sm truncate">{card.question}</div>
									<div className="mt-1 text-xs text-muted-foreground line-clamp-1">{card.answer}</div>
									{card.tags.length > 0 && (
										<div className="flex gap-1.5 mt-2">
											{card.tags.map((tg) => <Badge key={tg} variant="secondary" className="text-[10px] px-1.5 py-0">{tg}</Badge>)}
										</div>
									)}
								</div>
								<div className="flex shrink-0 gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
									<Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCard(card); setQuestion(card.question); setAnswer(card.answer); setTags(card.tags.join(", ")); setIsCardSheetOpen(true); }}>
										<Pencil className="h-4 w-4" />
									</Button>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
												<Trash2 className="h-4 w-4" />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>{t("deck.detail.delete_card")}</AlertDialogTitle>
												<AlertDialogDescription>{t("deck.detail.delete_card.desc")}</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>{t("deck.detail.cancel")}</AlertDialogCancel>
												<AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteCard(card.id)}>{t("deck.detail.delete_all.confirm")}</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							</div>
						))}
					</div>

					{/* Pagination */}
					{cards.length < totalCards && (
						<div className="flex flex-col items-center gap-2 pt-2">
							<p className="text-xs text-muted-foreground">{t("deck.detail.shown", { shown: cards.length, total: totalCards })}</p>
							<Button variant="outline" size="sm" onClick={handleLoadMore} disabled={loadingMore}>
								{loadingMore ? "..." : t("deck.detail.load_more")}
							</Button>
						</div>
					)}
				</section>
			)}

			{/* Stats tab */}
			{activeTab === "stats" && (
				<section className="space-y-4">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="bg-card border border-border rounded-xl p-5 text-center">
							<div className="text-3xl font-bold">{deckStats?.total ?? totalCards}</div>
							<div className="text-xs font-medium text-muted-foreground mt-1">{t("stats.total_cards")}</div>
						</div>
						<div className="bg-card border border-border rounded-xl p-5 text-center">
							<div className="text-3xl font-bold text-green-600 dark:text-green-500">{deckStats?.mature ?? 0}</div>
							<div className="text-xs font-medium text-muted-foreground mt-1">{t("deck.stats.mature")}</div>
						</div>
						<div className="bg-card border border-border rounded-xl p-5 text-center">
							<div className="text-3xl font-bold text-orange-600 dark:text-orange-500">{deckStats?.learning ?? 0}</div>
							<div className="text-xs font-medium text-muted-foreground mt-1">{t("deck.stats.learning")}</div>
						</div>
						<div className="bg-card border border-border rounded-xl p-5 text-center">
							<div className="text-3xl font-bold text-blue-600 dark:text-blue-500">{deckStats?.new ?? 0}</div>
							<div className="text-xs font-medium text-muted-foreground mt-1">{t("deck.stats.new")}</div>
						</div>
					</div>

					{/* Mastery bar */}
					{deckStats && deckStats.total > 0 && (
						<div className="bg-card border border-border rounded-xl p-6">
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-lg font-semibold">{t("deck.stats.mastery")}</h3>
								<span className="text-xl font-bold">{deckStats.masteryPercent}%</span>
							</div>
							<div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
								{deckStats.mature > 0 && <div className="bg-green-500 h-full" style={{ width: `${(deckStats.mature / deckStats.total) * 100}%` }} />}
								{deckStats.learning > 0 && <div className="bg-orange-500 h-full" style={{ width: `${(deckStats.learning / deckStats.total) * 100}%` }} />}
								{deckStats.new > 0 && <div className="bg-blue-500 h-full" style={{ width: `${(deckStats.new / deckStats.total) * 100}%` }} />}
							</div>
							<div className="flex flex-wrap gap-4 mt-4 text-sm font-medium text-muted-foreground">
								<span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> {deckStats.mature} {t("deck.stats.mature")}</span>
								<span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> {deckStats.learning} {t("deck.stats.learning")}</span>
								<span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> {deckStats.new} {t("deck.stats.new")}</span>
							</div>
						</div>
					)}
				</section>
			)}
		</div>
	);
}
