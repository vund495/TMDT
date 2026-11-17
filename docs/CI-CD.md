# CI/CD — VietCraft Bát Tràng

Pipeline GitHub Actions gồm 2 workflow:

| Workflow | File | Chạy khi | Việc làm |
| --- | --- | --- | --- |
| **CI** | `.github/workflows/ci.yml` | mọi `push` vào `main`, mọi pull request, bấm tay | test backend, chạy migration trên Postgres trống, typecheck + build frontend, build thử Docker image |
| **CD** | `.github/workflows/deploy.yml` | **CI xanh trên `main`** hoặc bấm tay | gọi Deploy Hook của Render cho backend + frontend, chờ `/health` trả 200, kiểm tra frontend phục vụ bundle mới |
| **PR Preview** | `.github/workflows/preview.yml` | PR mở/cập nhật/gắn nhãn | tìm URL preview Render của PR và comment link + trạng thái vào PR |

```
push / PR ──► CI
              ├─ backend        : pip install → pytest
              ├─ migrations     : Postgres 16 service → alembic upgrade head
              ├─ frontend       : npm ci → tsc --noEmit → vite build
              └─ docker         : build backend/Dockerfile + frontend/Dockerfile (không push)

PR mở/cập nhật ──► PR Preview ──► tìm URL preview Render → comment vào PR

main + CI xanh ──► CD ──► Render Deploy Hook (backend, frontend) ──► verify /health + HTML
```

## 1. Việc phải làm 1 lần trên Render

1. Vào **từng service** (`vietcraft-backend`, `vietcraft-frontend`) →
   **Settings → Build & Deploy → Auto-Deploy** = **Off**.
   Nếu để On, mỗi lần push sẽ deploy 2 lần (Render tự deploy + hook của CD).
   (Cách khác không cần secret: để **On + Checks Pass** và bật required status check `CI` — khi đó không cần `deploy.yml`.)
2. Cùng trang **Settings**, mục **Deploy Hook** → copy URL:
   - `vietcraft-backend` → `RENDER_BACKEND_DEPLOY_HOOK`
   - `vietcraft-frontend` → `RENDER_FRONTEND_DEPLOY_HOOK`

## 2. Việc phải làm 1 lần trên GitHub

**Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Giá trị |
| --- | --- |
| `RENDER_BACKEND_DEPLOY_HOOK` | Deploy Hook URL của `vietcraft-backend` |
| `RENDER_FRONTEND_DEPLOY_HOOK` | Deploy Hook URL của `vietcraft-frontend` |

(Secrets cũ dùng cho backup: `SUPABASE_DATABASE_URL` — giữ nguyên.)

Tuỳ chọn: tạo **Environment** tên `production` trong **Settings → Environments**,
bật *Required reviewers* nếu muốn deploy production phải bấm approve.

## 3. Bảo vệ nhánh `main`

**Settings → Branches → Add branch protection rule** cho `main`:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass → chọn `Backend · pytest`, `Backend · Alembic upgrade (Postgres 16)`,
  `Frontend · typecheck + build`, `Docker · build backend`, `Docker · build frontend`

Như vậy không ai merge được code đỏ vào `main`, và `main` luôn deploy được.

## 4. Biến môi trường của frontend (quan trọng)

Vite **bake** `VITE_API_BASE_URL` vào bundle **lúc build**, không đọc lúc runtime:

- CI build với `VITE_API_BASE_URL=https://vietcraft-backend.onrender.com` (khai báo trong `ci.yml`).
- Render static site cũng cần biến này (Render → `vietcraft-frontend` → Environment) với cùng giá trị.
- Đổi URL backend ⇒ sửa ở **cả 3 chỗ**: `ci.yml`, Render env, và `render.yaml` (comment) → sau đó deploy lại.

## 5. PR Preview — xem UI trước khi merge

**Dùng gì:** *Service Previews (PR Previews)* của Render cho static site `vietcraft-frontend`.
Render tính giá preview theo base service ⇒ base là **static site free** thì PR preview **cũng free**.

**Bật 1 lần:** Render Dashboard → `vietcraft-frontend` → tab **Previews** → *Pull Request Previews*:

| Chế độ | Cách dùng |
| --- | --- |
| **Automatic** | mọi PR vào `main` đều có preview |
| **Manual** | thêm label **`render-preview`** (hoặc `[render preview]` trong tiêu đề PR) khi muốn preview |

Mỗi PR có URL riêng: `https://vietcraft-frontend-pr-<số-PR>.onrender.com` (Render cũng tạo
GitHub *Deployment* gắn với PR). Preview **tự xoá** khi PR merge/close.

**Workflow `preview.yml`** không tạo preview (Render tự làm) — nó:
1. Poll GitHub Deployments API của commit PR để lấy `environment_url` (tối đa ~10 phút).
2. Chờ URL trả HTTP 200.
3. Comment (hoặc cập nhật lại đúng comment cũ, nhờ marker `<!-- vietcraft-preview -->`) link preview + trạng thái vào PR.

**Giới hạn cần biết:**

- Preview dùng `VITE_API_BASE_URL` của service gốc ⇒ gọi **API production, dữ liệu thật**. Muốn thử luồng ghi (đặt hàng, thanh toán) thì chạy local.
- **Không có preview cho backend**: *Preview Environments* (cả stack, có DB riêng) yêu cầu **workspace Pro** — đã ghi chú trong `render.yaml` (khối `previews:` comment sẵn, bỏ comment khi nâng Pro). PR sửa nhiều backend thì test bằng `docker compose up -d --build`.
- PR từ **fork** không được comment (workflow `if:` chặn) vì `GITHUB_TOKEN` chỉ read trên fork; PR nội bộ repo thì bình thường.

## 6. Sau khi service bị suspend (gói free) rồi Resume

Instance free bị sleep/suspend thì không mất code, nhưng nên deploy lại để chắc chắn asset khớp:

1. Render → `vietcraft-frontend` → **Manual Deploy → Clear build cache & deploy**.
2. Render → `vietcraft-backend` → **Manual Deploy** (Docker image được build lại, `alembic upgrade head` chạy lại khi container start).
3. Kiểm tra: `https://vietcraft-backend.onrender.com/health` và mở trang chủ, thử resize về 390px xem menu mobile.

## 7. Chạy y như CI ở máy local

```bash
# backend
cd backend
python -m venv venv && venv\Scripts\activate      # Windows
pip install -r requirements.txt
pytest -q
alembic upgrade head                              # cần DATABASE_URL trong backend/.env

# frontend
cd frontend
npm ci
npm run typecheck
npm run build
```

## 8. Sự cố thường gặp

| Hiện tượng | Nguyên nhân / cách xử lý |
| --- | --- |
| CD báo warning `Chưa có secret RENDER_*_DEPLOY_HOOK` | Chưa thêm secret ở mục 2 (workflow vẫn xanh, chỉ bỏ qua trigger) |
| Mỗi lần push thấy 2 deploy trên Render | Chưa tắt Auto-Deploy của service (mục 1) |
| PR không có preview | Chưa bật *Pull Request Previews* ở tab Previews của `vietcraft-frontend`, hoặc đang để *Manual* mà PR chưa có label `render-preview` |
| Comment của `preview.yml` ghi "Chưa tìm thấy preview" | Preview build > 10 phút (hiếm), hoặc PR từ fork, hoặc Render chưa tạo deployment — mở tab **Previews** trên Render để xem trực tiếp |
| Frontend deploy xong vẫn gọi API cũ | `VITE_API_BASE_URL` sai hoặc thiếu → build lại (biến chỉ có tác dụng lúc build) |
| Bước "Chờ backend healthy" fail | Xem log deploy backend trên Render (thường do `DATABASE_URL` Supabase sai/hết hạn, hoặc migration lỗi) |
| CI fail ở `npm ci` | `package-lock.json` lệch `package.json` → chạy `npm install` rồi commit lockfile |
| CI fail ở `alembic upgrade head` | Migration mới lỗi hoặc xung đột; chạy lại lệnh này ở local với DB trống để tái hiện |
