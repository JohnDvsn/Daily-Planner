# Rank Up Diary — PWA build

## Yang ditambahkan
- Web App Manifest agar aplikasi bisa dipasang di layar utama.
- Service worker untuk menyimpan file aplikasi dan aset yang sudah pernah dimuat.
- Tombol Install App dengan instruksi untuk browser yang tidak menampilkan prompt instalasi.
- Indikator ONLINE/OFFLINE.
- Penyempurnaan layout kecil untuk layar HP.

## Cara menjalankan
PWA membutuhkan HTTPS atau localhost agar service worker aktif.
- Hosting: unggah seluruh isi folder `Rank Up Diary` ke hosting HTTPS statis.
- Lokal di laptop: jalankan server lokal dari folder ini, jangan membuka `index.html` langsung dengan `file://`.
- Setelah halaman berhasil dibuka sekali saat online, buka ulang untuk menguji cache offline.

## Memasang di HP
- Android: buka URL HTTPS di Chrome, tekan Install App jika muncul, atau menu browser > Install app / Add to Home screen.
- iPhone/iPad: buka URL HTTPS di Safari > Share > Add to Home Screen.

## Batasan versi ini
- Data tetap tersimpan di localStorage browser/perangkat masing-masing.
- Belum ada login atau sinkronisasi laptop-HP.
- Offline cache bekerja setelah aset berhasil dimuat setidaknya sekali saat online.
- Notifikasi habit belum ditambahkan; itu tahap terpisah setelah fondasi PWA.
- Service worker tidak akan aktif saat file dibuka langsung melalui `file://`.
