import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nutricionista Maxsoane Costa',
  description: 'Nutricionista Maxsoane Costa',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#f9f7f2] text-[#2d312e] antialiased">
        {children}
      </body>
    </html>
  );
}