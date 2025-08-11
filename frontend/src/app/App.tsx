import CssBaseline from "@mui/material/CssBaseline";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AppRoutes from "./routes";

export default function App() {
  return (
    <>
      <CssBaseline />
      <Navbar />
      <AppRoutes />
      <Footer />
    </>
  );
}
