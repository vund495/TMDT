import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import CustomerLayout from "./components/layout/CustomerLayout";
import WorkshopLayout from "./components/layout/WorkshopLayout";
import AdminLayout from "./components/layout/AdminLayout";
import { Toaster } from "./components/ui";
import { useAuthStore } from "./store/authStore";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import SearchPage from "./pages/SearchPage";
import ProductDetail from "./pages/ProductDetail";
import WorkshopList from "./pages/WorkshopList";
import WorkshopDetail from "./pages/WorkshopDetail";
import PassportPage from "./pages/PassportPage";
import PassportDetail from "./pages/PassportDetail";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccess from "./pages/OrderSuccess";
import OrdersList from "./pages/OrdersList";
import OrderDetail from "./pages/OrderDetail";
import TourPage from "./pages/TourPage";
import MyTours from "./pages/MyTours";
import VouchersPage from "./pages/VouchersPage";
import DisputesPage from "./pages/DisputesPage";
import ClaimNew from "./pages/ClaimNew";
import ClaimDetail from "./pages/ClaimDetail";
import AccountPage from "./pages/AccountPage";
import ContactPage from "./pages/ContactPage";
import PolicyPage from "./pages/PolicyPage";
import NotificationsPage from "./pages/NotificationsPage";

import WorkshopDashboard from "./pages/workshop/WorkshopDashboard";
import WorkshopProfile from "./pages/workshop/WorkshopProfile";
import WorkshopProducts from "./pages/workshop/WorkshopProducts";
import WorkshopOrders from "./pages/workshop/WorkshopOrders";
import WorkshopTours from "./pages/workshop/WorkshopTours";
import WorkshopRevenue from "./pages/workshop/WorkshopRevenue";
import WorkshopWallet from "./pages/workshop/WorkshopWallet";

import AdminHome from "./pages/admin/AdminHome";
import AdminWorkshops from "./pages/admin/AdminWorkshops";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminTours from "./pages/admin/AdminTours";
import AdminVouchers from "./pages/admin/AdminVouchers";
import AdminReconcile from "./pages/admin/AdminReconcile";
import AdminFeedback from "./pages/admin/AdminFeedback";

function WorkshopGuard() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const role = useAuthStore((s) => s.profile?.role);
  if (isLoading) return <GuardLoading />;
  if (role === "workshop_owner" || role === "admin") return <Outlet />;
  return <Navigate to="/dang-nhap" replace />;
}

function AdminGuard() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const role = useAuthStore((s) => s.profile?.role);
  if (isLoading) return <GuardLoading />;
  if (role === "admin") return <Outlet />;
  return <Navigate to="/dang-nhap" replace />;
}

function GuardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
        <p className="text-sm text-ink-soft">Đang tải...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Khu khách hàng */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<SearchPage />} />
          <Route path="/dang-nhap" element={<Login />} />
          <Route path="/dang-ky" element={<Register />} />
          <Route path="/tim-kiem" element={<SearchPage />} />
          <Route path="/san-pham/:id" element={<ProductDetail />} />
          <Route path="/xuong-gom" element={<WorkshopList />} />
          <Route path="/xuong-gom/:id" element={<WorkshopDetail />} />
          <Route path="/ho-chieu" element={<PassportPage />} />
          <Route path="/ho-chieu/:code" element={<PassportDetail />} />
          <Route path="/gio-hang" element={<CartPage />} />
          <Route path="/thanh-toan" element={<CheckoutPage />} />
          <Route path="/dat-hang-thanh-cong/:id" element={<OrderSuccess />} />
          <Route path="/don-hang" element={<OrdersList />} />
          <Route path="/don-hang/:id" element={<OrderDetail />} />
          <Route path="/tour" element={<TourPage />} />
          <Route path="/tour-cua-toi" element={<MyTours />} />
          <Route path="/uu-dai" element={<VouchersPage />} />
          <Route path="/khieu-nai" element={<DisputesPage />} />
          <Route path="/khieu-nai/moi" element={<ClaimNew />} />
          <Route path="/khieu-nai/:id" element={<ClaimDetail />} />
          <Route path="/tai-khoan" element={<AccountPage />} />
          <Route path="/thong-bao" element={<NotificationsPage />} />
          <Route path="/lien-he" element={<ContactPage />} />
          <Route path="/chinh-sach" element={<PolicyPage />} />
        </Route>

        {/* Khu chủ xưởng */}
        <Route element={<WorkshopGuard />}>
          <Route element={<WorkshopLayout />}>
            <Route path="/xuong" element={<WorkshopDashboard />} />
            <Route path="/xuong/hs" element={<WorkshopProfile />} />
            <Route path="/xuong/san-pham" element={<WorkshopProducts />} />
            <Route path="/xuong/don-hang" element={<WorkshopOrders />} />
            <Route path="/xuong/tour" element={<WorkshopTours />} />
            <Route path="/xuong/doanh-thu" element={<WorkshopRevenue />} />
            <Route path="/xuong/vi-doi-soat" element={<WorkshopWallet />} />
          </Route>
        </Route>

        {/* Khu quản trị */}
        <Route element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminHome />} />
            <Route path="/admin/xuong" element={<AdminWorkshops />} />
            <Route path="/admin/nguoi-dung" element={<AdminUsers />} />
            <Route path="/admin/san-pham" element={<AdminProducts />} />
            <Route path="/admin/khieu-nai" element={<AdminDisputes />} />
            <Route path="/admin/tour" element={<AdminTours />} />
            <Route path="/admin/uu-dai" element={<AdminVouchers />} />
            <Route path="/admin/doi-soat" element={<AdminReconcile />} />
            <Route path="/admin/lien-he" element={<AdminFeedback />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
