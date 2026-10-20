import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { OrderConfirmation } from "./pages/OrderConfirmation";
import { Admin } from "./pages/Admin";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders/:id" element={<OrderConfirmation />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </>
  );
}
