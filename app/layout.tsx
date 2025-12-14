import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Reponix - AI-Powered GitHub Repository Analyzer | Code Analysis Tool",
  description:
    "Analyze GitHub repositories with AI. Detect security vulnerabilities, code quality issues, and AI-generated code. Free instant analysis for recruiters, developers, and educators.",
  keywords: [
    "GitHub analyzer",
    "repository analyzer",
    "code analyzer",
    "AI code detection",
    "GitHub repo analyzer",
    "code quality tool",
    "security vulnerability scanner",
    "AI-generated code detector",
    "Reponix",
    "code analysis",
    "GitHub security scanner",
    "repository scanner",
    "code review tool",
    "AI code checker",
    "GitHub analysis tool",
  ],
  authors: [{ name: "Tanishq", url: "https://github.com/tanishqbuilds" }],
  creator: "Tanishq",
  publisher: "Reponix",
  metadataBase: new URL("https://reponix.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://reponix.vercel.app",
    title: "Reponix - AI-Powered GitHub Repository Analyzer",
    description:
      "Analyze any GitHub repository instantly. Detect AI-generated code, security vulnerabilities, and code quality issues with our free AI-powered tool.",
    siteName: "Reponix",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Reponix - GitHub Repository Analyzer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reponix - AI-Powered GitHub Repository Analyzer",
    description:
      "Analyze GitHub repositories with AI. Detect security vulnerabilities, code quality issues, and AI-generated code instantly.",
    images: ["/og-image.png"],
    creator: "@tanishqbuilds",
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
  verification: {
    google: "CZ2Qm2fHMXL1NA0yJi3hIrfEvjTCJ1p4Hp5MCpoJX0E",
    // yandex: "your-yandex-verification-code",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Reponix",
    description:
      "AI-powered GitHub repository analyzer that detects security vulnerabilities, code quality issues, and AI-generated code",
    url: "https://reponix.vercel.app",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "GitHub repository analysis",
      "AI-generated code detection",
      "Security vulnerability scanning",
      "Code quality assessment",
      "Instant analysis results",
    ],
    author: {
      "@type": "Person",
      name: "Tanishq",
      url: "https://github.com/tanishqbuilds",
    },
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
