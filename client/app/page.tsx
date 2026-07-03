"use client";

import { Header } from "@/components/Header";
import { LandingHero } from "@/components/LandingHero";
import { LanguageSwitcher, useI18n } from "@/lib/i18n";
import { CallToActionButton } from "@/components/CallToActionButton";
import { Brain, Upload, BarChart3, Globe } from "lucide-react";
import React from "react";

const RATING_PREVIEW = [
	{ labelKey: "deck.review.again", interval: "10m", className: "text-red-600 dark:text-red-400" },
	{ labelKey: "deck.review.hard", interval: "1h", className: "text-orange-600 dark:text-orange-400" },
	{ labelKey: "deck.review.good", interval: "3d", className: "text-primary" },
	{ labelKey: "deck.review.easy", interval: "7d", className: "text-green-600 dark:text-green-400" },
];

function CardPreview() {
	const { t } = useI18n();

	return (
		<div className="w-full max-w-md mx-auto">
			<div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center space-y-6">
				<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
					{t("deck.detail.question")}
				</p>
				<p className="text-2xl font-semibold">die Bibliothek</p>
				<div className="grid grid-cols-4 gap-2 pt-2">
					{RATING_PREVIEW.map(({ labelKey, interval, className }) => (
						<div key={labelKey} className="border border-border rounded-lg py-2 px-1">
							<p className={`text-xs font-semibold ${className}`}>{t(labelKey)}</p>
							<p className="text-[11px] text-muted-foreground mt-0.5">{interval}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default function Home() {
	const { t } = useI18n();
	const [openFaq, setOpenFaq] = React.useState<number | null>(null);

	const features = [
		{ icon: Brain, titleKey: "landing.features.grid.1.title", descKey: "landing.features.grid.1.desc" },
		{ icon: Upload, titleKey: "landing.features.grid.2.title", descKey: "landing.features.grid.2.desc" },
		{ icon: BarChart3, titleKey: "landing.features.grid.3.title", descKey: "landing.features.grid.3.desc" },
		{ icon: Globe, titleKey: "landing.features.grid.4.title", descKey: "landing.features.grid.4.desc" },
	];

	const steps = [
		{ titleKey: "onboarding.step1.title", descKey: "onboarding.step1.desc" },
		{ titleKey: "onboarding.step2.title", descKey: "onboarding.step2.desc" },
		{ titleKey: "onboarding.step3.title", descKey: "onboarding.step3.desc" },
	];

	const faqs = [
		{ q: "landing.faq.q1", a: "landing.faq.a1" },
		{ q: "landing.faq.q2", a: "landing.faq.a2" },
		{ q: "landing.faq.q3", a: "landing.faq.a3" },
	];

	return (
		<div className="flex flex-col min-h-dvh bg-background">
			<Header />

			<LandingHero />

			{/* Product preview */}
			<section className="px-6 pb-20">
				<CardPreview />
			</section>

			{/* Features */}
			<section className="w-full py-20 px-6 border-t border-border">
				<div className="max-w-5xl mx-auto">
					<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-12">
						{t("landing.features.grid.title")}
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{features.map(({ icon: Icon, titleKey, descKey }) => (
							<div key={titleKey} className="bg-card border border-border rounded-xl p-5">
								<Icon className="h-5 w-5 text-primary mb-3" />
								<h3 className="text-sm font-semibold mb-1.5">{t(titleKey)}</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">{t(descKey)}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* How it works */}
			<section className="w-full py-20 px-6 border-t border-border">
				<div className="max-w-3xl mx-auto">
					<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-12">
						{t("landing.how.title")}
					</h2>
					<ol className="space-y-8">
						{steps.map(({ titleKey, descKey }, i) => (
							<li key={titleKey} className="flex gap-4">
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
									{i + 1}
								</span>
								<div>
									<h3 className="font-semibold mb-1">{t(titleKey)}</h3>
									<p className="text-sm text-muted-foreground leading-relaxed">{t(descKey)}</p>
								</div>
							</li>
						))}
					</ol>
				</div>
			</section>

			{/* FAQ */}
			<section className="w-full py-20 px-6 border-t border-border">
				<div className="max-w-2xl mx-auto">
					<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-12">
						{t("landing.faq.title")}
					</h2>
					<div className="divide-y divide-border border-y border-border mb-16">
						{faqs.map((faq, i) => (
							<div key={faq.q}>
								<button
									className="w-full text-left py-4 font-medium flex items-center justify-between gap-4"
									onClick={() => setOpenFaq(openFaq === i ? null : i)}
									aria-expanded={openFaq === i}
								>
									{t(faq.q)}
									<span
										className={`text-muted-foreground transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}
									>
										+
									</span>
								</button>
								<div
									className={`overflow-hidden transition-all duration-200 ${openFaq === i ? "max-h-40 pb-4" : "max-h-0"}`}
								>
									<p className="text-sm text-muted-foreground leading-relaxed">{t(faq.a)}</p>
								</div>
							</div>
						))}
					</div>
					<div className="flex justify-center">
						<CallToActionButton size="lg" />
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="w-full border-t border-border py-10 px-6 mt-auto">
				<div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-2">
						<div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-[10px] font-bold">
							D
						</div>
						<span className="text-sm font-semibold tracking-tight">Druido</span>
					</div>
					<LanguageSwitcher />
					<span className="text-xs text-muted-foreground">{t("landing.footer")}</span>
				</div>
			</footer>
		</div>
	);
}
