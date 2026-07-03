"use client";

import React from "react";
import Link from "next/link";
import { getDecksSummary, createDeck, deleteDeck, type DeckSummary } from "@/lib/decks-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Trash2, ArrowUpDown, Plus, GraduationCap, X } from "lucide-react";
import {
	AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
	AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n";
import WelcomeModal from "@/components/app/WelcomeModal";

const DECK_COLORS: Record<string, string> = {
	yellow: "bg-yellow-500",
	peach: "bg-orange-400",
	orange: "bg-orange-500",
	green: "bg-green-500",
	blue: "bg-blue-500",
	purple: "bg-purple-500",
};

type SortBy = "name" | "date" | "due" | "total";

export default function AppPage() {
	const [decks, setDecks] = React.useState<DeckSummary[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [formOpen, setFormOpen] = React.useState(false);
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [selectedColor, setSelectedColor] = React.useState("yellow");
	const [creating, setCreating] = React.useState(false);
	const [sortBy, setSortBy] = React.useState<SortBy>("date");
	const [showWelcome, setShowWelcome] = React.useState(false);
	const { t } = useI18n();

	async function loadDecks() {
		try {
			const data = await getDecksSummary();
			setDecks(data);
		} catch {
			toast.error(t("toast.decks.load_failed"));
		} finally {
			setLoading(false);
		}
	}

	React.useEffect(() => {
		let cancelled = false;
		getDecksSummary().then((data) => {
			if (!cancelled) {
				setDecks(data);
				setLoading(false);
				if (data.length === 0 && !localStorage.getItem("druido_onboarded")) {
					setShowWelcome(true);
				}
			}
		}).catch(() => {
			if (!cancelled) setLoading(false);
		});
		return () => { cancelled = true; };
	}, []);

	function handleDismissWelcome() {
		setShowWelcome(false);
		localStorage.setItem("druido_onboarded", "1");
	}

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) return;
		setCreating(true);
		try {
			await createDeck({ name, description: description || undefined, color: selectedColor });
			setName("");
			setDescription("");
			setSelectedColor("yellow");
			setFormOpen(false);
			toast.success(t("toast.deck.created"));
			await loadDecks();
		} catch {
			toast.error(t("toast.deck.create_failed"));
		} finally {
			setCreating(false);
		}
	}

	async function handleDeleteDeck(deckId: string) {
		try {
			await deleteDeck(deckId);
			toast.success(t("toast.deck.deleted"));
			await loadDecks();
		} catch {
			toast.error(t("toast.deck.delete_failed"));
		}
	}

	const totalDue = decks.reduce((sum, d) => sum + d.dueCards, 0);

	const sortedDecks = React.useMemo(() => {
		const sorted = [...decks];
		switch (sortBy) {
			case "name": sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
			case "due": sorted.sort((a, b) => b.dueCards - a.dueCards); break;
			case "total": sorted.sort((a, b) => b.totalCards - a.totalCards); break;
			case "date":
			default: sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
		}
		return sorted;
	}, [decks, sortBy]);

	const sortOptions: { key: SortBy; label: string }[] = [
		{ key: "date", label: t("sort.date") },
		{ key: "name", label: t("sort.name") },
		{ key: "due", label: t("sort.due") },
		{ key: "total", label: t("sort.total") },
	];

	return (
		<div className="space-y-6 animate-fade-in-up">
			{showWelcome && <WelcomeModal onDismiss={handleDismissWelcome} />}

			<section className="flex items-center justify-between gap-4">
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("app.decks.title")}</h1>
				<Button size="sm" onClick={() => setFormOpen(!formOpen)}>
					{formOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
					<span className="hidden sm:inline">{t("app.deck.create")}</span>
				</Button>
			</section>

			{/* Study-all banner */}
			{!loading && totalDue > 0 && (
				<section className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<GraduationCap className="h-5 w-5 text-primary shrink-0" />
						<p className="text-sm font-medium">{t("app.due_today", { n: totalDue })}</p>
					</div>
					<Button size="sm" asChild>
						<Link href="/app/study">{t("app.study_all")}</Link>
					</Button>
				</section>
			)}

			{/* Create deck form */}
			{formOpen && (
				<section className="bg-card border border-border rounded-xl p-5">
					<form onSubmit={handleCreate} className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<Input
								placeholder={t("app.deck.create.name")}
								value={name}
								onChange={(e) => setName(e.target.value)}
								autoFocus
							/>
							<Input placeholder={t("app.deck.create.desc")} value={description} onChange={(e) => setDescription(e.target.value)} />
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs font-medium text-muted-foreground mr-2">{t("app.deck.create.color")}</span>
							{Object.keys(DECK_COLORS).map((c) => (
								<button
									key={c}
									type="button"
									aria-label={c}
									onClick={() => setSelectedColor(c)}
									className={`w-6 h-6 rounded-full transition-all ${DECK_COLORS[c]} ${selectedColor === c ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "opacity-50 hover:opacity-100"}`}
								/>
							))}
						</div>
						<Button type="submit" size="sm" disabled={!name.trim() || creating}>
							{creating ? "..." : t("app.deck.create.save")}
						</Button>
					</form>
				</section>
			)}

			{/* Sort controls */}
			{decks.length > 1 && (
				<div className="flex items-center gap-2 flex-wrap">
					<ArrowUpDown className="h-4 w-4 text-muted-foreground" />
					{sortOptions.map((opt) => (
						<button
							key={opt.key}
							onClick={() => setSortBy(opt.key)}
							className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${sortBy === opt.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
						>
							{opt.label}
						</button>
					))}
				</div>
			)}

			<section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{loading && Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="bg-card border border-border rounded-xl p-5 space-y-4">
						<Skeleton className="h-6 w-2/3" />
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-8 w-24 rounded-lg mt-4" />
					</div>
				))}

				{!loading && decks.length === 0 && (
					<div className="col-span-full flex flex-col items-center justify-center p-12 text-center bg-card border border-border rounded-xl">
						<h3 className="text-lg font-semibold mb-2">{t("app.deck.empty")}</h3>
						<p className="text-muted-foreground text-sm max-w-sm">{t("onboarding.empty_hint")}</p>
					</div>
				)}

				{sortedDecks.map((deck) => {
					const dotColor = DECK_COLORS[deck.color] || DECK_COLORS.yellow;
					return (
						<div key={deck.id} className="group relative bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-primary/40 transition-colors">
							<div className="flex items-start justify-between gap-2">
								<div className="flex items-center gap-2 min-w-0">
									<span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
									<Link href={`/app/decks/${deck.id}`} className="text-base font-semibold truncate hover:underline underline-offset-4">
										{deck.name}
									</Link>
								</div>
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button variant="ghost" size="icon" className="h-7 w-7 -mt-1 -mr-1 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
											<Trash2 className="h-4 w-4" />
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent className="sm:max-w-[425px]">
										<AlertDialogHeader>
											<AlertDialogTitle>{t("app.deck.delete_title", { name: deck.name })}</AlertDialogTitle>
											<AlertDialogDescription>{t("deck.detail.delete_all.desc")}</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter className="mt-4">
											<AlertDialogCancel>{t("deck.detail.delete_all.cancel")}</AlertDialogCancel>
											<AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteDeck(deck.id)}>
												{t("deck.detail.delete_all.confirm")}
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>

							{deck.description && (
								<p className="text-sm text-muted-foreground line-clamp-2">{deck.description}</p>
							)}

							<div className="flex items-center justify-between mt-auto pt-2">
								<div className="flex items-center gap-2 text-xs text-muted-foreground">
									<span>{deck.totalCards} {t("app.deck.total")}</span>
									{deck.dueCards > 0 && (
										<Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
											{deck.dueCards} {t("app.deck.due")}
										</Badge>
									)}
								</div>
								<Button size="sm" variant="outline" asChild>
									<Link href={`/app/decks/${deck.id}`}>{t("app.deck.open")}</Link>
								</Button>
							</div>
						</div>
					);
				})}
			</section>
		</div>
	);
}
