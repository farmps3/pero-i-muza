
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "Перо и Муза — литературная платформа",
    template: "%s | Перо и Муза",
  },
  description:
    "Международная литературная платформа для поэтов и писателей. Публикуйте произведения, создавайте авторские страницы, находите читателей и вдохновение.",
  applicationName: "Перо и Муза",
  keywords: [
    "Перо и Муза",
    "литературная платформа",
    "поэзия",
    "стихи",
    "писатели",
    "поэты",
    "литература",
    "авторские произведения",
  ],
  openGraph: {
    title: "Перо и Муза — литературная платформа",
    description:
      "Пространство для поэтов и писателей со всего мира.",
    siteName: "Перо и Муза",
    locale: "ru_RU",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f2e9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
