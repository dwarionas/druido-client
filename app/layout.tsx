import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
	title: "Druido",
	description: "FSRS-based spaced repetition app",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="bg-muted/100">
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
					<I18nProvider>
						<AuthProvider>{children}</AuthProvider>
					</I18nProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
