import { Routes, Route, Navigate } from "react-router-dom";
import LandingRouter from "../pages/LandingRouter";
import Login from "../pages/Login";
import Register from "../pages/Register";

import Home from "../pages/Home";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";
import OrderDetail from "../pages/OrderDetail";

import MerchantRestaurant from "../pages/MerchantRestaurant";
import MerchantMenu from "../pages/MerchantMenu";
import MerchantOrders from "../pages/MerchantOrders";

import AdminProducts from "../pages/AdminProducts";
import AdminOrders from "../pages/AdminOrders";
import AdminRestaurants from "../pages/AdminRestaurants";

import MapPage from "../pages/Map";
import Protected from "../components/Protected";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingRouter />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Public */}
      <Route path="/products" element={<Home />} />
      <Route path="/map" element={<MapPage />} />

      {/* Customer */}
      <Route path="/cart" element={<Protected roles={["user"]}><Cart /></Protected>} />
      <Route path="/checkout" element={<Protected roles={["user"]}><Checkout /></Protected>} />
      <Route path="/orders" element={<Protected roles={["user"]}><Orders /></Protected>} />
      <Route path="/orders/:id" element={<Protected roles={["user"]}><OrderDetail /></Protected>} />

      {/* Merchant */}
      <Route path="/merchant/restaurant" element={<Protected role="merchant"><MerchantRestaurant /></Protected>} />
      <Route path="/merchant/menu" element={<Protected role="merchant"><MerchantMenu /></Protected>} />
      <Route path="/merchant/orders" element={<Protected role="merchant"><MerchantOrders /></Protected>} />

      {/* Admin */}
      <Route path="/admin/products" element={<Protected role="admin"><AdminProducts /></Protected>} />
      <Route path="/admin/orders" element={<Protected role="admin"><AdminOrders /></Protected>} />
      <Route path="/admin/restaurants" element={<Protected role="admin"><AdminRestaurants /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
