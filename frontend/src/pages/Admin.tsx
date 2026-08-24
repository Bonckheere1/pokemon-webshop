import { useState } from "react";
import { adminLogin, fetchAdminOrders } from "../api";
import type { Order } from "../types";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function Admin() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  async function handleLogin() {
    setError(null);
    try {
      await adminLogin(password);
      setLoggedIn(true);
      const data = await fetchAdminOrders();
      setOrders(data);
    } catch {
      setError("Invalid password.");
    }
  }

  if (!loggedIn) {
    return (
      <div className="admin-login">
        <h2>Admin login</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button onClick={handleLogin}>Log in</button>
        {error && <p className="status error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <h2>All orders</h2>
      {orders.map((order) => (
        <div className="admin-order" key={order.id}>
          <h4>
            Order #{order.id} — {formatPrice(order.total)}
          </h4>
          <p>
            {order.customer_name ?? "Guest"} {order.customer_email ? `(${order.customer_email})` : ""}
          </p>
          {order.gift_message && (
            // Same unsanitized render as the customer-facing order page, but
            // here it runs in the admin's browsing context - this is the
            // "impactful" half of the stored-XSS chain: an attacker with any
            // order id's gift message set to injected script gets it executed
            // as this admin session once they view the dashboard.
            <div className="gift-message" dangerouslySetInnerHTML={{ __html: order.gift_message }} />
          )}
        </div>
      ))}
    </div>
  );
}
