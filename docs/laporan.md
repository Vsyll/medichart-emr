# Laporan Desain Sistem MediChart EMR v2

## Abstrak

Dokumen ini menyajikan desain sistem MediChart EMR v2 yang mencakup arsitektur aplikasi, model data, desain keamanan, serta dokumentasi diagram UML/DFD. Fokus utama pengembangan adalah penambahan RBAC dan Diagnostic Reports dengan tetap mempertahankan alur klinis dari versi sebelumnya.

## Pendahuluan

MediChart EMR v2 adalah pengembangan lanjutan dari sistem rekam medis elektronik berbasis web single-page yang dibangun dengan HTML, CSS, dan JavaScript murni tanpa framework. Versi ini memperluas kemampuan versi sebelumnya dengan dukungan autentikasi berbasis peran, manajemen pengguna, diagnostic reports, serta dokumentasi teknis yang lebih lengkap.

Dokumen ini merangkum rancangan sistem dari sisi arsitektur, antarmuka, data, dan keamanan agar dapat digunakan sebagai dasar implementasi maupun presentasi formal.

## Deskripsi Sistem

Sistem berjalan sepenuhnya di sisi klien. Seluruh data disimpan di `localStorage`, sedangkan sesi login aktif disimpan di `sessionStorage`. Arsitektur ini membuat aplikasi mudah dijalankan tanpa server backend, tetapi tetap membutuhkan validasi yang ketat pada level JavaScript agar data klinis tetap konsisten.

Fitur utama yang dicakup pada v2 adalah:

- Autentikasi dan otorisasi berbasis peran (Dokter, Perawat, Admin)
- Manajemen pasien dan riwayat kunjungan
- Catatan klinis SOAP dan Problem List
- Diagnostic Reports untuk laboratorium dan radiologi
- Manajemen akun pengguna oleh Admin

### RBAC

RBAC dipakai untuk membatasi hak akses berdasarkan peran pengguna. Dokter memiliki akses klinis penuh, Perawat dibatasi pada data yang relevan untuk observasi dan tanda vital, sedangkan Admin berfokus pada manajemen akun dan data pasien.

### Diagnostic Reports

Modul ini menyimpan hasil laboratorium dan radiologi dalam bentuk `DiagnosticReport`. Laporan dapat berstatus `pending`, `final`, atau `amended`, dan dapat dikaitkan dengan `Encounter` bila berasal dari kunjungan tertentu.

### Clinical Notes

Catatan klinis tetap menjadi inti alur medis. Format SOAP dipertahankan, dengan penyesuaian agar Perawat hanya dapat menginput bagian Objective yang berisi tanda vital.

## Arsitektur Sistem

Sistem menggunakan arsitektur SPA monolitik. Seluruh logika presentasi, logika bisnis, dan penyimpanan data berada di dalam satu halaman HTML utama. Untuk keperluan desain, sistem dapat dipahami dalam tiga lapisan:

1. Presentation Layer: login page, app shell, panel pasien, panel diagnostic reports, dan panel admin
2. Business Logic Layer: `Auth_Module`, `Patient_Module`, `Clinical_Module`, `DiagReport_Module`, dan `Admin_Module`
3. Data Layer: `localStorage` dan `sessionStorage`

Diagram arsitektur komponen dapat dilihat pada [docs/component-diagram.puml](component-diagram.puml), sedangkan struktur paket disediakan dalam dua tingkat:

- [Package Diagram Simple](package-diagram.puml) untuk presentasi cepat
- [Package Diagram Detailed](package-diagram-detailed.puml) untuk analisis teknis

## Desain Antarmuka

Antarmuka utama terdiri dari halaman login dan app shell setelah autentikasi berhasil. Di dalam app shell, sidebar digunakan untuk navigasi berbasis peran, sementara area konten menampilkan daftar pasien, detail pasien, catatan klinis, diagnostic reports, atau panel administrasi.

Komponen UI penting:

- LoginPage untuk autentikasi
- AppShell untuk navigasi utama
- PatientListPanel untuk daftar dan pencarian pasien
- PatientDetailPanel untuk demographics dan riwayat kunjungan
- DiagReportPanel untuk tab laboratorium dan radiologi
- AdminPanel untuk manajemen akun pengguna

Desain visual menjaga konsistensi dengan token warna, radius, dan tipografi yang sudah ada pada versi sebelumnya.

## Desain Data

Model data utama mencakup entitas `User`, `Patient`, `Encounter`, `ClinicalNote`, `Problem`, dan `DiagnosticReport`.

### User

Menyimpan identitas login, peran, status aktif, serta timestamp login terakhir.

### Patient

Menyimpan data demografis dan informasi dasar pasien.

### Encounter

Merepresentasikan satu kunjungan atau episode pemeriksaan medis.

### ClinicalNote

Menyimpan catatan SOAP untuk satu encounter.

### Problem

Menyimpan daftar diagnosis/problem list yang terkait dengan pasien dan encounter.

### DiagnosticReport

Menyimpan hasil laboratorium dan radiologi, termasuk tipe laporan, status, interpretasi, dan relasi ke patient/encounter.

Rancangan relasi entitas dapat dilihat pada [docs/class-diagram.puml](class-diagram.puml).

## Desain Keamanan

Keamanan aplikasi berfokus pada beberapa lapisan:

- Login berbasis username dan password
- Sesi aktif disimpan di `sessionStorage`
- Hak akses dibatasi oleh RBAC sesuai peran pengguna
- Elemen UI yang tidak sesuai peran disembunyikan
- Data input divalidasi sebelum disimpan ke `localStorage`

Untuk menelusuri alur autentikasi dan pengelolaan sesi, lihat [docs/sequence-diagram.puml](sequence-diagram.puml).

## Diagram

- [Use Case Diagram](use-case-diagram.puml)
- [Class Diagram](class-diagram.puml)
- [Sequence Diagram](sequence-diagram.puml)
- [Component Diagram](component-diagram.puml)
- [Package Diagram Simple](package-diagram.puml)
- [Package Diagram Detailed](package-diagram-detailed.puml)
- [DFD Level 0](dfd-level0.puml)
- [DFD Level 1](dfd-level1.puml)

## Panduan Pemahaman Tim

Untuk memudahkan pemahaman tim terhadap apa yang sudah dibangun, gunakan dokumen berikut:

- [Panduan Tim](panduan-tim.md)
- [Validasi dan Uji](validasi-dan-uji.md)

## Perbandingan v0 dan v2

| Aspek | MediChart v0 | MediChart v2 |
|---|---|---|
| Autentikasi | Belum ada RBAC | Login, sesi, dan role-based access |
| Peran pengguna | Satu aktor dokter | Dokter, Perawat, Admin |
| Data klinis | SOAP dan Problem List dasar | SOAP, Problem List, Encounter, Diagnostic Reports |
| Manajemen pengguna | Tidak ada | Tersedia untuk Admin |
| Penyimpanan | Sederhana | `localStorage` dan `sessionStorage` dengan validasi |
| Dokumentasi | Diagram dasar | Diagram UML/DFD yang diperbarui dan laporan desain |

## Kesimpulan

MediChart EMR v2 mempertahankan inti sistem rekam medis versi lama, lalu menambahkan kontrol akses, manajemen data diagnostik, dan dokumentasi teknis yang lebih formal. Hasil rancangan ini sudah cukup untuk dijadikan dasar implementasi lanjutan maupun referensi presentasi.