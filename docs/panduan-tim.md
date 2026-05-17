# Panduan Tim MediChart EMR v2

## Tujuan Dokumen

Dokumen ini membantu anggota tim memahami apa yang sudah dibangun pada MediChart EMR v2, bagaimana alurnya, dan bagaimana cara menjelaskan sistem saat presentasi atau pengumpulan tugas.

## Gambaran Singkat Sistem

MediChart EMR v2 adalah aplikasi rekam medis berbasis browser (single-page) dengan fitur utama:

- Login + Role-Based Access Control (Dokter, Perawat, Admin)
- Manajemen pasien dan encounter
- Catatan klinis SOAP dan Problem List
- Diagnostic Reports (Laboratorium dan Radiologi)
- Manajemen akun oleh Admin

## Peran dan Batas Akses

| Peran | Akses Utama | Batasan |
|---|---|---|
| Dokter | Semua fitur klinis + diagnostic reports | Tidak mengelola akun user |
| Perawat | Lihat pasien, riwayat, diagnostic reports, input vital signs | Tidak bisa input diagnosis/assessment/plan atau ubah laporan diagnostik |
| Admin | Kelola user dan data pasien | Tidak bisa akses fitur klinis |

## Alur Sistem yang Perlu Dipahami

1. Pengguna login sesuai akun demo.
2. Sidebar menampilkan menu berdasarkan role.
3. Dokter/Perawat dapat membuka data pasien, riwayat encounter, dan laporan diagnostik (sesuai hak akses).
4. Admin mengelola akun pengguna dan data pasien.

## Cara Baca Diagram

- Use Case: lihat aktor dan use case fitur.
- Class Diagram: lihat entitas inti dan relasinya.
- Sequence Diagram: lihat urutan interaksi saat login dan input data.
- Component Diagram: lihat modul sistem dan dependensi.
- Package Diagram (Simple): helikopter view cepat untuk presentasi.
- Package Diagram (Detailed): detail relasi antar paket dan modul.
- DFD Level 0/1: lihat aliran data eksternal dan antar proses utama.

## Paket Diagram yang Disediakan

- [Package Diagram Simple](package-diagram.puml)
- [Package Diagram Detailed](package-diagram-detailed.puml)

## Skenario Demo Presentasi (Disarankan)

1. Login sebagai Dokter lalu tampilkan akses menu klinis.
2. Buka pasien dan tampilkan SOAP + Problem List.
3. Tambahkan atau lihat Diagnostic Report (Lab/Radiologi).
4. Logout lalu login sebagai Perawat untuk menunjukkan pembatasan akses.
5. Logout lalu login sebagai Admin untuk menunjukkan manajemen user.

## Catatan Presentasi

- Tekankan perbedaan v0 dan v2 (RBAC + Diagnostic Reports + dokumentasi lengkap).
- Jelaskan bahwa sistem client-side menggunakan `localStorage` dan `sessionStorage`.
- Tunjukkan bahwa dokumentasi sudah sinkron dengan implementasi dan task checklist.