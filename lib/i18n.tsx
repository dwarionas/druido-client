"use client";

import React from "react";

export type Locale = "uk" | "en" | "de";

const messages: Record<Locale, Record<string, string>> = {
	uk: {
		"landing.hero": "FSRS-закріплення знань для серйозних учнів.",
		"landing.cta": "Почати з email",
		"login.title": "Повертаємось до навчання",
		"login.subtitle": "Увійдіть за допомогою email та пароля",
	},
	en: {
		"landing.hero": "FSRS-based spaced repetition for serious learners.",
		"landing.cta": "Get started with email",
		"login.title": "Welcome back",
		"login.subtitle": "Log in with your email and password",
	},
	de: {
		"landing.hero": "FSRS-basiertes Wiederholen für ernsthafte Lerner.",
		"landing.cta": "Mit E-Mail starten",
		"login.title": "Willkommen zurück",
		"login.subtitle": "Melde dich mit E-Mail und Passwort an",
	},
};

interface I18nContextValue {
	locale: Locale;
	setLocale: (locale: Locale) => void;
	t: (key: string, fallback?: string) => string;
}

const I18nContext = React.createContext<I18nContextValue | undefined>(undefined);

const LOCALE_STORAGE_KEY = "druido.locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
	const [locale, setLocaleState] = React.useState<Locale>("en");

	React.useEffect(() => {
		const stored = (typeof window !== "undefined" && window.localStorage.getItem(LOCALE_STORAGE_KEY)) as Locale | null;
		if (stored === "uk" || stored === "en" || stored === "de") {
			setLocaleState(stored);
		}
	}, []);

	const setLocale = (next: Locale) => {
		setLocaleState(next);
		if (typeof window !== "undefined") {
			window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
		}
	};

	const t = (key: string, fallback?: string) => {
		const dict = messages[locale];
		return dict[key] ?? fallback ?? messages.en[key] ?? key;
	};

	const value: I18nContextValue = {
		locale,
		setLocale,
		t,
	};

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
	const ctx = React.useContext(I18nContext);
	if (!ctx) {
		throw new Error("useI18n must be used within I18nProvider");
	}
	return ctx;
}

export function LanguageSwitcher() {
	const { locale, setLocale } = useI18n();

	return (
		<div className="flex items-center gap-1 text-xs">
			{(["uk", "en", "de"] as Locale[]).map((lng) => (
				<button
					key={lng}
					type="button"
					onClick={() => setLocale(lng)}
					className={`rounded-md px-2 py-1 ${
						locale === lng ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
					}`}
				>
					{lng.toUpperCase()}
				</button>
			))}
		</div>
	);
}
