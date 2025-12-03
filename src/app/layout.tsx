import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/cart/cart-drawer';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'vietnamese'],
});

export const metadata: Metadata = {
  title: 'AN Milk Tea & Tea - Đặt hàng online',
  description:
    'Thưởng thức hương vị trà sữa thơm ngon, đậm đà tại AN Milk Tea. Đặt hàng online, giao tận nơi!',
  keywords: ['trà sữa', 'milk tea', 'AN Milk Tea', 'đặt hàng online', 'giao hàng', 'Bình Chánh'],
  metadataBase: new URL('https://anmilktea.online'),
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'AN Milk Tea & Tea - Đặt hàng online',
    description: 'Thưởng thức hương vị trà sữa thơm ngon, đậm đà tại AN Milk Tea.',
    type: 'website',
    url: 'https://anmilktea.online',
    siteName: 'AN Milk Tea & Tea',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <CartDrawer />
      </body>
    </html>
  );
}
