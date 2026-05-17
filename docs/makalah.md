% Makalah Akademik: MediChart EMR v2

# Abstrak

MediChart EMR v2 adalah rancangan sistem rekam medis elektronik berbasis web single-page yang dirancang untuk memenuhi kebutuhan dokumentasi klinis sederhana pada lingkungan pendidikan. Makalah ini menjelaskan tujuan, ruang lingkup, desain arsitektur, model data, mekanisme keamanan berbasis peran (RBAC), serta implementasi teknis dan validasi fungsional. Dokumen ditujukan sebagai naskah akademik kelompok untuk penilaian dan presentasi di perkuliahan.

# Kata Kunci

Electronic Medical Record, SPA, RBAC, Diagnostic Report, desain sistem, localStorage

# 1 Pendahuluan

Perkembangan sistem rekam medis elektronik (EMR) memerlukan keseimbangan antara fungsionalitas klinis dan kemudahan implementasi. Dalam konteks pendidikan, proyek ini bertujuan menghadirkan sebuah prototipe EMR yang dapat dipahami, dimodifikasi, dan dipresentasikan oleh kelompok mahasiswa. MediChart EMR v2 berfokus pada satu versi final (v2) yang mengintegrasikan autentikasi berbasis peran dan modul pencatatan hasil diagnostik (laboratorium dan radiologi).

Tujuan makalah:

- Menjelaskan desain arsitektur dan komponen sistem MediChart EMR v2.
- Menyajikan model data dan relasi antar-entitas yang digunakan.
- Menganalisis mekanisme otorisasi berbasis peran (RBAC) dan implikasinya terhadap UI/UX.
- Menyampaikan aspek implementasi teknis (client-side SPA) dan metode validasi yang dilakukan.

# 2 Konteks dan Ruang Lingkup

Meskipun terinspirasi oleh sistem open-source seperti OpenEMR/OpenMRS, MediChart EMR v2 tidak dirancang sebagai pengganti sistem produksi. Sistem ini bersifat edukasional: ringan, berdiri sendiri, dan berjalan sepenuhnya di browser tanpa backend. Ruang lingkup meliputi:

- Autentikasi dan manajemen sesi.
- Kontrol akses berbasis peran untuk tiga peran: `Dokter`, `Perawat`, `Admin`.
- Manajemen data pasien sederhana (demografi, encounter).
- Catatan klinis berbasis SOAP dan daftar masalah (Problem List).
- Modul Diagnostic Reports untuk menyimpan hasil laboratorium dan laporan imaging.

# 3 Arsitektur Sistem

Arsitektur utama adalah aplikasi single-page (SPA) monolitik yang diimplementasikan dalam satu berkas `medichart.html`. Komponen utama:

- Presentation Layer: halaman login, app shell, panel pasien, panel diagnostik, panel admin.
- Business Logic Layer: modul `Auth_Module`, `Patient_Module`, `Clinical_Module`, `DiagReport_Module`, `Admin_Module`.
- Data Layer: penyimpanan lokal menggunakan `localStorage` untuk data permanen dan `sessionStorage` untuk sesi.

Keuntungan arsitektur ini:

- Sederhana untuk dikembangkan dan di-deploy (cukup membuka `medichart.html`).
- Mudah diajarkan dan dimodifikasi dalam konteks tugas kelompok.

Keterbatasan:

- Tidak cocok untuk lingkungan produksi karena tidak ada enkripsi persisten, backup terpusat, atau manajemen multi-user nyata.

# 4 Model Data dan Relasi

Entitas utama yang digunakan pada MediChart EMR v2 adalah `User`, `Patient`, `Encounter`, `ClinicalNote`, `Problem`, dan `DiagnosticReport`. Setiap entitas direpresentasikan sebagai objek JSON dan disimpan dalam koleksi di `localStorage`.

Contoh ringkasan atribut `DiagnosticReport`:

- `reportId`, `patientId`, `encounterId` (nullable)
- `type` ∈ {`lab`, `imaging`}
- `date`, `status` ∈ {`pending`, `final`, `amended`}
- `interpretation`, `labData` (parameter hasil) atau `imagingData` (modality, findings, impression)

Relasi kunci:

- `DiagnosticReport` terkait ke `Patient` dan dapat terkait ke `Encounter` untuk menjaga konteks klinis.

# 5 Keamanan dan RBAC

Mekanisme kontrol akses dirancang sederhana namun eksplisit. RBAC mengatur apa yang dapat dilihat atau dilakukan oleh masing-masing peran:

- Dokter: akses penuh terhadap fitur klinis (mencatat, mengubah, melihat semua data klinis).
- Perawat: akses baca ke data klinis dan kemampuan mengisi bagian Objective (tanda vital).
- Admin: kemampuan manajemen akun dan data pasien; tidak memiliki akses klinis untuk mencatat diagnosis.

Implementasi RBAC:

- Fungsi `canAccess(feature)` mengevaluasi hak berdasarkan role yang tersimpan di `sessionStorage`.
- UI disesuaikan sehingga elemen (tombol, form) yang tidak berwenang tidak ditampilkan atau di-disable.

Catatan keamanan: karena sistem bersifat edukasional dan data tersimpan di localStorage, tidak ada jaminan kerahasiaan atau integritas terhadap ancaman eksternal.

# 6 Alur Utama dan Use Cases

Use case sentral yang dijelaskan dan diimplementasikan:

- Login dan otorisasi sesi.
- Manajemen daftar pasien: tambah, edit, lihat.
- Rekaman encounter dan SOAP notes.
- Pembuatan dan peninjauan Diagnostic Reports: input lab, input imaging, perubahan status (pending→final→amended).

Untuk setiap use case, diagram urutan (sequence) dan use-case tersedia di `docs/` sebagai PlantUML.

# 7 Implementasi Teknis

Rincian implementasi teknis:

- Platform: HTML5, CSS, JavaScript (ES6+).
- Struktur: satu file `medichart.html` yang berisi struktur DOM, style, dan modul-modul JS terorganisir secara fungsional.
- Penyimpanan: `localStorage` untuk data, deserialisasi/serialisasi JSON pada setiap operasi tulis/baca.
- ID entitas: generator ID sederhana (UUID-like) untuk `userId`, `patientId`, `reportId`.
- Validasi: fungsi `validateReport()` memastikan field wajib terisi dan format tanggal valid.

# 8 Validasi dan Pengujian

Karena lingkungan tugas bersifat lokal, validasi difokuskan pada:

- Smoke tests manual: login dengan akun demo, navigasi fitur utama, pembuatan laporan diagnostik, perubahan status, dan penghapusan pasien.
- Pemeriksaan konsistensi data: memastikan jumlah item yang ditampilkan sesuai dengan yang tersimpan di `localStorage`.
- Validasi field wajib pada form input diagnostik dan tindakan UI untuk nilai di luar rentang referensi (flagging).

# 9 Pembahasan dan Keterbatasan

Pembahasan menyoroti trade-off desain:

- Kelebihan: cepat dikembangkan, mudah dipelajari, cocok untuk demonstrasi konsep arsitektur EMR dan RBAC.
- Kekurangan: tidak ada autentikasi aman, tidak ada audit trail terpusat, tidak cocok untuk lingkungan klinis nyata.

Untuk perbaikan selanjutnya, disarankan:

- Menambahkan backend ringan (REST API) untuk otentikasi dan penyimpanan terpusat.
- Mengenkripsi data sensitif dan menambahkan audit trail.

# 10 Kesimpulan

MediChart EMR v2 merepresentasikan sebuah prototipe edukasional yang menekankan desain sistem, kontrol akses, dan pencatatan diagnostik. Makalah ini menyajikan desain, model data, keputusan arsitektural, dan hasil validasi yang relevan untuk presentasi akademik.

# Referensi

- Dokumentasi internal proyek (PlantUML sources dan README di `docs/`).
- OpenEMR / OpenMRS — referensi konsep EMR open-source (untuk studi perbandingan konseptual).

# Lampiran

- Petunjuk penggunaan singkat, daftar akun demo, dan instruksi untuk merender PlantUML ke gambar tersedia di `README.md` dan `docs/panduan-tim.md`.