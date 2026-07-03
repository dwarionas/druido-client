"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { CallToActionButton } from "@/components/CallToActionButton";
import { Button } from "@/components/ui/button";

export function LandingHero() {
	const { t } = useI18n();
	const { user, loading } = useAuth();

	return (
		<section className="flex flex-col items-center text-center px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
			<div className="max-w-3xl space-y-6 animate-fade-in-up">
				<h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
					{t("landing.hero")}
				</h1>
				<p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
					{t("landing.hero.sub")}
				</p>
				<div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
					<CallToActionButton size="lg" className="w-full sm:w-auto" />
					{!loading && !user && (
						<Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
							<Link href="/register">{t("landing.cta.register")}</Link>
						</Button>
					)}
				</div>
				<p className="text-sm text-muted-foreground">{t("landing.cta.note")}</p>
			</div>
		</section>
	);
}
