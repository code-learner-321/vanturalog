'use client'; 

import { usePathname } from "next/navigation";
import { Geist, Geist_Mono, Quicksand, Heebo } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AppoloWrapper from "@/lib/appolo-wrapper";

// 1. DEFINE FONTS HERE (Outside the component)
const headingFont = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-quicksand",
});

const bodyFont = Heebo({
  subsets: ["latin"],
  weight: ['100', '200', '300', '400', '700', '900'],
  variable: "--font-heebo",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  weight: ['100', '200', '300', '400', '700', '900'],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  weight: ['100', '200', '300', '400', '700', '900'],
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Logic to hide header/footer on admin pages
  const isAdmin = pathname?.startsWith("/admin");

  return (
    // 2. NOW THESE VARIABLES ARE DEFINED AND WILL WORK
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body className={`${bodyFont.variable} ${headingFont.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppoloWrapper>
          
          {/* Conditional Header */}
          {!isAdmin && <Header />}

          {children}

          {/* Conditional Footer */}
          {!isAdmin && <Footer />}

        </AppoloWrapper>
      </body>
    </html>
  );
}
