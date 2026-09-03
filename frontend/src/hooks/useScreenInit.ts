import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

/**
 * Khởi tạo màn hình: nạp lại phiên đăng nhập từ localStorage
 * và làm sạch tham số URL không cần thiết.
 */
export function useScreenInit() {
  const initFromStorage = useAuthStore((s) => s.initFromStorage);

  useEffect(() => {
    initFromStorage();
    const params = new URLSearchParams(window.location.search);
    if (params.get("role")) {
      params.delete("role");
      const qs = params.toString();
      const url = window.location.pathname + (qs ? `?${qs}` : "");
      window.history.replaceState({}, "", url);
    }
  }, [initFromStorage]);
}
