import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchGradedCard, purchaseGradedCard } from "../api";
import type { GradedCard } from "../types";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function GradedCardDetail() {
  const { id } = useParams<{ id: string }>();
  const [card, setCard] = useState<GradedCard | null>(null);
  const [tradeInValue, setTradeInValue] = useState(0);
  const [buying, setBuying] = useState(false);
  const [result, setResult] = useState<{ orderId: number; finalPrice: number } | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchGradedCard(id).then(setCard).catch(() => setCard(null));
  }, [id]);

  if (!card) return <p className="status">Loading...</p>;

  async function handleBuy() {
    if (!id) return;
    setBuying(true);
    try {
      const res = await purchaseGradedCard(Number(id), tradeInValue);
      setResult(res);
    } finally {
      setBuying(false);
    }
  }

  if (result) {
    return (
      <div className="order-confirmation">
        <h2>Purchase complete!</h2>
        <p>Order #{result.orderId}</p>
        <p className="price">You paid: {formatPrice(result.finalPrice)}</p>
      </div>
    );
  }

  return (
    <div className="product-detail">
      <img src={card.image} alt={card.card_name} />
      <div>
        <h2>{card.card_name}</h2>
        <p className="type">
          {card.set_name} &middot; {card.grading_company} {card.grade} &middot; Cert #{card.cert_number}
        </p>
        <p className="price">{formatPrice(card.price)}</p>

        <div className="checkout-form">
          <label htmlFor="tradeInValue">Trade-in credit (optional)</label>
          <input
            id="tradeInValue"
            type="number"
            min={0}
            value={tradeInValue}
            onChange={(e) => setTradeInValue(Math.max(0, Number(e.target.value)))}
          />
        </div>

        <button onClick={handleBuy} disabled={buying || card.status !== "listed"}>
          {card.status !== "listed" ? "Sold" : buying ? "Processing..." : "Buy now"}
        </button>
      </div>
    </div>
  );
}
