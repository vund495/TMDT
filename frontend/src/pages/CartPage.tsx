import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { EmptyState, Money, Spinner } from "../components/ui";
import { getCart, removeCartItem, updateCartItem } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { selectLocalTotal, useLocalCart } from "../store/localCartStore";

export default function CartPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const localItems = useLocalCart((s) => s.items);
  const localSetQty = useLocalCart((s) => s.setQty);
  const localRemove = useLocalCart((s) => s.remove);

  const cart = useQuery({ queryKey: ["cart"], queryFn: getCart, enabled: isAuthenticated });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cart"] });

  const remove = useMutation({
    mutationFn: (id: string) => removeCartItem(id),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, q }: { id: string; q: number }) => updateCartItem(id, q),
    onSuccess: invalidate,
  });

  const showLocal = !isAuthenticated;
  const localTotal = selectLocalTotal(localItems);

  if (!showLocal && cart.isLoading) return <Spinner />;
  if (!showLocal && !cart.data) return <p className="text-red-600">Không tải được giỏ hàng.</p>;

  if (showLocal) {
    if (localItems.length === 0) {
      return (
        <EmptyState
          icon={<ShoppingCart className="h-12 w-12" />}
          title="Giỏ hàng trống"
          hint="Thêm sản phẩm để bắt đầu mua sắm."
        />
      );
    }
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {localItems.map((item) => (
            <div key={item.product_id} className="flex gap-4 rounded-xl border border-ceramic-100 bg-white p-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                {item.product_image ? (
                  <img src={item.product_image} alt={item.product_name || ""} className="h-full w-full object-cover" />
                ) : (
                  "🏺"
                )}
              </div>
              <div className="flex-1">
                <Link to={`/san-pham/${item.product_id}`} className="font-medium text-ceramic-900 hover:underline">
                  {item.product_name}
                </Link>
                <div className="mt-1 text-sm text-gray-600">
                  <Money value={item.unit_price ?? 0} />
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center rounded-md border border-gray-300">
                    <button
                      onClick={() => localSetQty(item.product_id, Math.max(1, item.quantity - 1))}
                      className="px-2 py-1 text-gray-600"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => localSetQty(item.product_id, item.quantity + 1)}
                      className="px-2 py-1 text-gray-600"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => localRemove(item.product_id)}
                    className="text-xs font-medium text-red-500 hover:underline"
                  >
                    Xóa
                  </button>
                </div>
              </div>
              <div className="text-right font-semibold text-brand-dat">
                <Money value={item.unit_price * item.quantity} />
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-xl border border-ceramic-100 bg-white p-5">
          <h2 className="font-semibold text-ceramic-900">Tổng cộng</h2>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-gray-600">Tạm tính</span>
            <Money value={localTotal} />
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-gray-600">Phí vận chuyển</span>
            <span className="text-gray-600">Tính ở thanh toán</span>
          </div>
          <div className="mt-3 border-t pt-3">
            <div className="flex justify-between text-base font-bold">
              <span>Thành tiền</span>
              <Money value={localTotal} />
            </div>
          </div>
          <button
            onClick={() => navigate("/dang-nhap")}
            className="mt-4 block w-full rounded-lg bg-brand-lam px-5 py-2.5 text-center font-semibold text-white hover:bg-brand-lam/90"
          >
            Đăng nhập để thanh toán
          </button>
          <p className="mt-2 text-xs text-gray-500">
            Giỏ hàng đang lưu trên máy — sau khi đăng nhập sẽ được đồng bộ.
          </p>
        </div>
      </div>
    );
  }

  if (cart.data!.items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="h-12 w-12" />}
        title="Giỏ hàng trống"
        hint="Thêm sản phẩm để bắt đầu mua sắm."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {(cart.data!.items ?? []).map((item) => (
          <div key={item.id} className="flex gap-4 rounded-xl border border-ceramic-100 bg-white p-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
              {item.product_image ? (
                <img src={item.product_image} alt={item.product_name || ""} className="h-full w-full object-cover" />
              ) : (
                "🏺"
              )}
            </div>
            <div className="flex-1">
              <Link to={`/san-pham/${item.product_id}`} className="font-medium text-ceramic-900 hover:underline">
                {item.product_name}
              </Link>
              <div className="mt-1 text-sm text-gray-600">
                <Money value={item.unit_price ?? 0} />
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-md border border-gray-300">
                  <button
                    onClick={() => update.mutate({ id: item.id, q: Math.max(1, item.quantity - 1) })}
                    className="px-2 py-1 text-gray-600"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => update.mutate({ id: item.id, q: item.quantity + 1 })}
                    className="px-2 py-1 text-gray-600"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => remove.mutate(item.id)}
                  className="text-xs font-medium text-red-500 hover:underline"
                >
                  Xóa
                </button>
              </div>
            </div>
            <div className="text-right font-semibold text-brand-dat">
              <Money value={item.subtotal ?? 0} />
            </div>
          </div>
        ))}
      </div>

      <div className="h-fit rounded-xl border border-ceramic-100 bg-white p-5">
        <h2 className="font-semibold text-ceramic-900">Tổng cộng</h2>
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-gray-600">Tạm tính</span>
          <Money value={cart.data!.total} />
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-gray-600">Phí vận chuyển</span>
          <span className="text-gray-600">Tính ở thanh toán</span>
        </div>
        <div className="mt-3 border-t pt-3">
          <div className="flex justify-between text-base font-bold">
            <span>Thành tiền</span>
            <Money value={cart.data!.total} />
          </div>
        </div>
        <Link
          to="/thanh-toan"
          className="mt-4 block rounded-lg bg-brand-lam px-5 py-2.5 text-center font-semibold text-white hover:bg-brand-lam/90"
        >
          Đặt hàng & thanh toán
        </Link>
      </div>
    </div>
  );
}
