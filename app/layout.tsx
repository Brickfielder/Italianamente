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
        <header>
          <div className="top-bar">
            <Link href={ABOUT_PAGE_HREF}>About</Link>
            <a href="mailto:tiziana.mazzotta25@gmail.com">Contact</a>
          </div>

          <div className="brand-area">
            <h1 className="logo">ITALIANAMENTE</h1>
            <p className="subtitle">{"Impara l'italiano con Tiziana"}</p>
          </div>

          <nav className="main-nav">
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/grammar">Grammatica</a></li>
              <li><a href="/culture">Cultura</a></li>
              <li><a href="/multimedia">Multimedia</a></li>
            </ul>
          </nav>
        </header>

        {children}

        <footer>
          &copy; 2026 ItalianaMente - Corso di Italiano con Tiziana
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
