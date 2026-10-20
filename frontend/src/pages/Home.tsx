import { useEffect, useState } from "react";
import { fetchProducts } from "../api";
import { ProductCard } from "../components/ProductCard";
import type { Product } from "../types";

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState("id");

  useEffect(() => {
    setLoading(true);
    fetchProducts(sort)
      .then(setProducts)
      .catch(() => setError("Could not load products."))
      .finally(() => setLoading(false));
  }, [sort]);

  if (loading) return <p className="status">Loading Pokémon...</p>;
  if (error) return <p className="status error">{error}</p>;

  return (
    <div>
      <label htmlFor="sort">Sort by</label>
      <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
        <option value="id">Default</option>
        <option value="price ASC">Price: Low to High</option>
        <option value="price DESC">Price: High to Low</option>
        <option value="name ASC">Name: A to Z</option>
      </select>

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
