# Rank Up Diary — PWA + Firebase Cloud Messaging

## Yang sudah ditambahkan
- Web App Manifest dan service worker untuk instalasi PWA/offline.
- Integrasi awal Firebase Cloud Messaging (FCM) untuk menerima Web Push di browser Android yang mendukung Push API.
- Tombol **Aktifkan Notifikasi** untuk meminta izin dan mendaftarkan perangkat.
- Token FCM disimpan di localStorage perangkat ini; tombol **Salin Token FCM** disediakan untuk pengujian.
- Service worker menangani push saat aplikasi berada di background dan membuka aplikasi saat notifikasi ditekan.

## 1. Buat konfigurasi Firebase Web
1. Buka Firebase Console dan buat project baru (atau pilih project yang sudah ada).
2. Tambahkan aplikasi Web dari Project Overview.
3. Salin konfigurasi Web App dari Project settings > General > Your apps.
4. Buka `firebase-config.js`, lalu ganti placeholder:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
5. Buka Project settings > Cloud Messaging > Web configuration > Web Push certificates.
6. Generate key pair, lalu salin **public key** ke `vapidKey` pada `firebase-config.js`.
7. Pastikan Firebase Cloud Messaging API / FCM Registration API aktif untuk project tersebut.

Catatan: Firebase Web config dan VAPID **public** key memang dipakai di sisi browser. Jangan pernah memasukkan service-account JSON, private key, atau kredensial server ke file ini atau ke repository.

## 2. Publish dan aktifkan di Android
1. Commit seluruh folder aplikasi ke GitHub Pages, termasuk `firebase-config.js`.
2. Buka URL GitHub Pages di Chrome Android dan pastikan menggunakan HTTPS.
3. Tutup lalu buka ulang PWA (atau refresh) agar service worker versi baru terpasang.
4. Tekan **Aktifkan Notifikasi** dan izinkan notifikasi saat Android/Chrome meminta izin.
5. Jika berhasil, tombol berubah menjadi **Notifikasi Aktif**. Token perangkat disimpan lokal dengan key `ru_fcm_token`.

Jika sebelumnya PWA sudah terpasang, setelah deploy lakukan refresh ketika online. Jika tombol belum berubah, tutup PWA sepenuhnya lalu buka lagi.

## 3. Tes push dari Firebase Console
1. Aktifkan notifikasi di perangkat seperti langkah di atas.
2. Tekan **Salin Token FCM** di PWA dan simpan token secara privat.
3. Di Firebase Console, buka Messaging / Campaigns, buat notification campaign, lalu pilih opsi test message.
4. Tempel token perangkat sebagai target tes dan kirim.
5. Tes ketika Rank Up Diary berada di background.

Jangan posting token FCM ke issue publik, chat publik, atau repository.

## Batasan tahap ini
- Tahap ini baru menyiapkan **penerima push** dan tes manual melalui Firebase Console.
- Pengingat otomatis berdasarkan jam habit, habit yang belum dicatat, daily review, dan weekly review **belum aktif**. Untuk mengirim notifikasi terjadwal saat aplikasi ditutup, dibutuhkan backend tepercaya yang menyimpan token perangkat dan mengirim pesan lewat FCM HTTP v1.
- Firebase Cloud Messaging sendiri no-cost, tetapi Firebase Cloud Functions memerlukan paket Blaze yang menautkan billing account. Jangan aktifkan billing atau memasukkan metode pembayaran hanya untuk mencoba tahap ini. Kita bisa memilih backend terjadwal alternatif yang tidak perlu mengubah paket Firebase sebelum membangun pengingat otomatis.
- Data habit tetap tersimpan di localStorage perangkat. Integrasi ini tidak menambahkan login atau sinkronisasi perangkat.
- Notifikasi foreground ditampilkan sebagai toast di dalam aplikasi; push background ditampilkan oleh sistem.

## Menjalankan lokal
PWA membutuhkan HTTPS atau localhost. Jangan membuka `index.html` langsung melalui `file://`.
