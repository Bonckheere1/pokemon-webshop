import { Link } from "react-router-dom";
import type { Product } from "../types";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ProductCard({ product }: { product: Product }) {
  const contents: string[] = product.contents ? JSON.parse(product.contents) : [];

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      {product.category === "box" && <span className="box-badge">🎁 Box</span>}
      <img src={product.image} alt={product.name} loading="lazy" />
      <h3>{product.name}</h3>
      {product.category === "box" ? (
        <p className="type">Includes: {contents.join(", ")}</p>
      ) : (
        <p className="type">{product.type}</p>
      )}
      <p className="price">{formatPrice(product.price)}</p>
    </Link>
  );
}
