import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        Poké Mart
      </Link>
      <Link to="/cart" className="cart-link">
        Cart
      </Link>
      <Link to="/admin" className="admin-link">
        Admin
      </Link>
    </nav>
  );
}
