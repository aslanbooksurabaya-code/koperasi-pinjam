import type { Metadata } from "next"
import { Inter, Manrope } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: {
    default: "KoperasiApp — Sistem Informasi Koperasi Simpan Pinjam",
    template: "%s | KoperasiApp",
  },
  description:
    "Sistem manajemen koperasi simpan pinjam — nasabah, pinjaman, angsuran, dan laporan keuangan.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${manrope.variable} ${inter.variable} antialiased`}
      suppressHydrationWarning
    >
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
