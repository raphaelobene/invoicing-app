import { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import { ThemeProvider } from "@/components/shared/theme-provider"
import { site } from "@/lib/constants"
import { cn } from "@/lib/utils/dx"

import "./globals.css"

const fontSans = Inter({
	variable: "--font-sans",
	subsets: ["latin"],
})
const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
})

export const metadata: Metadata = {
	description: site.description,
	metadataBase: new URL(site.url),
	title: {
		absolute: site.name,
		template: `%s | ${site.name}`,
	},
	keywords: ["Next.js", "TypeScript", "React", "Web Development", "Tutorials"],
	authors: [{ name: `${site.name} Team`, url: `${site.url}/about-us` }],
	creator: "Aeons Co.",
	publisher: site.name,
	openGraph: {
		type: "website",
		locale: "en_US",
		url: site.url,
		title: site.name,
		description: site.description,
		siteName: site.name,
	},
	twitter: {
		card: "summary_large_image",
		title: site.name,
		description: site.description,
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	alternates: {
		canonical: site.url,
		languages: {
			"en-US": site.url,
		},
	},
}
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={cn(
				"antialiased, font-sans",
				fontSans.variable,
				geistMono.variable
			)}
		>
			<body>
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	)
}
