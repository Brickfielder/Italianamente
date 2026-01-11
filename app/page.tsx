export default function Home() {
  return (
    <main className="container">
      {/* CARD 1 - Grammatica */}
      <article className="tile">
        <div>
          <span className="tile-category">Grammatica</span>
          <h3>Mi serve ricordare il futuro?</h3>
          <div className="tile-content">
            <ul>
              <li>Quando lo uso</li>
              <li>Come si forma</li>
            </ul>
          </div>
        </div>
        <div className="read-more">Clicca per leggere</div>
      </article>

      {/* CARD 2 - Viaggi */}
      <article className="tile">
        <div>
          <span className="tile-category">Prossima Vacanza a...</span>
          <h3>Visita Padova</h3>
          <div className="tile-content">
            <ul>
              <li>Cappella degli Scrovegni</li>
              <li>Torre dell'Orologio</li>
              <li>Prato della Valle</li>
            </ul>
          </div>
        </div>
        <div className="read-more">Scopri l'itinerario</div>
      </article>

      {/* CARD 3 - Modo di Dire (Rosso) */}
      <article className="tile idiom">
        <div>
          <span className="tile-category">Modo di dire</span>
          <h3>"Non avere peli sulla lingua"</h3>
          <p>Significato: Essere molto schietti e sinceri, dire tutto ciò che si pensa.</p>
        </div>
      </article>

      {/* CARD 4 - Barzelletta (Grigio) */}
      <article className="tile joke">
        <div>
          <span className="tile-category">Barzelletta</span>
          <h3>Il colmo per un matematico?</h3>
          <p style={{ fontStyle: "italic", marginTop: "10px" }}>
            "Abitare in una frazione!"
          </p>
        </div>
        <div className="read-more">Ridi ancora</div>
      </article>

      {/* CARD 5 - Ricetta */}
      <article className="tile">
        <div>
          <span className="tile-category">Ricetta del mese</span>
          <h3>Tiramisù Classico</h3>
          <div className="tile-content">
            <p style={{ marginBottom: "10px" }}>
              Il dolce italiano più famoso al mondo.
            </p>
            <ul>
              <li>Mascarpone fresco</li>
              <li>Caffè espresso</li>
              <li>Savoiardi</li>
            </ul>
          </div>
        </div>
        <div className="read-more">Leggi la ricetta</div>
      </article>

      {/* CARD 6 - Film */}
      <article className="tile">
        <div>
          <span className="tile-category">Film del mese</span>
          <h3>La Grande Bellezza</h3>
          <div className="tile-content">
            <p><strong>Regia:</strong> Paolo Sorrentino</p>
            <p style={{ marginTop: "10px", fontSize: "0.9rem" }}>
              Un viaggio onirico attraverso Roma. Premio Oscar 2014.
            </p>
          </div>
        </div>
        <div className="read-more">Guarda il trailer</div>
      </article>
    </main>
  );
}