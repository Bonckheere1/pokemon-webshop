import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { GradedCards } from "./pages/GradedCards";
import { GradedCardDetail } from "./pages/GradedCardDetail";
import { Sell } from "./pages/Sell";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/graded-cards" element={<GradedCards />} />
          <Route path="/graded-cards/:id" element={<GradedCardDetail />} />
          <Route path="/sell" element={<Sell />} />
        </Routes>
      </main>
    </>
  );
}
