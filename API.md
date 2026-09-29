# Snapoose Pro - API Documentation

Dokumentasi lengkap REST API untuk backend **Snapoose Pro** (NestJS, Firestore, Cloudflare R2).

---

## 📌 Informasi Umum

- **Base URL**: `http://localhost:3000/api/v1` *(Port dapat disesuaikan melalui environment variable `PORT`)*
- **Global Route Prefix**: `/api/v1`
- **Default Format**: `application/json` (Kecuali endpoint upload file menggunakan `multipart/form-data`)
- **Validation**: Strict validation (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`). Properti yang tidak didefinisikan dalam DTO akan menghasilkan `400 Bad Request`.

---

## 🔐 Autentikasi & Otorisasi

API menerapkan **Global Auth Guard** menggunakan JWT (JSON Web Token).
- Seluruh endpoint **wajib** menyertakan token autentikasi, **kecuali** endpoint yang memiliki label `[Public]`.
- Token dikirimkan melalui HTTP Header:
  ```http
  Authorization: Bearer <access_token>
  ```
- Token didapatkan setelah berhasil melakukan **Login** (`POST /api/v1/auth/login`) atau **Register** (`POST /api/v1/auth/register`).

---

## 📑 Ringkasan Endpoint

| Modul | Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|---|
| **General** | `GET` | `/api/v1/test` | Public | Ping test / Health check |
| **Auth** | `POST` | `/api/v1/auth/register` | Public | Mendaftarkan akun user baru |
| **Auth** | `POST` | `/api/v1/auth/login` | Public | Login akun & mendapatkan access token |
| **Location** | `POST` | `/api/v1/location` | Bearer Token | Menambahkan lokasi baru |
| **Location** | `GET` | `/api/v1/location` | Bearer Token | Mengambil daftar semua lokasi |
| **CMS - Frame** | `POST` | `/api/v1/frame` | Bearer Token | Upload photo frame biasa (Multipart) |
| **CMS - Frame** | `POST` | `/api/v1/frame/custom-frame` | Bearer Token | Upload custom frame dengan periode aktif |
| **CMS - Frame** | `GET` | `/api/v1/frame` | Bearer Token | Mengambil daftar URL frame biasa |
| **CMS - Frame** | `GET` | `/api/v1/frame/custom-frame` | Bearer Token | Mengambil daftar data custom frame |
| **CMS - Voucher**| `POST` | `/api/v1/voucher` | Bearer Token | Membuat voucher diskon baru |
| **CMS - Voucher**| `PUT` | `/api/v1/voucher/:id` | Bearer Token | Mengubah / update data voucher |
| **CMS - Voucher**| `GET` | `/api/v1/voucher` | Bearer Token | Mengambil daftar seluruh voucher |

---

## 1. General

### 1.1. Health Check / Ping Test
Endpoint sederhana untuk mengecek apakah server aktif dan dapat menerima request.

- **Method**: `GET`
- **URL**: `/api/v1/test`
- **Akses**: Public (Tanpa Token)

#### Contoh Request
```bash
curl -X GET http://localhost:3000/api/v1/test
```

#### Respons Sukses (`200 OK`)
```text
hello world
```

---

## 2. Modul Autentikasi (IAM / Auth)

### 2.1. Register User Baru
Mendaftarkan akun user baru dan otomatis menghasilkan access token.

- **Method**: `POST`
- **URL**: `/api/v1/auth/register`
- **Akses**: Public
- **Headers**:
  - `Content-Type: application/json`

#### Request Body
| Field | Tipe | Wajib | Validasi / Deskripsi |
|---|---|---|---|
| `name` | `string` | Ya | Minimal 5 karakter, maksimal 20 karakter |
| `password` | `string` | Ya | Minimal 8 karakter |

#### Contoh Body
```json
{
  "name": "johndoe",
  "password": "password123"
}
```

#### Contoh Request
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "johndoe",
    "password": "password123"
  }'
```

#### Respons Sukses (`201 Created`)
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "uV8c7yN9X0a1B2c3D4e5",
      "tenantId": "DEFAULT_TENANT_ID",
      "name": "johndoe",
      "code": "USER"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Respons Error
- **`409 Conflict`** (Nama sudah terdaftar):
  ```json
  {
    "statusCode": 409,
    "message": "Nama sudah terdaftar",
    "error": "Conflict"
  }
  ```
- **`400 Bad Request`** (Validasi gagal):
  ```json
  {
    "statusCode": 400,
    "message": [
      "Name is too short",
      "Password min 8"
    ],
    "error": "Bad Request"
  }
  ```

---

### 2.2. Login
Melakukan login user menggunakan nama dan password untuk memperoleh access token.

- **Method**: `POST`
- **URL**: `/api/v1/auth/login`
- **Akses**: Public
- **Headers**:
  - `Content-Type: application/json`

#### Request Body
| Field | Tipe | Wajib | Validasi / Deskripsi |
|---|---|---|---|
| `name` | `string` | Ya | Nama user tidak boleh kosong |
| `password` | `string` | Ya | Password minimal 8 karakter |

#### Contoh Body
```json
{
  "name": "johndoe",
  "password": "password123"
}
```

#### Contoh Request
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "name": "johndoe",
    "password": "password123"
  }'
```

#### Respons Sukses (`200 OK`)
```json
{
  "success": true,
  "message": "User Login successfully",
  "data": {
    "user": {
      "id": "uV8c7yN9X0a1B2c3D4e5",
      "name": "johndoe",
      "code": "USER",
      "tenantId": "DEFAULT_TENANT_ID"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Respons Error
- **`409 Conflict`** (Kredensial salah):
  ```json
  {
    "statusCode": 409,
    "message": "Nama atau password salah",
    "error": "Conflict"
  }
  ```

---

## 3. Modul Lokasi (Location)

### 3.1. Tambah Lokasi Baru
Menambahkan entri lokasi/toko baru.

- **Method**: `POST`
- **URL**: `/api/v1/location`
- **Akses**: Bearer Token
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`

#### Request Body
| Field | Tipe | Wajib | Validasi / Deskripsi |
|---|---|---|---|
| `storeName` | `string` | Ya | Nama toko/mall (Maks. 100 karakter) |
| `nameBooth` | `string` | Ya | Nama booth pada lokasi (Maks. 100 karakter) |
| `street` | `string` | Ya | Alamat jalan lokasi (Maks. 200 karakter) |

#### Contoh Body
```json
{
  "storeName": "Grand Indonesia Mall",
  "nameBooth": "Booth GI Lantai 3",
  "street": "Jl. M.H. Thamrin No. 1, Jakarta Pusat"
}
```

#### Contoh Request
```bash
curl -X POST http://localhost:3000/api/v1/location \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "storeName": "Grand Indonesia Mall",
    "nameBooth": "Booth GI Lantai 3",
    "street": "Jl. M.H. Thamrin No. 1, Jakarta Pusat"
  }'
```

#### Respons Sukses (`201 Created`)
```json
{
  "success": true,
  "message": "Location created successfully"
}
```

#### Respons Error
- **`404 Not Found`** (Tenant tidak valid):
  ```json
  {
    "statusCode": 404,
    "message": "Tenant tidak ditemukan",
    "error": "Not Found"
  }
  ```

---

### 3.2. Ambil Daftar Lokasi
Mengambil seluruh data lokasi yang tersimpan.

- **Method**: `GET`
- **URL**: `/api/v1/location`
- **Akses**: Bearer Token
- **Headers**:
  - `Authorization: Bearer <access_token>`

#### Contoh Request
```bash
curl -X GET http://localhost:3000/api/v1/location \
  -H "Authorization: Bearer <access_token>"
```

#### Respons Sukses (`200 OK`)
```json
{
  "success": true,
  "message": "Location Get successfully",
  "data": [
    {
      "id": "loc_abc123def456",
      "tenantId": "tenant-001",
      "code": "LOK-1727601234567",
      "storeName": "Grand Indonesia Mall",
      "nameBooth": "Booth GI Lantai 3",
      "street": "Jl. M.H. Thamrin No. 1, Jakarta Pusat",
      "isActive": true,
      "createdAt": "2026-09-29T08:00:00.000Z",
      "updatedAt": "2026-09-29T08:00:00.000Z",
      "createdBy": "user-sub-id",
      "updatedBy": "user-sub-id"
    }
  ]
}
```

---

## 4. Modul Photo Frame (CMS / Frame)

File gambar frame disimpan ke **Cloudflare R2 Storage** dan metadatanya disimpan di Firestore.

### 4.1. Upload Normal Photo Frame
Mengunggah file photo frame standar.

- **Method**: `POST`
- **URL**: `/api/v1/frame`
- **Akses**: Bearer Token
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: multipart/form-data`

#### Multipart Form Data
| Field | Tipe | Wajib | Batasan & Deskripsi |
|---|---|---|---|
| `frame` | `File` (Binary) | Ya | Ekstensi file: `.png`, `.jpg`, `.jpeg`. Ukuran maksimal: **5 MB** |
| `name` | `string` | Ya | Nama frame |
| `frameType` | `string` | Ya | Tipe frame (misal: `STRIP`, `POLAROID`, `WIDE`) |

#### Contoh Request (cURL)
```bash
curl -X POST http://localhost:3000/api/v1/frame \
  -H "Authorization: Bearer <access_token>" \
  -F "name=Classic Strip White" \
  -F "frameType=STRIP" \
  -F "frame=@/path/to/frame.png"
```

#### Respons Sukses (`201 Created`)
```json
{
  "success": true,
  "message": "Frame created successfully",
  "data": {
    "id": "frm_doc_id_123",
    "tenantId": "tenant-001",
    "code": "FRM-1727603456789",
    "name": "Classic Strip White",
    "frameType": "STRIP",
    "imagePath": "https://pub-xxxxxx.r2.dev/frames/uuid-frame.png",
    "isActive": true,
    "validFrom": null,
    "validUntil": null,
    "createdAt": "2026-09-29T08:20:00.000Z",
    "updatedAt": "2026-09-29T08:20:00.000Z",
    "createdBy": "user-sub-id",
    "updatedBy": "user-sub-id"
  }
}
```

---

### 4.2. Upload Custom Photo Frame
Mengunggah custom frame khusus event/promosi yang memiliki masa berlaku tanggal aktif.

- **Method**: `POST`
- **URL**: `/api/v1/frame/custom-frame`
- **Akses**: Bearer Token
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: multipart/form-data`

#### Multipart Form Data
| Field | Tipe | Wajib | Batasan & Deskripsi |
|---|---|---|---|
| `frame` | `File` (Binary) | Ya | Ekstensi file: `.png`, `.jpg`, `.jpeg`. Maksimal: **5 MB** |
| `name` | `string` | Ya | Nama frame |
| `validFrom` | `string` | Tidak | Format ISO Date String (contoh: `2026-10-01T00:00:00.000Z`) |
| `validUntil` | `string` | Tidak | Format ISO Date String (contoh: `2026-10-31T23:59:59.000Z`) |

*(Catatan: `frameType` akan otomatis di-assign sebagai `"CUSTOM"`).*

#### Contoh Request (cURL)
```bash
curl -X POST http://localhost:3000/api/v1/frame/custom-frame \
  -H "Authorization: Bearer <access_token>" \
  -F "name=Halloween Special Edition" \
  -F "validFrom=2026-10-25T00:00:00.000Z" \
  -F "validUntil=2026-10-31T23:59:59.000Z" \
  -F "frame=@/path/to/halloween_frame.png"
```

#### Respons Sukses (`201 Created`)
```json
{
  "success": true,
  "message": "Custom Frame created successfully"
}
```

---

### 4.3. Ambil Daftar Frame Normal
Mengambil daftar URL gambar photo frame standar (non-custom).

- **Method**: `GET`
- **URL**: `/api/v1/frame`
- **Akses**: Bearer Token
- **Headers**:
  - `Authorization: Bearer <access_token>`

#### Contoh Request
```bash
curl -X GET http://localhost:3000/api/v1/frame \
  -H "Authorization: Bearer <access_token>"
```

#### Respons Sukses (`200 OK`)
```json
{
  "success": true,
  "message": "Get Frame successfully",
  "data": [
    "https://pub-xxxxxx.r2.dev/frames/uuid-1-classic.png",
    "https://pub-xxxxxx.r2.dev/frames/uuid-2-retro.png"
  ]
}
```

---

### 4.4. Ambil Daftar Custom Frame
Mengambil seluruh data dokumen custom frame yang aktif beserta tanggal periodenya.

- **Method**: `GET`
- **URL**: `/api/v1/frame/custom-frame`
- **Akses**: Bearer Token
- **Headers**:
  - `Authorization: Bearer <access_token>`

#### Contoh Request
```bash
curl -X GET http://localhost:3000/api/v1/frame/custom-frame \
  -H "Authorization: Bearer <access_token>"
```

#### Respons Sukses (`200 OK`)
```json
{
  "success": true,
  "message": "Get Frame successfully",
  "data": [
    {
      "code": "FRM-1727603456789",
      "tenantId": "tenant-001",
      "name": "Halloween Special Edition",
      "frameType": "CUSTOM",
      "imagePath": "https://pub-xxxxxx.r2.dev/frames/uuid-halloween.png",
      "isActive": true,
      "validFrom": "2026-10-25T00:00:00.000Z",
      "validUntil": "2026-10-31T23:59:59.000Z",
      "createdAt": "2026-09-29T08:20:00.000Z",
      "updatedAt": "2026-09-29T08:20:00.000Z",
      "createdBy": "user-sub-id",
      "updatedBy": "user-sub-id"
    }
  ]
}
```

---

## 5. Modul Voucher (CMS / Voucher)

### 5.1. Buat Voucher Diskon Baru
Menambahkan voucher diskon baru untuk tenant.

- **Method**: `POST`
- **URL**: `/api/v1/voucher`
- **Akses**: Bearer Token
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`

#### Request Body
| Field | Tipe | Wajib | Validasi / Deskripsi |
|---|---|---|---|
| `voucherCode` | `string` | Ya | Kode voucher (unik per promosi) |
| `discountPercent`| `number` | Ya | Persentase diskon (contoh: `20` untuk 20%) |
| `quota` | `integer` | Ya | Batas kuota pemakaian |
| `usedCount` | `integer` | Ya | Jumlah yang telah digunakan (biasanya `0` saat buat baru) |
| `validFrom` | `string` (Date) | Ya | Tanggal mulai berlaku (ISO 8601) |
| `validUntil` | `string` (Date) | Ya | Tanggal kedaluwarsa (ISO 8601) |

#### Contoh Body
```json
{
  "voucherCode": "DISKONHEMAT50",
  "discountPercent": 50,
  "quota": 100,
  "usedCount": 0,
  "validFrom": "2026-10-01T00:00:00.000Z",
  "validUntil": "2026-10-31T23:59:59.000Z"
}
```

#### Contoh Request
```bash
curl -X POST http://localhost:3000/api/v1/voucher \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "voucherCode": "DISKONHEMAT50",
    "discountPercent": 50,
    "quota": 100,
    "usedCount": 0,
    "validFrom": "2026-10-01T00:00:00.000Z",
    "validUntil": "2026-10-31T23:59:59.000Z"
  }'
```

#### Respons Sukses (`201 Created`)
```json
{
  "success": true,
  "message": "Voucher created successfully"
}
```

---

### 5.2. Update Data Voucher
Mengubah parameter voucher yang telah ada (seperti kuota, status aktif, tanggal berlaku).

- **Method**: `PUT`
- **URL**: `/api/v1/voucher/:id`
- **Akses**: Bearer Token
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`

#### URL Parameters
| Parameter | Tipe | Wajib | Deskripsi |
|---|---|---|---|
| `id` | `string` | Ya | ID dokumen voucher di Firestore |

#### Request Body
| Field | Tipe | Wajib | Validasi / Deskripsi |
|---|---|---|---|
| `voucherCode` | `string` | Ya | Kode voucher |
| `discountPercent`| `number` | Ya | Persentase diskon |
| `quota` | `integer` | Ya | Batas kuota pemakaian |
| `usedCount` | `integer` | Ya | Jumlah yang telah terpakai |
| `isActive` | `boolean` | Ya | Status aktif voucher (`true` / `false`) |
| `validFrom` | `string` (Date) | Ya | Tanggal mulai berlaku (ISO 8601) |
| `validUntil` | `string` (Date) | Ya | Tanggal kedaluwarsa (ISO 8601) |

#### Contoh Body
```json
{
  "voucherCode": "DISKONHEMAT50",
  "discountPercent": 50,
  "quota": 200,
  "usedCount": 10,
  "isActive": true,
  "validFrom": "2026-10-01T00:00:00.000Z",
  "validUntil": "2026-11-15T23:59:59.000Z"
}
```

#### Contoh Request
```bash
curl -X PUT http://localhost:3000/api/v1/voucher/vch_doc_id_987 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "voucherCode": "DISKONHEMAT50",
    "discountPercent": 50,
    "quota": 200,
    "usedCount": 10,
    "isActive": true,
    "validFrom": "2026-10-01T00:00:00.000Z",
    "validUntil": "2026-11-15T23:59:59.000Z"
  }'
```

#### Respons Sukses (`201 Created`)
```json
{
  "success": true,
  "message": "Voucher updated successfully"
}
```

#### Respons Error
- **`404 Not Found`** (Voucher atau Tenant tidak ditemukan):
  ```json
  {
    "statusCode": 404,
    "message": "Voucher tidak ditemukan",
    "error": "Not Found"
  }
  ```

---

### 5.3. Ambil Seluruh Data Voucher
Mengambil daftar voucher diskon yang tersimpan (maksimal 15 item).

- **Method**: `GET`
- **URL**: `/api/v1/voucher`
- **Akses**: Bearer Token
- **Headers**:
  - `Authorization: Bearer <access_token>`

#### Contoh Request
```bash
curl -X GET http://localhost:3000/api/v1/voucher \
  -H "Authorization: Bearer <access_token>"
```

#### Respons Sukses (`200 OK`)
```json
{
  "success": true,
  "message": "Voucher get successfully",
  "data": [
    {
      "id": "vch_doc_id_987",
      "code": "VCH-1727604567890",
      "tenantId": "tenant-001",
      "voucherCode": "DISKONHEMAT50",
      "discountPercent": 50,
      "quota": 200,
      "usedCount": 10,
      "isActive": true,
      "validFrom": "2026-10-01T00:00:00.000Z",
      "validUntil": "2026-11-15T23:59:59.000Z",
      "createdAt": "2026-09-29T08:30:00.000Z",
      "updatedAt": "2026-09-29T08:45:00.000Z",
      "createdBy": "user-sub-id",
      "updatedBy": "user-sub-id"
    }
  ]
}
```

---

## ⚠️ Format Penanganan Error (HTTP Status Codes)

Semua kesalahan validasi atau sistem mengikuti format standar dari NestJS:

| Status Code | Kondisi | Format Body Contoh |
|---|---|---|
| **`400 Bad Request`** | Data input tidak lolos validasi DTO atau format payload salah | `{"statusCode": 400, "message": ["voucherCode should not be empty"], "error": "Bad Request"}` |
| **`401 Unauthorized`** | Token tidak dikirimkan di header atau token tidak valid | `{"statusCode": 401, "message": "Token tidak ada"}` atau `{"statusCode": 401, "message": "Invalid token"}` |
| **`404 Not Found`** | Entitas database (Tenant, Lokasi, Voucher) tidak ditemukan | `{"statusCode": 404, "message": "Voucher tidak ditemukan", "error": "Not Found"}` |
| **`409 Conflict`** | Terjadi duplikasi data unik (misal: nama user sudah terdaftar) atau kredensial salah | `{"statusCode": 409, "message": "Nama sudah terdaftar", "error": "Conflict"}` |
| **`500 Internal Server Error`** | Error tak terduga pada server atau kegagalan koneksi Cloud Firestore / R2 | `{"statusCode": 500, "message": "Internal server error"}` |
