"use client"

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Navbar from "../src/components/Layout/Navbar"
import Footer from "../src/components/Layout/Footer"
import HomePage from "../src/pages/HomePage"
import LoginPage from "../src/pages/LoginPage"
import RegisterPage from "../src/pages/RegisterPage"
import AdminPage from "../src/pages/AdminPage"
import MenuItemPage from "../src/pages/MenuItemPage"
import ReservationPage from "../src/pages/ReservationPage"
import QRTablePage from "../src/pages/QRTablePage"
import "../src/App.css"

export default function Page() {
  return (
    <Router>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/menu/:id" element={<MenuItemPage />} />
            <Route path="/reservation" element={<ReservationPage />} />
            <Route path="/table/:token" element={<QRTablePage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}
