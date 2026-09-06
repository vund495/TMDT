# 🏺 TMDT VietCraft Bát Tràng

Sàn TMĐT gốm sứ Bát Tràng (B2C/B2B) + Tour O2O + Hộ chiếu sản phẩm (QR) + "Vỡ 1 đền 1".

## Tech stack & Port

| Tầng | Công nghệ | Port |
|---|---|---|
| Backend | FastAPI · SQLAlchemy async · Alembic | **8001** |
| Frontend | React 18 + TS (Vite) · TanStack Query · Zustand · Tailwind | **5173** |
| DB | PostgreSQL 16 (Docker) | 5433 |
| Container | Docker Compose: db + backend + frontend (+ pgadmin) | — |

## Bắt đầu nhanh (Docker)

```powershell
git clone https://github.com/vund495/TMDT.git ; cd TMDT
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
docker compose up -d --build                          # backend tự migrate
docker compose exec backend python scripts/run_seed.py # dữ liệu mẫu (lần đầu)
```

Kiểm tra: http://localhost:5173 · Swagger http://localhost:8001/docs · Health http://localhost:8001/health

**Lệnh hay dùng:** `docker compose ps` · `logs -f backend` · `down` (giữ DB) · `down -v` (xóa DB, chạy lại seed) · `up -d --build backend` (rebuild sau khi sửa code)

## Chạy test

```powershell
# backend/ (venv bật)        # frontend/
pytest                        npm run typecheck
                              npm run build
```

> Báo "hoàn thành" khi cả 3 lệnh đều pass (+ E2E thật qua Swagger nếu liên quan nghiệp vụ).

## Cấu trúc (tóm tắt)

```
backend/app/  main.py · core/(config, db, security) · models/ · schemas/ · enums/
              services/ · api/v1/ (auth, marketplace, cart, orders, payments,
              workshop, tours, disputes, admin, ...) · tasks/
backend/      alembic/ · scripts/ (run_seed, verify_seed) · tests/
frontend/src/ pages/ (khách /, workshop /workshop, admin /admin)
              components/ (ui, layout, motion) · lib/api · store · hooks · types
```

## Tài khoản demo

| Vai | Email | Pass |
|---|---|---|
| Admin | `admin.tmdt@example.com` | `Admin123!` |
| Xưởng 1 (Gia Long) | `workshop01.tmdt@example.com` | `Xuong123!` |
| Xưởng 2 (Gốm House) | `workshop02.tmdt@example.com` | `Xuong123!` |
| Khách | `khach01.tmdt@example.com` … `khach03` | `Khach123!` |

Voucher: `GIAM10` · `GIAM15-GIA-LONG`

## Quy ước làm việc

- Nhánh ổn định `main`; làm tính năng ở nhánh `feature/<UC>-<mô-tả>`, PR cho leader review.
- **⛔ Không tự commit/push** — chỉ khi chủ nhiệm bảo.
- Commit message: ngắn, tiếng Việt không dấu, khuôn `<UC>: <việc>` (VD `UC-05: thêm lọc giá`).
- **Không commit** `.env`, `venv/`, `node_modules/`, `dist/`.
- BE: logic để ở `services/`, router chỉ validate + gọi service; quyết định nhạy cảm **re-check từ DB**, không tin token.
- FE: file mới `.tsx/.ts`, types ở `src/types/`, gọi API qua `lib/api`.
- Đổi schema: sửa `models/` → `alembic revision --autogenerate` → restart backend → **commit cả migration**.
- Webhook thanh toán **phải idempotent**; đặt tour dùng `SELECT ... FOR UPDATE` khi trừ `slots_left`.
- Hoàn thành UC thì cập nhật trạng thái ✅ trong `TIEN-DO.md` (file nội bộ, không commit).

## Sự cố thường gặp

| Vấn đề | Xử lý |
|---|---|
| Backend không kết nối DB | Check `docker compose up -d db`, xem `logs backend` |
| Mất dữ liệu mẫu | Chạy lại `run_seed.py` |
| Sửa code không phản ánh | `docker compose up -d --build backend` |
| FE gọi API lỗi | Check `frontend/.env`: `VITE_API_BASE_URL=http://localhost:8001` |

## License

Đồ án môn học — tái sử dụng được với ghi nguồn.