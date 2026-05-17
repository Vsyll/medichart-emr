# Requirements Document

## Pendahuluan

MediChart EMR v2 adalah pengembangan lanjutan dari sistem rekam medis elektronik (Electronic Medical Record) MediChart berbasis web single-page (HTML/CSS/JS murni, tanpa framework). Versi ini memperluas sistem yang sudah ada dengan dua kategori fitur baru: **Diagnostic Reports** (hasil laboratorium dan radiologi) serta **Authentication & Authorization** berbasis peran (Role-Based Access Control). Selain itu, versi ini menghasilkan dokumentasi teknis lengkap berupa diagram UML/DFD yang diperbarui, laporan desain sistem, dan README yang komprehensif, serta mengarsipkan versi lama ke folder `archive/medichart-v0/`.

Sistem ini digunakan di lingkungan klinis oleh tiga peran utama: Dokter, Perawat, dan Admin, masing-masing dengan hak akses yang berbeda.

---

## Glosarium

- **System**: Sistem MediChart EMR v2 secara keseluruhan.
- **Auth_Module**: Modul autentikasi dan otorisasi yang mengelola login, sesi, dan hak akses.
- **Patient_Module**: Modul manajemen data pasien (demographics, daftar pasien, pencarian).
- **Clinical_Module**: Modul catatan klinis (SOAP notes, Problem List, Encounter).
- **DiagReport_Module**: Modul laporan diagnostik (hasil lab dan radiologi).
- **Admin_Module**: Modul administrasi pengguna dan manajemen data pasien.
- **Doc_Module**: Modul dokumentasi teknis (diagram UML/DFD, laporan, README).
- **Archive_Module**: Modul pengarsipan versi lama sistem.
- **Dokter**: Pengguna dengan peran dokter; memiliki akses penuh ke semua fitur klinis.
- **Perawat**: Pengguna dengan peran perawat; dapat melihat data pasien dan menginput tanda vital.
- **Admin**: Pengguna dengan peran administrator; mengelola akun pengguna dan data pasien.
- **DiagnosticReport**: Entitas yang merepresentasikan hasil pemeriksaan laboratorium atau radiologi/imaging.
- **LabResult**: Hasil pemeriksaan laboratorium, bagian dari DiagnosticReport.
- **ImagingResult**: Hasil pemeriksaan radiologi/imaging, bagian dari DiagnosticReport.
- **ReportStatus**: Status laporan diagnostik: `pending`, `final`, atau `amended`.
- **ReferenceRange**: Rentang nilai normal untuk parameter laboratorium.
- **Interpretation**: Catatan interpretasi dokter terhadap hasil diagnostik.
- **RBAC**: Role-Based Access Control — mekanisme kontrol akses berbasis peran.
- **Session**: Sesi login pengguna yang aktif di browser.
- **SOAP**: Format catatan klinis: Subjective, Objective, Assessment, Plan.
- **ICD**: International Classification of Diseases — kode diagnosis standar.
- **PlantUML**: Bahasa markup untuk membuat diagram UML secara tekstual.
- **DFD**: Data Flow Diagram — diagram aliran data Level 0 dan Level 1.

---

## Requirements

---

### Requirement 1: Pengarsipan Versi Lama

**User Story:** Sebagai Admin, saya ingin versi lama sistem diarsipkan secara terstruktur, sehingga kode lama tetap dapat diakses tanpa mengganggu pengembangan versi baru.

#### Acceptance Criteria

1. THE Archive_Module SHALL menyalin seluruh file versi lama sistem (termasuk `medichart.html`, `assets/`, dan `docs/` versi lama) ke dalam folder `archive/medichart-v0/` sebelum implementasi fitur baru dimulai.
2. WHEN proses pengarsipan selesai, THE Archive_Module SHALL mempertahankan struktur direktori asli di dalam folder `archive/medichart-v0/`.
3. IF folder `archive/medichart-v0/` sudah ada, THEN THE Archive_Module SHALL menimpa isinya dengan versi terbaru dari file yang diarsipkan.
4. THE Archive_Module SHALL menyertakan file `archive/medichart-v0/README.md` yang menjelaskan bahwa folder tersebut adalah arsip versi lama.

---

### Requirement 2: Autentikasi Pengguna

**User Story:** Sebagai pengguna sistem, saya ingin dapat login dengan username dan password, sehingga hanya pengguna yang berwenang yang dapat mengakses sistem.

#### Acceptance Criteria

1. WHEN pengguna mengirimkan username dan password yang valid, THE Auth_Module SHALL membuat sesi login dan mengarahkan pengguna ke halaman utama sesuai perannya.
2. WHEN pengguna mengirimkan username atau password yang tidak valid, THE Auth_Module SHALL menampilkan pesan kesalahan yang deskriptif tanpa mengungkapkan informasi sensitif.
3. THE Auth_Module SHALL menyimpan data sesi di `sessionStorage` browser selama sesi aktif.
4. WHEN pengguna menekan tombol logout, THE Auth_Module SHALL menghapus data sesi dan mengarahkan pengguna ke halaman login.
5. IF sesi tidak ditemukan saat pengguna mengakses halaman yang dilindungi, THEN THE Auth_Module SHALL mengarahkan pengguna ke halaman login.
6. THE Auth_Module SHALL mendukung minimal 5 akun demo: 1 Dokter (dr.pirman), 1 Dokter (dr.naser), 1 Perawat, dan 1 Admin.
7. WHEN pengguna berhasil login, THE Auth_Module SHALL mencatat timestamp login terakhir pada data akun pengguna.

---

### Requirement 3: Otorisasi Berbasis Peran (RBAC)

**User Story:** Sebagai Admin, saya ingin setiap pengguna hanya dapat mengakses fitur sesuai perannya, sehingga keamanan dan integritas data klinis terjaga.

#### Acceptance Criteria

1. THE Auth_Module SHALL mendukung tepat 3 peran: `Dokter`, `Perawat`, dan `Admin`.
2. WHILE pengguna berperan sebagai Dokter, THE Auth_Module SHALL mengizinkan akses penuh ke semua fitur klinis: melihat dan mengedit demographics, SOAP notes, Problem List, Diagnostic Reports, dan Encounter history.
3. WHILE pengguna berperan sebagai Perawat, THE Auth_Module SHALL mengizinkan akses untuk melihat data demographics pasien, melihat Encounter history, dan menginput tanda vital pada bagian Objective di SOAP notes.
4. WHILE pengguna berperan sebagai Perawat, THE Auth_Module SHALL mencegah akses ke fitur input diagnosis (Problem List), input Assessment dan Plan pada SOAP notes, serta manajemen Diagnostic Reports.
5. WHILE pengguna berperan sebagai Admin, THE Auth_Module SHALL mengizinkan akses ke manajemen akun pengguna (tambah, edit, nonaktifkan) dan manajemen data pasien (tambah, edit).
6. WHILE pengguna berperan sebagai Admin, THE Auth_Module SHALL mencegah akses ke fitur klinis seperti SOAP notes, Problem List, dan Diagnostic Reports.
7. IF pengguna mencoba mengakses fitur di luar hak aksesnya, THEN THE Auth_Module SHALL menampilkan pesan "Akses ditolak" dan tidak menampilkan data yang diminta.
8. THE Auth_Module SHALL menyembunyikan elemen UI (tombol, menu, form) yang tidak sesuai dengan peran pengguna yang sedang login.

---

### Requirement 4: Manajemen Pengguna oleh Admin

**User Story:** Sebagai Admin, saya ingin dapat mengelola akun pengguna sistem, sehingga akses ke sistem dapat dikontrol dengan baik.

#### Acceptance Criteria

1. WHILE pengguna berperan sebagai Admin, THE Admin_Module SHALL menampilkan daftar semua akun pengguna beserta nama, username, peran, dan status aktif/nonaktif.
2. WHEN Admin mengisi form tambah pengguna dengan data yang valid (nama, username unik, password, peran), THE Admin_Module SHALL membuat akun pengguna baru dan menampilkannya di daftar.
3. IF Admin mengisi username yang sudah digunakan, THEN THE Admin_Module SHALL menampilkan pesan kesalahan "Username sudah digunakan" dan tidak membuat akun baru.
4. WHEN Admin menonaktifkan akun pengguna, THE Admin_Module SHALL mencegah pengguna tersebut login ke sistem.
5. THE Admin_Module SHALL memvalidasi bahwa password akun baru memiliki panjang minimal 6 karakter.

---

### Requirement 5: Diagnostic Reports — Hasil Laboratorium

**User Story:** Sebagai Dokter, saya ingin dapat mencatat dan melihat hasil pemeriksaan laboratorium pasien, sehingga data diagnostik tersimpan dalam rekam medis secara terstruktur.

#### Acceptance Criteria

1. WHEN Dokter membuka halaman Diagnostic Reports untuk pasien tertentu, THE DiagReport_Module SHALL menampilkan daftar semua hasil laboratorium pasien tersebut, diurutkan berdasarkan tanggal terbaru.
2. WHEN Dokter mengisi form hasil laboratorium dengan data yang valid (nama tes, tanggal, nilai hasil, satuan, nilai referensi, status), THE DiagReport_Module SHALL menyimpan DiagnosticReport baru dengan tipe `lab` dan menampilkannya di daftar.
3. THE DiagReport_Module SHALL mendukung tepat 3 nilai ReportStatus untuk setiap DiagnosticReport: `pending`, `final`, dan `amended`.
4. WHEN Dokter mengubah status DiagnosticReport dari `pending` ke `final`, THE DiagReport_Module SHALL memperbarui status dan mencatat timestamp perubahan.
5. WHEN Dokter mengubah DiagnosticReport yang sudah berstatus `final`, THE DiagReport_Module SHALL mengubah statusnya menjadi `amended` secara otomatis.
6. THE DiagReport_Module SHALL menampilkan nilai referensi (ReferenceRange) di samping nilai hasil untuk setiap parameter laboratorium.
7. WHERE nilai hasil laboratorium berada di luar ReferenceRange, THE DiagReport_Module SHALL menandai nilai tersebut dengan indikator visual yang berbeda (misalnya warna merah untuk tinggi, biru untuk rendah).
8. WHEN Dokter menambahkan interpretasi pada DiagnosticReport, THE DiagReport_Module SHALL menyimpan teks Interpretation dan menampilkannya di detail laporan.
9. IF form hasil laboratorium dikirim dengan field wajib yang kosong (nama tes, tanggal, nilai hasil), THEN THE DiagReport_Module SHALL menampilkan pesan validasi yang spesifik untuk setiap field yang kosong.

---

### Requirement 6: Diagnostic Reports — Hasil Radiologi/Imaging

**User Story:** Sebagai Dokter, saya ingin dapat mencatat dan melihat hasil pemeriksaan radiologi pasien, sehingga data imaging tersimpan dalam rekam medis secara terstruktur.

#### Acceptance Criteria

1. WHEN Dokter membuka halaman Diagnostic Reports untuk pasien tertentu, THE DiagReport_Module SHALL menampilkan daftar semua hasil radiologi pasien tersebut, terpisah dari hasil laboratorium.
2. WHEN Dokter mengisi form hasil radiologi dengan data yang valid (jenis pemeriksaan, tanggal, temuan/findings, kesan/impression, status), THE DiagReport_Module SHALL menyimpan DiagnosticReport baru dengan tipe `imaging` dan menampilkannya di daftar.
3. THE DiagReport_Module SHALL mendukung jenis pemeriksaan imaging minimal: X-Ray, USG, CT Scan, dan MRI.
4. WHEN Dokter menambahkan interpretasi pada ImagingResult, THE DiagReport_Module SHALL menyimpan teks Interpretation dan menampilkannya di detail laporan.
5. THE DiagReport_Module SHALL menampilkan status (pending/final/amended) secara visual berbeda untuk setiap ImagingResult.
6. IF form hasil radiologi dikirim dengan field wajib yang kosong (jenis pemeriksaan, tanggal, temuan), THEN THE DiagReport_Module SHALL menampilkan pesan validasi yang spesifik untuk setiap field yang kosong.

---

### Requirement 7: Navigasi dan Tampilan Diagnostic Reports

**User Story:** Sebagai Dokter atau Perawat, saya ingin dapat menavigasi antara hasil lab dan radiologi dengan mudah, sehingga saya dapat menemukan informasi diagnostik yang dibutuhkan dengan cepat.

#### Acceptance Criteria

1. THE DiagReport_Module SHALL menyediakan tab atau filter untuk memisahkan tampilan antara hasil laboratorium (`lab`) dan hasil radiologi (`imaging`).
2. WHEN pengguna memilih tab "Laboratorium", THE DiagReport_Module SHALL menampilkan hanya DiagnosticReport bertipe `lab`.
3. WHEN pengguna memilih tab "Radiologi", THE DiagReport_Module SHALL menampilkan hanya DiagnosticReport bertipe `imaging`.
4. THE DiagReport_Module SHALL menampilkan ringkasan setiap DiagnosticReport dalam daftar, mencakup: nama tes/jenis pemeriksaan, tanggal, dan status.
5. WHEN pengguna mengklik item DiagnosticReport di daftar, THE DiagReport_Module SHALL menampilkan detail lengkap laporan tersebut.

---

### Requirement 8: Integrasi Diagnostic Reports dengan Encounter

**User Story:** Sebagai Dokter, saya ingin hasil diagnostik terhubung dengan kunjungan (Encounter) pasien, sehingga konteks klinis setiap pemeriksaan dapat ditelusuri.

#### Acceptance Criteria

1. THE DiagReport_Module SHALL mengaitkan setiap DiagnosticReport dengan encounterId yang relevan saat dibuat.
2. WHEN Dokter melihat detail Encounter, THE Clinical_Module SHALL menampilkan daftar DiagnosticReport yang terkait dengan Encounter tersebut.
3. THE DiagReport_Module SHALL memungkinkan DiagnosticReport dibuat tanpa encounterId (standalone) untuk hasil yang diterima di luar kunjungan.

---

### Requirement 9: Diagram UML — Use Case Diagram (Diperbarui)

**User Story:** Sebagai pengembang, saya ingin Use Case Diagram yang mencerminkan semua aktor dan use case baru, sehingga dokumentasi sistem tetap akurat dan dapat digunakan sebagai referensi.

#### Acceptance Criteria

1. THE Doc_Module SHALL menghasilkan file `docs/use-case-diagram.puml` yang valid secara sintaks PlantUML.
2. THE Doc_Module SHALL mencantumkan semua aktor baru: Dokter, Perawat, dan Admin (menggantikan aktor tunggal Dokter pada versi lama).
3. THE Doc_Module SHALL mencantumkan use case baru: "Lihat Diagnostic Reports", "Input Hasil Lab", "Input Hasil Radiologi", "Kelola Akun Pengguna", dan "Input Tanda Vital".
4. THE Doc_Module SHALL mempertahankan semua use case yang sudah ada dari versi lama.
5. WHEN file `docs/use-case-diagram.puml` di-render, THE Doc_Module SHALL menghasilkan diagram yang dapat dibaca dan tidak memiliki elemen yang tumpang tindih secara berlebihan.

---

### Requirement 10: Diagram UML — Class Diagram (Diperbarui)

**User Story:** Sebagai pengembang, saya ingin Class Diagram yang mencerminkan entitas baru, sehingga struktur data sistem terdokumentasi dengan lengkap.

#### Acceptance Criteria

1. THE Doc_Module SHALL menghasilkan file `docs/class-diagram.puml` yang valid secara sintaks PlantUML.
2. THE Doc_Module SHALL menambahkan kelas `DiagnosticReport` dengan atribut: `reportId`, `patientId`, `encounterId`, `type` (lab/imaging), `date`, `status` (pending/final/amended), `interpretation`, dan metode `addReport()`, `updateStatus()`.
3. THE Doc_Module SHALL menambahkan kelas `User` dengan atribut: `userId`, `username`, `passwordHash`, `name`, `role` (Dokter/Perawat/Admin), `isActive`, dan metode `login()`, `logout()`.
4. THE Doc_Module SHALL mempertahankan semua kelas yang sudah ada (Patient, Doctor, Encounter, ClinicalNote, Problem) dan memperbarui relasi yang relevan.
5. THE Doc_Module SHALL mendefinisikan relasi antara `User` dan `Doctor` (Doctor adalah spesialisasi dari User), serta relasi antara `DiagnosticReport` dan `Patient`, `Encounter`.

---

### Requirement 11: Diagram UML — Sequence Diagram (Diperbarui)

**User Story:** Sebagai pengembang, saya ingin Sequence Diagram yang mencakup alur baru, sehingga interaksi antar komponen sistem terdokumentasi dengan lengkap.

#### Acceptance Criteria

1. THE Doc_Module SHALL menghasilkan file `docs/sequence-diagram.puml` yang valid secara sintaks PlantUML.
2. THE Doc_Module SHALL menambahkan sequence untuk alur "Input Hasil Diagnostik" (Dokter → UI → Controller → Service → DB).
3. THE Doc_Module SHALL menambahkan sequence untuk alur "Login dengan RBAC" yang menunjukkan pengecekan peran setelah autentikasi berhasil.
4. THE Doc_Module SHALL mempertahankan semua sequence yang sudah ada dari versi lama.

---

### Requirement 12: Diagram Baru — Component Diagram

**User Story:** Sebagai pengembang, saya ingin Component Diagram yang menggambarkan arsitektur komponen sistem, sehingga dependensi antar modul dapat dipahami dengan jelas.

#### Acceptance Criteria

1. THE Doc_Module SHALL menghasilkan file `docs/component-diagram.puml` yang valid secara sintaks PlantUML.
2. THE Doc_Module SHALL mencantumkan semua modul utama sebagai komponen: Auth_Module, Patient_Module, Clinical_Module, DiagReport_Module, Admin_Module.
3. THE Doc_Module SHALL menggambarkan dependensi antar komponen dengan arah yang benar (misalnya Clinical_Module bergantung pada Patient_Module).
4. THE Doc_Module SHALL mencantumkan komponen penyimpanan data (localStorage/in-memory store) sebagai komponen terpisah.

---

### Requirement 13: Diagram Baru — Package Diagram

**User Story:** Sebagai pengembang, saya ingin Package Diagram (helicopter view) yang menggambarkan struktur paket sistem secara keseluruhan, sehingga organisasi kode dapat dipahami dengan cepat.

#### Acceptance Criteria

1. THE Doc_Module SHALL menghasilkan file `docs/package-diagram.puml` yang valid secara sintaks PlantUML.
2. THE Doc_Module SHALL mengelompokkan komponen ke dalam paket-paket logis: `Presentation`, `Business Logic`, `Data`, dan `Security`.
3. THE Doc_Module SHALL menggambarkan dependensi antar paket dengan arah yang benar.

---

### Requirement 14: Diagram Baru — DFD Level 0 dan Level 1

**User Story:** Sebagai pengembang, saya ingin Data Flow Diagram Level 0 dan Level 1 yang menggambarkan aliran data dalam sistem, sehingga proses bisnis dan aliran informasi dapat dipahami oleh pemangku kepentingan non-teknis.

#### Acceptance Criteria

1. THE Doc_Module SHALL menghasilkan file `docs/dfd-level0.puml` yang valid secara sintaks PlantUML, menggambarkan sistem sebagai satu proses tunggal dengan semua entitas eksternal dan aliran data utama.
2. THE Doc_Module SHALL menghasilkan file `docs/dfd-level1.puml` yang valid secara sintaks PlantUML, mendekomposisi sistem menjadi proses-proses utama: Autentikasi, Manajemen Pasien, Catatan Klinis, Diagnostic Reports, dan Administrasi.
3. THE Doc_Module SHALL mencantumkan semua entitas eksternal pada DFD Level 0: Dokter, Perawat, Admin.
4. THE Doc_Module SHALL menggambarkan data store pada DFD Level 1 untuk setiap proses yang menyimpan atau membaca data.

---

### Requirement 15: Laporan Desain Sistem

**User Story:** Sebagai pengembang, saya ingin laporan desain sistem yang komprehensif, sehingga dokumentasi dapat dijadikan dasar pembuatan presentasi atau laporan formal.

#### Acceptance Criteria

1. THE Doc_Module SHALL menghasilkan file `docs/laporan.md` dalam format Markdown yang terstruktur.
2. THE Doc_Module SHALL mencantumkan bagian-bagian berikut dalam laporan: Pendahuluan, Deskripsi Sistem, Arsitektur Sistem, Desain Antarmuka, Desain Data, Desain Keamanan, Diagram (referensi ke file PlantUML), dan Kesimpulan.
3. THE Doc_Module SHALL mendeskripsikan setiap fitur utama (RBAC, Diagnostic Reports, Clinical Notes) dalam bagian yang terpisah.
4. THE Doc_Module SHALL menyertakan tabel perbandingan fitur antara MediChart v0 dan MediChart v2.
5. THE Doc_Module SHALL ditulis dalam Bahasa Indonesia.

---

### Requirement 16: README yang Komprehensif

**User Story:** Sebagai pengembang atau pengguna baru, saya ingin README yang informatif, sehingga saya dapat memahami dan menjalankan sistem dengan cepat.

#### Acceptance Criteria

1. THE Doc_Module SHALL menghasilkan file `README.md` yang mencakup: deskripsi proyek, fitur-fitur utama, cara menjalankan, struktur direktori, akun demo, dan teknologi yang digunakan.
2. THE Doc_Module SHALL mencantumkan semua akun demo beserta username, password, dan perannya dalam tabel yang terformat.
3. THE Doc_Module SHALL menyertakan bagian "Changelog" yang mencatat perbedaan antara v0 dan v2.
4. THE Doc_Module SHALL ditulis dalam Bahasa Indonesia.

---

### Requirement 17: Implementasi Web Demo (medichart.html)

**User Story:** Sebagai pengguna, saya ingin mengakses semua fitur baru melalui antarmuka web yang sudah ada, sehingga sistem dapat digunakan langsung di browser tanpa instalasi tambahan.

#### Acceptance Criteria

1. THE System SHALL mengimplementasikan semua fitur baru (RBAC, Diagnostic Reports) dalam satu file `medichart.html` yang berdiri sendiri (self-contained: HTML, CSS, JS dalam satu file).
2. THE System SHALL mempertahankan semua fitur yang sudah ada (Login, Patient List, Demographics, SOAP Notes, Problem List, Encounter History) dalam versi baru.
3. THE System SHALL menggunakan `localStorage` sebagai mekanisme penyimpanan data sisi klien untuk semua entitas (User, Patient, Encounter, DiagnosticReport).
4. WHEN halaman `medichart.html` dibuka di browser modern (Chrome, Firefox, Edge versi terbaru), THE System SHALL berfungsi penuh tanpa error di konsol browser.
5. THE System SHALL mempertahankan desain visual yang konsisten dengan versi lama (design tokens, tipografi, palet warna).
6. WHEN ukuran layar kurang dari 820px, THE System SHALL menampilkan layout yang responsif dan dapat digunakan.

---

### Requirement 18: Validasi Data Diagnostik (Correctness Properties)

**User Story:** Sebagai Dokter, saya ingin sistem memvalidasi data diagnostik dengan benar, sehingga integritas data rekam medis terjaga.

#### Acceptance Criteria

1. THE DiagReport_Module SHALL memastikan bahwa setiap DiagnosticReport yang tersimpan memiliki `reportId` yang unik di antara semua laporan.
2. THE DiagReport_Module SHALL memastikan bahwa field `type` pada setiap DiagnosticReport hanya berisi nilai `lab` atau `imaging`.
3. THE DiagReport_Module SHALL memastikan bahwa field `status` pada setiap DiagnosticReport hanya berisi nilai `pending`, `final`, atau `amended`.
4. WHEN DiagnosticReport dengan status `final` diperbarui, THE DiagReport_Module SHALL mengubah statusnya menjadi `amended` dan tidak pernah kembali ke `pending`.
5. THE DiagReport_Module SHALL memastikan bahwa field `date` pada setiap DiagnosticReport berisi tanggal yang valid (format ISO 8601 atau format tanggal lokal yang konsisten).
6. FOR ALL DiagnosticReport yang disimpan kemudian dibaca kembali dari localStorage, THE DiagReport_Module SHALL menghasilkan objek yang ekuivalen dengan objek yang disimpan (round-trip property).

---

### Requirement 19: Validasi Autentikasi dan Otorisasi (Correctness Properties)

**User Story:** Sebagai Admin, saya ingin sistem autentikasi dan otorisasi bekerja dengan benar dan konsisten, sehingga keamanan sistem terjaga.

#### Acceptance Criteria

1. FOR ALL kombinasi username dan password yang valid, THE Auth_Module SHALL selalu menghasilkan sesi yang berisi peran yang benar untuk pengguna tersebut (invariant: sesi mencerminkan peran pengguna).
2. FOR ALL pengguna dengan peran `Perawat`, THE Auth_Module SHALL selalu menolak akses ke fitur yang hanya diizinkan untuk `Dokter` atau `Admin`, terlepas dari urutan operasi yang dilakukan.
3. THE Auth_Module SHALL memastikan bahwa setelah logout, tidak ada data sesi yang tersisa di `sessionStorage` (idempotence: logout berulang tidak meninggalkan sisa sesi).
4. FOR ALL akun yang dinonaktifkan oleh Admin, THE Auth_Module SHALL selalu menolak login untuk akun tersebut, bahkan jika username dan password benar.
5. THE Auth_Module SHALL memastikan bahwa pengecekan hak akses menghasilkan hasil yang sama terlepas dari urutan pengecekan yang dilakukan (confluence: urutan pengecekan tidak mempengaruhi hasil otorisasi).

---

### Requirement 20: Konsistensi Data Lintas Modul (Correctness Properties)

**User Story:** Sebagai pengembang, saya ingin data yang tersimpan di localStorage konsisten di seluruh modul, sehingga tidak ada inkonsistensi data yang dapat menyebabkan bug.

#### Acceptance Criteria

1. FOR ALL Patient yang dihapus dari sistem, THE System SHALL memastikan bahwa semua DiagnosticReport, Encounter, dan Problem yang terkait dengan patientId tersebut tidak lagi ditampilkan di antarmuka.
2. THE System SHALL memastikan bahwa jumlah DiagnosticReport yang ditampilkan di daftar selalu sama dengan jumlah DiagnosticReport yang tersimpan di localStorage untuk pasien yang sama (invariant: konsistensi tampilan dan penyimpanan).
3. FOR ALL operasi penyimpanan DiagnosticReport, THE DiagReport_Module SHALL memastikan bahwa data yang dapat dibaca kembali dari localStorage identik dengan data yang disimpan (round-trip: serialize → store → retrieve → deserialize menghasilkan objek yang ekuivalen).
4. THE System SHALL memastikan bahwa filter berdasarkan tipe (`lab`/`imaging`) pada daftar DiagnosticReport selalu menghasilkan subset yang benar dari total daftar (metamorphic: `len(filter(lab)) + len(filter(imaging)) == len(all)`).
