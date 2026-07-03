"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Lernground from "@/components/app/Lernground";
import { useI18n } from "@/lib/i18n";

// review session over the due cards of every deck at once
export default function StudyAllPage() {
	const { t } = useI18n();

	return (
		<div className="space-y-6 animate-fade-in-up">
			<section className="flex items-center gap-3">
				<Link href="/app" className="p-2 rounded-lg border border-border hover:bg-accent transition-colors" aria-label={t("deck.detail.back")}>
					<ArrowLeft className="h-4 w-4" />
				</Link>
				<div>
					<h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("app.study_all")}</h1>
					<p className="text-sm text-muted-foreground">{t("study.all_decks")}</p>
				</div>
			</section>

			<section className="bg-card border border-border rounded-xl p-5 md:p-6">
				<Lernground />
			</section>
		</div>
	);
}
