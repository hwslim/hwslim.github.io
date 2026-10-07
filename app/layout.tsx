import type { Metadata } from 'next';
import { getSettings } from '../lib/content.mjs';
import './globals.css';

const site = getSettings();
export const metadata: Metadata = {
  title: { default: `${site.lab_name} | ${site.full_name}`, template: `%s | ${site.lab_name}` },
  description: site.meta_description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
