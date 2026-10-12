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
  title: "Regal - All your needs At one place",
  description:
    "Discover the latest trends in fashion. Shop clothing, accessories, and more with free shipping on orders over ETB500.",
  keywords:
    "fashion, clothing, accessories, online shopping, women's fashion, men's fashion",
  icons: {
    icon: "/Logo-bg.ico",
  },
  openGraph: {
    title: "Regal - All your needs At one place",
    description: "Discover the latest trends in fashion.",
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
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${organo.variable} font-sans min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <AppProvider>
          <AuthProvider>
            <SocketProvider>
              <NotificationProvider>
                <WishlistProvider>
                  <CartProvider>
                    <LoadingWrapper>
                      <Header />
                      <main className="flex-1">{children}</main>
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
      </body>
    </html>
  );
}
