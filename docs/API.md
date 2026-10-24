# Snapoose Pro — API Documentation

Dokumentasi REST API berdasarkan controller, DTO, service, repository, dan schema saat ini. Diperbarui pada **24 Oktober 2026**. Data modul di bawah disimpan di PostgreSQL melalui Drizzle; file gambar diunggah ke Cloudflare R2. Perilaku yang belum selesai ditandai secara eksplisit; contoh sukses bukan bukti pengujian terhadap server atau database yang berjalan.

### Daftar isi

- [Konfigurasi dan format respons](#1-konfigurasi-dan-aturan-umum)
- [Ringkasan endpoint](#2-ringkasan-endpoint-aktif)
- [Autentikasi dan Postman](#3-autentikasi-dan-postman)
- [General dan instalasi desktop](#4-general-dan-instalasi-desktop)
- [Tenant](#5-tenant)
- [Location](#6-location)
- [Booth](#7-booth)
- [Frame dan upload slots](#8-frame-dan-upload-slots)
- [Product](#9-product)
- [Voucher](#10-voucher)
- [Format query array](#11-format-query-array)
- [Alur pengujian manual](#12-alur-pengujian-manual-di-postman)
- [Batasan implementasi](#13-batasan-implementasi-yang-memengaruhi-integrasi)

## 1. Konfigurasi dan aturan umum

| Pengaturan                         | Nilai                                                              |
| ---------------------------------- | ------------------------------------------------------------------ |
| Base URL lokal                     | `http://localhost:3001/api/v1`                                     |
| Port                               | Environment variable `PORT`; default `3001`                        |
| Prefix                             | `/api/v1`                                                          |
| Body biasa                         | `application/json`                                                 |
| Upload tenant/frame                | `multipart/form-data`                                              |
| Autentikasi                        | `Authorization: Bearer <encryptedToken>` untuk endpoint non-public |
| Identitas perangkat saat instalasi | Header `X-DEVICE-ID`; tidak menggantikan Bearer token              |

Path pada dokumentasi ditulis relatif terhadap base URL. Contoh: `GET /frame` berarti `GET http://localhost:3001/api/v1/frame`.

Validasi global memakai `whitelist: true`, `forbidNonWhitelisted: true`, dan `transform: true`:

- Field yang tidak terdaftar menghasilkan `400 Bad Request` pada body/query yang memakai DTO.
- Semua field dalam tabel request wajib, kecuali ditandai opsional.
- Nama, kode voucher, dan alamat di-trim sesuai DTO. Password tidak di-trim.
- Boolean body JSON harus berupa `true` atau `false`, bukan string `"true"`/`"false"`.
- ID pada DTO input seperti `tenantId`, `locationId`, `locationIds`, dan `boothIds` menggunakan UUID v4. ID pada path status divalidasi dengan `ParseUUIDPipe`.
- Pada endpoint terautentikasi, tenant dan user pembuat/pengubah diambil dari token. Jangan tambahkan `tenantId`, `createdBy`, atau `updatedBy` ke body endpoint tersebut.
- Gunakan tanggal ISO 8601 dengan zona waktu eksplisit, misalnya `2026-11-01T00:00:00+07:00` atau `2026-10-31T17:00:00Z`. Tanggal pada respons diserialisasikan sebagai string ISO.

### Format respons sukses

Respons daftar dengan pagination, contoh ketika tidak ada product yang cocok:

```json
{
  "message": "Products retrieved successfully",
  "statusCode": 200,
  "data": {
    "items": [],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

Respons operasi yang tidak mengembalikan data:

```json
{
  "message": "Product created successfully",
  "statusCode": 201
}
```

Tidak ada field `success`. Field `data` dihilangkan jika controller mengembalikan `undefined`; nilainya bukan otomatis `null` atau objek yang baru dibuat. Bentuk `data` mengikuti endpoint: daftar utama berupa `{ items, meta }`, dropdown location berupa array, dan instalasi berupa `{ products, frames, vouchers }`.

Khusus pembuatan tenant dan lokasi, `data` saat ini berisi hasil query insert PostgreSQL (`QueryResult`), **belum berupa record tenant/lokasi**. Jangan mengasumsikan ada `data.id` pada kedua respons tersebut.

### Pagination daftar

Berlaku untuk `GET /location`, `/booth`, `/frame`, `/frame/custom-frame`, `/product`, dan `/voucher`.

| Query   | Default | Validasi                           |
| ------- | ------- | ---------------------------------- |
| `page`  | `1`     | Integer 1–2147483647               |
| `limit` | `20`    | Integer 1–20; khusus voucher 1–100 |

Semua daftar tersebut diurutkan berdasarkan `createdAt DESC, id DESC`. `total` adalah jumlah record yang cocok dengan filter sebelum pagination; `totalPages = ceil(total / limit)`. `hasNextPage = page < totalPages` dan `hasPreviousPage = page > 1`. Halaman di luar rentang mengembalikan `items: []`, tanpa otomatis mengubah `page`. Daftar dan count dibaca melalui query terpisah sehingga perubahan data bersamaan dapat membuat hasil sesaat berbeda.

### Format respons error

Error validasi umumnya memiliki `message` berupa array:

```json
{
  "statusCode": 400,
  "message": ["isActive must be a boolean (true or false)"],
  "error": "Bad Request"
}
```

Error dari service/guard umumnya memiliki `message` berupa string:

```json
{
  "statusCode": 401,
  "message": "Invalid username or password",
  "error": "Unauthorized"
}
```

Error internal yang tidak ditangani:

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

Di luar `NODE_ENV=production`, respons `500` dapat memuat `detail` dan `code`. Error tidak dibungkus dengan format respons sukses. Frontend perlu menangani `message` sebagai string maupun array.

## 2. Ringkasan endpoint aktif

`Token` berarti Bearer token wajib. Status di bawah adalah status sukses sesuai implementasi saat ini.

| Method | Path                   | Akses                 | Status | Message sukses                           | Isi `data`                                                |
| ------ | ---------------------- | --------------------- | ------ | ---------------------------------------- | --------------------------------------------------------- |
| GET    | `/test`                | Public                | 200    | Test endpoint accessed successfully      | String                                                    |
| GET    | `/private`             | Token                 | 200    | Protected endpoint accessed successfully | String                                                    |
| POST   | `/install`             | Token + `X-DEVICE-ID` | 201    | Desktop Installation successfully        | `{ products, frames, vouchers }`; lihat batasan instalasi |
| POST   | `/tenant`              | Public                | 201    | Tenant created successfully              | QueryResult insert                                        |
| POST   | `/auth/register`       | Public                | 201    | User registered successfully             | `{ user }`                                                |
| POST   | `/auth/login`          | Public                | 201    | Login successful                         | `{ user, encryptedToken }`                                |
| POST   | `/location`            | Token                 | 201    | Location created successfully            | QueryResult insert                                        |
| GET    | `/location`            | Token                 | 200    | Locations retrieved successfully         | `{ items, meta }` lokasi                                  |
| GET    | `/location/dropdown`   | Token                 | 200    | Location options retrieved successfully  | Array `{ id, storeName }`                                 |
| PATCH  | `/location/:id/status` | Token                 | 200    | Location status updated successfully     | Tidak ada                                                 |
| POST   | `/booth`               | Token                 | 201    | Booth created successfully               | Tidak ada                                                 |
| GET    | `/booth`               | Token                 | 200    | Booths retrieved successfully            | `{ items, meta }` booth                                   |
| PATCH  | `/booth/:id/status`    | Token                 | 200    | Booth status updated successfully        | Tidak ada                                                 |
| POST   | `/frame`               | Token                 | 201    | Frame created successfully               | Tidak ada                                                 |
| POST   | `/frame/custom-frame`  | Token                 | 201*   | Custom frame created successfully        | Tidak ada; *input normal saat ini terblokir validasi DTO  |
| GET    | `/frame`               | Token                 | 200    | Frames retrieved successfully            | `{ items, meta }` frame non-CUSTOM                        |
| GET    | `/frame/custom-frame`  | Token                 | 200    | Custom frames retrieved successfully     | `{ items, meta }` frame CUSTOM                            |
| PATCH  | `/frame/:id/status`    | Token                 | 200    | Frame status updated successfully        | Tidak ada                                                 |
| POST   | `/product`             | Token                 | 201    | Product created successfully             | Tidak ada                                                 |
| GET    | `/product`             | Token                 | 200    | Products retrieved successfully          | `{ items, meta }`; item memiliki `validAtBooths`          |
| PATCH  | `/product/:id/status`  | Token                 | 200    | Product status updated successfully      | Tidak ada                                                 |
| POST   | `/voucher`             | Token                 | 201    | Voucher created successfully             | Tidak ada                                                 |
| GET    | `/voucher`             | Token                 | 200    | Vouchers retrieved successfully          | `{ items, meta }` voucher                                 |
| PATCH  | `/voucher/:id/status`  | Token                 | 200    | Voucher status updated successfully      | Tidak ada                                                 |

`PUT /voucher/:id` **belum tersedia**. Adanya `UpdateVoucherDto` tidak berarti endpoint tersebut aktif. Controller `session` dan `transaction` belum memiliki method HTTP, sehingga belum ada endpoint session, pembayaran, atau webhook Midtrans. Belum ada endpoint refresh token, logout, redeem voucher, hapus resource, atau GET catalogue/sync. `/location/options` sudah diganti menjadi `/location/dropdown`; tidak ada alias untuk path lama. Tidak ada endpoint `/booth/dropdown` atau `/booth/options`; gunakan `GET /booth` dengan filter location.

## 3. Autentikasi dan Postman

### Register — `POST /auth/register`

Public, body JSON:

| Field      | Tipe   | Validasi                                  |
| ---------- | ------ | ----------------------------------------- |
| `tenantId` | string | UUID v4 tenant yang sudah ada di database |
| `name`     | string | 5–20 karakter setelah trim; tidak kosong  |
| `password` | string | Minimal 8 karakter; tidak di-trim         |

```json
{
  "tenantId": "b86c550a-1acc-430f-8e71-969b3e3abe0f",
  "name": "admin_demo",
  "password": "ExamplePassword123!"
}
```

Contoh respons `201`:

```json
{
  "message": "User registered successfully",
  "statusCode": 201,
  "data": {
    "user": {
      "id": "9d9b3c91-1dc1-4bed-8678-71c2e2fc7484",
      "tenantId": "b86c550a-1acc-430f-8e71-969b3e3abe0f",
      "name": "admin_demo",
      "code": "USR-1"
    }
  }
}
```

Register **tidak mengembalikan token**. Login setelah registrasi. UUID/kode pada contoh hanya ilustrasi; ganti `tenantId` dengan ID tenant yang benar. Pelanggaran unique name atau foreign key tenant belum dipetakan ke error khusus di service register; jangan mengandalkan respons `409` untuk kasus tersebut.

### Login — `POST /auth/login`

Public, body JSON:

| Field      | Tipe   | Validasi                  |
| ---------- | ------ | ------------------------- |
| `name`     | string | Tidak kosong setelah trim |
| `password` | string | Minimal 8 karakter        |

```json
{
  "name": "admin_demo",
  "password": "ExamplePassword123!"
}
```

Contoh respons **`201`** (controller belum menetapkan `@HttpCode(200)`):

```json
{
  "message": "Login successful",
  "statusCode": 201,
  "data": {
    "user": {
      "id": "9d9b3c91-1dc1-4bed-8678-71c2e2fc7484",
      "name": "admin_demo",
      "code": "USR-1",
      "tenantId": "b86c550a-1acc-430f-8e71-969b3e3abe0f"
    },
    "encryptedToken": "<token-hasil-login>"
  }
}
```

Kredensial salah menghasilkan `401 Invalid username or password`.

Backend mengenkripsi JWT sebelum mengirimkannya sebagai `encryptedToken`. Kirim nilai tersebut utuh sebagai Bearer token; **jangan melakukan JWT decode langsung terhadap `encryptedToken`**. Gunakan `data.user` untuk informasi user. Masa berlaku JWT saat ini 2 jam. Jika token kedaluwarsa, login kembali.

### Pengaturan Postman

1. Buat environment variable `baseUrl`: `http://localhost:3001/api/v1`.
2. Login ke `{{baseUrl}}/auth/login`, pilih **Body → raw → JSON**.
3. Simpan `data.encryptedToken` sebagai environment variable `encryptedToken`.
4. Pada request terautentikasi, pilih **Authorization → Bearer Token**, isi `{{encryptedToken}}`.
5. Jika Authorization diatur di collection, gunakan **No Auth** pada request public.

Opsional, script setelah respons login untuk menyimpan token:

```javascript
if (pm.response.code === 201) {
  const body = pm.response.json();
  if (body.data?.encryptedToken) {
    pm.environment.set('encryptedToken', body.data.encryptedToken);
  }
}
```

Header yang dikirim:

```http
Authorization: Bearer <encryptedToken>
```

Token tidak ada: `401 Authentication token is required`. Token tidak valid/kedaluwarsa: `401 Invalid or expired authentication token`.

## 4. General dan instalasi desktop

### `GET /test`

Public. Memeriksa apakah endpoint aplikasi dapat merespons; bukan pemeriksaan koneksi database atau R2.

```json
{
  "message": "Test endpoint accessed successfully",
  "statusCode": 200,
  "data": "hello world"
}
```

### `GET /private`

Memerlukan token.

```json
{
  "message": "Protected endpoint accessed successfully",
  "statusCode": 200,
  "data": "hello private"
}
```

### Instalasi desktop — `POST /install`

Endpoint ini mengembalikan katalog aktif yang terhubung ke booth pilihan dan menulis serial number perangkat. Memerlukan Bearer token, body JSON, dan header perangkat:

```http
Authorization: Bearer <encryptedToken>
X-DEVICE-ID: DEVICE-JKT-001
Content-Type: application/json
```

| Input                | Tipe     | Perilaku saat ini                                                                                                                    |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Header `X-DEVICE-ID` | string   | Diteruskan sebagai `booths.serialNumber`; belum divalidasi wajib/format/panjangnya oleh backend. Kolom database maksimal 50 karakter |
| Body `locationIds`   | string[] | Wajib, minimal 1 UUID v4, tidak boleh duplikat; **belum dipakai dalam service/repository**                                           |
| Body `boothIds`      | string[] | Wajib, minimal 1 UUID v4, tidak boleh duplikat; digunakan untuk memilih katalog melalui tabel penghubung                             |

Contoh body:

```json
{
  "locationIds": ["ce73d7c7-0b08-4a0b-a47e-42d17de00ac3"],
  "boothIds": ["f9aef8b8-0e38-4c7a-9d83-d55ff2940ee7"]
}
```

Contoh bentuk respons `201` bila tidak ada katalog yang cocok:

```json
{
  "message": "Desktop Installation successfully",
  "statusCode": 201,
  "data": {
    "products": [],
    "frames": [],
    "vouchers": []
  }
}
```

Ketiga array berisi record lengkap sesuai schema resource, tanpa pagination dan tanpa metadata sync. Produk pada respons instalasi **tidak memiliki `validAtBooths`** seperti `GET /product`. `price` mengikuti representasi numeric berupa string desimal; `discountPercent` voucher berupa number.

Filter katalog yang diterapkan: resource milik tenant dari token, `isActive = true`, dan terhubung ke salah satu `boothIds`. Frame mencakup normal dan custom tanpa pengecekan periode berlaku. Voucher juga belum diperiksa tanggal berlaku atau sisa kuotanya. Karena itu, hasil instalasi bukan keputusan bahwa voucher dapat diredeem.

> **Batasan penting:** query UPDATE saat ini hanya membatasi `tenantId` dan `booths.isActive = true`. Akibatnya, serial number ditulis ke **semua booth aktif milik tenant**, bukan hanya `boothIds` yang dipilih. Hindari menjalankan endpoint ini pada data operasional sampai kondisi UPDATE diperbaiki.

Selain itu, backend belum memverifikasi bahwa setiap booth pilihan ada, aktif, milik tenant, atau berada di `locationIds` yang dikirim. Array katalog kosong tidak menghasilkan `404` dan tidak mencegah UPDATE serial number. Pengambilan katalog dan UPDATE belum dibungkus satu transaction. Header perangkat tidak menghasilkan token perangkat dan tidak menggantikan autentikasi Bearer. Message sukses di atas mengikuti string controller persis, termasuk kapitalisasinya.

## 5. Tenant

### Buat tenant — `POST /tenant`

Public, **Body → form-data** di Postman:

| Key         | Jenis Postman | Aturan                                                              |
| ----------- | ------------- | ------------------------------------------------------------------- |
| `name`      | Text          | Tidak kosong; maksimal 255 karakter                                 |
| `brandName` | Text          | Tidak kosong; maksimal 255 karakter                                 |
| `about`     | Text          | String wajib; boleh kosong                                          |
| `logo`      | File          | PNG/JPG/JPEG wajib; ukuran harus kurang dari 5 MiB (5.242.880 byte) |

Jangan kirim `logoUrl`; backend mengisinya setelah upload ke R2. Biarkan Postman membuat header `Content-Type` beserta multipart boundary.

Respons: `201`, message `Tenant created successfully`, `data` berupa hasil query insert. Saat ini ID tenant belum dikembalikan sebagai record dan tidak ada endpoint GET tenant. Untuk registrasi user, gunakan ID tenant dari database/proses provisioning.

## 6. Location

### Buat lokasi — `POST /location`

Memerlukan token, body JSON:

| Field       | Tipe   | Validasi                            |
| ----------- | ------ | ----------------------------------- |
| `storeName` | string | Tidak kosong; maksimal 50 karakter  |
| `street`    | string | Tidak kosong; maksimal 200 karakter |

```json
{
  "storeName": "Snapoose Jakarta",
  "street": "Jl. Contoh No. 10, Jakarta"
}
```

Lokasi baru memiliki `isActive: false`. Respons: `201`, message `Location created successfully`, `data` berupa hasil query insert, bukan record lokasi. `nameBooth` tidak diterima; buat booth melalui endpoint booth.

### Daftar lokasi — `GET /location`

Mengembalikan lokasi milik tenant pada token, termasuk aktif dan nonaktif, dalam `data.items` beserta `data.meta`. Query yang diterima hanya `page` dan `limit`, mengikuti [aturan pagination](#pagination-daftar). Belum ada filter status atau pencarian.

```http
GET /api/v1/location?page=1&limit=20
```

Setiap item berisi `id`, `tenantId`, `code`, `storeName`, `street`, `isActive`, `createdBy`, `updatedBy`, `createdAt`, dan `updatedAt`. `street`/audit user pada data tersimpan dapat null sesuai schema.

### Pilihan lokasi aktif — `GET /location/dropdown`

Lokasi aktif milik tenant, diurutkan berdasarkan `storeName` ascending. Respons berupa array langsung di `data`, tanpa pagination atau batas 20 item. Path lama `/location/options` tidak tersedia.

```json
{
  "message": "Location options retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      "id": "ce73d7c7-0b08-4a0b-a47e-42d17de00ac3",
      "storeName": "Snapoose Jakarta"
    }
  ]
}
```

### Ubah status — `PATCH /location/:id/status`

Body JSON:

```json
{
  "isActive": true
}
```

Gunakan `false` untuk menonaktifkan. Respons: `200`, message `Location status updated successfully`, tanpa `data`.

- Lokasi tidak ditemukan pada tenant: `404 Location not found`.
- Aktivasi ditolak jika **kedua** field tersimpan, `storeName` dan `street`, kosong: `400 Complete the location details before activating it`.

## 7. Booth

### Buat booth — `POST /booth`

Memerlukan token, body JSON:

| Field          | Tipe             | Validasi                                                          |
| -------------- | ---------------- | ----------------------------------------------------------------- |
| `locationId`   | string           | UUID v4 lokasi aktif milik tenant pada token                      |
| `name`         | string           | Tidak kosong; maksimal 100 karakter                               |
| `serialNumber` | string atau null | Opsional; jika string harus tidak kosong dan maksimal 50 karakter |

```json
{
  "locationId": "ce73d7c7-0b08-4a0b-a47e-42d17de00ac3",
  "name": "Booth Jakarta 01",
  "serialNumber": "SN-JKT-001"
}
```

Lokasi harus diaktifkan dahulu. Lokasi tidak ditemukan, nonaktif, atau milik tenant lain menghasilkan `404 Location not found`.

Booth baru memiliki `isActive: false`. Respons: `201`, message `Booth created successfully`, tanpa `data`.

### Daftar booth — `GET /booth`

| Query opsional | Nilai                               |
| -------------- | ----------------------------------- |
| `locationIds`  | Satu atau beberapa UUID v4 lokasi   |
| `statuses`     | `active`, `inactive`, atau keduanya |
| `page`         | Integer ≥ 1, default `1`            |
| `limit`        | Integer 1–20, default `20`          |

```http
GET /api/v1/booth?locationIds=ce73d7c7-0b08-4a0b-a47e-42d17de00ac3&statuses=active,inactive&page=1&limit=20
```

Hasil hanya milik tenant pada token, dalam `data.items` beserta `data.meta`, mengikuti [aturan pagination](#pagination-daftar). Setiap item berisi `id`, `tenantId`, `locationId`, `code`, `name`, `serialNumber`, `isActive`, `last_sync`, `createdAt`, `updatedAt`, `createdBy`, dan `updatedBy`. `serialNumber`, `last_sync`, dan audit user dapat null. Bila `statuses` tidak dikirim, booth aktif maupun nonaktif dapat muncul.

Endpoint ini dapat mengisi dropdown booth setelah memilih satu atau beberapa location. FE perlu memuat halaman berikutnya bila `meta.hasNextPage` bernilai `true`.

### Ubah status — `PATCH /booth/:id/status`

Body JSON `{ "isActive": true }` atau `{ "isActive": false }`.

Respons: `200`, message `Booth status updated successfully`, tanpa `data`. Booth tidak ditemukan pada tenant menghasilkan `404 Booth not found`.

## 8. Frame dan upload slots

Kedua endpoint POST frame memerlukan token dan **multipart/form-data** dengan file bernama `frame`. File PNG/JPG/JPEG wajib; ukuran harus kurang dari 5 MiB (5.242.880 byte). File tepat pada batas tersebut juga ditolak oleh validator saat ini. Backend membaca dimensi gambar menggunakan Sharp, mengunggah file ke R2, dan menyimpan metadata serta slots di PostgreSQL.

### Upload frame biasa — `POST /frame`

Isi **Body → form-data** di Postman:

| Key         | Jenis Postman | Nilai / aturan                                                         |
| ----------- | ------------- | ---------------------------------------------------------------------- |
| `name`      | Text          | Contoh `Classic Four Photos`; string tidak kosong                      |
| `frameType` | Text          | Contoh `STANDARD`; string tidak kosong                                 |
| `boothIds`  | Text          | JSON array UUID v4 booth milik tenant; minimal 1, tidak boleh duplikat |
| `slots`     | Text          | JSON array seperti contoh berikut; minimal 1 slot                      |
| `frame`     | File          | Pilih gambar overlay                                                   |

Isi value `slots` dengan teks ini, **tanpa membungkus seluruh array dengan tanda kutip tambahan**:

```json
[
  { "x": 60, "y": 80, "width": 530, "height": 707 },
  { "x": 610, "y": 80, "width": 530, "height": 707 },
  { "x": 60, "y": 807, "width": 530, "height": 707 },
  { "x": 610, "y": 807, "width": 530, "height": 707 }
]
```

Isi value `boothIds` sebagai teks JSON array, bukan daftar dipisahkan koma tanpa kurung:

```json
["f9aef8b8-0e38-4c7a-9d83-d55ff2940ee7"]
```

Ganti UUID contoh dengan booth yang benar-benar ada pada tenant. DTO mem-parse teks JSON dan memvalidasi setiap UUID. JSON tidak valid menghasilkan `400 Booth IDs must be a valid JSON array`. Repository memeriksa keberadaan dan kepemilikan booth, tetapi tidak mewajibkan booth aktif. Relasi disimpan ke `frame_booths`; frame baru memiliki `isActive: true`.

Koordinat contoh ditujukan untuk gambar 1200 × 1800 piksel. `x`, `y`, `width`, dan `height` pada setiap object wajib berupa **integer JSON**, bukan string angka. DTO saat ini belum mengecek batas minimum, slot keluar dari canvas, atau slot tumpang tindih. Pastikan frontend mengirim koordinat nonnegatif dan ukuran positif yang sesuai canvas.

`frameType` belum memakai enum; `STANDARD` hanya contoh. Nilai persis `CUSTOM` digunakan repository untuk membedakan custom frame. Gunakan endpoint custom frame untuk jenis tersebut. Schema membatasi `name` sampai 255 karakter dan `frameType` sampai 100 karakter, tetapi DTO belum memvalidasi panjang keduanya.

Contoh cURL, ganti path file dan token:

```bash
curl --request POST 'http://localhost:3001/api/v1/frame' \
  --header 'Authorization: Bearer <encryptedToken>' \
  --form 'name=Classic Four Photos' \
  --form 'frameType=STANDARD' \
  --form 'boothIds=["f9aef8b8-0e38-4c7a-9d83-d55ff2940ee7"]' \
  --form 'slots=[{"x":60,"y":80,"width":530,"height":707},{"x":610,"y":80,"width":530,"height":707},{"x":60,"y":807,"width":530,"height":707},{"x":610,"y":807,"width":530,"height":707}]' \
  --form 'frame=@/absolute/path/frame.png'
```

Respons:

```json
{
  "message": "Frame created successfully",
  "statusCode": 201
}
```

### Upload custom frame — `POST /frame/custom-frame`

> **Terblokir oleh validasi DTO saat ini:** `CreateCustomFrameDto.boothIds` masih memakai `@ValidateNested({ each: true })` walaupun elemennya string UUID. Pemeriksaan lokal melalui `ValidationPipe` menghasilkan `400` dengan message `boothIds.each value in nested property boothIds must be either object or array` untuk input UUID yang valid. Tabel berikut menjelaskan field yang dideklarasikan; request ini belum dapat berhasil dengan array UUID normal sebelum decorator tersebut diperbaiki.

Isi form-data berikut. **Jangan sertakan `frameType`**; backend mengisinya dengan `CUSTOM`:

| Key          | Jenis Postman | Nilai / aturan                                                                            |
| ------------ | ------------- | ----------------------------------------------------------------------------------------- |
| `name`       | Text          | String tidak kosong                                                                       |
| `boothIds`   | Text          | JSON array UUID v4 booth; minimal 1, tidak boleh duplikat; lihat masalah validasi di atas |
| `slots`      | Text          | JSON array dengan aturan yang sama seperti frame biasa                                    |
| `validFrom`  | Text          | Contoh `2026-11-01T00:00:00+07:00`                                                        |
| `validUntil` | Text          | Contoh `2026-11-30T23:59:59+07:00`; sama atau setelah `validFrom`                         |
| `frame`      | File          | Pilih gambar overlay                                                                      |

Kedua tanggal wajib dan harus valid ISO 8601. Urutan tanggal salah menghasilkan `400` dengan message validasi `Valid until must be on or after valid from`.

Respons sukses yang dideklarasikan controller: `201`, message `Custom frame created successfully`, tanpa `data`. Saat ini validasi `boothIds` di atas menghalangi request normal mencapai service.

### Payload frontend dan request upload

Object editor frontend seperti `{ id, name, canvas, slots, overlayUrl }` bukan body upload yang diterima langsung:

- `id` dibuat oleh database.
- `canvasWidth`/`canvasHeight` diambil dari gambar melalui Sharp. Jangan kirim `canvas`, `canvasWidth`, atau `canvasHeight`.
- `overlayUrl` dibuat setelah upload ke R2. Kirim file melalui field `frame`.
- `slots` dikirim sebagai teks JSON pada form-data. Transform DTO melakukan `JSON.parse` dan membentuk instance `SlotDto` untuk validasi nested.
- `boothIds` wajib ditambahkan sebagai teks JSON array UUID untuk menyimpan booth tempat frame berlaku.

Di Postman, cukup tempel array JSON pada Text `slots`; tidak perlu menjalankan `JSON.stringify()` manual. Jika memakai JavaScript frontend:

```javascript
const form = new FormData();
form.append('name', frame.name);
form.append('frameType', 'STANDARD');
form.append('boothIds', JSON.stringify(selectedBoothIds));
form.append('slots', JSON.stringify(frame.slots));
form.append('frame', selectedFile);
```

Biarkan Postman/browser membuat header `Content-Type` beserta boundary. Jangan mengirim raw JSON untuk endpoint upload ini karena file tetap wajib. Di service/database, slots sudah berupa array object; tidak perlu di-stringify lagi untuk kolom `jsonb`.

### Daftar frame — `GET /frame` dan `GET /frame/custom-frame`

| Path                  | Filter yang diterapkan                                                             |
| --------------------- | ---------------------------------------------------------------------------------- |
| `/frame`              | Tenant pada token dan `frameType != 'CUSTOM'`                                      |
| `/frame/custom-frame` | Tenant pada token, `frameType = 'CUSTOM'`, `validFrom` dan `validUntil` tidak null |

Keduanya menerima `page` dan `limit` sesuai [aturan pagination](#pagination-daftar), lalu mengembalikan `{ items, meta }` dalam `data`. Tidak ada filter `boothIds`, status, atau rentang tanggal pada DTO GET frame. Keduanya **belum memfilter `isActive` atau waktu saat ini**. Custom frame yang kedaluwarsa atau belum memasuki periode berlaku masih dapat muncul.

```http
GET /api/v1/frame?page=1&limit=20
GET /api/v1/frame/custom-frame?page=1&limit=20
```

Contoh respons frame biasa:

```json
{
  "message": "Frames retrieved successfully",
  "statusCode": 200,
  "data": {
    "items": [
      {
        "id": "3d944665-b5b8-4b5c-b89d-f747e8ec1858",
        "tenantId": "b86c550a-1acc-430f-8e71-969b3e3abe0f",
        "code": "FRM-1",
        "name": "Classic Four Photos",
        "frameType": "STANDARD",
        "canvasWidth": 1200,
        "canvasHeight": 1800,
        "isActive": true,
        "overlayUrl": "https://cdn.example.com/frames/example-frame.png",
        "slots": [
          { "x": 60, "y": 80, "width": 530, "height": 707 },
          { "x": 610, "y": 80, "width": 530, "height": 707 },
          { "x": 60, "y": 807, "width": 530, "height": 707 },
          { "x": 610, "y": 807, "width": 530, "height": 707 }
        ],
        "validFrom": null,
        "validUntil": null,
        "createdAt": "2026-10-17T03:00:00.000Z",
        "updatedAt": "2026-10-17T03:00:00.000Z",
        "createdBy": "9d9b3c91-1dc1-4bed-8678-71c2e2fc7484",
        "updatedBy": "9d9b3c91-1dc1-4bed-8678-71c2e2fc7484"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

Untuk custom frame, message menjadi `Custom frames retrieved successfully`, `frameType` bernilai `CUSTOM`, dan kedua tanggal terisi. Audit user dapat null sesuai schema. Dimensi respons berupa field datar `canvasWidth`/`canvasHeight`; frontend dapat memetakannya ke `{ canvas: { width, height } }` jika diperlukan editor. Daftar frame belum menyertakan `boothIds` atau `validAtBooths` walaupun relasinya disimpan.

Error pembacaan gambar: `400 Invalid image file` atau `400 Image width and height could not be determined`. File hilang, format yang ditolak, atau ukuran melewati batas juga menghasilkan error validasi upload `400`.

Booth tidak ditemukan atau milik tenant lain menghasilkan `404 Booth not found`. Pelanggaran foreign key yang ditangkap repository saat insert dipetakan menjadi `404 Not Found`. Error upload R2 yang tidak ditangani masuk ke respons internal `500`; error tersebut berbeda dari `401` autentikasi. Upload R2 dilakukan sebelum transaction database dan belum dibersihkan otomatis jika insert database gagal.

### Ubah status frame — `PATCH /frame/:id/status`

Memerlukan token. Body JSON `{ "isActive": true }` atau `{ "isActive": false }`. Berlaku untuk frame normal maupun custom pada tenant yang login.

Respons: `200`, message `Frame status updated successfully`, tanpa `data`. **Message error saat frame tidak ditemukan masih `404 Voucher not found`** karena string di service belum disesuaikan. Endpoint ini hanya mengubah status dan audit; tidak memvalidasi periode custom frame atau kondisi booth.

## 9. Product

### Buat produk — `POST /product`

Memerlukan token, body JSON:

| Field      | Tipe     | Validasi                                                                      |
| ---------- | -------- | ----------------------------------------------------------------------------- |
| `name`     | string   | Tidak kosong; maksimal 100 karakter                                           |
| `price`    | integer  | 0–2147483647; DTO juga mengubah string angka seperti `"25000"` menjadi number |
| `boothIds` | string[] | Minimal 1 UUID v4, tidak boleh duplikat; booth harus ada dan milik tenant     |

```json
{
  "name": "Photo Session",
  "price": 25000,
  "boothIds": ["f9aef8b8-0e38-4c7a-9d83-d55ff2940ee7"]
}
```

Produk baru memiliki `isActive: true` dan `includedPrintQuantity: 2`. `locationId`, `boothId` (singular), `includedPrintQuantity`, dan `isActive` tidak diterima pada body create. Relasi many-to-many disimpan melalui `product_booths` menggunakan `boothIds`. Booth nonaktif masih boleh dipilih; repository memeriksa keberadaan dan tenant, bukan status booth.

Schema harga sekarang `numeric(12, 2)`, tetapi DTO create dan filter harga masih hanya menerima integer. Nilai seperti `25000.50` belum diterima. Deklarasi `.$type<number>()` hanya mengubah tipe TypeScript, bukan konversi runtime: dengan konfigurasi Drizzle saat ini, harga yang dibaca dari kolom numeric berbentuk string, misalnya `"25000.00"`.

Respons: `201`, message `Product created successfully`, tanpa `data`.

Booth tidak ditemukan atau milik tenant lain: `404 Booth not found`. Pelanggaran foreign key yang ditangkap saat insert: `404 Not Found`. Product, relasi booth, dan pembaruan catalogue disimpan dalam satu transaction database.

### Daftar produk — `GET /product`

| Query opsional | Nilai                                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| `minPrice`     | Integer ≥ 0                                                                           |
| `maxPrice`     | Integer ≥ 0; tidak lebih kecil dari `minPrice`                                        |
| `boothIds`     | Satu atau beberapa UUID v4 booth; cocok dengan salah satu booth pada `product_booths` |
| `status`       | `active`, `inactive`, atau keduanya                                                   |
| `page`         | Integer ≥ 1, default `1`                                                              |
| `limit`        | Integer 1–20, default `20`                                                            |

```http
GET /api/v1/product?minPrice=10000&maxPrice=50000&status=active&boothIds=f9aef8b8-0e38-4c7a-9d83-d55ff2940ee7&page=1&limit=20
```

Hasil dibatasi pada tenant di token, mengikuti [aturan pagination](#pagination-daftar). Filter `boothIds` menggunakan subquery sehingga satu product tidak berulang walaupun cocok dengan beberapa booth. `locationIds` **sudah tidak ada di DTO product** dan akan ditolak `400`; jangan mengirimkannya ke endpoint ini.

Setiap item berisi `id`, `tenantId`, `code`, `name`, `price`, `includedPrintQuantity`, `isActive`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, dan `validAtBooths`. Field lama `locationId` dan `boothId` tidak ada pada schema product. Audit user dapat null.

`validAtBooths` adalah array `{ id, name }` untuk **seluruh booth yang terhubung** ke product, termasuk booth nonaktif dan booth di luar filter `boothIds`. Urutan array tersebut belum ditetapkan. Array kosong berarti tidak ada relasi booth yang ditemukan; bukan otomatis berlaku di semua booth.

Contoh respons:

```json
{
  "message": "Products retrieved successfully",
  "statusCode": 200,
  "data": {
    "items": [
      {
        "id": "7a889cf4-68b5-4df9-a7e7-10aeb9638496",
        "tenantId": "b86c550a-1acc-430f-8e71-969b3e3abe0f",
        "code": "PRD-1",
        "name": "Photo Session",
        "price": "25000.00",
        "includedPrintQuantity": 2,
        "isActive": true,
        "createdAt": "2026-10-24T03:00:00.000Z",
        "updatedAt": "2026-10-24T03:00:00.000Z",
        "createdBy": "9d9b3c91-1dc1-4bed-8678-71c2e2fc7484",
        "updatedBy": "9d9b3c91-1dc1-4bed-8678-71c2e2fc7484",
        "validAtBooths": [
          {
            "id": "f9aef8b8-0e38-4c7a-9d83-d55ff2940ee7",
            "name": "Booth Jakarta 01"
          }
        ]
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

Rentang harga terbalik menghasilkan `400 Minimum price must not exceed maximum price`.

### Alur filter Location → Booth → Terapkan

1. Isi dropdown location melalui `GET /location/dropdown`.
2. Setelah location dipilih, panggil `GET /booth?locationIds=...&page=1&limit=20`; muat halaman berikutnya sesuai `meta`.
3. Simpan pilihan booth/harga/status sementara di FE. Ketika **Terapkan** ditekan, panggil `GET /product?boothIds=...&minPrice=...&maxPrice=...&status=...&page=1` sesuai field yang diisi.
4. Hapus pilihan booth yang tidak lagi sesuai ketika location berubah. Jangan kirim parameter kosong.

Saat ini memilih location saja belum dapat langsung memfilter product. Jika FE mengartikan location terpilih tanpa booth spesifik sebagai semua booth di location tersebut, FE perlu mengumpulkan semua ID booth yang cocok dari seluruh halaman sebelum mengirim `boothIds`. Jika location itu tidak memiliki booth, tampilkan hasil kosong; menghilangkan `boothIds` justru menghapus pembatasan booth. Untuk dukungan langsung atau daftar booth sangat besar, backend perlu menambah filter location; fitur itu belum tersedia.

Filter harga cetak tambahan, search product, dan sorting pilihan user juga belum ada pada DTO/query product.

### Ubah status — `PATCH /product/:id/status`

Body JSON `{ "isActive": true }` atau `{ "isActive": false }`.

Respons: `200`, message `Product status updated successfully`, tanpa `data`. Produk tidak ditemukan pada tenant menghasilkan `404 Product not found`.

## 10. Voucher

### Buat voucher — `POST /voucher`

Memerlukan token, body JSON:

| Field             | Tipe     | Validasi                                                                  |
| ----------------- | -------- | ------------------------------------------------------------------------- |
| `voucherCode`     | string   | Tidak kosong; maksimal 50 karakter                                        |
| `discountPercent` | number   | 1–100; maksimal 2 angka desimal                                           |
| `quota`           | integer  | 0–2147483647; wajib, tidak boleh null                                     |
| `boothIds`        | string[] | Minimal 1 UUID v4, tidak boleh duplikat; booth harus ada dan milik tenant |
| `validFrom`       | string   | Tanggal ISO 8601 valid                                                    |
| `validUntil`      | string   | Tanggal ISO 8601 valid; sama atau setelah `validFrom`                     |

```json
{
  "voucherCode": "WELCOME10",
  "discountPercent": 10,
  "quota": 100,
  "boothIds": ["f9aef8b8-0e38-4c7a-9d83-d55ff2940ee7"],
  "validFrom": "2026-11-01T00:00:00+07:00",
  "validUntil": "2026-11-30T23:59:59+07:00"
}
```

Kirim `discountPercent` dan `quota` sebagai number JSON, bukan string. Jangan kirim `usedCount` atau `isActive`; nilai awalnya `0` dan `false`.

Respons: `201`, message `Voucher created successfully`, tanpa `data`.

Kode voucher unik per tenant tanpa membedakan huruf besar/kecil. Duplikat menghasilkan `409 Voucher code already exists`. Walaupun schema mendukung `quota: null` untuk kuota tidak terbatas, DTO create belum menerima null.

Relasi booth disimpan ke `voucher_booths`. Booth nonaktif masih boleh dipilih. Booth tidak ditemukan atau milik tenant lain menghasilkan `404 Booth not found`. Voucher, relasi, dan pembaruan catalogue berada dalam satu transaction. Pemetaan error database masih luas: semua `23505` menjadi pesan duplikat kode voucher dan semua `23503` menjadi pesan booth tidak ditemukan, tanpa memeriksa nama constraint.

### Daftar voucher — `GET /voucher`

Query yang sudah memengaruhi hasil repository:

| Query opsional | Nilai / perilaku                             |
| -------------- | -------------------------------------------- |
| `status`       | `active`, `inactive`, atau keduanya          |
| `quotaStatus`  | `available`, `exhausted`, atau keduanya      |
| `remainingMin` | Integer ≥ 0; batas bawah `quota - usedCount` |
| `remainingMax` | Integer ≥ 0; batas atas `quota - usedCount`  |
| `page`         | Integer 1–2147483647; default `1`            |
| `limit`        | Integer 1–100; default `20`                  |

```http
GET /api/v1/voucher?status=inactive&quotaStatus=available&remainingMin=1&page=1&limit=20
```

- `available`: quota null atau `quota - usedCount > 0`.
- `exhausted`: quota tidak null dan `quota - usedCount <= 0`.
- Status kuota tidak memeriksa `isActive` atau periode tanggal. `available` tidak otomatis berarti voucher boleh digunakan.
- Filter angka `remainingMin`/`remainingMax` tidak mencakup voucher dengan quota null.
- `remainingMin > remainingMax` menghasilkan `400 Minimum remaining quota must not exceed maximum remaining quota`.

Query berikut **diterima/divalidasi DTO tetapi belum diterapkan ke query database**:

| Query       | Validasi DTO                               | Default DTO |
| ----------- | ------------------------------------------ | ----------- |
| `search`    | String, maksimal 100 karakter setelah trim | Tidak ada   |
| `quotaMin`  | Integer ≥ 0                                | Tidak ada   |
| `quotaMax`  | Integer ≥ 0                                | Tidak ada   |
| `sortBy`    | `createdAt`, `name`, `quota`               | `createdAt` |
| `sortOrder` | `asc`, `desc`                              | `desc`      |

Jangan mengandalkan pencarian, rentang kuota total, atau sorting pilihan user dari parameter tersebut. **Pagination `page` dan `limit` sudah diterapkan**, dengan hasil dalam `data.items` dan metadata dalam `data.meta`. Urutan aktual selalu `createdAt DESC, id DESC`.

Setiap item berisi `id`, `tenantId`, `code`, `voucherCode`, `discountPercent`, `quota`, `usedCount`, `isActive`, `validFrom`, `validUntil`, `createdBy`, `updatedBy`, `createdAt`, dan `updatedAt`. `discountPercent` berupa number. `remaining` hanya dipakai menghitung filter dan tidak ditambahkan ke respons. Quota, tanggal, serta audit user pada data tersimpan dapat null sesuai schema. Respons belum menyertakan `boothIds` atau `validAtBooths`. GET voucher belum menerima filter `boothIds` atau `locationIds`.

### Ubah status voucher — `PATCH /voucher/:id/status`

Memerlukan token. Body JSON `{ "isActive": true }` atau `{ "isActive": false }`.

Respons: `200`, message `Voucher status updated successfully`, tanpa `data`. Voucher tidak ditemukan pada tenant menghasilkan `404 Voucher not found`. Aktivasi hanya mengubah flag dan audit; tidak mengecek kuota atau periode berlaku, tidak meredeem voucher, dan tidak mengubah `usedCount`.

## 11. Format query array

Filter array booth, product, dan voucher menerima satu nilai, nilai dipisah koma, atau query key berulang. Contoh setara untuk produk:

```http
GET /api/v1/product?status=active,inactive
GET /api/v1/product?status=active&status=inactive
```

Nama parameter berbeda antar modul: booth memakai **`statuses`**, product dan voucher memakai **`status`**. Booth menerima **`locationIds`**, sedangkan product menerima **`boothIds`**. Gunakan key biasa seperti `locationIds`, bukan `locationIds[]`. Jangan mengirim array sebagai teks JSON pada query; teks JSON digunakan untuk `slots` dan `boothIds` dalam form-data frame.

Parameter array tidak boleh kosong. `status=` atau `status=active,` gagal validasi. Dalam satu filter array, item dicocokkan sebagai pilihan OR; filter berbeda digabungkan sebagai AND.

Perbedaan format input:

| Tempat input                      | Contoh `boothIds`                                      |
| --------------------------------- | ------------------------------------------------------ |
| Body JSON product/voucher/install | `"boothIds": ["f9aef8b8-0e38-4c7a-9d83-d55ff2940ee7"]` |
| Field Text form-data frame        | `["f9aef8b8-0e38-4c7a-9d83-d55ff2940ee7"]`             |
| Query GET product                 | `?boothIds=f9aef8b8-0e38-4c7a-9d83-d55ff2940ee7`       |

POST product, voucher, dan install belum memasang interceptor multipart: gunakan body JSON untuk ketiganya. Jangan mengirim `boothIds` sebagai string JSON pada body JSON tersebut. Gunakan UUID aktual dari database dengan kapitalisasi konsisten; pengecekan duplikat saat ini membandingkan string secara langsung.

## 12. Alur pengujian manual di Postman

1. Siapkan tenant dan UUID-nya. `POST /tenant` tersedia, tetapi belum mengembalikan record/ID tenant; ambil UUID dari database/proses provisioning.
2. Register dengan tenant tersebut, lalu login dan simpan `encryptedToken`.
3. Coba `GET /private` dengan Bearer token untuk memastikan autentikasi berhasil.
4. Buat lokasi, ambil ID melalui `GET /location`, lalu aktifkan dengan `PATCH /location/:id/status`.
5. Gunakan ID dari `GET /location/dropdown` untuk membuat booth. Ambil ID booth melalui `GET /booth?locationIds=...`; hasilnya ada di `data.items`. Aktifkan booth bila diperlukan.
6. Upload frame biasa melalui form-data dengan `boothIds` dan `slots` sebagai teks JSON, lalu cek hasil melalui `GET /frame`. Pengujian POST custom frame saat ini terblokir masalah DTO yang dijelaskan di atas.
7. Buat product/voucher dengan `boothIds` berupa array JSON. Cek `data.items` dan `data.meta` melalui GET masing-masing; hanya daftar product yang menambahkan `validAtBooths`.
8. Gunakan PATCH status pada product, frame, atau voucher untuk mengaktifkan/menonaktifkan. Voucher baru masih nonaktif sampai diaktifkan.
9. Uji alur filter location → booth → product melalui GET. Kirim hanya parameter yang didukung DTO; reset `page` menjadi `1` ketika filter diterapkan.
10. Uji `/install` hanya pada tenant/data uji setelah memahami batasan UPDATE seluruh booth aktif. Jangan menganggap `201` sebagai bukti perangkat hanya terikat ke booth pilihan.

## 13. Batasan implementasi yang memengaruhi integrasi

Dokumentasi ini mencatat perilaku kode yang ada, termasuk bagian yang perlu diperbaiki:

| Bagian               | Kondisi saat ini dan dampaknya                                                                                                                                                                                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instalasi perangkat  | UPDATE serial number belum dibatasi ke `boothIds`; semua booth aktif tenant terpengaruh. `locationIds` hanya divalidasi bentuknya, header perangkat belum divalidasi, dan kepemilikan/status booth pilihan belum diperiksa                                                                                  |
| Custom frame         | `@ValidateNested` pada array string `boothIds` menyebabkan `400` untuk input UUID yang benar. Pemeriksaan lokal mengonfirmasi error tersebut                                                                                                                                                                |
| Harga product        | Schema memakai `numeric(12, 2)` dengan representasi runtime string, sedangkan tipe TypeScript diberi `number` dan DTO masih membatasi input integer                                                                                                                                                         |
| Error status frame   | Frame tidak ditemukan masih dilaporkan sebagai `Voucher not found`; message sukses sudah menyebut frame                                                                                                                                                                                                     |
| Respons relasi booth | Hanya GET product yang menyertakan `validAtBooths`; GET frame/voucher dan katalog install belum menyertakan detail relasi                                                                                                                                                                                   |
| Catalogue/sync       | Create product/frame/voucher memperbarui kolom sync terkait dalam transaction yang sama. PATCH status menjalankan UPDATE resource dan upsert catalogue melalui `Promise.all` tanpa satu transaction, sehingga keduanya dapat berhasil/gagal terpisah. Belum ada endpoint yang mengekspos timestamp tersebut |
| Upload R2            | Upload mendahului validasi booth/insert database dan belum ada penghapusan file otomatis bila langkah database gagal                                                                                                                                                                                        |
| Logging daftar booth | Service masih membaca `booth.length`, padahal repository mengembalikan `{ items, meta }`; log count tidak sesuai dan pemanggilan ini bermasalah pada pemeriksaan tipe TypeScript                                                                                                                            |

Endpoint yang menerima daftar booth untuk create memeriksa keberadaan dan tenant saat membaca, tetapi tidak mengunci baris booth. Pemetaan error foreign key saat insert masih umum seperti dijelaskan per modul. Validasi UUID tidak menggantikan validasi keberadaan atau kepemilikan resource.

Pembaruan dokumentasi ini tidak mengubah source backend atau migration. Verifikasi dilakukan melalui pembacaan source, pemeriksaan route/DTO, dan pemeriksaan lokal transform/validasi serta pemetaan numeric; belum mencakup request ke database, R2, atau endpoint instalasi yang berjalan.
