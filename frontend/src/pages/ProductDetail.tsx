import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addToCart, fetchProduct } from "../api";
import type { Product } from "../types";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchProduct(id).then(setProduct).catch(() => setProduct(null));
  }, [id]);

  if (!product) return <p className="status">Loading...</p>;

  const contents: string[] = product.contents ? JSON.parse(product.contents) : [];

  async function handleAddToCart() {
    setAdding(true);
    try {
      await addToCart(product!.id, quantity);
      navigate("/cart");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="product-detail">
      <img src={product.image} alt={product.name} />
      <div>
        <h2>{product.name}</h2>
        {product.category === "box" ? (
          <p className="type">Includes: {contents.join(", ")}</p>
        ) : (
          <p className="type">{product.type}</p>
        )}
        <p className="description">{product.description}</p>
        <p className="price">{formatPrice(product.price)}</p>
        <div className="quantity-row">
          <label htmlFor="quantity">Qty</label>
          <input
            id="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          />
        </div>
        <button onClick={handleAddToCart} disabled={adding}>
          {adding ? "Adding..." : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
