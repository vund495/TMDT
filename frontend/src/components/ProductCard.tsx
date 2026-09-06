import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Package, ShoppingBag } from "lucide-react";
import type { Product } from "../types";
import { addToCart } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useLocalCart } from "../store/localCartStore";
import { Money } from "./ui";
import Badge from "./ui/Badge";
import Button from "./ui/Button";

// LỰA CHỌN: Card có elevation thay vì row trơn.
// Vì sao: grid thương mại cần quét nhanh ảnh + giá + CTA trong một đơn vị thị giác;
// elevation ở đây nói lên hierarchy thật ("món này mua được"), đúng §4.4, không phải
// card trang trí. Không dùng list-row vì row hợp với quản trị (mật độ cao), không hợp
// với mua sắm cảm tính. Không dùng div-fake-preview: ảnh là ảnh thật từ API.
export default function ProductCard({ product }: { product: Product }) {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const localAdd = useLocalCart((s) => s.add);
  const price = product.sale_price ?? product.original_price;
  const img = product.images?.[0];
  const hasDiscount = product.sale_price != null;
  const soldOut = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      addToCart(product.id, 1).then(() => qc.invalidateQueries({ queryKey: ["cart"] }));
    } else {
      localAdd({
        product_id: product.id,
        product_name: product.name,
        product_image: product.images?.[0] ?? null,
        unit_price: price,
      });
    }
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-cream-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop">
      <Link to={`/san-pham/${product.id}`} className="flex flex-col" aria-label={product.name}>
        <div className="relative aspect-square w-full overflow-hidden bg-cream-100">
          {img ? (
            <img
              src={img}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-10 w-10 text-ink-faint" aria-hidden />
            </div>
          )}
          {hasDiscount && (
            <div className="absolute left-2 top-2">
              <Badge tone="red">Sale</Badge>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-3">
          <h3 className="line-clamp-1 text-sm font-bold text-ink">{product.name}</h3>
          {product.theme && <p className="mt-0.5 truncate text-xs text-ink-faint">{product.theme}</p>}
          {product.sold_count > 0 && (
            <p className="mt-0.5 text-xs text-ink-faint">
              Đã bán {product.sold_count.toLocaleString("vi-VN")}
            </p>
          )}
          <div className="mt-auto flex items-baseline gap-2 pt-1.5">
            <Money value={price} className="text-sm font-extrabold text-dat-700" />
            {hasDiscount && (
              <Money value={product.original_price} className="text-xs text-ink-faint line-through" />
            )}
          </div>
        </div>
      </Link>
      <div className="px-3 pb-3">
        <Button variant="primary" size="sm" block onClick={handleAddToCart} disabled={soldOut}>
          <ShoppingBag className="h-4 w-4" aria-hidden />
          {soldOut ? "Hết hàng" : "Thêm giỏ hàng"}
        </Button>
      </div>
    </div>
  );
}
