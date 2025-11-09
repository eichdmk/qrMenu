import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
// import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import QRTablePage from "./pages/QRTablePage";
// import TakeawayPage from "./pages/TakeawayPage";
import TakeawayCheckoutPage from "./pages/TakeawayCheckoutPage";
import DeliveryCheckoutPage from "./pages/DeliveryCheckoutPage";
import ReservationPage from "./pages/ReservationPage";
import MenuItemPage from "./pages/MenuItemPage";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import PublicOffer from "./pages/PublicOffer";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import PaymentResultPage from "./pages/PaymentResultPage";
import Requisites from "./pages/Requisites";

const AdminPage = lazy(() => import("./pages/AdminPage"));
const MenuAdminPage = lazy(() => import("./pages/admin/MenuAdminPage"));
const CategoriesAdminPage = lazy(() => import("./pages/admin/CategoriesAdminPage"));
const TablesAdminPage = lazy(() => import("./pages/admin/TablesAdminPage"));
const OrdersAdminPage = lazy(() => import("./pages/admin/OrdersAdminPage"));
const ReservationsAdminPage = lazy(() => import("./pages/admin/ReservationsAdminPage"));

// Loading component для Suspense
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '50vh',
    fontSize: '18px',
    color: '#666'
  }}>
    Загрузка...
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      {/* <Route path="/" element={<HomePage />} /> */}
      <Route path="/" element={<MenuPage />} />
      <Route path="/:id" element={<MenuItemPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/reservation" element={<ReservationPage />} />
     { /* <Route path="/takeaway" element={<TakeawayPage />} /> */}
      <Route path="/takeaway/checkout" element={<TakeawayCheckoutPage />} />
      <Route path="/delivery/checkout" element={<DeliveryCheckoutPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/offer" element={<PublicOffer />} />
      <Route path="/requisites" element={<Requisites />} />
      <Route path="/payment/result" element={<PaymentResultPage />} />
      <Route path="/table/:token" element={<QRTablePage />} />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute adminOnly>
            <Suspense fallback={<LoadingSpinner />}>
              <AdminPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/menu" 
        element={
          <ProtectedRoute adminOnly>
            <Suspense fallback={<LoadingSpinner />}>
              <MenuAdminPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/categories" 
        element={
          <ProtectedRoute adminOnly>
            <Suspense fallback={<LoadingSpinner />}>
              <CategoriesAdminPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/tables" 
        element={
          <ProtectedRoute adminOnly>
            <Suspense fallback={<LoadingSpinner />}>
              <TablesAdminPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/orders" 
        element={
          <ProtectedRoute adminOnly>
            <Suspense fallback={<LoadingSpinner />}>
              <OrdersAdminPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/reservations" 
        element={
          <ProtectedRoute adminOnly>
            <Suspense fallback={<LoadingSpinner />}>
              <ReservationsAdminPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <AppRoutes />
            </main>
            <Footer />
          </div>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            limit={3}
          />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;