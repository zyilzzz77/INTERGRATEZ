# Flazpay Integration Guide

Dokumen ini menjelaskan integrasi payment gateway Flazpay yang sudah dipasang di project ini.

## 1) Callback URL yang harus didaftarkan

Gunakan URL berikut di dashboard merchant Flazpay:

- Production: `https://YOUR_DOMAIN/api/payment/callback`
- Development (contoh tunnel): `https://YOUR_TUNNEL_DOMAIN/api/payment/callback`

Route handler callback ada di:

- `app/api/payment/callback/route.ts`

## 2) Endpoint internal project

Endpoint internal yang sudah menggunakan Flazpay:

- `POST /api/topup/create`
- `POST /api/topup/check`
- `POST /api/payment/create`
- `GET /api/payment/check?id=<paymentId>`
- `POST /api/payment/callback`

## 3) Environment variable

Isi variable berikut di environment deployment:

- `FLAZPAY_MID` (required)
- `FLAZPAY_CLIENT_ID` (required)
- `FLAZPAY_CLIENT_SECRET` (required)
- `FLAZPAY_SERVICE` (optional, default: `14`)
- `FLAZPAY_TYPE_FEE` (optional, default: `1`)
- `FLAZPAY_CREATE_URL` (optional, default: `https://flazpay.id/snap/v1/request/create`)
- `FLAZPAY_RETURN_URL` (optional, default: `<origin>/topup`)
- `FLAZPAY_EXPIRE_MINUTES` (optional, default: `15`)

## 3.1) Channel pembayaran dipilih user

Frontend topup sekarang memungkinkan user memilih channel pembayaran langsung.
Daftar channel didefinisikan di:

- `lib/flazpayChannels.ts`

Server akan memvalidasi channel dan batas min/max nominal sesuai channel.

## 4) Signature yang dipakai

### Create payment

Backend membentuk signature:

`md5(mid + client_id + client_secret + unique_code + service + amount + 'new')`

Catatan:
- Mengikuti contoh validasi PHP yang kamu kirim.

### Callback

Backend memvalidasi signature callback:

`md5(mid + client_id + client_secret + unique_code + 'CallbackStatus')`

Jika payload callback memakai `pay_id` sebagai referensi utama, backend juga mencoba validasi fallback dengan `pay_id` agar lebih toleran terhadap variasi payload.

## 5) Alur status transaksi

1. `POST /api/topup/create` membuat transaksi pending di DB.
2. Flazpay mengirim callback ke `POST /api/payment/callback`.
3. Jika status callback adalah paid/success:
   - transaksi diupdate jadi `paid`
   - kredit user ditambahkan
   - email sukses topup dikirim
4. Jika status callback failed/expired:
   - transaksi diupdate jadi `failed`
5. Frontend polling ke `POST /api/topup/check` untuk membaca status dari DB.

## 6) Mapping response Flazpay ke UI

Backend memetakan payload Flazpay ke format yang dipakai frontend:

- `paymentId`: `data.unique_code` (fallback `data.pay_id`)
- `payUrl`: `data.redirect_url` (fallback `data.checkout_url`)
- `qrImage`: `data.qrcode_url` (fallback generate dari `data.qr_content`)
- `amount`: menggunakan amount final dari gateway jika tersedia

## 7) Test callback manual (contoh)

Gunakan contoh ini untuk test endpoint callback dari terminal:

```bash
curl -X POST "https://YOUR_DOMAIN/api/payment/callback" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "mid=YOUR_MID&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&pay_id=FP-TEST-001&unique_code=FP-TEST-001&status=paid&signature=YOUR_MD5_SIGNATURE"
```

Endpoint callback harus mengembalikan `200 OK` dan body `OK` saat valid.
