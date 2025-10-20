import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import QRTablePage from "./pages/QRTablePage";
import TakeawayPage from "./pages/TakeawayPage";
import TakeawayCheckoutPage from "./pages/TakeawayCheckoutPage";
import ReservationPage from "./pages/ReservationPage";
import MenuItemPage from "./pages/MenuItemPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/menu/:id" element={<MenuItemPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/reservation" element={<ReservationPage />} />
                <Route path="/takeaway" element={<TakeawayPage />} />
                <Route path="/takeaway/checkout" element={<TakeawayCheckoutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/table/:token" element={<QRTablePage />} />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
            <Footer />
          </div>
          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            style={{ bottom: '100px' }}
          />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;