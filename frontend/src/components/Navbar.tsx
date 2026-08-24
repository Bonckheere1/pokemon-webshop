import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        Poké Mart
      </Link>
      <Link to="/graded-cards" className="graded-cards-link">
        Graded Cards
      </Link>
      <Link to="/sell" className="sell-link">
        Sell
      </Link>
      <Link to="/cart" className="cart-link">
        Cart
      </Link>
    </nav>
  );
}
