import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkout, fetchCart, removeFromCart } from "../api";
import type { CartItem } from "../types";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Coupon codes are resolved to a discount amount entirely client-side and
// handed to the server as a plain number - the backend has no matching
// coupon table and just subtracts whatever it's given (see cart.ts
// /checkout), so any of these (or a hand-crafted request) can undercut or
// zero out the total.
const COUPON_CODES: Record<string, number> = {
  WELCOME10: 1000,
  SAVE20: 2000,
};

export function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  function load() {
    setLoading(true);
    fetchCart()
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleRemove(cartItemId: number) {
    await removeFromCart(cartItemId);
    load();
  }

  async function handleCheckout() {
    setCheckingOut(true);
    try {
      const discountAmount = COUPON_CODES[couponCode.trim().toUpperCase()] ?? 0;
      const result = await checkout({
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        giftMessage: giftMessage || undefined,
        discountAmount,
      });
      navigate(`/orders/${result.orderId}`);
    } finally {
      setCheckingOut(false);
    }
  }

  if (loading) return <p className="status">Loading cart...</p>;
  if (items.length === 0) return <p className="status">Your cart is empty.</p>;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="cart">
      {items.map((item) => (
        <div className="cart-item" key={item.cartItemId}>
          <img src={item.image} alt={item.name} />
          <div className="cart-item-info">
            <h4>{item.name}</h4>
            <p>
              {item.quantity} × {formatPrice(item.price)}
            </p>
          </div>
          <button onClick={() => handleRemove(item.cartItemId)}>Remove</button>
        </div>
      ))}

      <div className="checkout-form">
        <label htmlFor="customerName">Name</label>
        <input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />

        <label htmlFor="customerEmail">Email</label>
        <input id="customerEmail" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />

        <label htmlFor="giftMessage">Gift message (optional)</label>
        <textarea id="giftMessage" value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} />

        <label htmlFor="couponCode">Coupon code (optional)</label>
        <input id="couponCode" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="e.g. WELCOME10" />
      </div>

      <div className="cart-total">
        <strong>Total: {formatPrice(total)}</strong>
        <button onClick={handleCheckout} disabled={checkingOut}>
          {checkingOut ? "Placing order..." : "Checkout"}
        </button>
      </div>
    </div>
  );
}
