import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchOrder } from "../api";
import type { Order } from "../types";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchOrder(id)
      .then(setOrder)
      .catch(() => setError("Could not load this order."));
  }, [id]);

  if (error) return <p className="status error">{error}</p>;
  if (!order) return <p className="status">Loading order...</p>;

  return (
    <div className="order-confirmation">
      <h2>Thanks{order.customer_name ? `, ${order.customer_name}` : ""}!</h2>
      <p>Order #{order.id} is on its way.</p>

      <ul className="order-items">
        {order.items.map((item, i) => (
          <li key={i}>
            {item.quantity} × {item.name} — {formatPrice(item.price)}
          </li>
        ))}
      </ul>

      <p className="price">Total: {formatPrice(order.total)}</p>

      {order.gift_message && (
        <div className="gift-message">
          <h4>Gift message</h4>
          {/* Gift messages are stored and re-rendered verbatim - no escaping,
              no sanitizer - so a message containing markup executes here as
              real HTML/JS (CWE-79 stored XSS). Anyone with this order's id
              (see the IDOR in GET /api/orders/:id) can trigger it against
              themselves, or against an admin browsing /admin (see Admin.tsx),
              where it can read the non-httpOnly `role` cookie via
              document.cookie and exfiltrate it. */}
          <div dangerouslySetInnerHTML={{ __html: order.gift_message }} />
        </div>
      )}
    </div>
  );
}
