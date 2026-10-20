/**
 * Root Layout
 *
 * Wraps all pages with providers, header, footer, and global components.
 */

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

export const runtime = "nodejs";
import { CartProvider } from "@/context/CartContext";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ServicesProvider } from "@/context/ServicesContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import ToastContainer from "@/components/ui/Toast";
import ScrollToTop from "@/components/layout/ScrollToTop";
import LoadingWrapper from "@/components/layout/LoadingWrapper";

import AIAssistant from "@/components/chat/AIAssistant";

const organo = localFont({
  src: "../../public/fonts/Organo.ttf",
  variable: "--font-organo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Regal — Curated. Crafted. Crowned. | የተመረጠ። በጥበብ የተሰራ። የነገሰ።",
  description:
    "Restoring dignity, health, and natural living through chemical-free body care, additive-free foods, modest attire, grounded toys, and guided journals.",
  keywords:
    "pure living, modest attire, organic skincare, natural food, grounded toys, mindful journals, Ethiopia",
  icons: {
    icon: "/Logo-bg.ico",
  },
  openGraph: {
    title: "Regal — Curated. Crafted. Crowned.",
    description: "Restoring dignity, health, and natural living to everyday essentials.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Noto+Sans+Ethiopic:wght@300;400;500;600;700&family=Noto+Serif+Ethiopic:wght@400;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${organo.variable} font-sans min-h-screen flex flex-col bg-[#FDFBF7] text-[#2B2D2F]`}
        suppressHydrationWarning
      >
        <LanguageProvider>
          <ServicesProvider>
            <AppProvider>
              <AuthProvider>
                <SocketProvider>
                  <NotificationProvider>
                    <WishlistProvider>
                      <CartProvider>
                        <LoadingWrapper>
                          <Header />
                          <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
                          <Footer />
                          <CartDrawer />
                          <ToastContainer />
                          <ScrollToTop />
                          <AIAssistant />
                        </LoadingWrapper>
                      </CartProvider>
                    </WishlistProvider>
                  </NotificationProvider>
                </SocketProvider>
              </AuthProvider>
            </AppProvider>
          </ServicesProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
