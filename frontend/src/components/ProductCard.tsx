import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { Product } from "../types";
import { addToCart } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useLocalCart } from "../store/localCartStore";
import { Money } from "./ui";
import Badge from "./ui/Badge";
export default function ProductCard({ product }: { product: Product }) {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const localAdd = useLocalCart((s) => s.add);
  const price = product.sale_price ?? product.original_price;
  const img = product.images?.[0];
  const hasDiscount = product.sale_price != null;

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
    <div className="group flex flex-col overflow-hidden rounded-xl border border-cream-200 bg-white shadow-card transition-all duration-200 ease-smooth hover:-translate-y-0.5 hover:shadow-pop">
      <Link to={`/san-pham/${product.id}`} className="flex flex-col">
        <div className="relative aspect-square w-full overflow-hidden bg-cream-100">
          {img ? (
            <img
              src={img}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 ease-smooth group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl">🏺</div>
          )}
          {hasDiscount && (
            <div className="absolute left-2 top-2">
              <Badge tone="red">Sale</Badge>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-3">
          <h3 className="line-clamp-1 text-sm font-bold text-ink">{product.name}</h3>
          {product.theme && <p className="mt-0.5 text-xs text-ink-faint">{product.theme}</p>}
          <div className="mt-auto flex items-baseline gap-2 pt-2">
            <Money value={price} className="text-sm font-extrabold text-dat-700" />
            {hasDiscount && (
              <Money value={product.original_price} className="text-xs text-ink-faint line-through" />
            )}
          </div>
        </div>
      </Link>
      {product.stock > 0 && (
        <button
          onClick={handleAddToCart}
          className="mx-3 mb-3 rounded-lg border border-brand-lam/30 bg-brand-lam/5 px-3 py-1.5 text-xs font-semibold text-brand-lam transition-colors hover:bg-brand-lam hover:text-white"
        >
          Thêm giỏ hàng
        </button>
      )}
    </div>
  );
}
