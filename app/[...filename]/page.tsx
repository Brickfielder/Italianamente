'use client'

import React from 'react';
import { useTina } from "tinacms/dist/react";
import { client } from "../tina/__generated__/client"; // Importante: controlla che questo percorso non dia errore

export default function Home(props) {
  // Configurazione per far funzionare Tina in modalità visuale
  // NOTA: Se vedi errori qui, potrebbe mancare il 'fetching' dei dati. 
  // Per ora impostiamo una struttura base che funziona anche vuota.
  
  // Dati di Esempio (Fallback) per vedere subito il risultato se il CMS è vuoto
  const fallbackTiles = [
    {
        type: 'standard',
        category: 'Grammatica',
        title: 'Mi serve ricordare il futuro?',
        points: ['Quando lo uso', 'Come si forma'],
        linkText: 'Clicca per leggere'
    },
    {
        type: 'idiom',
        category: 'Modo di dire',
        title: 'In bocca al lupo',
        content: 'Crepi il lupo!'
    }
  ];

  // Recuperiamo i dati se ci sono, altrimenti usiamo il fallback
  const tiles = props.data?.page?.tiles || fallbackTiles;

  return (
    <div className="page-wrapper">
        <header>
          <div className="topBar">
            <a href="#">About</a>
            <a href="#">Contacts</a>
          </div>

          <div className="brandArea">
            <h1 className="logo">ITALIANAMENTE</h1>
            <p className="subtitle">Impara l'italiano con Tiziana</p>
          </div>

          <nav className="mainNav">
            <ul>
              {['Home', 'Grammatica', 'Cultura', 'Multimedia', 'Contatti'].map((item) => (
                <li key={item}><a href="#">{item}</a></li>
              ))}
            </ul>
          </nav>
        </header>

        <main className="container">
          {tiles.map((tile, i) => (
            <article 
              key={i} 
              className={`tile ${tile.type !== 'standard' ? tile.type : ''}`}
            >
              <div>
                <span className="tileCategory" data-tina-field={tile.category}>
                    {tile.category}
                </span>
                <h3 data-tina-field={tile.title}>{tile.title}</h3>
                
                <div className="tileContent">
                  {tile.points && tile.points.length > 0 ? (
                    <ul>
                      {tile.points.map((p, index) => <li key={index}>{p}</li>)}
                    </ul>
                  ) : (
                    <p data-tina-field={tile.content}>{tile.content}</p>
                  )}
                </div>
              </div>
              {tile.linkText && <div className="readMore">{tile.linkText} ↓</div>}
            </article>
          ))}
        </main>
    </div>
  );
}