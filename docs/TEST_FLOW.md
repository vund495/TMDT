# Luồng test toàn diện — VietCraft Bát Tràng

> URL: Frontend http://localhost:5173 — Backend http://localhost:8001/docs (Swagger)
> Trạng thái dữ liệu: DB seed + test data (có sẵn đơn/dispute/tour).

## Tài khoản test

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin.tmdt@example.com` | `Admin123!` |
| Khách | `khach01.tmdt@example.com` | `Khach123!` |
| Khách | `khach02.tmdt@example.com` | `Khach123!` |
| Khách | `khach03.tmdt@example.com` | `Khach123!` |
| Xưởng | `workshop01.tmdt@example.com` (Xưởng Gốm Gia Long) | `Xuong123!` |
| Xưởng | `workshop02.tmdt@example.com` (Gốm House Bát Tràng) | `Xuong123!` |

<details>
<summary>Mẹo test backend nhanh (PowerShell)</summary>

```powershell
# Login lấy token
$t = (Invoke-RestMethod -Uri "http://localhost:8001/api/v1/auth/login" -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"admin.tmdt@example.com","password":"Admin123!"}').access_token
$h = @{ Authorization = "Bearer $t" }
# Gọi 1 endpoint mẫu
Invoke-RestMethod -Uri "http://localhost:8001/api/v1/workshops/me/revenue" -Headers $h
```
</details>

---

## PHẦN 1 — KHÁCH HÀNG (khach01)

### 1.1 Xác thực & hồ sơ
1. Vào `/dang-nhap`, đăng nhập `khach01...` / `Khach123!` → vào được Home.
2. Vào tài khoản → sửa `full_name`, `phone` → lưu → hiện lại đúng. (UC-03)
3. Đăng xuất → vào `/quan-tri` → bị chặn (redirect login). (UC-02)

### 1.2 Marketplace & Search
1. Trang chủ `/` → xem sản phẩm nổi bật. (UC-06)
2. Vào `/tim-kiem`:
   - Click pill chủ đề (VD: men ngọc) → lọc. (UC-05)
   - Select **Chất liệu** (VD: gốm), **Kỹ thuật nung**, **Men** → kết quả lọc. (UC-05)
   - Bấm "Xóa bộ lọc" → về toàn bộ.
3. Vào chi tiết sản phẩm (VD: `/san-pham/2cdaac5d-4329-417e-b9fb-416e1bea67b1` bộ ấm chén men ngọc) → thấy đủ material/firing_technique/glaze + video (nếu có). (UC-06)

### 1.3 Shop xưởng
1. `/xưởng` (hoặc trong Search chọn xưởng) → xem không gian gian hàng + map. (UC-09)

### 1.4 Hộ chiếu QR (UC-07, UC-08)
1. Chưa login: vào `/ho-chieu?code=PP-2CDAAC5D4329` → video **khóa** (badge locked, không xem được).
2. Login `khach01` → cùng URL → vẫn khóa nếu chưa từng mua sản phẩm đó.
3. Bấm **"Quét QR"** → browser xin quyền camera (test trên Chromium/Edge có BarcodeDetector; nếu không thì nhập tay code `PP-...`).
4. Sau khi mua hàng (mục 1.5) → mua sản phẩm có passport → xem lại → video **mở khóa**. (UC-08)

### 1.5 Mua hàng & thanh toán (UC-15, UC-16)
1. Thêm sản phẩm vào giỏ (VD bộ ấm chén men ngọc 990.000đ) → `/gio-hang`.
2. Tick **"Đóng gói chống sốc"** (nếu có) → Checkout → điền thông tin nhận hàng.
3. Chọn thanh toán **VietQR** (giả lập) → đơn tạo thành công, trạng thái `pending_payment`.
4. Vào `/don-hang` → đơn mới hiện `chờ thanh toán`.

### 1.6 Tour trải nghiệm (UC-23, UC-24)
1. Vào một tour của xưởng (VD xưởng Gốm House) → đặt vé 2 khách → thanh toán giữ chỗ.
2. Vào `/tour-cua-toi` thấy booking `confirmed`, chưa nhận voucher.
3. Test hủy: đặt thêm 1 vé → bấm Hủy → slot được trả lại, hoàn tiền (refund_tour). (UC-25)

### 1.7 Giỏi voucher (UC-27, UC-28)
1. (Chờ xưởng `attend` booking trong phần 2 admin/xưởng) → sau khi xưởng xác nhận tham dự:
2. Vào `/ma-giam-gia` → có voucher `TOUR-...` 10%. (UC-27)
3. Vào trang tour lại → thấy block "Gợi ý sản phẩm lưu niệm" cross-sell. (UC-28)

### 1.8 Khiếu nại (UC-29, UC-30, UC-31, UC-32)
> Dùng đơn đã có để test không cần tạo đơn mới. Chọn 1 đơn `completed` hoặc `returned` của chính khách này.

1. Vào `/tao-khieu-nai` (ClaimNew) → chọn đơn có vấn đề → gửi khiếu nại kèm lý do/hình ảnh. (UC-29)
2. Vào `/khieu-nai` (hoặc Claims) → thấy dispute vừa tạo `open`.
3. (Admin xử lý trong Phần 3) sau đó xem lại kết quả:
   - `approved` → đơn có payment refund + stock đã hoàn.
   - `reship` → trong `/don-hang` xuất hiện **đơn thay thế** mã `RC-...` total 0đ, có badge "Đơn thay thế". (UC-31)

---

## PHẦN 2 — XƯỞNG (workshop01: Gia Long)

### 2.1 Hồ sơ xưởng & ví (UC-04)
1. Login `workshop01...` → vào `/xuong/hi-so` → xem/sửa thông tin.
2. Vào `/xuong/vi-doi-soat` → khai báo **tài khoản NH** (BIDV / số / chủ TK) → lưu → bảng kỳ doanh thu không trùng key (5 dòng, mỗi dòng 1 kỳ). (UC-04)

### 2.2 Sản phẩm & video (UC-11, UC-12)
1. Vào `/xuong/san-pham` → Thêm sản phẩm mới (tên, giá, stock, **video_url** YouTube, material/firing/glaze) → trạng thái `pending_review`.
2. Vào sản phẩm bị từ chối (nếu có) → sửa theo reject_reason → Gửi duyệt lại. (UC-12)
3. Admin duyệt (Phần 3) → sản phẩm thành `approved`, có passport QR tự sinh. (UC-35)

### 2.3 Đơn hàng & đóng gói (UC-13, UC-16, UC-17, UC-19, UC-20)
1. `/xuong/don-hang` → thấy đơn `pending_payment` (VD `TT-582XC2B2`, `TT-C4YERQS4`).
2. Bấm **"Đang đóng gói"** → đơn chuyển `preparing`, `anti_shock_packed=True`. (UC-13/16)
3. Bấm **"Giao hàng"** → đơn chuyển `shipping`, có shipment/tracking code. (UC-17)
4. Gửi webhook mock (mục 2.4) cho tracking đó.
5. Đơn `returned` (`TT-I2IPHGQC` hoặc `TT-YC1TGGIS`) → bấm **"Xác nhận đã nhận kiện hoàn"** → `return_received`. (UC-20)
6. Đơn nào có badge boom (failed_delivery_count, is_returned) → kiểm tra số lần giảm phát. (UC-19)

### 2.4 Webhook shipping mock (UC-17, UC-19, UC-32)
```powershell
# Sau khi xưởng "Giao hàng", lấy tracking_code từ API đơn, rồi:
$body = '{"event":"delivered","tracking_code":"<TRACKING>"}'
Invoke-RestMethod -Uri "http://localhost:8001/api/v1/shipping/webhook" -Method Post -ContentType "application/json" -Body $body
```
- `picked_up` → shipping; `delivered` → completed.
- Gửi `attempt_failed` 3 lần với cùng tracking → `is_returned=True`, order `returned`, khách `bad_order_count` +1. (UC-19/32)

### 2.5 Tour (UC-22, UC-24, UC-26)
1. `/xuong/tours` → tạo slot mới (ngày, giờ, capacity, giá). (UC-22)
2. Thấy booking `confirmed` của khách → bấm **"Xác nhận tham dự"** → khách nhận voucher tự động. (UC-26/27)

### 2.6 Doanh thu (UC-14)
- `/xuong/doanh-thu` → bảng gross/commission/payout, không có warning key trùng. (UC-14)

---

## PHẦN 3 — ADMIN (admin...)

### 3.1 Dashboard (UC-38)
1. Login admin → `/quan-tri` → thấy 10 thẻ KPI (doanh thu, hoa hồng, lợi nhuận gộp, đã hoàn, payout...) + 2 biểu đồ bar (Doanh thu theo xưởng, theo kỳ). (UC-38)

### 3.2 Duyệt xưởng (UC-33)
1. `/quan-tri/doi-tac` → 2 tab:
   - **Chờ duyệt**: đăng ký xưởng mới (đăng ký với role workshop_owner) → xuất hiện → Duyệt/Từ chối. (UC-33)
   - **Tất cả đối tác**: 3 xưởng đã approved hiện đủ.
2. Từ chối 1 xưởng → xưởng đó bị reject (test bên xưởng).

### 3.3 Kiểm duyệt sản phẩm & video (UC-34, UC-35)
1. `/quan-tri/san-pham` (hoặc tab pending) → sản phẩm `pending_review` vừa tạo ở 2.2 hiện.
2. Bấm **xem trước video** → modal mở YouTube iframe/native video. (UC-34)
3. Duyệt → sản phẩm `approved` + sinh passport QR. (UC-35)

### 3.4 Người dùng (UC-32)
1. `/quan-tri/nguoi-dung` → tìm khách bị boom ≥3 → cột "Đơn gây lỗi" hiện số + badge đỏ. (UC-32)

### 3.5 Khiếu nại (UC-30, UC-31, UC-36)
1. `/quan-tri/khieu-nai` → list dispute.
2. Chọn dispute `open` (từ 1.8) → modal **3 hướng**:
   - **Chấp thuận - hoàn tiền** → tạo payment `refund` (VNPay/manual), đơn hoàn stock. (UC-30)
   - **Gửi hàng thay thế** → tạo đơn `RC-...` total 0đ, khách thấy "Đơn thay thế". (UC-31)
   - **Từ chối** → dispute `rejected`.
3. Xem chi tiết: resolution + admin_note hiển thị đúng. (UC-36)

### 3.6 Đối soát (UC-21)
1. `/quan-tri/doi-soat` (AdminReconcile) → list revenue records theo kỳ.
2. Bấm **"Đã chuyển tiền"** ở 1 record → payout_status `paid`, payout_date gán. (UC-21)
3. Về `/xuong/vi-doi-soat` bên xưởng → kỳ đó hiện "đã chuyển".

### 3.7 Thanh toán & feedback
- `/quan-tri/thanh-toan` → bảng payments gồm order/tour/refund + provider/status. (AdminPayments)
- `/quan-tri/phan-hoi` → feedback contact từ form liên hệ (tạo trước ở FE `/lien-he`).

---

## PHẦN 4 — KIỂM THỬ TỰ ĐỘNG

```powershell
docker compose exec -T backend python -m pytest -q   # 10 passed
```

---

## Checklist nhanh UC mới đợt này

- [ ] UC-05: Search lọc material/firing/glaze + clear
- [ ] UC-07: passport QR scan camera + fallback nhập tay
- [ ] UC-08: video khóa khi chưa mua, mở khi có view, chủ xưởng/admin xem được
- [ ] UC-13/16: nút "Đang đóng gói" chuyển `preparing`
- [ ] UC-17/19/20: webhook giao hàng, boom sau 3 lần, nhận kiện hoàn
- [ ] UC-26/27/28: attend → voucher → cross-sell
- [ ] UC-30: refund + restock
- [ ] UC-31: đơn thay thế RC-, badge "Đơn thay thế"
- [ ] UC-32: bad_order_count cột AdminUsers
- [ ] UC-33: 2 tab đối tác (pending + tất cả)
- [ ] UC-34: preview video modal
- [ ] UC-38: dashboard KPI + 2 biểu đồ
- [ ] No duplicate React key trong Revenue/Wallet (warning `2026-09` đã sửa)