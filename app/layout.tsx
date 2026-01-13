import React from "react";
import "./global.css";

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
            <a href="#">About</a>
            <a href="mailto:tiziana.mazzotta25@gmail.com">Contact</a>
          </div>

          <div className="brand-area">
            <h1 className="logo">ITALIANAMENTE</h1>
            <p className="subtitle">Impara l'italiano con Tiziana</p>
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
          &copy; 2024 ItalianaMente - Corso di Italiano con Tiziana
        </footer>
      </body>
    </html>
  );
}
