import { useEffect, useState } from "react";
import { fetchBoxes, fetchProducts } from "../api";
import { ProductCard } from "../components/ProductCard";
import type { Product } from "../types";

type Tab = "pokemon" | "boxes";

export function Home() {
  const [tab, setTab] = useState<Tab>("pokemon");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const load = tab === "pokemon" ? fetchProducts() : fetchBoxes();
    load
      .then(setProducts)
      .catch(() => setError("Could not load products."))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div>
      <div className="tabs">
        <button className={tab === "pokemon" ? "tab active" : "tab"} onClick={() => setTab("pokemon")}>
          Pokémon
        </button>
        <button className={tab === "boxes" ? "tab active" : "tab"} onClick={() => setTab("boxes")}>
          Boxes
        </button>
      </div>

      {loading && <p className="status">Loading...</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
