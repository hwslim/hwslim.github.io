import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Embodied AI Lab',
  description: 'Research on Embodied Artificial Intelligence',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/researchers">Researchers</Link></li>
            <li><Link href="/research-areas">Research Areas</Link></li>
            <li><Link href="/projects">Projects</Link></li>
            <li><Link href="/publications">Publications</Link></li>
            <li><Link href="/news">News</Link></li>
          </ul>
        </nav>
        {children}
      </body>
    </html>
  );
}
