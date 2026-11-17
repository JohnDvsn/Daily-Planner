/* data.js: constants and content. Change texts, stats, arcana, missions and categories here. */
(function (RU) {
  'use strict';

  const KEY = 'rankup-diary-v1';
  const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const DS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  const STATS = [
    { k: 'knowledge', n: 'Knowledge', r: ['Mulai Belajar', 'Rajin', 'Paham Materi', 'Analitis', 'Cendekia'] },
    { k: 'guts', n: 'Guts', r: ['Ragu-ragu', 'Berani Coba', 'Tahan Banting', 'Nekat Terukur', 'Tak Gentar'] },
    { k: 'proficiency', n: 'Proficiency', r: ['Pemula', 'Terampil', 'Cekatan', 'Mahir', 'Ahli'] },
    { k: 'kindness', n: 'Kindness', r: ['Cuek', 'Peduli', 'Hangat', 'Penolong', 'Berjiwa Besar'] },
    { k: 'charm', n: 'Charm', r: ['Pendiam', 'Mulai Luwes', 'Enak Diajak Ngobrol', 'Magnet Obrolan', 'Karismatik'] }
  ];
  const TH = [0, 8, 20, 38, 60]; /* poin minimal untuk Lv 1..5 */
  const NEED = 3;                /* nongkrong per rank confidant */

  const ARC = [
    ['fool', '0', 'Fool', 'Awal baru, siap mencoba hal yang belum pernah'],
    ['magician', 'I', 'Magician', 'Inisiatif dan keahlian, suka bikin sesuatu terjadi'],
    ['priestess', 'II', 'Priestess', 'Tenang dan pengamat, tahu banyak tanpa banyak bicara'],
    ['empress', 'III', 'Empress', 'Merawat dan hangat, bikin orang merasa diterima'],
    ['emperor', 'IV', 'Emperor', 'Memimpin dan tegas, suka struktur'],
    ['hierophant', 'V', 'Hierophant', 'Pembimbing, berbagi ilmu dan pengalaman'],
    ['lovers', 'VI', 'Lovers', 'Kedekatan, hubungan yang saling terbuka'],
    ['chariot', 'VII', 'Chariot', 'Dorongan maju, persaingan yang sehat'],
    ['justice', 'VIII', 'Justice', 'Adil dan analitis, melihat dari semua sisi'],
    ['hermit', 'IX', 'Hermit', 'Butuh ruang sendiri, reflektif'],
    ['fortune', 'X', 'Fortune', 'Peluang dan keberuntungan, ikut arus dengan sadar'],
    ['strength', 'XI', 'Strength', 'Teguh dan sabar, kuat tanpa keras'],
    ['hanged', 'XII', 'Hanged Man', 'Mau melihat dari sudut pandang lain'],
    ['death', 'XIII', 'Death', 'Menutup yang lama, memulai yang baru'],
    ['temperance', 'XIV', 'Temperance', 'Seimbang dan pandai kompromi'],
    ['devil', 'XV', 'Devil', 'Godaan dan kebiasaan yang susah dilepas'],
    ['tower', 'XVI', 'Tower', 'Perubahan mendadak yang mengguncang'],
    ['star', 'XVII', 'Star', 'Harapan dan inspirasi'],
    ['moon', 'XVIII', 'Moon', 'Ragu dan perasaan yang belum jelas'],
    ['sun', 'XIX', 'Sun', 'Percaya diri dan ceria'],
    ['judgement', 'XX', 'Judgement', 'Panggilan untuk jujur pada diri sendiri'],
    ['world', 'XXI', 'World', 'Utuh, selesai, siap ke tahap berikutnya']
  ].map((a) => ({ id: a[0], num: a[1], name: a[2], hint: a[3] }));

  const MOOD = ['Berat', 'Kurang baik', 'Biasa saja', 'Baik', 'Semangat'];
  const CONF = ['Minder', 'Ragu', 'Cukup', 'Yakin', 'Percaya diri penuh'];

  const MISSIONS = [
    { t: 'Sapa satu orang di kelas yang belum kamu kenal', stat: 'charm', pts: 3 },
    { t: 'Angkat tangan dan ajukan satu pertanyaan di kelas', stat: 'guts', pts: 5 },
    { t: 'Ajak satu teman makan siang bareng', stat: 'charm', pts: 3 },
    { t: 'Kirim pesan terima kasih ke orang yang pernah membantumu', stat: 'kindness', pts: 2 },
    { t: 'Tawarkan bantuan ke teman yang kesulitan dengan tugas', stat: 'kindness', pts: 3 },
    { t: 'Sampaikan pendapatmu di diskusi kelompok sebelum diminta', stat: 'guts', pts: 3 },
    { t: 'Beri satu pujian yang tulus ke temanmu', stat: 'kindness', pts: 2 },
    { t: 'Ceritakan satu hal tentang dirimu ke teman yang belum akrab', stat: 'charm', pts: 3 },
    { t: 'Minta masukan tentang tugasmu ke dosen atau senior', stat: 'guts', pts: 3 },
    { t: 'Datang ke satu acara kampus, meski sendirian', stat: 'guts', pts: 5 },
    { t: 'Hubungi teman lama yang sudah lama tidak ngobrol', stat: 'charm', pts: 3 },
    { t: 'Latihan presentasi di depan satu teman', stat: 'proficiency', pts: 3 }
  ];

  const HABIT_IDEAS = [
    { name: 'Baca materi 15 menit', stat: 'knowledge' },
    { name: 'Ngobrol dengan satu orang', stat: 'charm' },
    { name: 'Rapikan catatan kuliah', stat: 'proficiency' },
    { name: 'Bantu satu orang hari ini', stat: 'kindness' },
    { name: 'Lakukan satu hal yang bikin gugup', stat: 'guts' }
  ];

  /* Kategori pengeluaran. Urutan ini juga urutan tumpukan di grafik. */
  const CATS = [
    { k: 'makan', n: 'Makan', color: 'var(--c-makan)' },
    { k: 'jajan', n: 'Jajan', color: 'var(--c-jajan)' },
    { k: 'keperluan', n: 'Keperluan', color: 'var(--c-keperluan)' },
    { k: 'lain', n: 'Lainnya', color: 'var(--c-lain)' }
  ];

  const TABS = [
    ['home', 'Beranda'], ['jadwal', 'Jadwal'], ['task', 'Task'], ['habit', 'Kebiasaan'],
    ['confidant', 'Confidant'], ['catatan', 'Catatan'], ['uang', 'Uang'], ['refleksi', 'Refleksi']
  ];

  const statOf = (k) => STATS.find((s) => s.k === k) || STATS[0];
  const arcOf = (id) => ARC.find((a) => a.id === id) || ARC[0];
  const catOf = (k) => CATS.find((c) => c.k === k) || CATS[CATS.length - 1];

  Object.assign(RU, { KEY, DAYS, DS, STATS, TH, NEED, ARC, MOOD, CONF, MISSIONS, HABIT_IDEAS, CATS, TABS, statOf, arcOf, catOf });
})(window.RU = window.RU || {});
