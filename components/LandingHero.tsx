"use client";

import React from "react";
import { LanguageSwitcher, useI18n } from "@/lib/i18n";

export function LandingHero() {
	const { t } = useI18n();

	return (
		<section className="grid gap-8 md:grid-cols-2 md:items-center">
			<div className="space-y-4">
				<h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t("landing.hero")}</h1>
				<p className="text-muted-foreground text-lg">
					Druido helps you remember more with an advanced scheduling algorithm, clean interface, and fast deck management for language
					learning and beyond.
				</p>
				<div className="flex flex-wrap gap-3 items-center">
					<a href="http://localhost:8000/login" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
						{t("landing.cta")}
					</a>
					<a href="#features" className="rounded-md border px-4 py-2 text-sm font-medium">
						Learn more
					</a>
				</div>
			</div>
			<div className="flex flex-col items-end gap-4">
				<LanguageSwitcher />
				<div className="rounded-xl border bg-card p-6 shadow-sm w-full">
					<p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Why Druido</p>
					<ul className="space-y-3 text-sm text-muted-foreground">
						<li>• FSRS algorithm for optimal long-term retention.</li>
						<li>• Decks and cards synced securely in the cloud.</li>
						<li>• Dashboard, filters, and global search to stay organised.</li>
						<li>• Designed for language learners with multilingual UI.</li>
					</ul>
				</div>
			</div>
		</section>
	);
}
