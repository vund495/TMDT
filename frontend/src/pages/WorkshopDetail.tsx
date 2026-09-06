import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Amphora, MapPin } from "lucide-react";
import ProductCard from "../components/ProductCard";
import MapEmbed from "../components/MapEmbed";
import { EmptyState, Spinner } from "../components/ui";
import { getWorkshop, listProducts } from "../lib/api";

export default function WorkshopDetail() {
  const { id = "" } = useParams();

  const workshop = useQuery({
    queryKey: ["workshop", id],
    queryFn: () => getWorkshop(id),
  });
  const products = useQuery({
    queryKey: ["products", "workshop", id],
    queryFn: () => listProducts({ workshop_id: id, page_size: 50 }),
    enabled: !!id,
  });

  if (workshop.isLoading) return <Spinner />;
  if (workshop.isError || !workshop.data)
    return <p className="text-red-600">Không tìm thấy xưởng.</p>;

  const w = workshop.data;

  return (
    <div>
      <div className="flex items-center gap-4 rounded-2xl border border-ceramic-100 bg-white p-6 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-cream-100">
          {w.logo_url ? (
            <img src={w.logo_url} alt={w.name} className="h-full w-full object-cover" />
          ) : (
            <Amphora className="h-8 w-8 text-ink-faint" aria-hidden />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ceramic-900">{w.name}</h1>
          {w.address && (
            <p className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-ink-faint" aria-hidden /> {w.address}
            </p>
          )}
          {w.description && <p className="mt-1 max-w-xl text-sm text-gray-700">{w.description}</p>}
        </div>
      </div>

      <h2 className="mt-8 text-lg font-bold text-ceramic-900">Sản phẩm của xưởng</h2>
      <div className="mt-3">
        {products.isLoading ? (
          <Spinner />
        ) : !products.data || products.data.items.length === 0 ? (
          <EmptyState title="Xưởng chưa có sản phẩm nào" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {w.address && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-ceramic-900">Vị trí gian hàng</h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-ink-faint" aria-hidden /> {w.address}
          </p>
          <div className="mt-3 overflow-hidden rounded-2xl border border-ceramic-100">
            <MapEmbed lat={w.lat} lng={w.lng} address={w.address} className="h-72 w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
