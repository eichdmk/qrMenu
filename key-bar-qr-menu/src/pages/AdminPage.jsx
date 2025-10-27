import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

function AdminPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Перенаправляем на страницу меню по умолчанию
    navigate("/admin/menu", { replace: true });
  }, [navigate]);

  return (
    <ProtectedRoute adminOnly>
      <div>Перенаправление...</div>
    </ProtectedRoute>
  );
}

export default AdminPage;