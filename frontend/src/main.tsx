import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import App from "./app/App";
import "./index.css";

// Leaflet CSS'i tek sefer, global import et
import "leaflet/dist/leaflet.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // NOT: StrictMode dev'de Leaflet'i iki kez mount edebiliyor; kapatıyoruz
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
