import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchGradedCards, searchGradedCards } from "../api";
import type { GradedCard } from "../types";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function GradedCards() {
  const [cards, setCards] = useState<GradedCard[]>([]);
  const [company, setCompany] = useState("");
  const [grade, setGrade] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const request = company || grade ? searchGradedCards({ company, grade }) : fetchGradedCards();
    request.then(setCards).finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div>
      <h2>Graded Card Singles</h2>
      <p className="type">Authenticated, professionally graded singles listed by our sellers.</p>

      <div className="checkout-form">
        <label htmlFor="company">Grading company</label>
        <input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. PSA" />

        <label htmlFor="grade">Grade</label>
        <input id="grade" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. PSA 10" />

        <button onClick={load} style={{ marginTop: "0.75rem" }}>
          Search
        </button>
      </div>

      {loading && <p className="status">Loading listings...</p>}

      {!loading && (
        <div className="product-grid">
          {cards.map((card) => (
            <Link key={card.id} to={`/graded-cards/${card.id}`} className="product-card">
              <img src={card.image} alt={card.card_name} loading="lazy" />
              <h3>{card.card_name}</h3>
              <p className="type">
                {card.grading_company} {card.grade}
              </p>
              <p className="price">{formatPrice(card.price)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
