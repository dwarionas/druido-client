import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { I18nProvider } from "@/lib/i18n";
import { Toaster } from "@/components/ui/sonner";
import { Inter } from "next/font/google";

const inter = Inter({
	subsets: ["latin", "latin-ext"],
	variable: "--font-inter",
	display: "swap",
	weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
	title: "Druido",
	description: "FSRS-based spaced repetition for serious learners. Smart scheduling, powerful deck management, and multi-language support.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" suppressHydrationWarning className={inter.variable}>
			<body className="font-sans antialiased bg-background">
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
					<I18nProvider>
						<AuthProvider>{children}</AuthProvider>
					</I18nProvider>
					<Toaster position="bottom-right" richColors />
				</ThemeProvider>
			</body>
		</html>
	);
}
