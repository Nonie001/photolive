import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["latin", "thai"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PhotoLive — แกลเลอรีรูปงานแบบ realtime",
  description:
    "แพลตฟอร์มแกลเลอรีรูปสำหรับงานอีเวนต์ งานแต่ง งานวิ่ง งานรับปริญญา รูปขึ้นหน้าเว็บแบบสด ๆ ทันทีหลังช่างภาพถ่าย",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
