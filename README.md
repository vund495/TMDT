# TMDT Gốm sứ Bát Tràng

Nền tảng thương mại điện tử trung gian kết nối xưởng gốm Bát Tràng với khách hàng B2C/B2B, kèm mô hình **O2O** (đặt tour trải nghiệm làm gốm) và cơ chế **Hộ chiếu sản phẩm** (Product Passport) qua mã QR để định vị thương hiệu.

Nổi bật:
- **Hộ chiếu sản phẩm** — mỗi SP có mã QR, video nghệ nhân chỉ mở khóa sau khi mua (trải nghiệm "đập hộp" độc quyền).
- **"Vỡ 1 đền 1"** — khách gửi ảnh/video bằng chứng → hoàn tiền 100% hoặc gửi hàng thay thế ngay.
- **O2O Tour** — khách đặt tour làm gốm, sau tour nhận mã giảm giá mua chéo SP lưu niệm.

---

## Tech stack

| Tầng | Công nghệ |
|---|---|
| Backend | **FastAPI** (Python 3.11+), SQLAlchemy 2 async, Alembic, Pydantic v2 |
| Frontend | **React 18 + TypeScript** (Vite), TanStack Query, Zustand, Tailwind CSS |
| Database | **PostgreSQL 16** (Docker, port host **5433**) |
| Auth | Backend tự cấp **JWT HS256** + bcrypt (bảng `users`) — không cần dịch vụ ngoài |
| Thanh toán | **VietQR** (sinh mã QR chuyển khoản + nội dung đơn), webhook Casso idempotent |
| Vận chuyển | Mock webhook GHTK/J&T |
| Container | Docker Compose: `db` + `backend` (8001) + `frontend` (5173) |

---

## Cấu trúc thư mục (tóm tắt)

```
TMDT/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app + CORS
│   │   ├── core/              # config, security (JWT/bcrypt), database
│   │   ├── models/            # 17 bảng SQLAlchemy
│   │   ├── schemas/           # Pydantic DTO
│   │   ├── api/v1/            # routers: auth, marketplace, cart, orders,
│   │   │                      #   payments, workshop, tours, promotions,
│   │   │                      #   shipping, product_passport, reviews,
│   │   │                      #   disputes, feedback, admin, users
│   │   ├── services/          # business logic (order/tour/payment/dispute)
│   │   └── enums/             # state machine đơn hàng & tour
│   ├── alembic/               # migrations (tự chạy khi khởi động)
│   ├── scripts/               # run_seed.py / verify_seed.py
│   ├── seed.sql               # dữ liệu mẫu idempotent
│   ├── tests/                 # pytest
│   └── requirements.txt
├── frontend/                  # React 18 + TS (src/pages: khách, /workshop, /admin)
├── docs/erd.png
└── docker-compose.yml
```

---

## Chạy dự án

Yêu cầu: **Docker Desktop**.

```bash
git clone https://github.com/vund495/TMDT.git
cd TMDT
copy backend\.env.example backend\.env      # macOS/Linux: cp ...
copy frontend\.env.example frontend\.env
docker compose up -d --build                 # backend tự alembic upgrade head
docker compose exec backend python scripts/run_seed.py   # nạp dữ liệu mẫu
```

Kiểm tra: `http://localhost:5173` (web) · `http://localhost:8001/docs` (Swagger) · `http://localhost:8001/health` → `{"status":"ok"}`

**Lệnh hay dùng:**

```bash
docker compose ps | logs -f backend | down | down -v (xóa hết DB)
docker compose up -d --build backend   # rebuild sau khi đổi code
```

**Chạy thủ công** (vẫn cần Docker cho DB): `docker compose up -d db`, rồi `cd backend && venv\Scripts\activate && pip install -r requirements.txt && alembic upgrade head && uvicorn app.main:app --reload --port 8001`, và `cd frontend && npm install && npm run dev`.

Test: `pytest` (trong `backend/`) · `npm run typecheck` · `npm run build` (trong `frontend/`).

---

## Cổng dịch vụ

| Dịch vụ | Port host |
|---|---|
| Frontend | 5173 |
| Backend API (Swagger `/docs`) | 8001 |
| PostgreSQL | 5433 |

---

## Tài khoản demo

| Vai | Email | Mật khẩu |
|---|---|---|
| Admin | `admin.tmdt@example.com` | `Admin123!` |
| Chủ xưởng 1 (Gia Long) | `workshop01.tmdt@example.com` | `Xuong123!` |
| Chủ xưởng 2 (Gốm House) | `workshop02.tmdt@example.com` | `Xuong123!` |
| Khách hàng | `khach01.tmdt@example.com` … `khach03` | `Khach123!` |

Voucher mẫu: `GIAM10` (-10%, max 50k) · `GIAM15-GIA-LONG` (-15%, max 75k).

### ID dữ liệu mẫu (test qua Swagger)

| Đối tượng | ID |
|---|---|
| Xưởng Gốm Gia Long | `2e76df4e-5ac7-4370-b4d5-a5755e98a108` |
| Xưởng Gốm House | `5ac7f8a6-e20b-4117-a8b1-be66196b31c9` |
| SP Bình cắm hoa mini | `cac760a9-0831-415c-981d-210e3fb8e638` |
| SP Bộ bát đĩa 5 người | `14151590-fe82-4233-bd1b-0240b0665574` |
| Tour slot 1 (Gia Long, 150k) | `7469f394-cf85-443a-bee4-180352c57dd2` |
| Tour slot 3 (Gốm House, 120k) | `6243200d-6719-47ef-8277-a7c1f76e806f` |

**Quy tắc sinh mã khi test:**
- QR Hộ chiếu SP = `PP-` + 12 ký tự đầu `product_id` (bỏ gạch, HOA). VD `26050ba0-...` → `PP-26050BA09C34`
- Mã thanh toán tour (webhook casso) = `TT-` + 8 ký tự đầu `booking_id` (HOA)
- Voucher cross-sell sau tour = `TOUR-` + 6 ký tự đầu `booking_id` (HOA)

### Luồng test trạng thái đơn

| Bước | Gọi (vai) | Kết quả |
|---|---|---|
| Tạo đơn | `POST /orders` (khách) | `pending_payment` |
| Thanh toán giả lập | `POST /payments/webhook/casso` | `matched:1` → `preparing` |
| Xưởng bàn giao | `POST /workshop/orders/{id}/ship` (xưởng) | `shipping` |
| Xác nhận nhận hàng | `POST /orders/{id}/confirm-receipt` (khách) | `completed` |
| Giao thất bại x3 | `POST /shipping/webhook` `event=attempt_failed` | lần 3 → `returned` |

---

## Trạng thái triển khai

Huy hiệu: ✅ hoàn thành (đã test) · 🟡 một phần · ❌ chưa

**Backend API (đã chạy trên Docker 8001):**

| Module | Trạng thái | Use Case |
|---|---|---|
| Auth JWT local + hồ sơ người dùng | ✅ | UC-01→03 |
| Marketplace: tìm/lọc/sắp xếp, chi tiết SP, gian hàng | ✅ | UC-05, 06, 09 |
| Product Passport qua QR + video (chỉ mở khi `unlocked`) | ✅ | UC-07, 08, 35 |
| Giỏ hàng + đặt đơn + VietQR + webhook Casso | ✅ | UC-39, 15, 21 |
| Workshop: đăng SP (video_url), publish → tự sinh Passport, doanh thu | ✅ | UC-11→14 |
| Xưởng bàn giao đơn → `shipping` | ✅ | UC-13, WC3 |
| Vận chuyển webhook + xác nhận nhận hàng | ✅ | UC-17, 18, 20 |
| Boom hàng sau 3 lần thất bại + lịch sử xấu khách | ✅ | UC-19, 32 |
| O2O Tour: slot, đặt vé (1-6/20-50 người), thanh toán/hủy/hoàn slot, `attend` + voucher | ✅ | UC-22→28 |
| Khiếu nại "Vỡ 1 đền 1": tạo, phân xử (refund · reship · rejected) | ✅ | UC-29→31 |
| Voucher admin CRUD | ✅ | UC-27, 28 |
| Đánh giá (verified purchase) + bình luận + feedback | ✅ | UC-40, 41 |
| Admin: duyệt xưởng, duyệt/từ chối SP, xem lịch tour, phân xử, thống kê | ✅ | UC-33→38 |

- Frontend React SPA (khách `/`, xưởng `/workshop`, admin `/admin`) — **đang xây dựng tiếp**.
- Backend unit test: `pytest` (10 passed). Đã E2E test thật các luồng chính.
- Migration Alembic: `a1b2c3d4e5f6` (thêm `products.reject_reason`) · `b2c3d4e5f6a7` (thêm `products.video_url`, `shipments.failed_delivery_count`, `users.bad_order_count`).

---

## Ghi chú kỹ thuật

- **Auth**: `POST /auth/register` → hash bcrypt + trả JWT (12h); `POST /auth/login` → verify + trả JWT. Gửi header `Authorization: Bearer <token>`. Role nằm trong token nhưng quyết định nhạy cảm phải **re-check từ DB**.
- **State machine đơn**: `pending_payment → preparing → shipping → completed / disputing / returned` — tập trung ở `enums/order_status.py`, gọi qua `can_transition()`.
- **Race condition đặt tour (UC-24)**: dùng `SELECT ... FOR UPDATE` khi trừ `slots_left`.
- **Webhook thanh toán** phải **idempotent** (tránh trừ tiền/đổi trạng thái 2 lần).
- **Đổi schema**: sửa `models/` → `alembic revision --autogenerate` → restart backend (tự upgrade) → **commit cả file migration**.
- **API docs**: Swagger tại `http://localhost:8001/docs`, có thể export OpenAPI cho báo cáo.

---

## Quy ước Git

- Nhánh ổn định `main`; code trên nhánh `feature/<mã-uc>-<mô-tả>`, tạo PR cho leader review.
- Commit message: `<UC>: <việc làm>`, ví dụ `UC-05: thêm lọc khoảng giá`.
- **Không commit** `.env`, `venv/`, `node_modules/` (đã chặn bằng `.gitignore`).

## License

Đồ án môn học — cho phép tái sử dụng mã nguồn với ghi nhận nguồn.
