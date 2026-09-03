import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QrCode, Star, Truck } from "lucide-react";
import { Money, Spinner, StatusBadge } from "../components/ui";
import {
  addToCart,
  createComment,
  createReview,
  getProduct,
  listComments,
  listReviews,
} from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useLocalCart } from "../store/localCartStore";

export default function ProductDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { profile, isAuthenticated } = useAuthStore();
  const localAdd = useLocalCart((s) => s.add);

  const product = useQuery({ queryKey: ["product", id], queryFn: () => getProduct(id) });
  const reviews = useQuery({ queryKey: ["reviews", id], queryFn: () => listReviews(id) });
  const comments = useQuery({ queryKey: ["comments", id], queryFn: () => listComments(id) });

  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [commentText, setCommentText] = useState("");

  const addCart = useMutation({
    mutationFn: (quantity: number) => addToCart(id, quantity),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      navigate("/gio-hang");
    },
  });

  const handleAdd = (quantity: number) => {
    if (isAuthenticated) {
      addCart.mutate(quantity);
    } else {
      localAdd(
        {
          product_id: id,
          product_name: p?.name ?? "",
          product_image: p?.images?.[0] ?? null,
          unit_price: price,
        },
        quantity
      );
      navigate("/gio-hang");
    }
  };

  const postReview = useMutation({
    mutationFn: () => createReview(id, { rating, content: reviewText || undefined }),
    onSuccess: () => {
      setReviewText("");
      qc.invalidateQueries({ queryKey: ["reviews", id] });
    },
  });

  const postComment = useMutation({
    mutationFn: () => createComment(id, { content: commentText }),
    onSuccess: () => {
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["comments", id] });
    },
  });

  if (product.isLoading) return <Spinner />;
  if (product.isError || !product.data)
    return <p className="text-red-600">Không tìm thấy sản phẩm.</p>;

  const p = product.data;
  const price = p.sale_price ?? p.original_price;
  const isCustomer = profile?.role === "customer";

  return (
    <div>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-ceramic-100 bg-white">
          {p.images?.[0] ? (
            <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center text-8xl">🏺</div>
          )}
        </div>

        <div>
          <StatusBadge status={p.status} />
          <h1 className="mt-2 text-2xl font-bold text-ceramic-900">{p.name}</h1>
          {p.workshop_name && (
            <Link to={`/xuong-gom/${p.workshop_id}`} className="text-sm font-medium text-brand-lam hover:underline">
              {p.workshop_name}
            </Link>
          )}

          <div className="mt-4 flex items-baseline gap-3">
            <Money value={price} className="text-2xl font-bold text-brand-dat" />
            {p.sale_price != null && (
              <Money value={p.original_price} className="text-gray-400 line-through" />
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {[
              ["Chủ đề", p.theme],
              ["Chất liệu", p.material],
              ["Kỹ thuật nung", p.firing_technique],
              ["Men", p.glaze],
              ["Còn hàng", `${p.stock}`],
              ["Đã bán", `${p.sold_count}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-gray-50 px-3 py-2">
                <div className="text-xs text-gray-500">{k}</div>
                <div className="font-medium text-ceramic-900">{v || "—"}</div>
              </div>
            ))}
          </div>

          {p.description && <p className="mt-4 text-sm leading-relaxed text-gray-700">{p.description}</p>}

          {/* Hộ chiếu */}
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-brand-lam/30 bg-brand-lam/5 p-3">
            <QrCode className="h-5 w-5 text-brand-lam" />
            <div className="text-sm">
              <div className="font-medium text-brand-lam">Hộ chiếu sản phẩm</div>
              <div className="text-xs text-gray-600">
                Nguồn gốc, nhiệt độ nung & video nghệ nhân — mở khóa sau khi nhận hàng.
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center rounded-md border border-gray-300">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-gray-600">−</button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2 text-gray-600">+</button>
            </div>
            <button
              disabled={addCart.isPending || p.stock <= 0}
              onClick={() => handleAdd(qty)}
              className="flex-1 rounded-lg bg-brand-lam px-5 py-2.5 font-semibold text-white hover:bg-brand-lam/90 disabled:opacity-50"
            >
              {p.stock <= 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Đánh giá */}
        <section>
          <h2 className="text-lg font-bold text-ceramic-900">Đánh giá ({reviews.data?.length ?? 0})</h2>
          <div className="mt-3 space-y-3">
            {(reviews.data ?? []).map((r) => (
              <div key={r.id} className="rounded-lg border border-ceramic-100 bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ceramic-900">{r.user_name || "Ẩn danh"}</span>
                  <span className="flex text-amber-500">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </span>
                </div>
                {r.content && <p className="mt-1 text-sm text-gray-600">{r.content}</p>}
              </div>
            ))}
            {reviews.data?.length === 0 && <p className="text-sm text-gray-500">Chưa có đánh giá.</p>}
          </div>

          {isCustomer && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                postReview.mutate();
              }}
              className="mt-4 rounded-lg border border-ceramic-100 bg-white p-4"
            >
              <h3 className="font-semibold text-ceramic-900">Viết đánh giá</h3>
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`${n <= rating ? "text-amber-500" : "text-gray-300"}`}
                  >
                    <Star className="h-5 w-5 fill-current" />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Chia sẻ cảm nhận (bỏ trống nếu chỉ chấm sao)"
                className="mt-2 w-full rounded-md border border-gray-300 p-2 text-sm"
                rows={2}
              />
              <button type="submit" disabled={postReview.isPending} className="mt-2 rounded-md bg-brand-lam px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {postReview.isPending ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
              {postReview.isError && <p className="mt-1 text-xs text-red-600">{(postReview.error as Error).message}</p>}
            </form>
          )}
        </section>

        {/* Bình luận */}
        <section>
          <h2 className="text-lg font-bold text-ceramic-900">Bình luận ({comments.data?.length ?? 0})</h2>
          <div className="mt-3 space-y-3">
            {(comments.data ?? []).map((c) => (
              <div key={c.id} className="rounded-lg border border-ceramic-100 bg-white p-3">
                <span className="text-sm font-medium text-ceramic-900">{c.user_name || "Ẩn danh"}</span>
                <p className="mt-1 text-sm text-gray-600">{c.content}</p>
              </div>
            ))}
            {comments.data?.length === 0 && <p className="text-sm text-gray-500">Chưa có bình luận.</p>}
          </div>
          {isCustomer && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                postComment.mutate();
              }}
              className="mt-4 flex gap-2"
            >
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Viết bình luận..."
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <button type="submit" disabled={postComment.isPending} className="rounded-md bg-brand-lam px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                Gửi
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
