/**
 * Root Layout
 * 
 * Wraps all pages with providers, header, footer, and global components.
 * Uses next/font for optimized font loading.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import ToastContainer from "@/components/ui/Toast";

// Load Inter font with next/font for optimal performance
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Attire - Modern Fashion E-Commerce",
  description: "Discover the latest trends in fashion. Shop clothing, accessories, and more with free shipping on orders over $50.",
  keywords: "fashion, clothing, accessories, online shopping, women's fashion, men's fashion",
  openGraph: {
    title: "Attire - Modern Fashion E-Commerce",
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
    <html lang="en">
      <body className={`${inter.variable} font-sans min-h-screen flex flex-col`}>
        <AuthProvider>
          <SocketProvider>
            <AppProvider>
              <CartProvider>
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
                <CartDrawer />
                <ToastContainer />
              </CartProvider>
            </AppProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
