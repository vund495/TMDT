import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import ProductCard from "../components/ProductCard";
import Reveal from "../components/motion/Reveal";
import { Skeleton } from "../components/ui";
import { listProducts, listWorkshops } from "../lib/api";

// LỰA CHỌN layout (mỗi section một họ khác nhau, §4.7):
// 1. Hero split bất đối xứng (chữ trái / ảnh phải), không hero căn giữa vì VARIANCE 6 > 4.
//    Tối đa 4 text element: eyebrow + headline 2 dòng + subtext 17 từ + 2 CTA khác intent.
// 2. Logo wall DƯỚI hero, SVG monogram tự vẽ cho xưởng thật từ API (không wordmark trơn,
//    không nhãn phụ). Không eyebrow ở section này.
// 3. Grid sản phẩm bán chạy (data thật, sort best_seller), không eyebrow, headline đứng một mình.
// 4. 2 tile ảnh + chữ bên dưới (không chữ đè lên ảnh): đúng 2 ô cho 2 nội dung (tour, hộ chiếu).
// Ảnh tự host trong public/images (Unsplash, giấy phép mở: hero 1565193566173, tour 1493106641515,
// tableware 1578749556568). Đã xem và chọn tay: đúng chất liệu gốm, loại 2 ảnh sai chất liệu
// (tinh dầu, bình gỗ). TODO: thay bằng ảnh thật lò Bát Tràng khi có.
export default function HomePage() {
  const best = useQuery({
    queryKey: ["products", "best-seller", 8],
    queryFn: () => listProducts({ sort: "best_seller", page: 1, page_size: 8 }),
  });
  const workshops = useQuery({ queryKey: ["workshops"], queryFn: () => listWorkshops() });

  return (
    <div>
      <section className="grid items-center gap-8 pt-12 lg:grid-cols-2 lg:gap-12 lg:pt-16">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-dat-700">
            Sàn gốm Bát Tràng
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink md:text-5xl">
            Gốm chính gốc,
            <br />
            minh bạch từng chiếc
          </h1>
          <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-ink-soft">
            Mỗi sản phẩm mang hộ chiếu QR truy xuất xưởng. Vỡ 1 đền 1, không hỏi thêm.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/tim-kiem"
              className="rounded-md bg-dat-700 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-dat-800 active:translate-y-px active:scale-[0.98]"
            >
              Khám phá sản phẩm
            </Link>
            <Link
              to="/tour"
              className="rounded-md border border-cream-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-all hover:bg-cream-50 active:translate-y-px active:scale-[0.98]"
            >
              Đặt tour làm gốm
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <img
            src="/images/hero-pottery.jpg"
            alt="Bộ bình gốm men mộc"
            width={1200}
            height={800}
            loading="eager"
            className="aspect-[4/3] w-full rounded-lg object-cover shadow-elevated"
          />
        </Reveal>
      </section>

      {workshops.data && workshops.data.length > 0 && (
        <section aria-label="Các xưởng trên sàn" className="mt-14 border-t border-cream-200 pt-8">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            {workshops.data.slice(0, 6).map((w, i) => (
              <Reveal key={w.id} delay={i * 0.05}>
                <Link to={`/xuong-gom/${w.id}`} className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-cream-50"
                  >
                    {(w.name || "?").trim().slice(0, 1)}
                  </span>
                  <span className="text-sm font-semibold text-ink">{w.name}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="mt-14">
        <Reveal>
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-extrabold tracking-tight text-ink">Bán chạy nhất</h2>
            <Link
              to="/tim-kiem"
              className="flex items-center gap-1 text-sm font-semibold text-men-700 hover:underline"
            >
              Khám phá sản phẩm <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Reveal>
        <div className="mt-5">
          {best.isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Đang tải sản phẩm">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-lg border border-cream-200 bg-white">
                  <Skeleton className="aspect-square rounded-none" />
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : best.isError || !best.data || best.data.items.length === 0 ? (
            <p className="text-sm text-ink-soft">
              Chưa tải được danh sách.{" "}
              <Link to="/tim-kiem" className="font-semibold text-men-700 hover:underline">
                Khám phá sản phẩm
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {best.data.items.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 0.06}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-2">
        <Reveal>
          <Link to="/tour" className="group block overflow-hidden rounded-lg border border-cream-200 bg-white shadow-card">
            <img
              src="/images/tour-throwing.jpg"
              alt="Nghệ nhân chuốt gốm trên bàn xoay"
              width={800}
              height={479}
              loading="lazy"
              className="aspect-[8/5] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="p-5">
              <h2 className="text-lg font-extrabold tracking-tight text-ink">Tour nặn gốm tại lò</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                Tự tay chuốt gốm cùng nghệ nhân, nhận voucher mua quà lưu niệm sau tour.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-dat-700">
                Xem lịch tour <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </div>
          </Link>
        </Reveal>
        <Reveal delay={0.08}>
          <Link to="/ho-chieu" className="group block overflow-hidden rounded-lg border border-cream-200 bg-white shadow-card">
            <img
              src="/images/passport-tableware.jpg"
              alt="Bộ bát đĩa gốm men lam"
              width={800}
              height={533}
              loading="lazy"
              className="aspect-[8/5] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="p-5">
              <h2 className="text-lg font-extrabold tracking-tight text-ink">Hộ chiếu QR mỗi sản phẩm</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                Quét mã để xem xưởng, mẻ nung và video nghệ nhân mở khóa sau khi mua.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-dat-700">
                Tra cứu hộ chiếu <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </div>
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
