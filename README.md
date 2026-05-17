# MediChart EMR v2

MediChart EMR v2 adalah sistem rekam medis elektronik berbasis web single-page yang dibangun dengan HTML, CSS, dan JavaScript murni tanpa framework. Versi ini memperluas MediChart v0 dengan autentikasi berbasis peran, manajemen pengguna, diagnostic reports, serta dokumentasi teknis yang lebih lengkap.

## Fitur Utama

- Login dan logout dengan sesi di `sessionStorage`
- Role-Based Access Control untuk Dokter, Perawat, dan Admin
- Manajemen pasien, encounter, SOAP notes, dan problem list
- Diagnostic Reports untuk laboratorium dan radiologi
- Manajemen akun pengguna oleh Admin
- Dokumentasi desain: UML, DFD, dan laporan sistem

## Cara Menjalankan

1. Buka file `medichart.html` langsung di browser, atau jalankan melalui ekstensi Live Server di VS Code.
2. Login menggunakan salah satu akun demo pada tabel di bawah.
3. Navigasi fitur mengikuti peran pengguna yang sedang aktif.

## Struktur Direktori

- `medichart.html` - aplikasi utama SPA
- `assets/` - aset visual dan gambar pendukung
- `docs/` - diagram UML, DFD, dan laporan desain
- `archive/medichart-v0/` - arsip versi lama proyek
- `.kiro/specs/medichart-emr-v2/` - spesifikasi kebutuhan, desain, dan task checklist

## Akun Demo

| Nama | Username | Password | Peran | Status |
|---|---|---|---|---|
| Dr. Pirman | `dr.pirman` | `123456` | Dokter | Aktif |
| Dr. Naser | `dr.naser` | `123456` | Dokter | Aktif |
| Perawat Sinta | `perawat.sinta` | `123456` | Perawat | Aktif |
| Admin Raka | `admin.raka` | `123456` | Admin | Aktif |
| Dokter Demo | `dr.demo` | `123456` | Dokter | Aktif |

## Teknologi yang Digunakan

- HTML5
- CSS3
- JavaScript murni
- Web Storage API (`localStorage` dan `sessionStorage`)
- PlantUML untuk diagram dokumentasi

## Changelog

### MediChart v0

- Fokus pada daftar pasien, demographics, SOAP, dan problem list dasar
- Satu aktor utama: Dokter
- Dokumentasi terbatas pada diagram dasar

### MediChart v2

- Menambahkan autentikasi dan RBAC untuk Dokter, Perawat, dan Admin
- Menambahkan Diagnostic Reports untuk laboratorium dan radiologi
- Menambahkan manajemen pengguna oleh Admin
- Memperbarui diagram UML/DFD dan menambahkan laporan desain sistem
- Mengarsipkan versi lama ke `archive/medichart-v0/`

## Dokumentasi

- [Class Diagram](docs/class-diagram.puml)
- [Sequence Diagram](docs/sequence-diagram.puml)
- [Use Case Diagram](docs/use-case-diagram.puml)
- [Component Diagram](docs/component-diagram.puml)
- [Package Diagram Simple](docs/package-diagram.puml)
- [Package Diagram Detailed](docs/package-diagram-detailed.puml)
- [DFD Level 0](docs/dfd-level0.puml)
- [DFD Level 1](docs/dfd-level1.puml)
- [Laporan Desain](docs/laporan.md)
- [Panduan Tim](docs/panduan-tim.md)
- [Validasi dan Uji](docs/validasi-dan-uji.md)

## Ringkasan Dokumen Formal

Paket dokumentasi ditulis dengan gaya laporan terstruktur agar mudah dipindahkan ke format akademik (LaTeX/ODT) bila dibutuhkan:

1. Laporan utama: [docs/laporan.md](docs/laporan.md)
2. Panduan pemahaman tim: [docs/panduan-tim.md](docs/panduan-tim.md)
3. Bukti validasi dan pengujian: [docs/validasi-dan-uji.md](docs/validasi-dan-uji.md)
4. Template LaTeX: [docs/laporan.tex](docs/laporan.tex)
5. Template ODT/Word-ready: [docs/template-laporan-odt.md](docs/template-laporan-odt.md)
6. Makalah proyek deskriptif: [docs/makalah.md](docs/makalah.md)

## Lampiran Source PlantUML

Bagian ini berisi source PlantUML siap copy-paste untuk kebutuhan laporan akademik (misalnya dimasukkan ke lampiran LaTeX/ODT/Word).

### 1) Use Case Diagram

Sumber file: [docs/use-case-diagram.puml](docs/use-case-diagram.puml)

		@startuml
		left to right direction
		skinparam packageStyle rectangle
		skinparam shadowing false

		actor Dokter
		actor Perawat
		actor Admin

		rectangle "Sistem Catatan Pemeriksaan Dokter" {
			usecase "Login" as UC_Login
			usecase "Lihat Dashboard Pasien" as UC_Dashboard
			usecase "Lihat Daftar Pasien" as UC_List
			usecase "Cari Data Pasien" as UC_Search
			usecase "Tambah Pasien Baru" as UC_AddPatient
			usecase "Edit Data Pasien" as UC_EditPatient

			usecase "Lihat Data Demographics" as UC_Demographics
			usecase "Lihat Riwayat SOAP" as UC_SoapHistory

			usecase "Input Keluhan Pasien" as UC_Complaint
			usecase "Input Diagnosa\nProblem List" as UC_ProblemList
			usecase "Input Catatan Klinis\nSOAP" as UC_Soap
			usecase "Simpan Catatan Pemeriksaan" as UC_SaveExam
			usecase "Edit Catatan Pemeriksaan" as UC_EditExam
			usecase "Input Tanda Vital" as UC_Vitals

			usecase "Lihat Diagnostic Reports" as UC_ViewDiag
			usecase "Input Hasil Lab" as UC_InputLab
			usecase "Input Hasil Radiologi" as UC_InputImaging

			usecase "Kelola Akun Pengguna" as UC_ManageUsers
		}

		Dokter --> UC_Login
		Dokter --> UC_Dashboard
		Dokter --> UC_Search
		Dokter --> UC_AddPatient
		Dokter --> UC_EditPatient
		Dokter --> UC_Demographics
		Dokter --> UC_SoapHistory
		Dokter --> UC_Complaint
		Dokter --> UC_ProblemList
		Dokter --> UC_Soap
		Dokter --> UC_SaveExam
		Dokter --> UC_EditExam
		Dokter --> UC_ViewDiag
		Dokter --> UC_InputLab
		Dokter --> UC_InputImaging

		Perawat --> UC_Login
		Perawat --> UC_Dashboard
		Perawat --> UC_List
		Perawat --> UC_Search
		Perawat --> UC_Demographics
		Perawat --> UC_SoapHistory
		Perawat --> UC_Vitals
		Perawat --> UC_ViewDiag

		Admin --> UC_Login
		Admin --> UC_Dashboard
		Admin --> UC_List
		Admin --> UC_Search
		Admin --> UC_AddPatient
		Admin --> UC_EditPatient
		Admin --> UC_ManageUsers

		UC_Dashboard ..> UC_List : <<include>>
		UC_Search ..> UC_List : <<include>>
		UC_AddPatient ..> UC_Demographics : <<include>>
		UC_SaveExam ..> UC_Complaint : <<include>>
		UC_SaveExam ..> UC_ProblemList : <<include>>
		UC_SaveExam ..> UC_Soap : <<include>>
		UC_EditExam ..> UC_Soap : <<include>>

		@enduml

### 2) Class Diagram

Sumber file: [docs/class-diagram.puml](docs/class-diagram.puml)

		@startuml
		skinparam shadowing false
		skinparam classAttributeIconSize 0

		class User {
			+userId: string
			+username: string
			+passwordHash: string
			+name: string
			+role: string
			+isActive: boolean
			+lastLoginAt: string
			+login()
			+logout()
		}

		class Doctor {
			+doctorId: string
			+specialty: string
			+createClinicalNote()
		}

		class Patient {
			+patientId: string
			+name: string
			+age: int
			+gender: string
			+address: string
			+phone: string
			+bloodType: string
			+allergies: string
			+getDemographics()
			+createPatient()
		}

		class Encounter {
			+encounterId: string
			+patientId: string
			+doctorId: string
			+date: datetime
			+chiefComplaint: string
			+status: string
			+startEncounter()
			+closeEncounter()
		}

		class ClinicalNote {
			+noteId: string
			+encounterId: string
			+subjective: string
			+objective: string
			+assessment: string
			+plan: string
			+updatedAt: string
			+saveNote()
			+updateNote()
		}

		class Problem {
			+problemId: string
			+patientId: string
			+encounterId: string
			+diagnosisName: string
			+icdCode: string
			+status: string
			+createdAt: string
			+addProblem()
			+updateStatus()
		}

		class DiagnosticReport {
			+reportId: string
			+patientId: string
			+encounterId: string
			+type: string
			+date: string
			+status: string
			+interpretation: string
			+createdAt: string
			+updatedAt: string
			+addReport()
			+updateStatus()
		}

		User <|-- Doctor

		Patient "1" -- "0..*" Encounter : memiliki
		Doctor "1" -- "0..*" Encounter : menangani
		Encounter "1" -- "0..1" ClinicalNote : menghasilkan
		Patient "1" -- "0..*" Problem : memiliki
		Encounter "1" -- "0..*" Problem : mencatat
		Patient "1" -- "0..*" DiagnosticReport : memiliki
		Encounter "0..1" -- "0..*" DiagnosticReport : terkait

		@enduml

### 3) Sequence Diagram

Sumber file: [docs/sequence-diagram.puml](docs/sequence-diagram.puml)

		@startuml
		autonumber

		actor Dokter
		actor Perawat
		boundary "UI Dashboard" as UI
		control "Auth Controller" as AuthController
		control "Patient Controller" as PatientController
		control "Encounter Controller" as EncounterController
		control "DiagReport Controller" as DiagController
		entity "Auth Service" as AuthService
		entity "Clinical Service" as ClinicalService
		entity "DiagReport Service" as DiagService
		database "Medical Record Database" as DB

		group Login dengan RBAC
			Dokter -> UI : Login ke sistem
			UI -> AuthController : Kirim data login
			AuthController -> AuthService : Validasi user
			AuthService -> DB : Cek akun dan status aktif
			DB --> AuthService : Data akun
			AuthService --> AuthController : Sesi dan role
			AuthController -> AuthService : Cek hak akses peran
			AuthService --> AuthController : Role valid
			AuthController --> UI : Tampilkan app shell sesuai peran
		end

		group Lihat data pasien
			UI -> PatientController : Request daftar pasien
			PatientController -> ClinicalService : Ambil semua pasien
			ClinicalService -> DB : Query patients
			DB --> ClinicalService : Data pasien
			ClinicalService --> PatientController : Kirim daftar pasien
			PatientController --> UI : Tampilkan list pasien
		end

		@enduml

### 4) Component Diagram

Sumber file: [docs/component-diagram.puml](docs/component-diagram.puml)

		@startuml
		left to right direction
		skinparam shadowing false
		skinparam componentStyle rectangle

		component "Presentation Layer" as Presentation
		component "Auth_Module" as Auth
		component "Patient_Module" as Patient
		component "Clinical_Module" as Clinical
		component "DiagReport_Module" as Diag
		component "Admin_Module" as Admin
		component "localStorage Store" as LocalStore
		component "sessionStorage Store" as SessionStore

		Presentation --> Auth
		Presentation --> Patient
		Presentation --> Clinical
		Presentation --> Diag
		Presentation --> Admin

		Clinical --> Patient : data pasien
		Clinical --> Diag : laporan terkait
		Diag --> Patient : relasi pasien
		Admin --> Auth : cek akses

		Auth --> SessionStore
		Patient --> LocalStore
		Clinical --> LocalStore
		Diag --> LocalStore
		Admin --> LocalStore

		@enduml

### 5) Package Diagram Simple

Sumber file: [docs/package-diagram.puml](docs/package-diagram.puml)

		@startuml
		top to bottom direction
		skinparam shadowing false
		skinparam defaultTextAlignment center

		rectangle "UI_Layer" as UI #DFF3DF
		rectangle "Core_Domain" as CORE #DFF3DF
		rectangle "Security_Auth" as SEC #DFF3DF
		rectangle "HL7_Connector" as HL7 #DFF3DF

		UI -down-> CORE
		SEC -right-> CORE
		CORE -right-> HL7

		@enduml

### 6) Package Diagram Detailed

Sumber file: [docs/package-diagram-detailed.puml](docs/package-diagram-detailed.puml)

		@startuml
		left to right direction
		skinparam shadowing false
		skinparam packageStyle rectangle

		package "Presentation" {
			[LoginPage]
			[AppShell]
			[PatientPanel]
			[DiagReportPanel]
			[AdminPanel]
		}

		package "Business Logic" {
			[Auth_Module]
			[Patient_Module]
			[Clinical_Module]
			[DiagReport_Module]
			[Admin_Module]
		}

		package "Data" {
			[localStorage]
			[sessionStorage]
		}

		package "Security" {
			[RBAC Policy]
		}

		[LoginPage] --> [Auth_Module]
		[AppShell] --> [Auth_Module]
		[AppShell] --> [Patient_Module]
		[AppShell] --> [Clinical_Module]
		[AppShell] --> [DiagReport_Module]
		[AppShell] --> [Admin_Module]
		[AppShell] --> [RBAC Policy]

		[Auth_Module] --> [sessionStorage]
		[Auth_Module] --> [RBAC Policy]
		[Patient_Module] --> [localStorage]
		[Clinical_Module] --> [localStorage]
		[Clinical_Module] --> [Patient_Module]
		[Clinical_Module] --> [DiagReport_Module]
		[DiagReport_Module] --> [localStorage]
		[Admin_Module] --> [localStorage]
		[Admin_Module] --> [Auth_Module]

		@enduml

### 7) DFD Level 0

Sumber file: [docs/dfd-level0.puml](docs/dfd-level0.puml)

		@startuml
		left to right direction
		skinparam shadowing false

		actor Dokter
		actor Perawat
		actor Admin

		rectangle "0. Sistem MediChart EMR v2" as System

		Dokter --> System : kredensial login\npermintaan pasien\ncatatan klinis\nhasil diagnostik
		System --> Dokter : status login\ndata pasien\ndetail klinis\ndetail laporan

		Perawat --> System : kredensial login\npermintaan pasien\ninput tanda vital
		System --> Perawat : status login\ndata pasien\nriwayat SOAP\ndaftar laporan

		Admin --> System : kredensial login\nkelola pengguna\ndata pasien
		System --> Admin : status login\ndaftar akun\ndata pasien

		@enduml

### 8) DFD Level 1

Sumber file: [docs/dfd-level1.puml](docs/dfd-level1.puml)

		@startuml
		left to right direction
		skinparam shadowing false

		actor Dokter
		actor Perawat
		actor Admin

		rectangle "1.0 Autentikasi" as P1
		rectangle "2.0 Manajemen Pasien" as P2
		rectangle "3.0 Catatan Klinis" as P3
		rectangle "4.0 Diagnostic Reports" as P4
		rectangle "5.0 Administrasi" as P5

		database "D1 User Store" as DUser
		database "D2 Session Store" as DSession
		database "D3 Patient Store" as DPatient
		database "D4 Encounter Store" as DEncounter
		database "D5 Clinical Note Store" as DNote
		database "D6 Problem Store" as DProblem
		database "D7 Diagnostic Report Store" as DReport

		Dokter --> P1 : username/password
		Perawat --> P1 : username/password
		Admin --> P1 : username/password
		P1 --> Dokter : status login / peran
		P1 --> Perawat : status login / peran
		P1 --> Admin : status login / peran
		P1 --> DUser : baca akun
		P1 --> DSession : simpan sesi

		Dokter --> P2 : cari/tambah/edit pasien
		Perawat --> P2 : lihat data pasien
		Admin --> P2 : tambah/edit pasien
		P2 --> DPatient : baca/tulis data pasien

		Dokter --> P3 : SOAP, Problem List, Encounter
		Perawat --> P3 : input vital signs
		P3 --> DEncounter : baca/tulis encounter
		P3 --> DNote : baca/tulis clinical note
		P3 --> DProblem : baca/tulis problem

		Dokter --> P4 : input/lihat hasil lab & radiologi
		Perawat --> P4 : lihat hasil diagnostik
		P4 --> DReport : baca/tulis laporan diagnostik
		P4 --> DEncounter : kaitkan encounter
		P4 --> DPatient : kaitkan pasien

		Admin --> P5 : kelola akun pengguna
		P5 --> DUser : baca/tulis akun pengguna

		@enduml
