# Tiến độ triển khai Use Case — VietCraft Bát Tràng
> Cập nhật: 07/09/2026 | Backend: FastAPI + SQLAlchemy async | Frontend: React 18 + Vite | DB: PostgreSQL 16

---

## 1. Cấu trúc tổng hệ thống

```
TMDT/
├── backend/                          # FastAPI async, Python 3.13
│   ├── app/
│   │   ├── main.py                   # FastAPI app, CORS mount 86 routes
│   │   ├── core/
│   │   │   ├── config.py             # Settings (DB, VietQR, VNPay, Casso)
│   │   │   ├── database.py           # SQLAlchemy async engine, Base
│   │   │   ├── security.py           # JWT decode, get_current_user
│   │   │   └── dependencies.py       # require_admin, require_workshop_owner, get_owned_workshop
│   │   ├── models/                   # SQLAlchemy ORM (13 models)
│   │   │   ├── user.py               # users
│   │   │   ├── workshop.py           # workshops
│   │   │   ├── product.py            # products
│   │   │   ├── product_passport.py   # product_passports
│   │   │   ├── order.py              # orders, order_items, shipments
│   │   │   ├── payment.py            # payments
│   │   │   ├── tour.py               # tour_slots, tour_bookings
│   │   │   ├── voucher.py            # vouchers, revenue_records
│   │   │   ├── dispute.py            # disputes
│   │   │   ├── feedback.py           # feedback (contact)
│   │   │   ├── review.py             # reviews, comments
│   │   │   └── notification.py       # notifications
│   │   ├── enums/
│   │   │   ├── order_status.py       # OrderStatus enum + can_transition()
│   │   │   └── tour_status.py        # TourBookingStatus enum
│   │   ├── schemas/                  # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── order_service.py      # create_order, cancel, transitions
│   │   │   ├── payment_service.py    # VietQR/VNPay, unlock passport, refund, reconcile
│   │   │   ├── tour_service.py       # book_slot, cancel_booking, attend
│   │   │   ├── dispute_service.py    # create/resolve dispute
│   │   │   └── user_service.py       # auth register/login
│   │   └── api/v1/                   # Router files (18 routers)
│   │       ├── auth.py               # POST register/login, GET me
│   │       ├── users.py              # GET/PATCH /users/profile
│   │       ├── marketplace.py        # GET /products, /products/{id}, /workshops, /workshops/{id}
│   │       ├── cart.py               # CRUD /cart
│   │       ├── product_passport.py   # GET /passport/{qr_code}
│   │       ├── workshop.py           # CRUD workshop, products, orders/ship, revenue/wallet
│   │       ├── orders.py             # POST create, GET list/detail, cancel, confirm-receipt
│   │       ├── shipping.py           # POST /shipping/webhook (GHTK/J&T mock)
│   │       ├── payments.py           # VNPay create/return/ipn, refund, Casso webhook
│   │       ├── tours.py              # Tour slots CRUD, bookings, cancel, attend
│   │       ├── promotions.py         # Vouchers CRUD, my-vouchers
│   │       ├── reviews.py            # Reviews + comments per product
│   │       ├── disputes.py           # Create/list/resolve disputes
│   │       ├── feedback.py           # Contact feedback
│   │       ├── admin.py              # Admin: approve/reject, users, disputes, stats, reconcile
│   │       ├── notifications.py      # GET notifications, mark read
│   │       └── upload.py             # File upload (images)
│   ├── seed.sql                      # Dữ liệu mẫu (users, workshops, products, 35 payments)
│   └── alembic/                      # DB migrations (1 head: a1b2c3d4e5f7)
│
├── frontend/                         # React 18 + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── App.tsx                   # Route definitions (BrowserRouter)
│   │   ├── pages/
│   │   │   ├── auth/                 # Login, Register
│   │   │   ├── admin/                # AdminHome, AdminWorkshops, AdminUsers, AdminProducts,
│   │   │   │                         # AdminDisputes, AdminTours, AdminVouchers, AdminReconcile,
│   │   │   │                         # AdminFeedback, AdminPayments
│   │   │   ├── workshop/             # WorkshopDashboard, WorkshopProfile, WorkshopProducts,
│   │   │   │                         # WorkshopOrders, WorkshopTours, WorkshopRevenue, WorkshopWallet
│   │   │   └── (customer pages)      # HomePage, SearchPage, ProductDetail, PassportPage,
│   │   │                             # WorkshopList/Detail, Cart, Checkout, Orders, TourPage,
│   │   │                             # MyTours, Vouchers, Disputes/Claims, Notifications, etc.
│   │   ├── components/
│   │   │   ├── layout/               # CustomerLayout, WorkshopLayout, AdminLayout
│   │   │   └── motion/               # PageTransition (motion/react), Reveal
│   │   ├── lib/api/                  # API client (auth, products, orders, workshops, admin, etc.)
│   │   ├── store/                    # Zustand (authStore)
│   │   ├── types/domain.ts           # TS types (Product, Order, Dispute, TourBooking, etc.)
│   │   └── utils/                    # formatCurrency, status, ui, dates
│   └── public/images/               # Logo, VNPay/VietQR icons
│
└── docker-compose.yml               # db:5433, backend:8001, frontend:5173, pgadmin:5051
```

### Bảng DB hiện tại (14 tables)

| Table | Mô tả | Ghi chú |
|---|---|---|
| users | Người dùng (customer/workshop_owner/admin) | bad_order_count, is_active |
| workshops | Xưởng gốm | status: pending/approved/rejected; bank_name, bank_account_no, bank_account_name |
| products | Sản phẩm | theme, material, firing_technique, glaze, video_url, status: draft/pending_review/active/rejected |
| product_passports | Hộ chiếu QR | per-product (global unlock), unlocked_by_order_id |
| orders | Đơn hàng | status, anti_shock_packed, receiver info |
| order_items | Chi tiết đơn | product_name, unit_price, quantity |
| shipments | Vận đơn | tracking_code, carrier, failed_delivery_count, is_returned |
| payments | Giao dịch thanh toán | ref_type: order/tour/refund/refund_tour, provider: vietqr/vnpay/manual |
| tour_slots | Suất tour trống | capacity, slots_left, price_per_guest |
| tour_bookings | Đặt tour | num_guests, status, voucher_issued |
| vouchers | Mã giảm giá | discount_percent, max_discount_amount, usage_limit |
| revenue_records | Doanh thu đối soát | period YYYY-MM, gross/commission/payout |
| disputes | Khiếu nại | resolution: approved/reship/rejected, evidence_urls |
| notifications | Thông báo | type: order/tour/dispute/system/news |
| reviews, comments | Đánh giá, bình luận sản phẩm | — |
| feedback | Liên hệ | — |

---

## 2. Tiến độ 38 Use Case

### Chú giải
- ✅ **Đủ** — hiện thực đầy đủ BE + FE
- ⚠️ **Một phần** — đã xây nhưng chưa đủ theo UC
- ❌ **Thiếu** — chưa có BE hoặc FE
- 🚫 **Không cần code** — là hệ thống bên ngoài (shipping partner, VNPay production)

---

### Nhóm A: Xác thực & Hồ sơ (Authentication & Profile)

| UC | Tên | BE | FE | DB | Ghi chú |
|---|---|---|---|---|---|
| UC-01 | Đăng ký tài khoản | ✅ `POST /auth/register` | ✅ `Register.tsx` | ✅ users | Đăng ký email+pass, role customer/workshop_owner |
| UC-02 | Đăng nhập hệ thống | ✅ `POST /auth/login` | ✅ `Login.tsx` | ✅ JWT | bcrypt verify, chặn tài khoản is_active=False |
| UC-03 | Quản lý hồ sơ cá nhân/doanh nghiệp | ✅ `PATCH /users/profile` | ⚠️ `AccountPage.tsx` xem được, sửa được full_name+phone | ✅ | AccountPage đã có form edit (ĐỦ) — WorkshopProfile CRUD workshop (ĐỦ). **Lưu ý**: AccountPage chỉ sửa profile cá nhân, WorkshopProfile sửa info xưởng |
| UC-04 | Quản lý thông tin thanh toán/ví đối soát | ✅ `GET /workshop/revenue/wallet` (payout_status/kỳ) + `PATCH /workshop` bank fields | ✅ `WorkshopWallet.tsx` form tài khoản NH + bảng payout_status | ✅ workshops.bank_*, revenue_records.payout_status | Khai báo tài khoản NH nhận tiền + xem trạng thái chuyển tiền từng kỳ |

### Nhóm B: Marketplace (Mua sắm & Sản phẩm)

| UC | Tên | BE | FE | DB | Ghi chú |
|---|---|---|---|---|---|
| UC-05 | Tìm kiếm SP theo chủ đề văn hóa | ✅ `GET /products` filter: theme, material, firing_technique, glaze, price q | ✅ `SearchPage.tsx` pill theme + select material/kỹ thuật nung/men | ✅ | Đã bổ sung 3 filter theo yêu cầu |
| UC-06 | Xem chi tiết kỹ thuật nung/men | ✅ `GET /products/{id}` | ✅ `ProductDetail.tsx` | ✅ | material, firing_technique, glaze hiển thị đầy đủ |
| UC-07 | Quét mã QR Hộ chiếu sản phẩm | ✅ `GET /passport/{qr_code}` | ✅ `PassportPage.tsx` QR camera scanner (BarcodeDetector) + nhập tay fallback | ✅ product_passports | Đã thêm nút "Quét QR" dùng camera trình duyệt |
| UC-08 | Xem video nghệ nhân (mở khóa sau mua) | ✅ `_unlock_passports` per-user + `product_passport_views` (`payment_service.py:268`) | ✅ `PassportPage.tsx`/`PassportDetail.tsx` badge locked/unlocked | ✅ product_passport_views | Per-user: chỉ người mua (view) / admin / chủ xưởng xem video |
| UC-09 | Xem không gian gian hàng xưởng | ✅ `GET /workshops`, `/workshops/{id}` | ✅ `WorkshopList.tsx`, `WorkshopDetail.tsx` (MapEmbed) | ✅ lat/lng | Google Maps embed |

### Nhóm C: Workshop (Chủ xưởng vận hành)

| UC | Tên | BE | FE | DB | Ghi chú |
|---|---|---|---|---|---|
| UC-10 | Quản lý không gian gian hàng | ⚠️ `POST/PATCH /workshop` (name/desc/addr/logo) | ⚠️ `WorkshopProfile.tsx` | ✅ | **Thiếu**: UI không expose lat/lng, không quản lý "không gian trưng bày" riêng |
| UC-11 | Đăng tải thông tin & Video kể chuyện | ✅ `POST /workshop/products` có video_url | ✅ `WorkshopProducts.tsx` form video_url | ✅ | Upload file qua `/upload` endpoint |
| UC-12 | Chỉnh sửa nội dung bị từ chối/bản nháp | ✅ `PATCH /workshop/products/{id}` + `POST .../publish` | ✅ `WorkshopProducts.tsx` nút sửa + gửi duyệt | ✅ reject_reason, draft | Hoàn chỉnh |
| UC-13 | Cập nhật trạng thái chuẩn bị đơn hàng | ✅ `POST /workshop/orders/{id}/mark-packing` (pending_payment→preparing) | ✅ `WorkshopOrders.tsx` nút "Đang đóng gói" | ✅ | Đã thêm nút riêng chuyển pending_payment→preparing |
| UC-14 | Xem báo cáo doanh thu xưởng | ✅ `GET /workshop/revenue` | ✅ `WorkshopRevenue.tsx` gross/commission/payout | ✅ revenue_records | Đầy đủ |

### Nhóm D: Order & Logistics (Đơn hàng & Vận chuyển)

| UC | Tên | BE | FE | DB | Ghi chú |
|---|---|---|---|---|---|
| UC-15 | Mua hàng & Thanh toán trực tuyến | ✅ `POST /orders` + `/payments/vnpay` + `/payments/webhook/casso` | ✅ `CartPage`, `CheckoutPage`, `VnpayResult` | ✅ orders, payments | VNPay + VietQR + Casso |
| UC-16 | Đóng gói chống sốc chuyên dụng đa lớp | ✅ `POST /workshop/orders/{id}/mark-packing` set `anti_shock_packed=True` | ✅ `CheckoutPage.tsx` checkbox + `WorkshopOrders.tsx` nút xác nhận đóng gói | ✅ anti_shock_packed | Đã thêm bước xưởng xác nhận "đang đóng gói chống sốc" |
| UC-17 | Cập nhật trạng thái giao hàng | ✅ `POST /shipping/webhook` | ✅ `OrderDetail.tsx` xem status | ✅ shipments | Webhook handles: picked_up, delivered, returned, attempt_failed |
| UC-18 | Xác nhận nhận hàng hoàn tất | ✅ `POST /orders/{id}/confirm-receipt` | ✅ `OrderDetail.tsx` nút "Đã nhận hàng" | ✅ | Hoàn chỉnh |
| UC-19 | Báo cáo giao hàng thất bại (Boom hàng) | ✅ `POST /shipping/webhook` event `attempt_failed/failed` | ✅ `OrderDetail.tsx`/`OrdersList.tsx`/`WorkshopOrders.tsx` boom badge + failed_delivery_count | ✅ failed_delivery_count | Đã thêm UI boom hàng cho khách/xưởng |
| UC-20 | Tiếp nhận kiện hàng hoàn | ✅ `POST /workshop/orders/{id}/receive-return` (returned→return_received) | ✅ `WorkshopOrders.tsx` nút "Xác nhận đã nhận kiện hoàn" | ✅ enums `return_received`, VALID_TRANSITIONS | Hoàn chỉnh (P0) |
| UC-21 | Đối soát & Chuyển tiền doanh thu | ✅ `POST /admin/reconcile-revenue` + `GET /admin/reconcile/records` + `POST /admin/reconcile/{id}/mark-paid` | ✅ `AdminReconcile.tsx` bảng records + nút "Đã chuyển tiền" | ✅ revenue_records payout_status/payout_date | payout ghi nội bộ (không gateway thật) |

### Nhóm E: O2O Tour (Tour Trải nghiệm Ngoại tuyến)

| UC | Tên | BE | FE | DB | Ghi chú |
|---|---|---|---|---|---|
| UC-22 | Thiết lập lịch trống & Sức chứa | ✅ `POST /tours/slots` | ✅ `WorkshopTours.tsx` | ✅ tour_slots | Hoàn chỉnh |
| UC-23 | Đặt vé tour trải nghiệm | ✅ `POST /tours/bookings` + FOR UPDATE trừ slot | ✅ `TourPage.tsx` | ✅ tour_bookings | Hoàn chỉnh |
| UC-24 | Thanh toán giữ chỗ & Trừ slot tự động | ✅ `_on_paid` tour → confirmed, slot trừ khi book | ✅ QR/VNPay trong `TourPage` | ✅ | Hoàn chỉnh |
| UC-25 | Yêu cầu hủy lịch tour | ✅ `POST /tours/bookings/{id}/cancel` + `refund_tour` | ✅ `MyTours.tsx` nút Hủy | ✅ | Hoàn chỉnh |
| UC-26 | Cập nhật trạng thái Đã tham gia | ✅ `POST /tours/bookings/{id}/attend` | ✅ `WorkshopTours.tsx` nút "Xác nhận tham dự" (xưởng), `MyTours.tsx` hiển thị "Đã tham gia" + voucher | ✅ | Đã bổ sung trạng thái attended/no_show + voucher cho khách |
| UC-27 | Nhận mã giảm giá tự động | ✅ attend → tạo Voucher TOUR-{id} 10% | ✅ `VouchersPage.tsx` hiển thị | ✅ vouchers | Hoàn chỉnh |
| UC-28 | Mua chéo (Cross-sell) sản phẩm lưu niệm | ✅ voucher 10% sau tour kéo khách mua | ✅ `TourPage.tsx` block "Gợi ý sản phẩm lưu niệm" | ✅ vouchers | Đã thêm block gợi ý sản phẩm |

### Nhóm F: Dispute & Support (Xử lý sự cố)

| UC | Tên | BE | FE | DB | Ghi chú |
|---|---|---|---|---|---|
| UC-29 | Yêu cầu đền bù nứt vỡ | ✅ `POST /disputes` | ✅ `ClaimNew.tsx` | ✅ disputes | Đầy đủ |
| UC-30 | Thực thi Hoàn tiền (Refund) 100% | ✅ `refund_order` (`payment_service.py`) — gọi **VNPay refund API thật** khi provider=vnpay, ghi `gateway_response`; nội bộ nếu VietQR/manual + **hoàn stock** | ✅ `AdminDisputes.tsx` modal "Chấp thuận - hoàn tiền" | ✅ payments.gateway_response | Đã tích hợp VNPay refund sandbox + restock |
| UC-31 | Gửi sản phẩm thay thế | ✅ `dispute_service._create_replacement_order` tạo đơn RC- total=0 status=preparing, `replacement_of_id` trỏ về đơn gốc, đơn gốc→completed | ✅ `AdminDisputes.tsx` modal "Gửi hàng thay thế" + badge "Đơn thay thế" trong OrderDetail/OrdersList/WorkshopOrders | ✅ orders.replacement_of_id | Đã thêm đơn thay thế + theo dõi |
| UC-32 | Ghi nhận lịch sử xấu (boom hàng) | ✅ `shipping.py:64` tăng `bad_order_count` khi boom ≥3 | ✅ `AdminUsers.tsx` cột "Đơn gây lỗi" | ✅ users.bad_order_count | Đã thêm UI hiển thị bad_order_count |

### Nhóm G: Admin (Quản trị hệ thống)

| UC | Tên | BE | FE | DB | Ghi chú |
|---|---|---|---|---|---|
| UC-33 | Quản lý danh sách đối tác (Duyệt xưởng) | ✅ `/admin/workshops` (toàn bộ, filter status) + `/pending`, `/approve`, `/reject` | ✅ `AdminWorkshops.tsx` 2 tab: "Chờ duyệt" + "Tất cả đối tác" | ✅ workshops.status | Đã thêm danh sách toàn bộ đối tác |
| UC-34 | Kiểm duyệt nội dung sản phẩm & Video | ✅ `/admin/products/pending`, `/approve`, `/reject` | ✅ `AdminProducts.tsx` xem trước video YouTube (iframe embed) + preview modal | ✅ products.status | Đã thêm preview video khi duyệt |
| UC-35 | Sinh mã QR Hộ chiếu sản phẩm tự động | ✅ `admin.py:142` sinh QR khi approve, `workshop.py:198` khi publish | ✅ `WorkshopProducts.tsx` hiển thị passport_qr | ✅ product_passports | Hoàn chỉnh |
| UC-36 | Tiếp nhận & Phân xử khiếu nại | ✅ `POST /disputes/{id}/resolve` (approved/reship/rejected) | ✅ `AdminDisputes.tsx` modal 3 hướng | ✅ disputes | Hoàn chỉnh |
| UC-37 | Quản lý lịch đặt chỗ tour ngoại khóa | ✅ `GET /admin/tours/bookings` (toàn sàn) | ✅ `AdminTours.tsx` | ✅ tour_bookings | Hoàn chỉnh |
| UC-38 | Thống kê doanh thu & Lợi nhuận gộp toàn sàn | ✅ `GET /admin/stats` gồm commission, payout, refunded, gross_profit, revenue theo xưởng/kỳ | ✅ `AdminDashboard.tsx` 10 thẻ + 2 biểu đồ bar doanh thu theo xưởng/kỳ | ✅ revenue_records | Đã thêm lợi nhuận gộp + phân tích theo xưởng/kỳ |

---

## 3. Tổng kết thiếu

### Thiếu hoàn toàn (0% — cần làm mới)
| UC | Thứ tự ưu tiên | Mô tả công việc |
|---|---|---|
| _(không còn)_ | — | ✅ Toàn bộ P0/P1/P2 đã hoàn thành trong đợt cập nhật này |

> Bản cập nhật 2026-09-07 đã xong: UC-19 FE (boom UI), UC-30 (VNPay refund + restock), UC-31 (đơn thay thế RC-), UC-08 per-user view, UC-05 filter material/firing/glaze, UC-07 QR camera, UC-13/16 mark-packing, UC-26 FE attended, UC-28 FE cross-sell, UC-32 FE bad_order_count, UC-33 FE danh sách đối tác, UC-34 FE preview video, UC-38 stats/gross_profit.

### Thiếu một phần lớn (30–70% — cần bổ sung)
| UC | Prio | BE thiếu | FE thiếu | DB thiếu |
|---|---|---|---|---|
| _(không còn)_ | — | — | — | — |

### Thiếu một phần nhỏ (70–95% — cần chỉnh sửa nhỏ)
| UC | Prio | Chi tiết |
|---|---|---|
| **UC-03** | 🟢 P2 | FE: AccountPage đã có thể edit full_name+phone (✅ ĐỦ); WorkshopProfile đã CRUD workshop. Thực tế **ĐỦ** |
| **UC-07** | 🟢 P2 | FE: PassportPage đã có QR scanner camera (BarcodeDetector) nhưng Safari/Firefox chưa hỗ trợ → fallback nhập tay (đã có) |
| **UC-13** | 🟢 P2 | WorkshopOrders đã có nút "Đang đóng gói" (mark-packing) — ✅ ĐỦ |
| **UC-16** | 🟢 P2 | Xưởng đã xác nhận đóng gói chống sốc riêng qua mark-packing — ✅ ĐỦ |
| **UC-26 FE** | 🟢 P2 | MyTours đã hiển thị "Đã tham gia" + voucher — ✅ ĐỦ |
| **UC-28 FE** | 🟢 P2 | TourPage đã có block gợi ý sản phẩm cross-sell — ✅ ĐỦ |
| **UC-33 FE** | 🟢 P2 | AdminWorkshops đã có tab đối tác đã duyệt — ✅ ĐỦ |
| **UC-34 FE** | 🟢 P2 | AdminProducts đã xem trước video YouTube — ✅ ĐỦ |
| **UC-38** | 🟢 P2 | AdminDashboard đã có charts + gross_profit — ✅ ĐỦ |

---

## 4. Bugs / Code Issues phát hiện khi review

### `payment_service.py` — Dead code sau return (đã sửa)
- **File**: `backend/app/services/payment_service.py`
- **Vấn đề**: Dòng 411–438 (sau `return` statement ở dòng 410 trong `reconcile_revenue`) là **dead code** —永远不会 được execute. Đoạn code này là copy-paste thừa từ `find_payment_by_ref`.
- **Sửa**: ✅ Đã xóa nhánh dead code.

### Passport unlock per-user ✅
- Đã chuyển sang **per-user** qua bảng `product_passport_views`. Video chỉ mở cho: người có `ProductPassportView` (đã thanh toán đơn chứa sản phẩm), admin, hoặc chủ xưởng của sản phẩm. `product_passports.unlocked` vẫn giữ làm cờ nhanh nhưng endpoint `GET /passport/{qr_code}` xác định quyền theo view.

---

## 5. Hành động tiếp theo đề xuất

### Ưu tiên cao (P0) — làm trước
1. **UC-20**: ✅ Đã làm xong — BE `POST /workshop/orders/{id}/receive-return` + FE nút trong WorkshopOrders + enum `return_received`
2. **UC-04/21**: ✅ Đã làm xong — `payout_status`/`payout_date` cho revenue_records + form tài khoản NH xưởng + nút admin "đã chuyển tiền"
3. **UC-30**: ✅ Đã làm xong — `refund_order` gọi **VNPay refund API thật** (sandbox) khi provider=vnpay, fallback nội bộ + `_restock_order` hoàn stock, idempotent

### Ưu tiên trung bình (P1) — làm tiếp
4. **UC-31**: ✅ Replacement order — `reship` tạo đơn RC- (total=0, preparing), `replacement_of_id` trên đơn thay thế trỏ về đơn gốc, đơn gốc→completed
5. **UC-08**: ✅ Passport per-user qua `product_passport_views`
6. **UC-19 FE**: ✅ UI boom hàng (failed_delivery_count + returned badge) cho khách/xưởng
7. **UC-32 FE**: ✅ Hiển thị bad_order_count trong AdminUsers

### Ưu tiên thấp (P2) — làm sau
8. ✅ UC-05 filter material/firing/glaze — đã xong
9. ✅ UC-07 QR scanner camera (BarcodeDetector + fallback nhập tay) — đã xong
10. ✅ UC-28 Cross-sell block trong TourPage — đã xong
11. ✅ UC-26 FE attended/no_show + voucher trong MyTours — đã xong
12. ✅ UC-33 FE tab đối tác đã duyệt trong AdminWorkshops — đã xong
13. ✅ UC-34 FE preview video YouTube trong AdminProducts — đã xong
14. ✅ UC-38 Biểu đồ/stats chi tiết (gross_profit + revenue theo xưởng/kỳ) trong AdminDashboard — đã xong
15. ✅ Sửa dead code trong payment_service.py

---

## 6. External (không cần code, cần cấu hình production)
- **VNPay**: sandbox hiện tại cần TMN key thật + Secret key production
- **VietQR**: tài khoản BIDV 7621982567 / Nguyen Duy Vu (BIN 970418) — tiền thật
- **Shipping partner**: webhook hiện mock, cần tích hợp GHTK/J&T API thật
- **Casso**: webhook detection cần API key Casso production
