export default function MapEmbed({
  lat,
  lng,
  address,
  className,
}: {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  className?: string;
}) {
  // Ưu tiên tọa độ, nếu không có thì tra bằng địa chỉ
  const query = lat != null && lng != null ? `${lat},${lng}` : (address || "Bát Tràng, Gia Lâm, Hà Nội");
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;

  return (
    <iframe
      title="Bản đồ"
      src={src}
      className={`w-full border-0 ${className ?? "h-64"}`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}
