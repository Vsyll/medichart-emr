# Implementation Plan: MediChart EMR v2

## Overview

Implementasi MediChart EMR v2 dilakukan secara inkremental dalam satu file `medichart.html` (self-contained SPA). Setiap task membangun di atas task sebelumnya, dimulai dari pengarsipan versi lama, lalu infrastruktur data & autentikasi, kemudian fitur klinis baru (Diagnostic Reports), diakhiri dengan dokumentasi teknis. Semua logika bisnis ditulis dalam JavaScript murni tanpa framework eksternal.

## Tasks

- [x] 1. Arsipkan versi lama ke `archive/medichart-v0/`
  - Salin `medichart.html`, folder `assets/`, dan folder `docs/` ke dalam `archive/medichart-v0/` dengan mempertahankan struktur direktori asli
  - Buat file `archive/medichart-v0/README.md` yang menjelaskan bahwa folder ini adalah arsip versi lama
  - Jika folder sudah ada, timpa isinya dengan versi terbaru
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Definisikan data model dan inisialisasi localStorage
  - [x] 2.1 Implementasikan fungsi utilitas `generateId()` (UUID v4 sederhana) dan `deepEqual()` untuk perbandingan objek
    - Tulis fungsi `generateId()` yang menghasilkan string UUID unik
    - Tulis fungsi `deepEqual(a, b)` yang membandingkan dua objek secara rekursif
    - _Requirements: 17.3, 18.1_

  - [x] 2.2 Implementasikan lapisan penyimpanan localStorage
    - Tulis fungsi `store.get(key)` yang mem-parse JSON dari localStorage dengan error handling (fallback ke `[]` jika corrupt)
    - Tulis fungsi `store.set(key, data)` yang menyimpan data sebagai JSON string
    - Definisikan konstanta key: `mc_patients`, `mc_encounters`, `mc_clinical_notes`, `mc_problems`, `mc_diag_reports`, `mc_users`
    - _Requirements: 17.3, 20.1_

  - [x]* 2.3 Tulis property test untuk round-trip serialization localStorage
    - **Property 1: DiagnosticReport Round-Trip Serialization**
    - **Validates: Requirements 18.6, 20.3**

- [x] 3. Implementasikan Auth_Module dan seed data demo
  - [x] 3.1 Implementasikan fungsi `seedDemoUsers()`
    - Buat minimal 5 akun demo: `dr.pirman` (Dokter), `dr.naser` (Dokter), 1 Perawat, 1 Admin, dan 1 akun tambahan
    - Setiap akun memiliki field: `userId`, `username`, `passwordHash`, `name`, `role`, `isActive`, `lastLoginAt`
    - Jalankan seed hanya jika `mc_users` kosong
    - _Requirements: 2.6, 3.1_

  - [x] 3.2 Implementasikan `Auth_Module.login(username, password)`
    - Cari user di `mc_users` berdasarkan username (case-insensitive)
    - Verifikasi password dan status `isActive`
    - Jika valid: buat objek Session `{ userId, username, name, role, loginAt }`, simpan ke `sessionStorage['mc_session']`, perbarui `lastLoginAt` di `mc_users`
    - Jika tidak valid: kembalikan `null`
    - _Requirements: 2.1, 2.2, 2.3, 2.7, 4.4_

  - [x] 3.3 Implementasikan `Auth_Module.logout()`, `getSession()`, `isAuthenticated()`, `requireAuth()`
    - `logout()`: hapus `sessionStorage['mc_session']`, redirect ke halaman login
    - `getSession()`: baca dan parse `mc_session` dari sessionStorage
    - `isAuthenticated()`: kembalikan `true` jika sesi valid
    - `requireAuth()`: panggil redirect ke login jika tidak ada sesi
    - _Requirements: 2.4, 2.5_

  - [x] 3.4 Implementasikan `Auth_Module.hasRole(role)` dan `Auth_Module.canAccess(feature)`
    - `hasRole(role)`: bandingkan role sesi dengan role yang diberikan
    - `canAccess(feature)`: implementasikan RBAC matrix sesuai tabel di design document (10 fitur × 3 peran)
    - Fitur yang dicek: `view_patients`, `edit_patients`, `view_demographics`, `soap_subjective`, `soap_objective`, `soap_assessment_plan`, `problem_list`, `view_diag_reports`, `edit_diag_reports`, `manage_users`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x]* 3.5 Tulis property test untuk Auth_Module
    - **Property 7: Sesi Mencerminkan Peran Pengguna** — untuk semua kombinasi username/password valid, sesi yang dihasilkan harus mengandung role yang benar
    - **Validates: Requirements 19.1**

  - [x]* 3.6 Tulis property test untuk penolakan akses Perawat
    - **Property 8: Penolakan Akses Perawat ke Fitur Dokter** — `canAccess()` selalu `false` untuk fitur Dokter/Admin saat role Perawat
    - **Validates: Requirements 19.2, 3.4**

  - [x]* 3.7 Tulis property test untuk logout
    - **Property 9: Logout Membersihkan Sesi** — setelah `logout()`, `sessionStorage` tidak mengandung `mc_session`; logout berulang tidak error
    - **Validates: Requirements 19.3, 2.4**

  - [x]* 3.8 Tulis property test untuk akun nonaktif
    - **Property 10: Akun Nonaktif Ditolak Login** — `login()` selalu `null` untuk akun dengan `isActive === false`
    - **Validates: Requirements 19.4, 4.4**

- [x] 4. Checkpoint — Pastikan semua test Auth_Module lulus
  - Pastikan semua test lulus, tanyakan kepada user jika ada pertanyaan.

- [x] 5. Implementasikan halaman Login dan App Shell dengan RBAC
  - [x] 5.1 Perbarui halaman Login (`#page-login`)
    - Hubungkan tombol "Masuk" dengan `Auth_Module.login()`
    - Tampilkan pesan error dari `#l-err` jika login gagal (tanpa mengungkapkan detail sensitif)
    - Setelah login berhasil, sembunyikan `#page-login` dan tampilkan `#page-app`
    - _Requirements: 2.1, 2.2_

  - [x] 5.2 Implementasikan App Shell dengan navigasi berbasis peran
    - Tampilkan nama dan role dokter/pengguna di sidebar
    - Sembunyikan item navigasi yang tidak sesuai peran (Admin tidak lihat menu klinis, Perawat tidak lihat menu admin)
    - Hubungkan tombol logout dengan `Auth_Module.logout()`
    - Panggil `requireAuth()` saat halaman dimuat
    - _Requirements: 2.4, 2.5, 3.7, 3.8_

  - [x]* 5.3 Tulis unit test untuk halaman Login
    - Test: login berhasil menampilkan app shell
    - Test: login gagal menampilkan pesan error
    - Test: logout mengarahkan ke halaman login
    - _Requirements: 2.1, 2.2, 2.4_

- [x] 6. Implementasikan Admin_Module dan halaman Admin
  - [x] 6.1 Implementasikan `Admin_Module` (CRUD pengguna)
    - `getAllUsers()`: baca semua user dari `mc_users`
    - `addUser(data)`: validasi (nama, username unik, password ≥ 6 karakter, peran valid), buat user baru dengan `generateId()`, simpan ke `mc_users`
    - `deactivateUser(userId)`: set `isActive = false` pada user yang dituju
    - `isUsernameAvailable(username)`: cek keunikan username (case-insensitive)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.2 Implementasikan halaman Admin (`#page-admin`)
    - Tampilkan tabel daftar pengguna: nama, username, peran, status aktif/nonaktif
    - Tampilkan form tambah pengguna dengan validasi inline
    - Tampilkan pesan "Username sudah digunakan" jika duplikat
    - Tampilkan tombol "Nonaktifkan" per baris pengguna
    - Sembunyikan halaman ini dari pengguna non-Admin (cek `canAccess('manage_users')`)
    - _Requirements: 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x]* 6.3 Tulis unit test untuk Admin_Module
    - Test: tambah user dengan data valid berhasil
    - Test: tambah user dengan username duplikat gagal dengan pesan yang benar
    - Test: nonaktifkan user mencegah login
    - Test: password < 6 karakter ditolak
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [x] 7. Implementasikan DiagReport_Module
  - [x] 7.1 Implementasikan fungsi inti DiagReport_Module
    - `getReportsByPatient(patientId)`: filter `mc_diag_reports` berdasarkan `patientId`, urutkan berdasarkan `date` terbaru
    - `getReportsByEncounter(encounterId)`: filter berdasarkan `encounterId`
    - `getReportById(reportId)`: cari laporan berdasarkan `reportId`
    - `addReport(data)`: validasi data, buat `reportId` baru, set `status: 'pending'`, simpan ke `mc_diag_reports`
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 8.1, 8.3_

  - [x]* 7.2 Tulis property test untuk keunikan reportId
    - **Property 2: Keunikan reportId** — tidak ada dua laporan dengan `reportId` yang sama
    - **Validates: Requirements 18.1**

  - [x]* 7.3 Tulis property test untuk validitas field `type`
    - **Property 3: Validitas Field `type`** — field `type` hanya berisi `"lab"` atau `"imaging"`
    - **Validates: Requirements 18.2**

  - [x]* 7.4 Tulis property test untuk validitas field `status`
    - **Property 4: Validitas Field `status`** — field `status` hanya berisi `"pending"`, `"final"`, atau `"amended"`
    - **Validates: Requirements 18.3**

  - [x] 7.5 Implementasikan `DiagReport_Module.updateStatus()` dan transisi status
    - `updateStatus(reportId, newStatus)`: perbarui status laporan
    - Jika status saat ini `final` dan ada pembaruan data, otomatis ubah ke `amended`
    - Status tidak boleh kembali ke `pending` dari `final` atau `amended`
    - Catat `updatedAt` timestamp saat status berubah
    - _Requirements: 5.4, 5.5, 18.4_

  - [x]* 7.6 Tulis property test untuk transisi status `final` → `amended`
    - **Property 5: Transisi Status `final` → `amended`** — laporan `final` yang diperbarui selalu menjadi `amended`, tidak pernah kembali ke `pending`
    - **Validates: Requirements 18.4, 5.5_

  - [x] 7.7 Implementasikan `DiagReport_Module.filterByType()` dan `validateReport()`
    - `filterByType(patientId, type)`: filter laporan berdasarkan `patientId` dan `type` (`lab` atau `imaging`)
    - `validateReport(data)`: validasi field wajib (nama tes/jenis pemeriksaan, tanggal, nilai hasil/temuan), kembalikan `{ valid: boolean, errors: {} }`
    - _Requirements: 5.9, 6.6, 7.1, 7.2, 7.3_

  - [x]* 7.8 Tulis property test untuk konsistensi filter tipe
    - **Property 6: Konsistensi Filter Tipe** — `len(filter(lab)) + len(filter(imaging)) == len(all)` untuk semua pasien
    - **Validates: Requirements 20.4**

  - [x]* 7.9 Tulis property test untuk konsistensi tampilan dan penyimpanan
    - **Property 11: Konsistensi Tampilan dan Penyimpanan DiagnosticReport** — `getReportsByPatient()` selalu mengembalikan jumlah yang sama dengan data di localStorage
    - **Validates: Requirements 20.2**

- [x] 8. Checkpoint — Pastikan semua test DiagReport_Module lulus
  - Pastikan semua test lulus, tanyakan kepada user jika ada pertanyaan.

- [x] 9. Implementasikan UI Diagnostic Reports
  - [x] 9.1 Buat panel Diagnostic Reports (`#page-diag-reports`) dengan tab Lab/Imaging
    - Buat dua tab: "Laboratorium" dan "Radiologi"
    - Saat tab "Laboratorium" aktif, tampilkan hanya laporan bertipe `lab`
    - Saat tab "Radiologi" aktif, tampilkan hanya laporan bertipe `imaging`
    - Setiap item daftar menampilkan: nama tes/jenis pemeriksaan, tanggal, dan badge status (pending/final/amended) dengan warna berbeda
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 9.2 Implementasikan form input hasil laboratorium
    - Form berisi: nama tes, tanggal, parameter hasil (nama parameter, nilai, satuan, nilai referensi), status, interpretasi
    - Tampilkan `ReferenceRange` di samping nilai hasil
    - Tandai nilai di luar rentang referensi dengan indikator visual (merah untuk tinggi, biru untuk rendah) menggunakan field `flag`
    - Validasi field wajib (nama tes, tanggal, nilai hasil) dengan pesan error spesifik per field
    - _Requirements: 5.2, 5.6, 5.7, 5.9_

  - [x] 9.3 Implementasikan form input hasil radiologi/imaging
    - Form berisi: jenis pemeriksaan (dropdown: X-Ray, USG, CT Scan, MRI), bagian tubuh, tanggal, temuan (findings), kesan (impression), status, interpretasi
    - Validasi field wajib (jenis pemeriksaan, tanggal, temuan) dengan pesan error spesifik per field
    - _Requirements: 6.2, 6.3, 6.6_

  - [x] 9.4 Implementasikan tampilan detail DiagnosticReport
    - Saat item diklik, tampilkan detail lengkap laporan (semua field termasuk interpretasi)
    - Tampilkan status dengan badge berwarna berbeda (pending=amber, final=green, amended=blue)
    - Tampilkan tombol "Ubah Status ke Final" jika status `pending` (hanya untuk Dokter)
    - Tampilkan tombol "Edit" yang otomatis mengubah status ke `amended` jika status `final`
    - _Requirements: 5.3, 5.4, 5.5, 5.8, 6.4, 6.5, 7.5_

  - [x] 9.5 Terapkan RBAC pada UI Diagnostic Reports
    - Sembunyikan tombol "Tambah Laporan", "Edit", dan "Ubah Status" dari pengguna Perawat dan Admin
    - Perawat hanya dapat melihat daftar dan detail laporan
    - Admin tidak dapat mengakses halaman Diagnostic Reports sama sekali
    - _Requirements: 3.2, 3.3, 3.4, 3.6_

- [x] 10. Integrasi Diagnostic Reports dengan Encounter
  - [x] 10.1 Hubungkan DiagnosticReport dengan Encounter saat pembuatan
    - Saat form laporan dibuka dari konteks Encounter tertentu, otomatis isi `encounterId`
    - Izinkan pembuatan laporan tanpa `encounterId` (standalone) dari halaman Diagnostic Reports utama
    - _Requirements: 8.1, 8.3_

  - [x] 10.2 Tampilkan daftar DiagnosticReport terkait di detail Encounter
    - Di panel detail Encounter, tambahkan seksi "Laporan Diagnostik Terkait"
    - Gunakan `getReportsByEncounter(encounterId)` untuk mengambil data
    - Tampilkan ringkasan setiap laporan (nama tes/jenis, tanggal, status)
    - _Requirements: 8.2_

- [x] 11. Perbarui fitur yang sudah ada dengan RBAC
  - [x] 11.1 Terapkan RBAC pada form SOAP Notes
    - Perawat hanya dapat mengisi bagian Objective (tanda vital); sembunyikan/disable field Subjective, Assessment, dan Plan
    - Dokter dapat mengisi semua bagian SOAP
    - Admin tidak dapat mengakses form SOAP
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 11.2 Terapkan RBAC pada manajemen pasien
    - Sembunyikan tombol "Tambah Pasien" dan "Edit Pasien" dari pengguna Perawat
    - Admin dapat menambah dan mengedit data pasien
    - _Requirements: 3.2, 3.5_

  - [x] 11.3 Terapkan RBAC pada Problem List
    - Sembunyikan form input Problem List dari pengguna Perawat dan Admin
    - Hanya Dokter yang dapat menambah dan mengubah status Problem
    - _Requirements: 3.3, 3.4_

  - [x]* 11.4 Tulis unit test untuk RBAC pada fitur yang sudah ada
    - Test: Perawat tidak dapat melihat form Problem List
    - Test: Perawat dapat mengisi Objective SOAP
    - Test: Admin tidak dapat mengakses SOAP Notes
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 12. Checkpoint — Pastikan semua test integrasi lulus
  - Pastikan semua test lulus, tanyakan kepada user jika ada pertanyaan.

- [x] 13. Buat dokumentasi teknis — Diagram UML yang diperbarui
  - [x] 13.1 Perbarui `docs/use-case-diagram.puml`
    - Tambahkan aktor baru: Perawat dan Admin (menggantikan aktor tunggal Dokter)
    - Tambahkan use case baru: "Lihat Diagnostic Reports", "Input Hasil Lab", "Input Hasil Radiologi", "Kelola Akun Pengguna", "Input Tanda Vital"
    - Pertahankan semua use case yang sudah ada
    - Pastikan sintaks PlantUML valid dan diagram dapat di-render tanpa elemen tumpang tindih
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 13.2 Perbarui `docs/class-diagram.puml`
    - Tambahkan kelas `DiagnosticReport` dengan atribut dan metode sesuai design document
    - Tambahkan kelas `User` dengan atribut dan metode sesuai design document
    - Definisikan relasi `User` → `Doctor` (spesialisasi) dan `DiagnosticReport` → `Patient`, `Encounter`
    - Pertahankan semua kelas yang sudah ada (Patient, Doctor, Encounter, ClinicalNote, Problem)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 13.3 Perbarui `docs/sequence-diagram.puml`
    - Tambahkan sequence "Input Hasil Diagnostik" (Dokter → UI → Controller → Service → DB)
    - Tambahkan sequence "Login dengan RBAC" (menunjukkan pengecekan peran setelah autentikasi)
    - Pertahankan semua sequence yang sudah ada
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 14. Buat dokumentasi teknis — Diagram baru
  - [x] 14.1 Buat `docs/component-diagram.puml`
    - Cantumkan semua modul utama sebagai komponen: Auth_Module, Patient_Module, Clinical_Module, DiagReport_Module, Admin_Module
    - Gambarkan dependensi antar komponen dengan arah yang benar
    - Cantumkan komponen penyimpanan data (localStorage/sessionStorage) sebagai komponen terpisah
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 14.2 Buat `docs/package-diagram.puml`
    - Sediakan package diagram versi simple (garis lurus) pada `docs/package-diagram.puml`
    - Sediakan package diagram versi detailed pada `docs/package-diagram-detailed.puml`
    - Gambarkan dependensi antar paket dengan arah yang benar
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 14.3 Buat `docs/dfd-level0.puml`
    - Gambarkan sistem sebagai satu proses tunggal dengan semua entitas eksternal (Dokter, Perawat, Admin) dan aliran data utama
    - _Requirements: 14.1, 14.3_

  - [x] 14.4 Buat `docs/dfd-level1.puml`
    - Dekomposisi sistem menjadi proses-proses utama: Autentikasi, Manajemen Pasien, Catatan Klinis, Diagnostic Reports, Administrasi
    - Cantumkan data store untuk setiap proses yang menyimpan atau membaca data
    - _Requirements: 14.2, 14.4_

- [x] 15. Buat dokumentasi teknis — Laporan dan README
  - [x] 15.1 Buat `docs/laporan.md`
    - Tulis laporan dalam Bahasa Indonesia dengan bagian: Pendahuluan, Deskripsi Sistem, Arsitektur Sistem, Desain Antarmuka, Desain Data, Desain Keamanan, Diagram (referensi ke file PlantUML), Kesimpulan
    - Deskripsikan setiap fitur utama (RBAC, Diagnostic Reports, Clinical Notes) dalam bagian terpisah
    - Sertakan tabel perbandingan fitur antara MediChart v0 dan MediChart v2
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 15.2 Perbarui `README.md`
    - Cantumkan deskripsi proyek, fitur-fitur utama, cara menjalankan, struktur direktori, akun demo (dalam tabel), dan teknologi yang digunakan
    - Tambahkan bagian "Changelog" yang mencatat perbedaan antara v0 dan v2
    - Tulis dalam Bahasa Indonesia
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

  - [x] 15.3 Buat template laporan formal (LaTeX)
    - Buat file `docs/laporan.tex` dengan struktur laporan akademik yang setara dengan `docs/laporan.md`
    - Sertakan bagian lampiran source PlantUML untuk kebutuhan dokumentasi formal
    - _Requirements: 15.6_

  - [x] 15.4 Buat template dokumen ODT/Word-ready
    - Buat file `docs/template-laporan-odt.md` dengan struktur heading dan isi siap salin ke Word/ODT
    - _Requirements: 15.7_

  - [x] 15.5 Buat makalah proyek menyeluruh
    - Buat file `docs/makalah.md` dengan gaya laporan akademik yang lebih deskriptif dari `docs/laporan.md`
    - Cakup konteks proyek secara keseluruhan (analisis, desain, implementasi, validasi, pembahasan, kesimpulan)
    - _Requirements: 15.8_

- [x] 16. Verifikasi akhir dan polish
  - [x] 16.1 Verifikasi konsistensi visual dan responsivitas
    - Pastikan semua elemen UI baru (tab, badge status, form lab/imaging) menggunakan design tokens yang sudah ada (warna, tipografi, border-radius)
    - Verifikasi layout responsif pada lebar layar < 820px
    - _Requirements: 17.5, 17.6_

  - [x] 16.2 Verifikasi konsistensi data lintas modul
    - Pastikan DiagnosticReport yang terkait dengan pasien yang dihapus tidak lagi ditampilkan di antarmuka
    - Verifikasi bahwa jumlah laporan di daftar selalu konsisten dengan data di localStorage
    - _Requirements: 20.1, 20.2_

  - [x]* 16.3 Tulis unit test smoke test untuk integrasi keseluruhan
    - Test: buka `medichart.html`, login dengan semua akun demo, navigasi antar halaman tanpa error
    - Test: filter tab Lab/Imaging menampilkan data yang benar
    - Test: integrasi Encounter-DiagReport menampilkan laporan terkait
    - _Requirements: 17.4, 8.2_

- [x] 17. Final Checkpoint — Pastikan semua test lulus
  - Pastikan semua test lulus, tanyakan kepada user jika ada pertanyaan.

## Notes

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk keterlacakan
- Property tests menggunakan library **fast-check** (`npm install --save-dev fast-check`)
- Karena sistem adalah SPA monolitik, logika bisnis perlu diekstrak ke modul JS terpisah agar dapat diuji secara terisolasi dari DOM dan localStorage
- Format tag property test: `// Feature: medichart-emr-v2, Property {N}: {property_text}`
- Minimum 100 iterasi per property test (`{ numRuns: 100 }`)
