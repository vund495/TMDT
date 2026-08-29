import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "../store/authStore";
import type { Role } from "../types";

interface ProtectedRouteProps {
  roles?: Role[];
  children: ReactNode;
}

export default function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { profile, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return <p className="p-8 text-center text-gray-500">Đang tải...</p>;
  }
  if (!profile) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  const role: Role = profile.role;
  if (roles && !roles.includes(role)) {
    return (
      <p className="p-8 text-center text-red-600">
        Bạn không có quyền truy cập khu vực này.
      </p>
    );
  }
  return children;
}
