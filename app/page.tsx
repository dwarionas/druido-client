import { Header } from "@/components/Header";
import { LandingHero } from "@/components/LandingHero";

export default function Home() {
	return (
		<div className="min-h-dvh bg-background">
			<main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-10 px-4 py-12">
				<Header />

				<LandingHero />

				<section id="features" className="grid gap-4 md:grid-cols-3">
					<div className="rounded-lg border bg-card p-4 text-sm">
						<h2 className="mb-1 font-medium">Smart scheduling</h2>
						<p className="text-muted-foreground">Review cards at the right time using FSRS, a modern replacement for SM-2.</p>
					</div>
					<div className="rounded-lg border bg-card p-4 text-sm">
						<h2 className="mb-1 font-medium">Powerful organisation</h2>
						<p className="text-muted-foreground">Create multiple decks, tag cards, and search across your entire collection.</p>
					</div>
					<div className="rounded-lg border bg-card p-4 text-sm">
						<h2 className="mb-1 font-medium">Built for polyglots</h2>
						<p className="text-muted-foreground">Switch interface language between Ukrainian, English, and German (soon).</p>
					</div>
				</section>

				<footer className="mt-auto flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
					<span>© {new Date().getFullYear()} Druido.</span>
					<span>FSRS-based spaced repetition for language learners.</span>
				</footer>
			</main>
		</div>
	);
}
