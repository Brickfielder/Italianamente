import React from "react";
import Link from "next/link";
import Script from "next/script";
import "./global.css";
import { ABOUT_PAGE_HREF } from "./constants/routes";

export const metadata = {
  title: "ItalianaMente",
  description: "Impara l'italiano con Tiziana",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        <a className="skip-link" href="#main-content">Vai al contenuto</a>
        <header className="site-header">
          <div className="header-top">
            <Link href="/" className="brand-area" aria-label="ItalianaMente — Home">
              <span className="logo">ItalianaMente</span>
              <span className="subtitle">Impara l’italiano con Tiziana</span>
            </Link>
            <nav className="top-bar" aria-label="Informazioni">
              <Link href={ABOUT_PAGE_HREF}>Chi sono</Link>
              <a href="mailto:tiziana.mazzotta25@gmail.com">Contatti</a>
            </nav>
          </div>

          <nav className="main-nav" aria-label="Navigazione principale">
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/grammar">Grammatica</a></li>
              <li><a href="/culture">Cultura</a></li>
              <li><a href="/multimedia">Multimedia</a></li>
            </ul>
          </nav>
        </header>

        <div id="main-content">{children}</div>

        <footer>
          &copy; 2026 ItalianaMente · Corso di italiano con Tiziana
        </footer>

        <Script
          data-goatcounter="https://italianamente.goatcounter.com/count"
          src="https://gc.zgo.at/count.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
