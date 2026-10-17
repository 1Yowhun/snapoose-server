# Snapoose Pro — API Documentation

Dokumentasi REST API berdasarkan controller, DTO, service, dan repository saat ini. Diperbarui pada **17 Oktober 2026**. Data modul di bawah disimpan di PostgreSQL melalui Drizzle; file gambar diunggah ke Cloudflare R2.

### Daftar isi

- [Konfigurasi dan format respons](#1-konfigurasi-dan-aturan-umum)
- [Ringkasan endpoint](#2-ringkasan-endpoint-aktif)
- [Autentikasi dan Postman](#3-autentikasi-dan-postman)
- [General](#4-general)
- [Tenant](#5-tenant)
- [Location](#6-location)
- [Booth](#7-booth)
- [Frame dan upload slots](#8-frame-dan-upload-slots)
- [Product](#9-product)
- [Voucher](#10-voucher)
- [Format query array](#11-format-query-array)
- [Alur pengujian manual](#12-alur-pengujian-manual-di-postman)

## 1. Konfigurasi dan aturan umum

| Pengaturan | Nilai |
|---|---|
| Base URL lokal | `http://localhost:3001/api/v1` |
| Port | Environment variable `PORT`; default `3001` |
| Prefix | `/api/v1` |
| Body biasa | `application/json` |
| Upload tenant/frame | `multipart/form-data` |
| Autentikasi | `Authorization: Bearer <encryptedToken>` untuk endpoint non-public |

Path pada dokumentasi ditulis relatif terhadap base URL. Contoh: `GET /frame` berarti `GET http://localhost:3001/api/v1/frame`.

Validasi global memakai `whitelist: true`, `forbidNonWhitelisted: true`, dan `transform: true`:

- Field yang tidak terdaftar menghasilkan `400 Bad Request` pada body/query yang memakai DTO.
- Semua field dalam tabel request wajib, kecuali ditandai opsional.
- Nama, kode voucher, dan alamat di-trim sesuai DTO. Password tidak di-trim.
- Boolean body JSON harus berupa `true` atau `false`, bukan string `"true"`/`"false"`.
- `tenantId` dan `locationId` pada DTO input menggunakan UUID v4. ID pada path status divalidasi dengan `ParseUUIDPipe`.
- Pada endpoint terautentikasi, tenant dan user pembuat/pengubah diambil dari token. Jangan tambahkan `tenantId`, `createdBy`, atau `updatedBy` ke body endpoint tersebut.
- Gunakan tanggal ISO 8601 dengan zona waktu eksplisit, misalnya `2026-11-01T00:00:00+07:00` atau `2026-10-31T17:00:00Z`. Tanggal pada respons diserialisasikan sebagai string ISO.

### Format respons sukses

Respons dengan data:

```json
{
  "message": "Products retrieved successfully",
  "statusCode": 200,
  "data": []
}
```

Respons operasi yang tidak mengembalikan data:

```json
{
  "message": "Product created successfully",
  "statusCode": 201
}
```

Tidak ada field `success`. Field `data` dihilangkan jika controller mengembalikan `undefined`; nilainya bukan otomatis `null` atau objek yang baru dibuat. Daftar kosong dikembalikan sebagai `data: []`.

Khusus pembuatan tenant dan lokasi, `data` saat ini berisi hasil query insert PostgreSQL (`QueryResult`), **belum berupa record tenant/lokasi**. Jangan mengasumsikan ada `data.id` pada kedua respons tersebut.

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

| Method | Path | Akses | Status | Message sukses | Isi `data` |
|---|---|---|---|---|---|
| GET | `/test` | Public | 200 | Test endpoint accessed successfully | String |
| GET | `/private` | Token | 200 | Protected endpoint accessed successfully | String |
| POST | `/tenant` | Public | 201 | Tenant created successfully | QueryResult insert |
| POST | `/auth/register` | Public | 201 | User registered successfully | `{ user }` |
| POST | `/auth/login` | Public | 201 | Login successful | `{ user, encryptedToken }` |
| POST | `/location` | Token | 201 | Location created successfully | QueryResult insert |
| GET | `/location` | Token | 200 | Locations retrieved successfully | Array lokasi |
| GET | `/location/options` | Token | 200 | Location options retrieved successfully | Array `{ id, storeName }` |
| PATCH | `/location/:id/status` | Token | 200 | Location status updated successfully | Tidak ada |
| POST | `/booth` | Token | 201 | Booth created successfully | Tidak ada |
| GET | `/booth` | Token | 200 | Booths retrieved successfully | Array booth |
| PATCH | `/booth/:id/status` | Token | 200 | Booth status updated successfully | Tidak ada |
| POST | `/frame` | Token | 201 | Frame created successfully | Tidak ada |
| POST | `/frame/custom-frame` | Token | 201 | Custom frame created successfully | Tidak ada |
| GET | `/frame` | Token | 200 | Frames retrieved successfully | Array frame non-CUSTOM |
| GET | `/frame/custom-frame` | Token | 200 | Custom frames retrieved successfully | Array frame CUSTOM |
| POST | `/product` | Token | 201 | Product created successfully | Tidak ada |
| GET | `/product` | Token | 200 | Products retrieved successfully | Array produk |
| PATCH | `/product/:id/status` | Token | 200 | Product status updated successfully | Tidak ada |
| POST | `/voucher` | Token | 201 | Voucher created successfully | Tidak ada |
| GET | `/voucher` | Token | 200 | Vouchers retrieved successfully | Array voucher |

`PUT /voucher/:id` masih dikomentari di controller dan **belum tersedia**. Adanya `UpdateVoucherDto` tidak berarti endpoint tersebut aktif. Belum ada endpoint refresh token, logout, redeem voucher, atau hapus resource pada controller yang didokumentasikan di sini.

## 3. Autentikasi dan Postman

### Register — `POST /auth/register`

Public, body JSON:

| Field | Tipe | Validasi |
|---|---|---|
| `tenantId` | string | UUID v4 tenant yang sudah ada di database |
| `name` | string | 5–20 karakter setelah trim; tidak kosong |
| `password` | string | Minimal 8 karakter; tidak di-trim |

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

| Field | Tipe | Validasi |
|---|---|---|
| `name` | string | Tidak kosong setelah trim |
| `password` | string | Minimal 8 karakter |

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

## 4. General

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

## 5. Tenant

### Buat tenant — `POST /tenant`

Public, **Body → form-data** di Postman:

| Key | Jenis Postman | Aturan |
|---|---|---|
| `name` | Text | Tidak kosong; maksimal 255 karakter |
| `brandName` | Text | Tidak kosong; maksimal 255 karakter |
| `about` | Text | String wajib; boleh kosong |
| `logo` | File | PNG/JPG/JPEG wajib; ukuran harus kurang dari 5 MiB (5.242.880 byte) |

Jangan kirim `logoUrl`; backend mengisinya setelah upload ke R2. Biarkan Postman membuat header `Content-Type` beserta multipart boundary.

Respons: `201`, message `Tenant created successfully`, `data` berupa hasil query insert. Saat ini ID tenant belum dikembalikan sebagai record dan tidak ada endpoint GET tenant. Untuk registrasi user, gunakan ID tenant dari database/proses provisioning.

## 6. Location

### Buat lokasi — `POST /location`

Memerlukan token, body JSON:

| Field | Tipe | Validasi |
|---|---|---|
| `storeName` | string | Tidak kosong; maksimal 50 karakter |
| `street` | string | Tidak kosong; maksimal 200 karakter |

```json
{
  "storeName": "Snapoose Jakarta",
  "street": "Jl. Contoh No. 10, Jakarta"
}
```

Lokasi baru memiliki `isActive: false`. Respons: `201`, message `Location created successfully`, `data` berupa hasil query insert, bukan record lokasi. `nameBooth` tidak diterima; buat booth melalui endpoint booth.

### Daftar lokasi — `GET /location`

Mengembalikan maksimal **20 lokasi** milik tenant pada token, termasuk aktif dan nonaktif. Belum ada pagination, filter, atau urutan eksplisit pada query repository.

Setiap item berisi `id`, `tenantId`, `code`, `storeName`, `street`, `isActive`, `createdBy`, `updatedBy`, `createdAt`, dan `updatedAt`. `street`/audit user pada data tersimpan dapat null sesuai schema.

### Pilihan lokasi aktif — `GET /location/options`

Lokasi aktif milik tenant, diurutkan berdasarkan `storeName` ascending. Tidak dibatasi 20 item seperti endpoint daftar lokasi.

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

| Field | Tipe | Validasi |
|---|---|---|
| `locationId` | string | UUID v4 lokasi aktif milik tenant pada token |
| `name` | string | Tidak kosong; maksimal 100 karakter |
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

| Query opsional | Nilai |
|---|---|
| `locationIds` | Satu atau beberapa UUID v4 lokasi |
| `statuses` | `active`, `inactive`, atau keduanya |

```http
GET /api/v1/booth?locationIds=ce73d7c7-0b08-4a0b-a47e-42d17de00ac3&statuses=active,inactive
```

Hasil hanya milik tenant pada token, diurutkan berdasarkan `createdAt` descending. Belum ada pagination atau batas jumlah item. Setiap item berisi `id`, `tenantId`, `locationId`, `code`, `name`, `serialNumber`, `isActive`, `last_sync`, `createdAt`, `updatedAt`, `createdBy`, dan `updatedBy`. `serialNumber`, `last_sync`, dan audit user dapat null.

### Ubah status — `PATCH /booth/:id/status`

Body JSON `{ "isActive": true }` atau `{ "isActive": false }`.

Respons: `200`, message `Booth status updated successfully`, tanpa `data`. Booth tidak ditemukan pada tenant menghasilkan `404 Booth not found`.

## 8. Frame dan upload slots

Kedua endpoint POST frame memerlukan token dan **multipart/form-data** dengan file bernama `frame`. File PNG/JPG/JPEG wajib; ukuran harus kurang dari 5 MiB (5.242.880 byte). File tepat pada batas tersebut juga ditolak oleh validator saat ini. Backend membaca dimensi gambar menggunakan Sharp, mengunggah file ke R2, dan menyimpan metadata serta slots di PostgreSQL.

### Upload frame biasa — `POST /frame`

Isi **Body → form-data** di Postman:

| Key | Jenis Postman | Nilai / aturan |
|---|---|---|
| `name` | Text | Contoh `Classic Four Photos`; string tidak kosong |
| `frameType` | Text | Contoh `STANDARD`; string tidak kosong |
| `slots` | Text | JSON array seperti contoh berikut; minimal 1 slot |
| `frame` | File | Pilih gambar overlay |

Isi value `slots` dengan teks ini, **tanpa membungkus seluruh array dengan tanda kutip tambahan**:

```json
[
  { "x": 60, "y": 80, "width": 530, "height": 707 },
  { "x": 610, "y": 80, "width": 530, "height": 707 },
  { "x": 60, "y": 807, "width": 530, "height": 707 },
  { "x": 610, "y": 807, "width": 530, "height": 707 }
]
```

Koordinat contoh ditujukan untuk gambar 1200 × 1800 piksel. `x`, `y`, `width`, dan `height` pada setiap object wajib berupa **integer JSON**, bukan string angka. DTO saat ini belum mengecek batas minimum, slot keluar dari canvas, atau slot tumpang tindih. Pastikan frontend mengirim koordinat nonnegatif dan ukuran positif yang sesuai canvas.

`frameType` belum memakai enum; `STANDARD` hanya contoh. Nilai persis `CUSTOM` digunakan repository untuk membedakan custom frame. Gunakan endpoint custom frame untuk jenis tersebut. Schema membatasi `name` sampai 255 karakter dan `frameType` sampai 100 karakter, tetapi DTO belum memvalidasi panjang keduanya.

Contoh cURL, ganti path file dan token:

```bash
curl --request POST 'http://localhost:3001/api/v1/frame' \
  --header 'Authorization: Bearer <encryptedToken>' \
  --form 'name=Classic Four Photos' \
  --form 'frameType=STANDARD' \
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

Isi form-data berikut. **Jangan sertakan `frameType`**; backend mengisinya dengan `CUSTOM`:

| Key | Jenis Postman | Nilai / aturan |
|---|---|---|
| `name` | Text | String tidak kosong |
| `slots` | Text | JSON array dengan aturan yang sama seperti frame biasa |
| `validFrom` | Text | Contoh `2026-11-01T00:00:00+07:00` |
| `validUntil` | Text | Contoh `2026-11-30T23:59:59+07:00`; sama atau setelah `validFrom` |
| `frame` | File | Pilih gambar overlay |

Kedua tanggal wajib dan harus valid ISO 8601. Urutan tanggal salah menghasilkan `400` dengan message validasi `Valid until must be on or after valid from`.

Respons: `201`, message `Custom frame created successfully`, tanpa `data`.

### Payload frontend dan request upload

Object editor frontend seperti `{ id, name, canvas, slots, overlayUrl }` bukan body upload yang diterima langsung:

- `id` dibuat oleh database.
- `canvasWidth`/`canvasHeight` diambil dari gambar melalui Sharp. Jangan kirim `canvas`, `canvasWidth`, atau `canvasHeight`.
- `overlayUrl` dibuat setelah upload ke R2. Kirim file melalui field `frame`.
- `slots` dikirim sebagai teks JSON pada form-data. Transform DTO melakukan `JSON.parse` dan membentuk instance `SlotDto` untuk validasi nested.

Di Postman, cukup tempel array JSON pada Text `slots`; tidak perlu menjalankan `JSON.stringify()` manual. Jika memakai JavaScript frontend:

```javascript
const form = new FormData();
form.append('name', frame.name);
form.append('frameType', 'STANDARD');
form.append('slots', JSON.stringify(frame.slots));
form.append('frame', selectedFile);
```

Biarkan Postman/browser membuat header `Content-Type` beserta boundary. Jangan mengirim raw JSON untuk endpoint upload ini karena file tetap wajib. Di service/database, slots sudah berupa array object; tidak perlu di-stringify lagi untuk kolom `jsonb`.

### Daftar frame — `GET /frame` dan `GET /frame/custom-frame`

| Path | Filter yang diterapkan |
|---|---|
| `/frame` | Tenant pada token dan `frameType != 'CUSTOM'` |
| `/frame/custom-frame` | Tenant pada token, `frameType = 'CUSTOM'`, `validFrom` dan `validUntil` tidak null |

Keduanya mengembalikan maksimal **20 item**, tanpa pagination dan urutan eksplisit. Keduanya **belum memfilter `isActive` atau waktu saat ini**. Custom frame yang kedaluwarsa atau belum memasuki periode berlaku masih dapat muncul.

Contoh respons frame biasa:

```json
{
  "message": "Frames retrieved successfully",
  "statusCode": 200,
  "data": [
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
  ]
}
```

Untuk custom frame, message menjadi `Custom frames retrieved successfully`, `frameType` bernilai `CUSTOM`, dan kedua tanggal terisi. Audit user dapat null sesuai schema. Dimensi respons berupa field datar `canvasWidth`/`canvasHeight`; frontend dapat memetakannya ke `{ canvas: { width, height } }` jika diperlukan editor.

Error pembacaan gambar: `400 Invalid image file` atau `400 Image width and height could not be determined`. File hilang, format yang ditolak, atau ukuran melewati batas juga menghasilkan error validasi upload `400`.

## 9. Product

### Buat produk — `POST /product`

Memerlukan token, body JSON:

| Field | Tipe | Validasi |
|---|---|---|
| `name` | string | Tidak kosong; maksimal 100 karakter |
| `price` | integer | 0–2147483647; DTO juga mengubah string angka seperti `"25000"` menjadi number |

```json
{
  "name": "Photo Session",
  "price": 25000
}
```

Produk baru memiliki `isActive: true` dan `includedPrintQuantity: 2`. `locationId`, `boothId`, `includedPrintQuantity`, dan `isActive` tidak diterima pada body create. Relasi lokasi/booth produk yang dibuat lewat endpoint ini bernilai null.

Respons: `201`, message `Product created successfully`, tanpa `data`.

### Daftar produk — `GET /product`

| Query opsional | Nilai |
|---|---|
| `minPrice` | Integer ≥ 0 |
| `maxPrice` | Integer ≥ 0; tidak lebih kecil dari `minPrice` |
| `locationIds` | Satu atau beberapa UUID v4 lokasi |
| `status` | `active`, `inactive`, atau keduanya |

```http
GET /api/v1/product?minPrice=10000&maxPrice=50000&status=active
```

Hasil dibatasi pada tenant di token, tanpa pagination atau urutan eksplisit. Filter `locationIds` hanya cocok dengan produk yang sudah memiliki relasi lokasi di database; produk baru dengan `locationId: null` tidak cocok dengan filter ini.

Setiap item berisi `id`, `tenantId`, `locationId`, `boothId`, `code`, `name`, `price`, `includedPrintQuantity`, `isActive`, `createdAt`, `updatedAt`, `createdBy`, dan `updatedBy`. `price` berupa number; relasi lokasi/booth serta audit user dapat null.

Rentang harga terbalik menghasilkan `400 Minimum price must not exceed maximum price`.

### Ubah status — `PATCH /product/:id/status`

Body JSON `{ "isActive": true }` atau `{ "isActive": false }`.

Respons: `200`, message `Product status updated successfully`, tanpa `data`. Produk tidak ditemukan pada tenant menghasilkan `404 Product not found`.

## 10. Voucher

### Buat voucher — `POST /voucher`

Memerlukan token, body JSON:

| Field | Tipe | Validasi |
|---|---|---|
| `voucherCode` | string | Tidak kosong; maksimal 50 karakter |
| `discountPercent` | number | 1–100; maksimal 2 angka desimal |
| `quota` | integer | 0–2147483647; wajib, tidak boleh null |
| `validFrom` | string | Tanggal ISO 8601 valid |
| `validUntil` | string | Tanggal ISO 8601 valid; sama atau setelah `validFrom` |

```json
{
  "voucherCode": "WELCOME10",
  "discountPercent": 10,
  "quota": 100,
  "validFrom": "2026-11-01T00:00:00+07:00",
  "validUntil": "2026-11-30T23:59:59+07:00"
}
```

Kirim `discountPercent` dan `quota` sebagai number JSON, bukan string. Jangan kirim `usedCount` atau `isActive`; nilai awalnya `0` dan `false`.

Respons: `201`, message `Voucher created successfully`, tanpa `data`.

Kode voucher unik per tenant tanpa membedakan huruf besar/kecil. Duplikat menghasilkan `409 Voucher code is already in use`. Walaupun schema mendukung `quota: null` untuk kuota tidak terbatas, DTO create belum menerima null.

### Daftar voucher — `GET /voucher`

Query yang sudah memengaruhi hasil repository:

| Query opsional | Nilai / perilaku |
|---|---|
| `status` | `active`, `inactive`, atau keduanya |
| `quotaStatus` | `available`, `exhausted`, atau keduanya |
| `remainingMin` | Integer ≥ 0; batas bawah `quota - usedCount` |
| `remainingMax` | Integer ≥ 0; batas atas `quota - usedCount` |

```http
GET /api/v1/voucher?status=inactive&quotaStatus=available&remainingMin=1
```

- `available`: quota null atau `quota - usedCount > 0`.
- `exhausted`: quota tidak null dan `quota - usedCount <= 0`.
- Status kuota tidak memeriksa `isActive` atau periode tanggal. `available` tidak otomatis berarti voucher boleh digunakan.
- Filter angka `remainingMin`/`remainingMax` tidak mencakup voucher dengan quota null.
- `remainingMin > remainingMax` menghasilkan `400 Minimum remaining quota must not exceed maximum remaining quota`.

Query berikut **diterima/divalidasi DTO tetapi belum diterapkan ke query database**:

| Query | Validasi DTO | Default DTO |
|---|---|---|
| `search` | String, maksimal 100 karakter setelah trim | Tidak ada |
| `quotaMin` | Integer ≥ 0 | Tidak ada |
| `quotaMax` | Integer ≥ 0 | Tidak ada |
| `sortBy` | `createdAt`, `name`, `quota` | `createdAt` |
| `sortOrder` | `asc`, `desc` | `desc` |
| `page` | Integer 1–2147483647 | `1` |
| `limit` | Integer 1–100 | `20` |

Jangan mengandalkan pencarian, sorting, atau pagination dari parameter tersebut. Hasil saat ini berupa seluruh array yang cocok dengan tenant dan filter yang sudah diterapkan, tanpa metadata `total`/`page` dan tanpa batas 20 item.

Setiap item berisi `id`, `tenantId`, `code`, `voucherCode`, `discountPercent`, `quota`, `usedCount`, `isActive`, `validFrom`, `validUntil`, `createdBy`, `updatedBy`, `createdAt`, dan `updatedAt`. `discountPercent` berupa number. `remaining` hanya dipakai menghitung filter dan tidak ditambahkan ke respons. Quota, tanggal, serta audit user pada data tersimpan dapat null sesuai schema.

## 11. Format query array

Filter array booth, product, dan voucher menerima satu nilai, nilai dipisah koma, atau query key berulang. Contoh setara untuk produk:

```http
GET /api/v1/product?status=active,inactive
GET /api/v1/product?status=active&status=inactive
```

Nama parameter berbeda antar modul: booth memakai **`statuses`**, product dan voucher memakai **`status`**. Gunakan key biasa seperti `locationIds`, bukan `locationIds[]`. Jangan mengirim array sebagai teks JSON pada query; JSON string khusus dipakai untuk `slots` dalam form-data.

Parameter array tidak boleh kosong. `status=` atau `status=active,` gagal validasi. Dalam satu filter array, item dicocokkan sebagai pilihan OR; filter berbeda digabungkan sebagai AND.

## 12. Alur pengujian manual di Postman

1. Siapkan tenant dan UUID-nya. `POST /tenant` tersedia, tetapi belum mengembalikan record/ID tenant; ambil UUID dari database/proses provisioning.
2. Register dengan tenant tersebut, lalu login dan simpan `encryptedToken`.
3. Coba `GET /private` dengan Bearer token untuk memastikan autentikasi berhasil.
4. Buat lokasi, ambil ID melalui `GET /location`, lalu aktifkan dengan `PATCH /location/:id/status`.
5. Gunakan ID dari `GET /location/options` untuk membuat booth. Aktifkan booth bila diperlukan.
6. Upload frame melalui form-data, lalu cek metadata, dimensi, dan slots melalui GET frame yang sesuai.
7. Buat produk/voucher dan cek hasil melalui GET masing-masing. Voucher baru masih nonaktif dan belum memiliki endpoint pengubahan status yang aktif.

Dokumentasi ini menjelaskan perilaku kode saat ini. Batasan yang disebutkan belum diubah melalui pembaruan dokumentasi ini.
