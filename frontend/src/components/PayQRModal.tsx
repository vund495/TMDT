import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CheckCircle2, QrCode } from "lucide-react";
import { Link } from "react-router-dom";
import { Modal, Money, Spinner } from "./ui";
import { createVnpayPayment, getPaymentQr, getPaymentStatus, type PaymentQrOut } from "../lib/api";
import { toastError, toastOk } from "../lib/toast";

export default function PayQRModal({
  open,
  onClose,
  refType,
  refId,
  label,
  onPaid,
}: {
  open: boolean;
  onClose: () => void;
  refType: "order" | "tour";
  refId: string;
  label: string;
  onPaid?: (info: PaymentQrOut) => void;
}) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"vietqr" | "vnpay">("vietqr");
  const [qr, setQr] = useState<PaymentQrOut | null>(null);
  const [paid, setPaid] = useState(false);

  const load = useMutation({
    mutationFn: () => getPaymentQr(refType, refId),
    onSuccess: (d) => {
      setQr(d);
      toastOk("Đã cập nhật mã thanh toán");
    },
    onError: (e) => toastError("Không lấy được mã thanh toán", (e as Error).message),
  });

  const vnpay = useMutation({
    mutationFn: () => {
      if (!qr?.payment_id) throw new Error("Không có payment_id để thanh toán VNPay");
      return createVnpayPayment(qr.payment_id);
    },
    onSuccess: (r) => {
      window.location.assign(r.pay_url);
    },
    onError: (e) => toastError("VNPay lỗi", (e as Error).message),
  });

  useEffect(() => {
    if (open) {
      setQr(null);
      setTab("vietqr");
      setPaid(false);
      load.mutate();
      getPaymentStatus(refType, refId)
        .then((s) => {
          if (s.status === "paid") {
            setPaid(true);
            onPaid?.(s);
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, refId]);

  useEffect(() => {
    if (!open) return;
    const t = setInterval(async () => {
      try {
        const s = await getPaymentStatus(refType, refId);
        if (s.status === "paid") {
          clearInterval(t);
          setPaid(true);
          toastOk(`Đã thanh toán ${label} thành công`);
          onPaid?.(s);
        }
      } catch {
        // chưa có payment hoặc lỗi tạm thời — bỏ qua, poll tiếp
      }
    }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, refId, refType, label]);

  const refresh = () => {
    setQr(null);
    load.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} title={paid ? `Thanh toán ${label} thành công` : `Thanh toán ${label}`} size="md">
      {paid ? (
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" aria-hidden />
          <h2 className="mt-3 text-xl font-bold text-ceramic-900">Thanh toán thành công!</h2>
          <p className="mt-2 text-sm text-gray-600">
            {refType === "order"
              ? "Chúng tôi đã nhận được khoản thanh toán. Đơn hàng của bạn đang được chuẩn bị và hộ chiếu sản phẩm trong đơn đã được mở khóa."
              : "Vé tour của bạn đã được xác nhận. Hẹn gặp bạn tại xưởng!"}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {refType === "order" ? (
              <>
                <Link
                  to={`/don-hang/${refId}`}
                  onClick={onClose}
                  className="rounded-lg bg-dat-700 px-5 py-2.5 font-semibold text-white hover:bg-dat-800"
                >
                  Xem chi tiết đơn
                </Link>
                <Link
                  to="/ho-chieu"
                  onClick={onClose}
                  className="rounded-lg bg-gray-100 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-200"
                >
                  Hộ chiếu của tôi
                </Link>
              </>
            ) : (
              <Link
                to="/tour-cua-toi"
                onClick={onClose}
                className="rounded-lg bg-dat-700 px-5 py-2.5 font-semibold text-white hover:bg-dat-800"
              >
                Xem tour của tôi
              </Link>
            )}
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-200"
            >
              Đóng
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1 text-sm">
        <button
          onClick={() => setTab("vietqr")}
          className={`rounded-md px-3 py-1.5 font-medium ${tab === "vietqr" ? "bg-white shadow text-dat-700" : "text-gray-600"}`}
        >
          VietQR
        </button>
        <button
          onClick={() => setTab("vnpay")}
          className={`rounded-md px-3 py-1.5 font-medium ${tab === "vnpay" ? "bg-white shadow text-dat-700" : "text-gray-600"}`}
        >
          VNPay
        </button>
      </div>

      {tab === "vietqr" ? (
        <div>
          {load.isPending && <Spinner />}
          {load.isError && <p className="text-sm text-red-600">{(load.error as Error).message}</p>}
          {qr && !load.isPending && (
            <div className="text-center">
              {qr.qr_url ? (
                <img
                  src={qr.qr_url}
                  alt="Mã QR thanh toán"
                  className="mx-auto h-56 w-56 rounded-lg border border-gray-200"
                />
              ) : (
                <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400">
                  Không có mã QR
                </div>
              )}
              <p className="mt-3 text-sm text-gray-600">
                Chuyển khoản: <span className="font-mono font-bold text-dat-700">{qr.code}</span>
              </p>
              <p className="mt-1 font-semibold text-dat-700">
                Tổng cần thanh toán: <Money value={qr.amount} />
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Quét mã bằng app ngân hàng hoặc chuyển đúng số tiền trên, ghi mã{" "}
                <span className="font-mono">{qr.code}</span> vào nội dung chuyển khoản.
              </p>
              <button
                onClick={refresh}
                disabled={load.isPending}
                className="mt-4 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Làm mới mã QR
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          {qr ? (
            <>
              <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-lg border border-dashed border-gray-300">
                <QrCode className="h-16 w-16 text-gray-300" aria-hidden />
              </div>
              <p className="mt-3 text-sm text-gray-600">
                Thanh toán qua cổng VNPay:{" "}
                <span className="font-semibold text-dat-700">
                  <Money value={qr.amount} />
                </span>
              </p>
              <button
                onClick={() => vnpay.mutate()}
                disabled={vnpay.isPending}
                className="mt-4 rounded-lg bg-dat-700 px-6 py-2.5 font-semibold text-white hover:bg-dat-800 disabled:opacity-50"
              >
                {vnpay.isPending ? "Đang chuyển hướng..." : "Thanh toán qua VNPay"}
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-500">Đang tải thông tin thanh toán...</p>
          )}
          {vnpay.isError && <p className="mt-2 text-sm text-red-600">{(vnpay.error as Error).message}</p>}
        </div>
      )}
      </div>
      )}
    </Modal>
  );
}