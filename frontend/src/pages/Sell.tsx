import { useEffect, useState } from "react";
import {
  createGradedCardListing,
  deleteGradedCardListing,
  fetchGradedCards,
  isSellerLoggedIn,
  sellerLogin,
  sellerLogout,
  sellerRegister,
  updateGradedCardListing,
} from "../api";
import type { GradedCard } from "../types";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Only used to know which listings to show under "My inventory" - not a
// trust boundary, since it's the seller reading the payload of their own
// token to filter the UI. The server-side authorization for editing/deleting
// listings is a separate (broken) check - see gradedCards.ts.
function currentSellerId(): number | null {
  const token = localStorage.getItem("sellerToken");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.sellerId ?? null;
  } catch {
    return null;
  }
}

export function Sell() {
  const [loggedIn, setLoggedIn] = useState(isSellerLoggedIn());
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [cardName, setCardName] = useState("");
  const [setName, setSetName] = useState("");
  const [gradingCompany, setGradingCompany] = useState("PSA");
  const [grade, setGrade] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState("");
  const [creating, setCreating] = useState(false);

  const [myListings, setMyListings] = useState<GradedCard[]>([]);

  function loadMyListings() {
    const sellerId = currentSellerId();
    if (!sellerId) return;
    fetchGradedCards().then((cards) => setMyListings(cards.filter((c) => c.seller_id === sellerId)));
  }

  useEffect(() => {
    if (loggedIn) loadMyListings();
  }, [loggedIn]);

  async function handleAuth() {
    setAuthError(null);
    try {
      if (mode === "register") await sellerRegister(username, password);
      else await sellerLogin(username, password);
      setLoggedIn(true);
    } catch {
      setAuthError(mode === "register" ? "Could not register (username taken?)." : "Invalid credentials.");
    }
  }

  function handleLogout() {
    sellerLogout();
    setLoggedIn(false);
    setMyListings([]);
  }

  async function handleCreate() {
    setCreating(true);
    try {
      await createGradedCardListing({ cardName, setName, gradingCompany, grade, certNumber, price, image });
      setCardName("");
      setSetName("");
      setGrade("");
      setCertNumber("");
      setPrice(0);
      setImage("");
      loadMyListings();
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteGradedCardListing(id);
    loadMyListings();
  }

  async function handleMarkSold(id: number) {
    await updateGradedCardListing(id, { status: "sold" });
    loadMyListings();
  }

  if (!loggedIn) {
    return (
      <div className="admin-login">
        <h2>{mode === "register" ? "Become a seller" : "Seller login"}</h2>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button onClick={handleAuth}>{mode === "register" ? "Register" : "Log in"}</button>
        {authError && <p className="status error">{authError}</p>}
        <p className="type">
          {mode === "register" ? "Already have an account? " : "New seller? "}
          <a href="#" onClick={() => setMode(mode === "register" ? "login" : "register")}>
            {mode === "register" ? "Log in" : "Register"}
          </a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="cart-total">
        <h2>Sell a graded card</h2>
        <button onClick={handleLogout}>Log out</button>
      </div>

      <div className="checkout-form">
        <label htmlFor="cardName">Card name</label>
        <input id="cardName" value={cardName} onChange={(e) => setCardName(e.target.value)} />

        <label htmlFor="setName">Set</label>
        <input id="setName" value={setName} onChange={(e) => setSetName(e.target.value)} />

        <label htmlFor="gradingCompany">Grading company</label>
        <input id="gradingCompany" value={gradingCompany} onChange={(e) => setGradingCompany(e.target.value)} />

        <label htmlFor="grade">Grade</label>
        <input id="grade" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. PSA 10" />

        <label htmlFor="certNumber">Certification number</label>
        <input id="certNumber" value={certNumber} onChange={(e) => setCertNumber(e.target.value)} />

        <label htmlFor="price">Price (cents)</label>
        <input id="price" type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />

        <label htmlFor="image">Image URL</label>
        <input id="image" value={image} onChange={(e) => setImage(e.target.value)} />

        <button onClick={handleCreate} disabled={creating} style={{ marginTop: "0.75rem" }}>
          {creating ? "Listing..." : "List for sale"}
        </button>
      </div>

      <h3>My inventory</h3>
      {myListings.map((card) => (
        <div className="admin-order" key={card.id}>
          <h4>
            {card.card_name} ({card.grading_company} {card.grade}) — {formatPrice(card.price)} — {card.status}
          </h4>
          <button onClick={() => handleMarkSold(card.id)}>Mark sold</button>{" "}
          <button onClick={() => handleDelete(card.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
