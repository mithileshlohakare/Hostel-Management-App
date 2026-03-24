import './globals.css';
import type { Metadata } from 'next';
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google';

import { Toaster } from '@/components/ui/sonner';

const headingFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-heading' });
const bodyFont = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'HostelSync',
  description: 'Hostel management SaaS platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className='dark'>
      <body className={`${headingFont.variable} ${bodyFont.variable} font-[var(--font-body)]`}>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
