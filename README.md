# Provider Lobby UI

Giao dien React + Tailwind + framer-motion mo phong he thong sanh game va danh sach game.

## Chay du an

1. Cai Node.js (khuyen nghi Node 22+).
2. Cai package:
   - `npm install`
3. Chay migration DB:
   - `npm run migrate`
4. Chay API server:
   - `npm run server`
5. Mo them terminal moi, chay frontend:
   - `npm run dev`
6. Build/preview:
   - `npm run build`
   - `npm run preview`

## Routing (share link)

- Lobby: `/`
- Mo thang sanh: `/?provider=pg` (ho tro back/forward + refresh giu trang thai)

## He thong phan tich (rule-based + random co kiem soat)

- Phan tich theo diem nhap (1-1000) trong modal game.
- Moi lan phan tich tru 10 xu (uu tien API that, fallback local khi chua co token).
- Ket qua tra ve:
  - Ty le % de xuat
  - Do tin cay
  - Rui ro
  - Quay moi / Quay auto
  - Khung gio de xuat
  - Business Logic panel (AI Prediction Engine, Game Selection Logic, Real-time Logging, VIP Level System)

## API tich hop user/xu

- `POST /api/auth/register`: dang ky user moi (luu vao SQLite)
- `POST /api/auth/login`: dang nhap
- `GET /api/auth/me`: lay thong tin user
- `POST /api/auth/logout`: dang xuat
- `POST /api/user/deduct-xu`: tru xu khi phan tich
- Mat khau duoc ma hoa bang `bcrypt`.

## Migration/schema DB

- File schema: `backend/migrations/001_create_users.sql`
- Chay migration:
  - `npm run migrate`

## Smoke test

- Luong test: `register -> login -> me -> deduct-xu -> logout`
- Chay:
  - `npm run test:smoke`

## CDN assets (anh game)

- Set bien moi truong `VITE_ASSETS_BASE_URL` (VD: `https://cdn.example.com`)
- Anh game se duoc build thanh: `${VITE_ASSETS_BASE_URL}/assets/img/games/<provider>/<slug>.webp`

## Cau truc du lieu

`src/data/mockData.js`

- `Provider Object`:
  - `id`
  - `name`
  - `shortName`
  - `lobbyLabel`
  - `image` (ho tro URL hoac Base64 data URI)
  - `isActive`
- `Game Object`:
  - `id`
  - `title`
  - `image`
  - `multiplier`
  - `isHot`
  - `isNew`

## Luu y

- HTML/bo cuc co the thay doi linh hoat theo tung giai doan du an.
- Ban chi can sua du lieu trong `mockData.js` de them/xoa provider va game.

## Asset manifest / download (de upload CDN)

- Tao manifest:
  - `npm run assets:manifest`
- Tai anh tu bigtool (de ban upload len CDN sau):
  - `npm run assets:download`
  - Gioi han so file: `set DOWNLOAD_LIMIT=200 && npm run assets:download`
  - Chon dinh dang: `set DOWNLOAD_EXT=webp && npm run assets:download`
