# Makalah Proyek MediChart EMR v2

Dokumen ini disusun agar konsisten dengan dua acuan utama:

1. Struktur laporan formal pada `docs/laporan.tex`
2. Urutan bab template ODT/Word pada `docs/template-laporan-odt.md`

## Cover

- Judul: Laporan Desain Sistem MediChart EMR v2
- Mata Kuliah: Konsep Teknologi Informasi
- Kelompok: [Isi Nama Kelompok]
- Anggota: [Isi 5-7 Nama]
- Dosen: [Isi Nama Dosen]
- Tanggal: [Isi Tanggal]

## Daftar Isi

Gunakan fitur daftar isi otomatis jika dokumen ini dipindahkan ke ODT/Word/PDF.

## 1. Pendahuluan

MediChart EMR v2 merupakan pengembangan lanjutan dari sistem rekam medis berbasis web single-page. Fokus utama pengembangan adalah menambah kontrol akses berbasis peran (RBAC), memperkaya data klinis dengan Diagnostic Reports, serta menyiapkan dokumentasi teknis yang lengkap untuk kebutuhan akademik.

Dalam konteks tugas mata kuliah, proyek ini tidak hanya menekankan implementasi antarmuka, tetapi juga keterlacakan desain dari kebutuhan hingga artefak UML/DFD.

## 2. Deskripsi Sistem

Sistem berjalan sepenuhnya di browser dengan pendekatan client-side only. Data klinis dan administratif disimpan di localStorage, sedangkan sesi login disimpan di sessionStorage. Tidak ada backend server dalam implementasi saat ini.

Peran pengguna yang didukung:

- Dokter: akses penuh ke fitur klinis
- Perawat: akses melihat data klinis terbatas dan input vital signs
- Admin: manajemen akun pengguna dan data pasien

Fitur utama sistem:

1. Login/logout dan manajemen sesi
2. Role-Based Access Control (RBAC)
3. Manajemen pasien dan encounter
4. SOAP notes dan problem list
5. Diagnostic Reports (Lab dan Radiologi)
6. Administrasi akun pengguna

## 3. Arsitektur Sistem

Arsitektur MediChart EMR v2 menggunakan pola SPA monolitik:

- Layer presentasi: login page, app shell, panel pasien, panel diagnostik, panel admin
- Layer logika bisnis: Auth_Module, Patient_Module, Clinical_Module, DiagReport_Module, Admin_Module
- Layer data: localStorage dan sessionStorage

Referensi diagram arsitektur:

- `docs/component-diagram.puml`
- `docs/package-diagram.puml` (simple)
- `docs/package-diagram-detailed.puml` (detailed)

## 4. Desain Antarmuka

Desain antarmuka disusun agar alur pengguna jelas berdasarkan peran.

1. Pengguna login pada halaman awal
2. Sistem menampilkan menu sesuai hak akses
3. Pengguna mengakses modul pasien/klinis/diagnostik/admin sesuai peran

Komponen antarmuka inti:

- LoginPage
- AppShell
- PatientListPanel
- PatientDetailPanel
- DiagReportPanel
- AdminPanel

Responsivitas didukung agar tata letak tetap dapat digunakan pada layar di bawah 820px.

## 5. Desain Data

Entitas utama sistem:

- User
- Patient
- Encounter
- ClinicalNote
- Problem
- DiagnosticReport

Relasi data memastikan bahwa encounter, problem, dan diagnostic report terhubung ke pasien. Diagnostic report juga dapat dikaitkan langsung ke encounter untuk mempertahankan konteks klinis pemeriksaan.

Referensi model relasi:

- `docs/class-diagram.puml`

## 6. Desain Keamanan

Aspek keamanan utama:

1. Autentikasi username/password
2. Otorisasi RBAC tiga peran
3. Pembatasan komponen UI sesuai role
4. Penolakan aksi di luar hak akses
5. Manajemen sesi aktif melalui sessionStorage

Dengan pendekatan ini, risiko akses tidak sah pada fitur klinis dapat ditekan pada level alur aplikasi.

## 7. Diagram UML/DFD

Dokumentasi diagram yang disediakan:

1. Use Case Diagram (`docs/use-case-diagram.puml`)
2. Class Diagram (`docs/class-diagram.puml`)
3. Sequence Diagram (`docs/sequence-diagram.puml`)
4. Component Diagram (`docs/component-diagram.puml`)
5. Package Diagram Simple (`docs/package-diagram.puml`)
6. Package Diagram Detailed (`docs/package-diagram-detailed.puml`)
7. DFD Level 0 (`docs/dfd-level0.puml`)
8. DFD Level 1 (`docs/dfd-level1.puml`)

Lampiran source PlantUML lengkap tersedia pada README untuk kebutuhan copy-paste ke laporan formal.

## 8. Perbandingan v0 dan v2

| Aspek | MediChart v0 | MediChart v2 |
|---|---|---|
| Autentikasi | Belum ada RBAC | Login, sesi, dan role-based access |
| Peran pengguna | Satu aktor dokter | Dokter, Perawat, Admin |
| Data klinis | SOAP dan Problem List dasar | SOAP, Problem List, Encounter, Diagnostic Reports |
| Manajemen pengguna | Tidak ada | Tersedia untuk Admin |
| Dokumentasi | Diagram dasar | UML/DFD diperbarui + laporan formal |

## 9. Validasi dan Pengujian

Validasi dilakukan melalui:

1. Pengecekan sintaks JavaScript
2. Verifikasi keberadaan artefak dokumentasi
3. Validasi marker PlantUML
4. Smoke test alur utama login, navigasi, dan modul diagnostik

Hasil umum menunjukkan konsistensi antara implementasi, spesifikasi, dan dokumentasi akhir.

## 10. Kesimpulan

MediChart EMR v2 berhasil memperluas fungsi sistem dari prototipe dasar menjadi simulasi EMR yang lebih lengkap untuk kebutuhan akademik. Penambahan RBAC dan Diagnostic Reports meningkatkan kualitas pemodelan proses klinis, sementara paket dokumentasi formal (Markdown, LaTeX, ODT/Word-ready, dan lampiran PlantUML) memperkuat kesiapan pengumpulan tugas.

## Lampiran

### A. Daftar Dokumen Pendukung

- `docs/laporan.md`
- `docs/laporan.tex`
- `docs/template-laporan-odt.md`
- `docs/panduan-tim.md`
- `docs/validasi-dan-uji.md`

### B. Catatan Pengisian Sebelum Submit

Lengkapi identitas kelompok pada bagian cover dan sesuaikan format akhir mengikuti ketentuan kampus.