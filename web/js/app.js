/* ===================================================================
   ██████╗ ██████╗
   ██╔══██╗██╔══██╗
   ██║  ██║██████╔╝   MediChart — Sistem Catatan Pemeriksaan Dokter
   ██║  ██║██╔══██╗   Arsitektur: Dokter → UI → Controller → Service → DB
   ██████╔╝██████╔╝
   ╚═════╝ ╚═════╝
=================================================================== */

/* ===================================================================
   DATABASE DUMMY LAYER
   Simulasi penyimpanan data in-memory (pengganti database nyata)
=================================================================== */
const DB = {
  patients: [
    { id:'P001', name:'Siti Rahayu',      age:34, gender:'Perempuan', address:'Jl. Mawar No. 12, Kebayoran Baru, Jakarta Selatan' },
    { id:'P002', name:'Agus Firmansyah',  age:47, gender:'Laki-laki', address:'Jl. Melati Raya No. 5, Cipete, Jakarta Selatan' },
    { id:'P003', name:'Dewi Lestari',     age:28, gender:'Perempuan', address:'Komplek Griya Asri Blok C2, Depok' },
    { id:'P004', name:'Hendra Kurniawan', age:55, gender:'Laki-laki', address:'Jl. Sudirman No. 88, Tangerang Selatan' },
    { id:'P005', name:'Rina Oktaviani',   age:41, gender:'Perempuan', address:'Jl. Kemanggisan Ilir III No. 7, Jakarta Barat' },
  ],

  /* encounters: tiap entry mewakili satu kunjungan pemeriksaan */
  encounters: [
    {
      id:'ENC0001', patientId:'P001', doctorName:'dr. Aul Pirman, S.Cmpr',
      keluhan:'Batuk berdahak dan demam tinggi sejak 3 hari',
      diagnosa:'ISPA (Infeksi Saluran Pernafasan Atas)',
      soap:{ S:'Pasien mengeluh batuk berdahak warna hijau, demam 38.5°C sejak 3 hari.',
             O:'TD 120/80 mmHg, Nadi 88x/mnt, Suhu 38.5°C. Faring hiperemis.',
             A:'ISPA bakteri, derajat sedang.',
             P:'Amoksisilin 500mg 3×1 tab, Paracetamol 500mg 3×1 prn, Kontrol 3 hari.' },
      timestamp: new Date(Date.now() - 86400000*5),
    },
    {
      id:'ENC0002', patientId:'P001', doctorName:'dr. Aul Pirman, S.Cmpr',
      keluhan:'Kontrol ISPA, batuk berkurang',
      diagnosa:'ISPA dalam penyembuhan',
      soap:{ S:'Pasien merasa membaik, batuk berkurang, demam sudah turun.',
             O:'TD 118/78 mmHg, Suhu 36.8°C. Faring sedikit hiperemis.',
             A:'Perbaikan klinis ISPA.',
             P:'Lanjut amoksisilin hingga habis. Kontrol jika keluhan kembali.' },
      timestamp: new Date(Date.now() - 86400000*2),
    },
    {
      id:'ENC0003', patientId:'P003', doctorName:'dr. Nsr Ardy, S.Th.Ds',
      keluhan:'Nyeri kepala terus-menerus',
      diagnosa:'Tension-type Headache',
      soap:{ S:'Sakit kepala seperti diikat, tidak berdenyut, bilateral, sejak 2 hari.',
             O:'TD 110/70, Nadi 76, Pemeriksaan neurologis dalam batas normal.',
             A:'Tension-type headache, tidak ada tanda bahaya.',
             P:'Ibuprofen 400mg prn, edukasi sleep hygiene dan manajemen stres.' },
      timestamp: new Date(Date.now() - 86400000*1),
    },
  ],
};

/* ===================================================================
   APPLICATION STATE
=================================================================== */
const State = {
  doctor:         null,   // dokter yang sedang login
  currentPatient: null,   // pasien yang sedang dipilih
  searchQuery:    '',     // query pencarian
  diagTab:        'lab',  // tab Diagnostic Reports aktif
  currentDiagId:  null,   // laporan diagnostik yang sedang dipilih
};

/* ===================================================================
   SERVICE LAYER
   Logika bisnis murni — tidak menyentuh DOM secara langsung
=================================================================== */
const Service = {

  /** Cari pasien berdasarkan ID atau nama (case-insensitive substring) */
  searchPatients(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [...DB.patients];
    return DB.patients.filter(p =>
      p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
  },

  /** Ambil satu pasien berdasarkan ID */
  getPatientById(id) {
    return DB.patients.find(p => p.id === id) || null;
  },

  /** Ambil semua encounters milik satu pasien, terbaru di atas */
  getEncountersByPatient(patientId) {
    return DB.encounters
      .filter(e => e.patientId === patientId)
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  /** Ambil satu encounter by ID */
  getEncounterById(encId) {
    return DB.encounters.find(e => e.id === encId) || null;
  },

  /**
   * validatePatientData — validasi form tambah pasien baru
   * @returns {string[]} array pesan error, kosong = valid
   */
  validatePatientData({ id, name, age, gender, address, diagnosa, soap }) {
    const errs = [];
    if (!id.trim())   errs.push('ID Pasien wajib diisi.');
    else if (DB.patients.find(p => p.id.toUpperCase() === id.trim().toUpperCase()))
      errs.push('ID Pasien sudah digunakan.');
    if (!name.trim()) errs.push('Nama pasien wajib diisi.');
    if (!age || isNaN(+age) || +age <= 0) errs.push('Umur harus diisi dengan angka valid.');
    if (!gender)      errs.push('Jenis kelamin wajib dipilih.');
    if (!address.trim()) errs.push('Alamat wajib diisi.');
    // Validasi SOAP awal
    const soapErrs = Service.validateSoapData({ diagnosa, soap });
    errs.push(...soapErrs);
    return errs;
  },

  /**
   * validateSoapData — validasi data pemeriksaan (edit/tambah encounter)
   * @returns {string[]} array pesan error
   */
  validateSoapData({ diagnosa, soap }, role = 'Dokter') {
    const errs = [];
    const canProblem = role === 'Dokter';
    const canSubjective = role === 'Dokter';
    const canObjective = role === 'Dokter' || role === 'Perawat';
    const canAssessmentPlan = role === 'Dokter';

    if (canProblem && !diagnosa.trim()) errs.push('Diagnosa / Problem List tidak boleh kosong.');
    const hasSOAP = (canSubjective ? soap.S.trim() : '') || (canObjective ? soap.O.trim() : '') || (canAssessmentPlan ? soap.A.trim() : '') || (canAssessmentPlan ? soap.P.trim() : '');
    if (!hasSOAP) errs.push('Minimal satu kolom SOAP (S/O/A/P) harus terisi.');
    return errs;
  },

  /**
   * Buat pasien baru + encounter pertama sekaligus
   */
  createPatientWithSoap({ id, name, age, gender, address, keluhan, diagnosa, soap }, doctorName) {
    const patient = {
      id: id.trim().toUpperCase(), name: name.trim(),
      age: +age, gender, address: address.trim(),
    };
    DB.patients.push(patient);

    const enc = {
      id:         'ENC' + String(DB.encounters.length + 1).padStart(4, '0'),
      patientId:  patient.id,
      doctorName,
      keluhan:    keluhan.trim(),
      diagnosa:   diagnosa.trim(),
      soap:       { S: soap.S.trim(), O: soap.O.trim(), A: soap.A.trim(), P: soap.P.trim() },
      timestamp:  new Date(),
    };
    DB.encounters.push(enc);
    return { patient, enc };
  },

  /**
   * Update encounter yang sudah ada (edit)
   */
  updateEncounter(encId, { keluhan, diagnosa, soap }, doctorName) {
    const enc = DB.encounters.find(e => e.id === encId);
    if (!enc) return null;
    enc.keluhan    = keluhan.trim();
    enc.diagnosa   = diagnosa.trim();
    enc.soap       = { S: soap.S.trim(), O: soap.O.trim(), A: soap.A.trim(), P: soap.P.trim() };
    enc.doctorName = doctorName;
    enc.updatedAt  = new Date();
    return enc;
  },

  /**
   * Tambah encounter baru ke pasien yang sudah ada
   */
  addNewEncounter(patientId, { keluhan, diagnosa, soap }, doctorName) {
    const enc = {
      id:        'ENC' + String(DB.encounters.length + 1).padStart(4, '0'),
      patientId,
      doctorName,
      keluhan:   keluhan.trim(),
      diagnosa:  diagnosa.trim(),
      soap:      { S: soap.S.trim(), O: soap.O.trim(), A: soap.A.trim(), P: soap.P.trim() },
      timestamp: new Date(),
    };
    DB.encounters.push(enc);
    return enc;
  },

  /** Perbarui data pasien yang sudah ada */
  updatePatient(patientId, data) {
    const patient = DB.patients.find(item => item.id === patientId);
    if (!patient) return null;
    patient.name = data.name.trim();
    patient.age = +data.age;
    patient.gender = data.gender;
    patient.address = data.address.trim();
    return patient;
  },

  /** Ambil semua laporan diagnostik dari localStorage, urut terbaru dahulu */
  getAllReports() {
    return store.get(KEYS.DIAG_REPORTS)
      .filter(report => !report.patientId || DB.patients.some(patient => patient.id === report.patientId))
      .slice()
      .sort((a, b) => new Date(b.date || b.updatedAt || b.createdAt) - new Date(a.date || a.updatedAt || a.createdAt));
  },

  /** Ambil laporan diagnostik untuk pasien tertentu */
  getReportsByPatient(patientId) {
    return this.getAllReports().filter(report => report.patientId === patientId);
  },

  /** Ambil laporan diagnostik untuk encounter tertentu */
  getReportsByEncounter(encounterId) {
    return this.getAllReports().filter(report => report.encounterId === encounterId);
  },

  /** Cari laporan berdasarkan ID */
  getReportById(reportId) {
    return this.getAllReports().find(report => report.reportId === reportId) || null;
  },

  /** Filter laporan berdasarkan tipe */
  filterByType(patientId, type) {
    return this.getReportsByPatient(patientId).filter(report => report.type === type);
  },

  /** Validasi input laporan diagnostik */
  validateReport(data) {
    const errors = {};
    const validTypes = ['lab', 'imaging'];
    const validStatuses = ['pending', 'final', 'amended'];
    const validModalities = ['X-Ray', 'USG', 'CT Scan', 'MRI'];

    if (!data.patientId) errors.patientId = 'Pasien wajib dipilih.';
    if (data.encounterId === undefined) data.encounterId = null;
    if (!validTypes.includes(data.type)) errors.type = 'Tipe laporan tidak valid.';
    if (!data.date) errors.date = 'Tanggal wajib diisi.';
    if (!validStatuses.includes(data.status || 'pending')) errors.status = 'Status laporan tidak valid.';

    if (data.type === 'lab') {
      const lab = data.labData || {};
      if (!lab.testName || !lab.testName.trim()) errors.testName = 'Nama tes wajib diisi.';
      const result = (lab.results && lab.results[0]) || {};
      if (!result.paramName || !result.paramName.trim()) errors.paramName = 'Nama parameter wajib diisi.';
      if (result.value === undefined || String(result.value).trim() === '') errors.value = 'Nilai hasil wajib diisi.';
      if (!result.unit || !result.unit.trim()) errors.unit = 'Satuan wajib diisi.';
      if (!result.referenceRange || !String(result.referenceRange).trim()) errors.referenceRange = 'Nilai referensi wajib diisi.';
    }

    if (data.type === 'imaging') {
      const img = data.imagingData || {};
      if (!validModalities.includes(img.modality)) errors.modality = 'Jenis pemeriksaan wajib dipilih.';
      if (!img.findings || !img.findings.trim()) errors.findings = 'Temuan wajib diisi.';
    }

    return { valid: Object.keys(errors).length === 0, errors };
  },

  /** Tambah laporan diagnostik baru */
  addReport(data) {
    const normalized = {
      patientId: data.patientId,
      encounterId: data.encounterId || null,
      type: data.type,
      date: data.date,
      status: data.status || 'pending',
      interpretation: data.interpretation || '',
      labData: data.type === 'lab' ? data.labData : null,
      imagingData: data.type === 'imaging' ? data.imagingData : null,
    };

    const validation = this.validateReport(normalized);
    if (!validation.valid) return { errors: validation.errors };

    const reports = store.get(KEYS.DIAG_REPORTS);
    const report = {
      reportId: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...normalized,
    };
    reports.push(report);
    store.set(KEYS.DIAG_REPORTS, reports);
    return { report };
  },

  /** Perbarui status laporan diagnostik */
  updateStatus(reportId, newStatus) {
    const reports = store.get(KEYS.DIAG_REPORTS);
    const report = reports.find(item => item.reportId === reportId);
    if (!report) return null;
    if (report.status !== 'pending' && newStatus === 'pending') return report;
    if (report.status === 'amended' && newStatus !== 'amended') return report;
    report.status = report.status === 'final' && newStatus !== 'amended' ? 'amended' : newStatus;
    report.updatedAt = new Date().toISOString();
    store.set(KEYS.DIAG_REPORTS, reports);
    return report;
  },

  /** Perbarui isi laporan; final akan otomatis menjadi amended */
  updateReport(reportId, updates) {
    const reports = store.get(KEYS.DIAG_REPORTS);
    const report = reports.find(item => item.reportId === reportId);
    if (!report) return null;
    Object.assign(report, updates);
    if (report.status === 'final') report.status = 'amended';
    report.updatedAt = new Date().toISOString();
    store.set(KEYS.DIAG_REPORTS, reports);
    return report;
  },
};

/* ===================================================================
   CONTROLLER LAYER
   Menghubungkan interaksi UI → Service → render
=================================================================== */

/* ------------------------------------------------------------------
   login()
   Alur: Dokter isi form → klik Masuk → login()
         → Auth_Module.login() → renderDashboard()
------------------------------------------------------------------ */
function login() {
  const username = document.getElementById('inp-usr').value;
  const password = document.getElementById('inp-pwd').value;
  const errEl    = document.getElementById('l-err');
  errEl.style.display = 'none';

  const session = Auth_Module.login(username, password);

  if (!session) {
    errEl.textContent   = '⚠ Username atau password salah.';
    errEl.style.display = 'block';
    return;
  }

  // Login berhasil
  State.doctor = { name: session.name, role: session.role, username: session.username };
  document.getElementById('page-login').style.display = 'none';
  document.getElementById('page-app').style.display   = 'flex';

  // Update sidebar: nama dan role
  document.getElementById('sb-name').textContent = session.name;
  const roleEl = document.getElementById('sb-role');
  if (roleEl) roleEl.textContent = session.role;

  // Avatar: foto jika ada, fallback ke inisial
  const avEl = document.getElementById('sb-av');
  if (session.photo) {
    avEl.innerHTML = `<img src="${session.photo}" alt="${esc(session.name)}">`;
  } else {
    const initials = session.name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
    avEl.innerHTML = `<div style="width:40px;height:40px;border-radius:50%;background:var(--primary-lt);color:var(--primary-dk);display:grid;place-items:center;font-size:13px;font-weight:800;">${initials}</div>`;
  }

  // Terapkan navigasi berbasis peran
  updateNavForRole(session.role);

  // Render halaman awal sesuai peran (Admin → halaman admin, lainnya → dashboard)
  if (session.role !== 'Admin') {
    renderDashboard();
  }
}

/* ------------------------------------------------------------------
   updateNavForRole(role)
   Tampilkan/sembunyikan item navigasi berdasarkan peran pengguna.
   - Menu klinis (Rekam Medis): hanya Dokter dan Perawat
   - Menu admin (Manajemen Pengguna): hanya Admin
   Validates: Requirements 3.7, 3.8
------------------------------------------------------------------ */
function updateNavForRole(role) {
  const navItems = document.querySelectorAll('#sb-nav .nav-item[data-role-access]');
  navItems.forEach(item => {
    const allowedRoles = item.getAttribute('data-role-access').split(',').map(r => r.trim());
    if (allowedRoles.includes(role)) {
      item.classList.remove('hidden');
    } else {
      item.classList.add('hidden');
    }
  });

  // Jika Admin login, arahkan ke halaman admin secara otomatis
  // (karena menu klinis tersembunyi)
  if (role === 'Admin') {
    const mainEl  = document.getElementById('app-main');
    const diagEl  = document.getElementById('page-diag-reports');
    const adminEl = document.getElementById('page-admin');
    const navDash = document.getElementById('nav-dashboard');
    const navAdm  = document.getElementById('nav-admin');
    if (mainEl)  mainEl.classList.add('hidden');
    if (diagEl)  diagEl.classList.add('hidden');
    if (adminEl) adminEl.classList.remove('hidden');
    if (navDash) navDash.classList.remove('active');
    if (navAdm)  navAdm.classList.add('active');
    renderAdminPage();
  }
}

function logout() {
  Auth_Module.logout(); // hapus sesi dari sessionStorage + redirect ke login
  State.doctor = null; State.currentPatient = null; State.searchQuery = ''; State.diagTab = 'lab'; State.currentDiagId = null;
  document.getElementById('inp-usr').value = '';
  document.getElementById('inp-pwd').value = '';
  document.getElementById('l-err').style.display = 'none';
}

/* ------------------------------------------------------------------
   renderDashboard()
   Menggambar kerangka utama: header + layout 2 kolom.
------------------------------------------------------------------ */
function renderDashboard() {
  const main = document.getElementById('app-main');
  main.innerHTML = `
    <div class="pg-head anim-up">
      <div>
        <div class="pg-title">Rekam Medis Pasien</div>
      </div>
      <div class="workspace-meta">
        <span class="meta-chip">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          <span id="stat-total-patients">${DB.patients.length}</span> pasien
        </span>
        <span class="meta-chip green">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <span id="stat-total-encounters">${DB.encounters.length}</span> catatan
        </span>
      </div>
    </div>

    <div class="layout-2col anim-up" style="animation-delay:.05s">
      <!-- Kolom kiri: search + tabel pasien -->
      <div class="card" style="align-self:start;">
        <div class="card-head">
          <div class="card-title">
            <div class="card-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            Semua Pasien
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="badge b-gray" id="pt-count"></span>
            ${Auth_Module.canAccess('edit_patients') ? `<button class="btn btn-sm btn-add-compact" onclick="showAddPatientForm()">+ Pasien</button>` : ''}
          </div>
        </div>
        <div class="card-body" style="padding-bottom:8px;">
          <div class="search-bar">
            <input type="text" id="s-inp" placeholder="Cari ID atau nama pasien…"
              oninput="searchPatient(this.value)" value="${esc(State.searchQuery)}">
          </div>
          <div id="pt-list"></div>
        </div>
      </div>

      <!-- Kolom kanan: detail pasien (placeholder awal) -->
      <div id="right-col">
        <div class="placeholder-panel">
          <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <div class="placeholder-title">Belum ada pasien dipilih</div>
          <div class="placeholder-sub">Pilih pasien dari daftar untuk melihat demographics, problem list, dan riwayat catatan SOAP.</div>

        </div>
      </div>
    </div>
  `;

  renderPatientList(State.searchQuery);

  // Jika ada pasien yang sudah dipilih (misal setelah modal ditutup), re-render
  if (State.currentPatient) {
    renderPatientDetail(State.currentPatient.id);
  }
}

function openProfilePhoto(){
  const img = document.querySelector('#sb-av img');

  if(!img) return;

  document.getElementById('photoPreview').src = img.src;
  document.getElementById('photoModal').style.display = 'flex';
}

function closeProfilePhoto(){
  document.getElementById('photoModal').style.display = 'none';
}

/* ------------------------------------------------------------------
   updateDashboardStats()
   Sinkronkan statistik dashboard setelah pasien/catatan berubah.
------------------------------------------------------------------ */
function updateDashboardStats() {
  const patientEl = document.getElementById('stat-total-patients');
  const encounterEl = document.getElementById('stat-total-encounters');
  if (patientEl) patientEl.textContent = DB.patients.length;
  if (encounterEl) encounterEl.textContent = DB.encounters.length;
}

/* ------------------------------------------------------------------
   renderPatientList(query)
   Render tabel daftar pasien ke #pt-list.
   Alur: oninput → searchPatient() → renderPatientList()
------------------------------------------------------------------ */
function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');
}

function renderPatientList(query = '') {
  const patients = Service.searchPatients(query);
  const wrap     = document.getElementById('pt-list');
  const cntEl    = document.getElementById('pt-count');
  if (!wrap) return;

  cntEl.textContent = `${patients.length} pasien`;

  if (patients.length === 0) {
    wrap.innerHTML = `<div class="empty-state">
      <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      Tidak ditemukan pasien yang cocok.
    </div>`;
    return;
  }

  wrap.innerHTML = `
    <table class="pt-table">
      <thead><tr><th>ID</th><th>Nama Pasien</th><th class="col-gender">Gender</th></tr></thead>
      <tbody>
        ${patients.map(p => `
          <tr onclick="selectPatient('${p.id}')" class="${State.currentPatient?.id === p.id ? 'selected' : ''}">
            <td><span class="badge b-blue">${esc(p.id)}</span></td>
            <td>
              <div class="patient-name-wrap">
                <div class="patient-avatar">${getInitials(p.name)}</div>
                <div>
                  <div class="pt-name">${esc(p.name)}</div>
                  <div class="pt-meta">${p.age} thn · ${esc(p.address.substring(0, 30))}…</div>
                </div>
              </div>
            </td>
            <td class="col-gender">
              <span class="gender-badge ${p.gender === 'Laki-laki' ? 'gender-male' : 'gender-female'}">
                ${p.gender === 'Laki-laki' ? '♂ L' : '♀ P'}
              </span>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

/* ------------------------------------------------------------------
   searchPatient(query)
   Alur: Dokter ketik → searchPatient() → Service.searchPatients()
         → renderPatientList()
------------------------------------------------------------------ */
function searchPatient(query) {
  State.searchQuery = query;
  renderPatientList(query);
}

/* ------------------------------------------------------------------
   selectPatient(patientId)
   Alur: Dokter klik baris → selectPatient()
         → Service.getPatientById() → renderPatientDetail()
------------------------------------------------------------------ */
function selectPatient(patientId) {
  const patient = Service.getPatientById(patientId);
  if (!patient) { showToast('Pasien tidak ditemukan.', 'err'); return; }
  State.currentPatient = patient;
  renderPatientList(State.searchQuery);  // refresh highlight
  renderPatientDetail(patientId);
}

/* ------------------------------------------------------------------
   renderPatientDetail(patientId)
   Render panel kanan: demographics + riwayat pemeriksaan (read-only).
   Tidak langsung menampilkan form SOAP baru.
------------------------------------------------------------------ */
function renderPatientDetail(patientId) {
  const p     = Service.getPatientById(patientId);
  const panel = document.getElementById('right-col');
  if (!p || !panel) return;

  const encounters = Service.getEncountersByPatient(patientId);

  panel.innerHTML = `
    <!-- Demographics -->
    <div class="card anim-up" style="margin-bottom:16px;">
      <div class="card-head">
        <div class="card-title">
          <div class="card-icon">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          Data Pasien
        </div>
        <div style="display:flex;gap:7px;align-items:center;">
          <span class="badge b-blue">${esc(p.id)}</span>
          ${Auth_Module.canAccess('edit_patients') ? `
          <button class="btn btn-ghost btn-sm" onclick="showEditPatientForm('${p.id}')">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit Pasien
          </button>` : ''}
          <button class="btn btn-green btn-sm" onclick="showAddSoapForm()">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Tambah Catatan Baru
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="pt-header">
          <div class="pt-header-name">${esc(p.name)}</div>
        </div>
        <div class="demo-grid">
          <div class="demo-item">
            <div class="demo-label">Umur</div>
            <div class="demo-val">${p.age} tahun</div>
          </div>
          <div class="demo-item">
            <div class="demo-label">Jenis Kelamin</div>
            <div class="demo-val">${esc(p.gender)}</div>
          </div>
          <div class="demo-item full">
            <div class="demo-label">Alamat</div>
            <div class="demo-val">${esc(p.address)}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Riwayat Pemeriksaan -->
    <div class="card anim-up" style="animation-delay:.06s">
      <div class="card-head">
        <div class="card-title">
          <div class="card-icon gray">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          Riwayat Pemeriksaan
        </div>
        <span class="badge b-gray" id="enc-count">${encounters.length} catatan</span>
      </div>
      <div class="card-body" id="history-wrap"></div>
    </div>
  `;

  renderPatientHistory(patientId);
}

/* ------------------------------------------------------------------
   renderPatientHistory(patientId)
   Render daftar encounter ke #history-wrap dalam mode baca saja.
   Tiap encounter punya tombol "Edit Catatan".
------------------------------------------------------------------ */
function renderPatientHistory(patientId) {
  const encounters = Service.getEncountersByPatient(patientId);
  const wrap       = document.getElementById('history-wrap');
  const cntEl      = document.getElementById('enc-count');
  if (!wrap) return;

  if (cntEl) cntEl.textContent = `${encounters.length} catatan`;

  if (encounters.length === 0) {
    wrap.innerHTML = `<div class="empty-state">
      <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      Belum ada riwayat pemeriksaan untuk pasien ini.<br>
      <span style="margin-top:8px;display:inline-block;">
        <button class="btn btn-green btn-sm" onclick="showAddSoapForm()" style="margin-top:8px;">
          Tambah Catatan Pertama
        </button>
      </span>
    </div>`;
    return;
  }

  wrap.innerHTML = encounters.map((enc, idx) => {
    const dt = enc.timestamp.toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });
    const tm = enc.timestamp.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
    const isLatest = idx === 0;

    return `
      <div class="enc-item anim-slide" style="animation-delay:${idx * .04}s">
        <div class="enc-item-head">
          <span class="enc-id">${enc.id}</span>
          ${isLatest ? '<span class="badge b-green">Terbaru</span>' : ''}
          <span class="badge b-gray" style="font-size:10px;">${esc(enc.doctorName)}</span>
          <span class="enc-date">${dt} · ${tm}</span>
          ${enc.updatedAt ? `<span class="badge b-amber" style="font-size:10px;">Diedit</span>` : ''}
        </div>
        <div class="enc-item-body">
          <div class="enc-row">
            <div class="enc-tag">Keluhan Utama</div>
            <div class="enc-val">${esc(enc.keluhan) || '<em class="text-muted">—</em>'}</div>
          </div>
          <div class="enc-row">
            <div class="enc-tag">Diagnosa / Problem List</div>
            <div class="enc-val">${esc(enc.diagnosa)}</div>
          </div>
          <div class="soap-view">
            ${renderSoapRow('S', 'Subjective',  enc.soap.S)}
            ${renderSoapRow('O', 'Objective',   enc.soap.O)}
            ${renderSoapRow('A', 'Assessment',  enc.soap.A)}
            ${renderSoapRow('P', 'Plan',        enc.soap.P)}
          </div>
          ${renderEncounterReports(enc.id)}
        </div>
        <div class="enc-actions">
          ${Auth_Module.canAccess('edit_diag_reports') ? `<button class="btn btn-ghost btn-sm" onclick="openReportForm('lab', '${enc.id}')">+ Lab</button>` : ''}
          ${Auth_Module.canAccess('edit_diag_reports') ? `<button class="btn btn-ghost btn-sm" onclick="openReportForm('imaging', '${enc.id}')">+ Radiologi</button>` : ''}
          <button class="btn btn-amber btn-sm" onclick="showEditSoapForm('${enc.id}')">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit Catatan
          </button>
        </div>
      </div>`;
  }).join('');
}

/** Helper: render satu baris SOAP dalam mode baca */
function renderSoapRow(key, label, value) {
  const colorMap = { S:'sp-s', O:'sp-o', A:'sp-a', P:'sp-p' };
  return `
    <div class="soap-view-row">
      <div class="soap-view-key">
        <span class="soap-pill ${colorMap[key]}">${key} — ${label}</span>
      </div>
      <div class="soap-view-val ${!value ? 'empty' : ''}">
        ${value ? esc(value) : 'Tidak diisi'}
      </div>
    </div>`;
}

/* ------------------------------------------------------------------
   showAddPatientForm()
   Buka modal form tambah pasien baru + data SOAP pertama.
   Alur: Dokter klik "Tambah Pasien Baru" → showAddPatientForm()
------------------------------------------------------------------ */
function showAddPatientForm() {
  openModal('Tambah Pasien Baru', `
    <div class="val-box" id="vb-add"></div>

    <div class="form-section-label">Data Pasien</div>
    <div class="grid-2">
      <div class="field">
        <label>ID Pasien <span class="req">*</span></label>
        <input type="text" id="f-id" placeholder="contoh: P006">
        <div class="f-msg" id="fe-id"></div>
      </div>
      <div class="field">
        <label>Jenis Kelamin <span class="req">*</span></label>
        <select id="f-gender">
          <option value="">-- Pilih --</option>
          <option value="Laki-laki">Laki-laki</option>
          <option value="Perempuan">Perempuan</option>
        </select>
        <div class="f-msg" id="fe-gender"></div>
      </div>
    </div>
    <div class="field">
      <label>Nama Lengkap <span class="req">*</span></label>
      <input type="text" id="f-name" placeholder="Nama pasien">
      <div class="f-msg" id="fe-name"></div>
    </div>
    <div class="grid-2">
      <div class="field">
        <label>Umur <span class="req">*</span></label>
        <input type="number" id="f-age" placeholder="tahun" min="0" max="150">
        <div class="f-msg" id="fe-age"></div>
      </div>
      <div class="field">
        <label>Alamat <span class="req">*</span></label>
        <input type="text" id="f-addr" placeholder="Alamat lengkap">
        <div class="f-msg" id="fe-addr"></div>
      </div>
    </div>

    <div class="form-section-label" style="margin-top:8px;">Pemeriksaan Awal</div>
    <div class="field">
      <label>Keluhan Utama</label>
      <textarea id="f-kel" placeholder="Deskripsikan keluhan pasien…"></textarea>
    </div>
    <div class="field">
      <label>Diagnosa / Problem List <span class="req">*</span></label>
      <textarea id="f-diag" placeholder="Diagnosa utama atau daftar masalah…"></textarea>
      <div class="f-msg" id="fe-diag"></div>
    </div>

    <div class="form-section-label">Catatan SOAP <span style="font-weight:400;text-transform:none;letter-spacing:0;">(isi minimal satu)</span></div>
    <div class="f-msg" id="fe-soap" style="margin-bottom:8px;"></div>
    <div class="grid-2">
      ${soapField('f-s','Subjective','S','Cerita pasien, riwayat keluhan…')}
      ${soapField('f-o','Objective','O','TTV, hasil pemeriksaan fisik…')}
      ${soapField('f-a','Assessment','A','Penilaian klinis dokter…')}
      ${soapField('f-p','Plan','P','Rencana tatalaksana, resep, rujukan…')}
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
      <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
      <button class="btn btn-green" onclick="addPatientWithInitialSoap()">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Simpan Pasien & Catatan
      </button>
    </div>
  `);
}

/* ------------------------------------------------------------------
   addPatientWithInitialSoap()
   Alur: Dokter klik Simpan di form tambah pasien
         → validatePatientData() → Service.createPatientWithSoap()
         → tutup modal, refresh list, pilih pasien baru
------------------------------------------------------------------ */
function addPatientWithInitialSoap() {
  const data = collectPatientForm();
  clearModalErrors(['id','name','age','gender','addr','diag','soap']);

  // Validasi via Service
  const errs = Service.validatePatientData(data);

  if (errs.length > 0) {
    showModalErrors(errs, data);
    return;
  }

  // Simpan via Service
  const { patient } = Service.createPatientWithSoap(data, State.doctor.name);
  closeModal();
  showToast(`✓ Pasien ${patient.name} berhasil ditambahkan.`, 'ok');
  updateDashboardStats();
  renderPatientList(State.searchQuery);
  selectPatient(patient.id);
}

function showEditPatientForm(patientId) {
  if (!Auth_Module.canAccess('edit_patients')) {
    showToast('Akses ditolak.', 'err');
    return;
  }
  const patient = Service.getPatientById(patientId);
  if (!patient) { showToast('Data pasien tidak ditemukan.', 'err'); return; }

  openModal(`Edit Pasien — ${esc(patient.name)}`, `
    <div class="field">
      <label>Nama Lengkap <span class="req">*</span></label>
      <input type="text" id="ep-name" value="${esc(patient.name)}">
    </div>
    <div class="grid-2">
      <div class="field">
        <label>Umur <span class="req">*</span></label>
        <input type="number" id="ep-age" value="${esc(patient.age)}">
      </div>
      <div class="field">
        <label>Jenis Kelamin <span class="req">*</span></label>
        <select id="ep-gender">
          <option value="Laki-laki" ${patient.gender === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option>
          <option value="Perempuan" ${patient.gender === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
        </select>
      </div>
    </div>
    <div class="field">
      <label>Alamat <span class="req">*</span></label>
      <textarea id="ep-addr">${esc(patient.address)}</textarea>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="submitEditPatientForm('${patient.id}')">Simpan</button>
    </div>
  `);
}

function submitEditPatientForm(patientId) {
  const patient = Service.getPatientById(patientId);
  if (!patient) { showToast('Data pasien tidak ditemukan.', 'err'); return; }
  const data = {
    name: val('ep-name'),
    age: val('ep-age'),
    gender: val('ep-gender'),
    address: val('ep-addr'),
  };
  if (!data.name.trim() || !data.age || !data.gender || !data.address.trim()) {
    showToast('Lengkapi semua field pasien.', 'err');
    return;
  }
  const updated = Service.updatePatient(patientId, data);
  if (!updated) { showToast('Gagal memperbarui pasien.', 'err'); return; }
  closeModal();
  showToast('✓ Data pasien berhasil diperbarui.', 'ok');
  renderDashboard();
  if (State.currentPatient?.id === patientId) {
    selectPatient(patientId);
  }
}

/* ------------------------------------------------------------------
   showEditSoapForm(encId)
   Buka modal form edit — isi dengan data encounter yang sudah ada.
   Alur: Dokter klik "Edit Catatan" → showEditSoapForm()
------------------------------------------------------------------ */
function showEditSoapForm(encId) {
  const enc = Service.getEncounterById(encId);
  if (!enc) { showToast('Data tidak ditemukan.', 'err'); return; }
  const role = State.doctor?.role || 'Dokter';
  const canProblem = role === 'Dokter';
  const canSubjective = role === 'Dokter';
  const canObjective = role === 'Dokter' || role === 'Perawat';
  const canAssessmentPlan = role === 'Dokter';

  openModal(`Edit Catatan — ${enc.id}`, `
    <div class="val-box" id="vb-edit"></div>
    <div style="background:var(--amber-lt);border:1px solid #FDE68A;border-radius:var(--rsm);
      padding:8px 12px;font-size:12px;color:#78350F;margin-bottom:14px;">
      ⚠ Perubahan akan memperbarui data catatan yang sudah ada, bukan membuat catatan baru.
    </div>
    ${canProblem ? `<div class="field">
      <label>Keluhan Utama</label>
      <textarea id="e-kel" placeholder="Keluhan pasien…">${esc(enc.keluhan)}</textarea>
    </div>
    <div class="field">
      <label>Diagnosa / Problem List <span class="req">*</span></label>
      <textarea id="e-diag" placeholder="Diagnosa…">${esc(enc.diagnosa)}</textarea>
      <div class="f-msg" id="ee-diag"></div>
    </div>` : ''}
    <div class="form-section-label">Catatan SOAP <span style="font-weight:400;text-transform:none;letter-spacing:0;">(isi minimal satu)</span></div>
    <div class="f-msg" id="ee-soap" style="margin-bottom:8px;"></div>
    <div class="grid-2">
      ${canSubjective ? soapField('e-s','Subjective','S','Cerita pasien…',    enc.soap.S) : ''}
      ${canObjective ? soapField('e-o','Objective','O','Pemeriksaan fisik…', enc.soap.O) : ''}
      ${canAssessmentPlan ? soapField('e-a','Assessment','A','Penilaian klinis…', enc.soap.A) : ''}
      ${canAssessmentPlan ? soapField('e-p','Plan','P','Rencana tatalaksana…',    enc.soap.P) : ''}
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
      <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
      <button class="btn btn-amber" onclick="updateSoap('${encId}')">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Simpan Perubahan
      </button>
    </div>
  `);
}

/* ------------------------------------------------------------------
   updateSoap(encId)
   Alur: Dokter klik Simpan Perubahan → validateSoapData()
         → Service.updateEncounter() → refresh history
------------------------------------------------------------------ */
function updateSoap(encId) {
  const data = {
    keluhan:  val('e-kel'),
    diagnosa: val('e-diag'),
    soap:     { S: val('e-s'), O: val('e-o'), A: val('e-a'), P: val('e-p') },
  };

  const errs = validateSoapData(data);
  clearFieldErr(['ee-diag','ee-soap']);

  if (errs.length > 0) {
    showSoapErrors(errs, 'ee-diag', 'ee-soap', 'vb-edit');
    return;
  }

  Service.updateEncounter(encId, data, State.doctor.name);
  closeModal();
  showToast('✓ Catatan pemeriksaan berhasil diperbarui.', 'ok');
  updateDashboardStats();
  renderPatientHistory(State.currentPatient.id);
}

/* ------------------------------------------------------------------
   showAddSoapForm()
   Buka modal form kosong untuk menambah encounter baru
   pada pasien yang sudah dipilih.
   Alur: Dokter klik "Tambah Catatan Pemeriksaan Baru" → showAddSoapForm()
------------------------------------------------------------------ */
function showAddSoapForm() {
  if (!State.currentPatient) {
    showToast('Pilih pasien terlebih dahulu.', 'err');
    return;
  }
  const role = State.doctor?.role || 'Dokter';
  const canProblem = role === 'Dokter';
  const canSubjective = role === 'Dokter';
  const canObjective = role === 'Dokter' || role === 'Perawat';
  const canAssessmentPlan = role === 'Dokter';

  openModal(`Catatan Pemeriksaan Baru — ${State.currentPatient.name}`, `
    <div class="val-box" id="vb-new"></div>
    ${canProblem ? `<div class="field">
      <label>Keluhan Utama</label>
      <textarea id="n-kel" placeholder="Deskripsikan keluhan pasien…"></textarea>
    </div>
    <div class="field">
      <label>Diagnosa / Problem List <span class="req">*</span></label>
      <textarea id="n-diag" placeholder="Diagnosa atau daftar masalah…"></textarea>
      <div class="f-msg" id="ne-diag"></div>
    </div>` : ''}
    <div class="form-section-label">Catatan SOAP <span style="font-weight:400;text-transform:none;letter-spacing:0;">(isi minimal satu)</span></div>
    <div class="f-msg" id="ne-soap" style="margin-bottom:8px;"></div>
    <div class="grid-2">
      ${canSubjective ? soapField('n-s','Subjective','S','Cerita pasien, riwayat keluhan…') : ''}
      ${canObjective ? soapField('n-o','Objective','O','TTV, hasil pemeriksaan fisik…') : ''}
      ${canAssessmentPlan ? soapField('n-a','Assessment','A','Penilaian klinis dokter…') : ''}
      ${canAssessmentPlan ? soapField('n-p','Plan','P','Rencana tatalaksana, resep, rujukan…') : ''}
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
      <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="addNewSoap()">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Simpan Catatan Baru
      </button>
    </div>
  `);
}

/* ------------------------------------------------------------------
   addNewSoap()
   Alur: Dokter klik Simpan Catatan Baru → validateSoapData()
         → Service.addNewEncounter() → refresh history
------------------------------------------------------------------ */
function addNewSoap() {
  if (!State.currentPatient) { showToast('Pasien belum dipilih.', 'err'); return; }

  const data = {
    keluhan:  val('n-kel'),
    diagnosa: val('n-diag'),
    soap:     { S: val('n-s'), O: val('n-o'), A: val('n-a'), P: val('n-p') },
  };

  const errs = validateSoapData(data);
  clearFieldErr(['ne-diag','ne-soap']);

  if (errs.length > 0) {
    showSoapErrors(errs, 'ne-diag', 'ne-soap', 'vb-new');
    return;
  }

  Service.addNewEncounter(State.currentPatient.id, data, State.doctor.name);
  closeModal();
  showToast('✓ Catatan pemeriksaan baru berhasil ditambahkan.', 'ok');
  updateDashboardStats();
  renderPatientHistory(State.currentPatient.id);
}

/* ------------------------------------------------------------------
   validatePatientData() — wrapper Controller ke Service
------------------------------------------------------------------ */
function validatePatientData(data) {
  return Service.validatePatientData(data);
}

/* ------------------------------------------------------------------
   validateSoapData() — wrapper Controller ke Service
------------------------------------------------------------------ */
function validateSoapData(data) {
  return Service.validateSoapData(data, State.doctor?.role || 'Dokter');
}

/* ===================================================================
   UI / MODAL HELPERS
=================================================================== */

/** Kumpulkan data dari form tambah pasien */
function collectPatientForm() {
  return {
    id:      val('f-id'),
    name:    val('f-name'),
    age:     val('f-age'),
    gender:  val('f-gender'),
    address: val('f-addr'),
    keluhan: val('f-kel'),
    diagnosa:val('f-diag'),
    soap:    { S: val('f-s'), O: val('f-o'), A: val('f-a'), P: val('f-p') },
  };
}

/** Tampilkan error di modal tambah pasien */
function showModalErrors(errs, data) {
  // Field-level
  setFErr('f-id',   'fe-id',   !data.id.trim(), 'ID Pasien wajib diisi.');
  setFErr('f-name', 'fe-name', !data.name.trim(), 'Nama wajib diisi.');
  setFErr('f-age',  'fe-age',  !data.age || isNaN(+data.age) || +data.age <= 0, 'Umur tidak valid.');
  setFErr('f-addr', 'fe-addr', !data.address.trim(), 'Alamat wajib diisi.');
  setFErr('f-diag', 'fe-diag', !data.diagnosa.trim(), 'Diagnosa tidak boleh kosong.');

  const noSOAP = !Object.values(data.soap).some(v => v.trim());
  const soapEl = document.getElementById('fe-soap');
  if (soapEl) soapEl.textContent = noSOAP ? 'Minimal satu field SOAP harus terisi.' : '';

  // Summary
  const vb = document.getElementById('vb-add');
  if (vb) {
    vb.style.display = 'block';
    vb.innerHTML = '<strong>Mohon perbaiki:</strong><ul>' +
      errs.map(e => `<li>${e}</li>`).join('') + '</ul>';
    vb.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }
}

/** Tampilkan error di modal SOAP (edit/tambah baru) */
function showSoapErrors(errs, diagErrId, soapErrId, boxId) {
  const noSOAP  = errs.some(e => e.includes('SOAP'));
  const noDiag  = errs.some(e => e.includes('Diagnosa'));

  const diagEl = document.getElementById(diagErrId);
  const soapEl = document.getElementById(soapErrId);
  if (diagEl) diagEl.textContent = noDiag ? 'Diagnosa tidak boleh kosong.' : '';
  if (soapEl) soapEl.textContent = noSOAP ? 'Minimal satu field SOAP harus terisi.' : '';

  const vb = document.getElementById(boxId);
  if (vb) {
    vb.style.display = 'block';
    vb.innerHTML = '<strong>Mohon perbaiki:</strong><ul>' +
      errs.map(e => `<li>${e}</li>`).join('') + '</ul>';
    vb.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }
}

function clearModalErrors(fields) {
  fields.forEach(f => {
    const msgEl = document.getElementById('fe-' + f) || document.getElementById('ee-' + f) || document.getElementById('ne-' + f);
    if (msgEl) msgEl.textContent = '';
    const inpEl = document.getElementById('f-' + f) || document.getElementById('e-' + f) || document.getElementById('n-' + f);
    if (inpEl) inpEl.closest('.field')?.classList.remove('f-err');
  });
  const vb = document.querySelector('.val-box');
  if (vb) vb.style.display = 'none';
}

function clearFieldErr(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  const vb = document.querySelector('.val-box');
  if (vb) vb.style.display = 'none';
}

function setFErr(inputId, msgId, hasErr, msg) {
  const inp = document.getElementById(inputId);
  const m   = document.getElementById(msgId);
  if (inp) inp.closest('.field')?.classList.toggle('f-err', hasErr);
  if (m)   m.textContent = hasErr ? msg : '';
}

/** Render satu field SOAP dalam form */
function soapField(id, label, key, placeholder, value = '') {
  const colorMap = { S:'#1D4ED8', O:'#92400E', A:'var(--red)', P:'var(--green-dk)' };
  return `
    <div class="field">
      <label style="color:${colorMap[key]};"><strong>${key}</strong> — ${label}</label>
      <textarea id="${id}" placeholder="${placeholder}" rows="3">${esc(value)}</textarea>
    </div>`;
}

/* ===================================================================
   MODAL ENGINE
=================================================================== */
function openModal(title, bodyHTML) {
  const bg = document.getElementById('modal-bg');
  bg.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <div class="modal-title">${title}</div>
        <button class="btn-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
    </div>`;
  bg.classList.remove('hidden');
  // Tutup jika klik overlay
  bg.onclick = e => { if (e.target === bg) closeModal(); };
}

function closeModal() {
  document.getElementById('modal-bg').classList.add('hidden');
}

/* ===================================================================
   MICRO-UTILITIES
=================================================================== */

/**
 * generateId() — menghasilkan UUID v4 sederhana
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * @returns {string} UUID v4 string
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * deepEqual(a, b) — membandingkan dua nilai secara rekursif
 * Mendukung: primitif, null, Array, dan Object biasa
 * @param {*} a
 * @param {*} b
 * @returns {boolean} true jika a dan b ekuivalen secara dalam
 */
function deepEqual(a, b) {
  // Primitif dan referensi yang sama
  if (a === b) return true;

  // Salah satu null/undefined
  if (a == null || b == null) return a === b;

  // Tipe berbeda
  if (typeof a !== typeof b) return false;

  // Bukan objek — primitif yang tidak sama (sudah ditangani di atas)
  if (typeof a !== 'object') return false;

  // Array
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Object biasa
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

/* ===================================================================
   STORAGE KEYS
=================================================================== */
const KEYS = {
  PATIENTS:       'mc_patients',
  ENCOUNTERS:     'mc_encounters',
  CLINICAL_NOTES: 'mc_clinical_notes',
  PROBLEMS:       'mc_problems',
  DIAG_REPORTS:   'mc_diag_reports',
  USERS:          'mc_users',
};

/* ===================================================================
   STORE — lapisan penyimpanan localStorage
=================================================================== */
const store = {
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[store.get] Data corrupt untuk key "${key}". Fallback ke [].`, e);
      return [];
    }
  },
  set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },
};

/* ===================================================================
   AUTH_MODULE — Seed Data Demo
=================================================================== */
function seedDemoUsers() {
  const existing = store.get(KEYS.USERS);
  if (existing.length > 0) return; // sudah ada data, skip

  const demoUsers = [
    {
      userId:       generateId(),
      username:     'dr.pirman',
      passwordHash: btoa('tanyadew'),
      name:         'dr. Aul Pirman, S.Cmpr',
      role:         'Dokter',
      photo:        '../assets/pirman.jpg',
      isActive:     true,
      lastLoginAt:  null,
    },
    {
      userId:       generateId(),
      username:     'dr.naser',
      passwordHash: btoa('satria1950'),
      name:         'dr. Nsr Ardy, S.Th.Ds',
      role:         'Dokter',
      photo:        '../assets/naser.jpg',
      isActive:     true,
      lastLoginAt:  null,
    },
    {
      userId:       generateId(),
      username:     'perawat.sari',
      passwordHash: btoa('sari123'),
      name:         'Sari Dewi, A.Md.Kep',
      role:         'Perawat',
      isActive:     true,
      lastLoginAt:  null,
    },
    {
      userId:       generateId(),
      username:     'admin.budi',
      passwordHash: btoa('budi123'),
      name:         'Budi Santoso',
      role:         'Admin',
      isActive:     true,
      lastLoginAt:  null,
    },
    {
      userId:       generateId(),
      username:     'dr.rina',
      passwordHash: btoa('rina123'),
      name:         'dr. Rina Oktaviani, Sp.PD',
      role:         'Dokter',
      isActive:     true,
      lastLoginAt:  null,
    },
  ];

  store.set(KEYS.USERS, demoUsers);
  console.info('[seedDemoUsers] 5 akun demo berhasil dibuat di mc_users.');
}

/* ===================================================================
   AUTH_MODULE — Autentikasi dan Otorisasi
=================================================================== */
const Auth_Module = {
  login(username, password) {
    if (!username || !password) return null;
    const users = store.get(KEYS.USERS);
    const user = users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!user) return null;
    if (!user.isActive) return null;
    if (user.passwordHash !== btoa(password)) return null;
    const session = {
      userId:   user.userId,
      username: user.username,
      name:     user.name,
      role:     user.role,
      photo:    user.photo || null,
      loginAt:  new Date().toISOString(),
    };
    sessionStorage.setItem('mc_session', JSON.stringify(session));
    user.lastLoginAt = session.loginAt;
    store.set(KEYS.USERS, users);
    return session;
  },
  logout() {
    sessionStorage.removeItem('mc_session');
    const appEl   = document.getElementById('page-app');
    const loginEl = document.getElementById('page-login');
    if (appEl)   appEl.style.display   = 'none';
    if (loginEl) loginEl.style.display = 'flex';
  },
  getSession() {
    try {
      const raw = sessionStorage.getItem('mc_session');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },
  isAuthenticated() {
    return this.getSession() !== null;
  },
  hasRole(role) {
    const session = this.getSession();
    return session !== null && session.role === role;
  },
  canAccess(feature) {
    const session = this.getSession();
    if (!session) return false;
    const role = session.role;
    const accessMatrix = {
      'view_patients':          ['Dokter', 'Perawat', 'Admin'],
      'edit_patients':          ['Dokter', 'Admin'],
      'view_demographics':      ['Dokter', 'Perawat', 'Admin'],
      'soap_subjective':        ['Dokter'],
      'soap_objective':         ['Dokter', 'Perawat'],
      'soap_assessment_plan':   ['Dokter'],
      'problem_list':           ['Dokter'],
      'view_diag_reports':      ['Dokter', 'Perawat'],
      'edit_diag_reports':      ['Dokter'],
      'manage_users':           ['Admin'],
    };
    const allowed = accessMatrix[feature];
    if (!allowed) return false;
    return allowed.includes(role);
  },
  requireAuth() {
    if (!this.isAuthenticated()) {
      sessionStorage.removeItem('mc_session');
      document.getElementById('page-app').style.display   = 'none';
      document.getElementById('page-login').style.display = 'flex';
    }
  },
};

let _tt;
function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `show t-${type}`;
  clearTimeout(_tt);
  _tt = setTimeout(() => { t.className = ''; }, 3600);
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function isToday(date) {
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ===================================================================
   ADMIN_MODULE — Manajemen Akun Pengguna
=================================================================== */
const Admin_Module = {
  getAllUsers() {
    return store.get(KEYS.USERS);
  },
  isUsernameAvailable(username) {
    if (!username) return false;
    const users = store.get(KEYS.USERS);
    return !users.some(
      u => u.username.toLowerCase() === username.trim().toLowerCase()
    );
  },
  addUser(data) {
    const errors = {};
    const validRoles = ['Dokter', 'Perawat', 'Admin'];

    if (!data.name || !data.name.trim()) {
      errors.name = 'Nama lengkap wajib diisi.';
    }
    if (!data.username || !data.username.trim()) {
      errors.username = 'Username wajib diisi.';
    } else if (!this.isUsernameAvailable(data.username)) {
      errors.username = 'Username sudah digunakan.';
    }
    if (!data.password || data.password.length < 6) {
      errors.password = 'Password minimal 6 karakter.';
    }
    if (!data.role || !validRoles.includes(data.role)) {
      errors.role = 'Peran tidak valid. Pilih Dokter, Perawat, atau Admin.';
    }

    if (Object.keys(errors).length > 0) {
      return { errors };
    }

    const newUser = {
      userId:       generateId(),
      username:     data.username.trim(),
      passwordHash: btoa(data.password),
      name:         data.name.trim(),
      role:         data.role,
      isActive:     true,
      lastLoginAt:  null,
    };

    const users = store.get(KEYS.USERS);
    users.push(newUser);
    store.set(KEYS.USERS, users);

    return { user: newUser };
  },
  deactivateUser(userId) {
    const users = store.get(KEYS.USERS);
    const user = users.find(u => u.userId === userId);
    if (!user) return null;
    user.isActive = false;
    store.set(KEYS.USERS, users);
    return user;
  },
};

/* ===================================================================
   ADMIN PAGE — Fungsi UI Halaman Admin
=================================================================== */
function navigateTo(page) {
  const mainEl  = document.getElementById('app-main');
  const diagEl  = document.getElementById('page-diag-reports');
  const adminEl = document.getElementById('page-admin');
  const navDash = document.getElementById('nav-dashboard');
  const navDiag = document.getElementById('nav-diag');
  const navAdm  = document.getElementById('nav-admin');

  if (page === 'diag-reports') {
    if (!Auth_Module.canAccess('view_diag_reports')) {
      showToast('Akses ditolak. Hanya Dokter dan Perawat yang dapat mengakses halaman ini.', 'err');
      return;
    }
    mainEl.classList.add('hidden');
    if (diagEl) diagEl.classList.remove('hidden');
    adminEl.classList.add('hidden');
    navDash.classList.remove('active');
    if (navDiag) navDiag.classList.add('active');
    navAdm.classList.remove('active');
    renderDiagReportsPage();
    return;
  }

  if (page === 'admin') {
    if (!Auth_Module.canAccess('manage_users')) {
      showToast('Akses ditolak. Hanya Admin yang dapat mengakses halaman ini.', 'err');
      return;
    }
    mainEl.classList.add('hidden');
    if (diagEl) diagEl.classList.add('hidden');
    adminEl.classList.remove('hidden');
    navDash.classList.remove('active');
    if (navDiag) navDiag.classList.remove('active');
    navAdm.classList.add('active');
    renderAdminPage();
  } else {
    mainEl.classList.remove('hidden');
    if (diagEl) diagEl.classList.add('hidden');
    adminEl.classList.add('hidden');
    navDash.classList.add('active');
    if (navDiag) navDiag.classList.remove('active');
    navAdm.classList.remove('active');
    renderDashboard();
  }
}

function renderAdminPage() {
  const users = Admin_Module.getAllUsers();
  const countEl = document.getElementById('admin-user-count');
  const tableEl = document.getElementById('admin-user-table');
  if (!tableEl) return;

  if (countEl) countEl.textContent = `${users.length} pengguna`;

  if (users.length === 0) {
    tableEl.innerHTML = `<div class="empty-state" style="padding:32px;">
      <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
      </svg>
      Belum ada pengguna terdaftar.
    </div>`;
    return;
  }

  const roleBadge = {
    'Dokter':  'b-blue',
    'Perawat': 'b-green',
    'Admin':   'b-amber',
  };

  tableEl.innerHTML = `
    <table class="pt-table" style="min-width:100%;">
      <thead>
        <tr>
          <th>Nama</th>
          <th>Username</th>
          <th>Peran</th>
          <th>Status</th>
          <th style="text-align:right;">Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td>
              <div class="pt-name">${esc(u.name)}</div>
            </td>
            <td><code style="font-size:12px;background:var(--surface2);padding:2px 6px;border-radius:4px;">${esc(u.username)}</code></td>
            <td><span class="badge ${roleBadge[u.role] || 'b-gray'}">${esc(u.role)}</span></td>
            <td>
              ${u.isActive
                ? '<span class="badge b-green">Aktif</span>'
                : '<span class="badge b-red">Nonaktif</span>'}
            </td>
            <td style="text-align:right;">
              ${u.isActive
                ? `<button class="btn btn-red btn-xs" onclick="deactivateUser('${esc(u.userId)}', '${esc(u.name)}')">
                    <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    Nonaktifkan
                  </button>`
                : '<span class="text-muted text-xs">—</span>'}
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function renderEncounterReports(encounterId) {
  const reports = Service.getReportsByEncounter(encounterId);
  if (!reports.length) return '';
  return `
    <div style="margin-top:12px; padding-top:12px; border-top:1px dashed var(--border);">
      <div class="text-xs bold text-muted" style="margin-bottom:8px;">Laporan Diagnostik Terkait</div>
      <div style="display:grid;gap:8px;">
        ${reports.map(report => `
          <button class="btn btn-ghost btn-sm" style="justify-content:space-between;width:100%;" onclick="openReportDetail('${report.reportId}')">
            <span>${esc(report.type === 'lab' ? (report.labData?.testName || 'Lab') : (report.imagingData?.modality || 'Radiologi'))}</span>
            <span class="badge ${report.status === 'final' ? 'b-green' : report.status === 'amended' ? 'b-blue' : 'b-amber'}">${esc(report.status)}</span>
          </button>`).join('')}
      </div>
    </div>`;
}

function renderReportListItem(report, active = false) {
  const title = report.type === 'lab'
    ? (report.labData?.testName || 'Lab')
    : (report.imagingData?.modality || 'Radiologi');
  const badgeClass = report.status === 'final' ? 'b-green' : report.status === 'amended' ? 'b-blue' : 'b-amber';
  return `
    <button class="btn ${active ? 'btn-primary' : 'btn-ghost'} w-full" style="justify-content:space-between;margin-bottom:8px;" onclick="openReportDetail('${report.reportId}')">
      <span style="text-align:left;">
        <div class="bold">${esc(title)}</div>
        <div class="text-xs text-muted">${esc(report.date || '')}</div>
      </span>
      <span class="badge ${badgeClass}">${esc(report.status)}</span>
    </button>`;
}

function renderDiagReportDetail(report) {
  const patient = Service.getPatientById(report.patientId);
  const encounter = report.encounterId ? Service.getEncounterById(report.encounterId) : null;
  const statusClass = report.status === 'final' ? 'b-green' : report.status === 'amended' ? 'b-blue' : 'b-amber';
  const title = report.type === 'lab' ? report.labData?.testName : report.imagingData?.modality;
  const body = report.type === 'lab'
    ? `<div class="demo-grid">
        <div class="demo-item"><div class="demo-label">Nama Tes</div><div class="demo-val">${esc(report.labData?.testName || '-')}</div></div>
        <div class="demo-item"><div class="demo-label">Tanggal</div><div class="demo-val">${esc(report.date || '-')}</div></div>
        <div class="demo-item full"><div class="demo-label">Hasil</div><div class="demo-val">${esc(report.labData?.results?.[0]?.paramName || '-')}: ${esc(report.labData?.results?.[0]?.value || '-')} ${esc(report.labData?.results?.[0]?.unit || '')} <span class="text-muted">(${esc(report.labData?.results?.[0]?.referenceRange || '-')})</span></div></div>
      </div>`
    : `<div class="demo-grid">
        <div class="demo-item"><div class="demo-label">Modality</div><div class="demo-val">${esc(report.imagingData?.modality || '-')}</div></div>
        <div class="demo-item"><div class="demo-label">Tanggal</div><div class="demo-val">${esc(report.date || '-')}</div></div>
        <div class="demo-item full"><div class="demo-label">Temuan</div><div class="demo-val">${esc(report.imagingData?.findings || '-')}</div></div>
      </div>`;

  return `
    <div class="val-box" style="display:block;margin-bottom:12px;">
      <strong>${esc(title || 'Laporan')}</strong>
      <div class="text-xs text-muted">${patient ? esc(patient.name) : '-'}${encounter ? ` · Encounter ${esc(encounter.id || encounter.encounterId || '')}` : ''}</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
      <span class="badge ${statusClass}">${esc(report.status)}</span>
      <span class="badge b-gray">${esc(report.type)}</span>
      <span class="badge b-gray">${esc(report.date || '')}</span>
    </div>
    ${body}
    <div class="field" style="margin-top:12px;">
      <label>Interpretasi</label>
      <div class="demo-val">${esc(report.interpretation || '-')}</div>
    </div>
    <div class="field">
      <label>Encounter</label>
      <div class="demo-val">${encounter ? esc(encounter.id || encounter.encounterId || '-') : 'Standalone'}</div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
      ${Auth_Module.canAccess('edit_diag_reports') && report.status === 'pending' ? `<button class="btn btn-green btn-sm" onclick="changeReportStatus('${report.reportId}', 'final')">Ubah Status ke Final</button>` : ''}
      ${Auth_Module.canAccess('edit_diag_reports') ? `<button class="btn btn-amber btn-sm" onclick="openReportForm('${report.type}', '${report.encounterId || ''}', '${report.reportId}')">Edit</button>` : ''}
    </div>`;
}

function renderDiagReportsPage() {
  const main = document.getElementById('page-diag-reports');
  if (!main) return;

  const patientId = State.currentPatient?.id || '';
  const patientName = State.currentPatient?.name || 'semua pasien';
  const allReports = patientId ? Service.getReportsByPatient(patientId) : Service.getAllReports();
  const filtered = allReports.filter(report => report.type === State.diagTab);
  const selected = State.currentDiagId ? Service.getReportById(State.currentDiagId) : filtered[0] || allReports[0] || null;
  if (selected && !State.currentDiagId) State.currentDiagId = selected.reportId;

  main.innerHTML = `
    <div class="pg-head anim-up">
      <div>
        <div class="pg-title">Diagnostic Reports</div>
        <div class="pg-sub">Menampilkan laporan untuk ${esc(patientName)}.</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn ${State.diagTab === 'lab' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="setDiagTab('lab')">Laboratorium</button>
        <button class="btn ${State.diagTab === 'imaging' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="setDiagTab('imaging')">Radiologi</button>
        ${Auth_Module.canAccess('edit_diag_reports') ? `<button class="btn btn-green btn-sm" onclick="openReportForm('${State.diagTab}', null)">+ Tambah Laporan</button>` : ''}
      </div>
    </div>

    <div class="layout-2col anim-up" style="animation-delay:.05s">
      <div class="card" style="align-self:start;">
        <div class="card-head">
          <div class="card-title">
            <div class="card-icon gray">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </div>
            Daftar ${State.diagTab === 'lab' ? 'Laboratorium' : 'Radiologi'}
          </div>
          <span class="badge b-gray">${filtered.length} laporan</span>
        </div>
        <div class="card-body" style="padding-bottom:8px;">
          ${filtered.length === 0 ? '<div class="empty-state">Belum ada laporan untuk filter ini.</div>' : filtered.map(report => renderReportListItem(report, selected?.reportId === report.reportId)).join('')}
        </div>
      </div>

      <div class="card" style="align-self:start;">
        <div class="card-head">
          <div class="card-title">
            <div class="card-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12h6M9 16h6M10 4h4l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
            </div>
            Detail Laporan
          </div>
        </div>
        <div class="card-body" id="diag-detail-wrap">
          ${selected ? renderDiagReportDetail(selected) : '<div class="empty-state">Pilih laporan untuk melihat detail.</div>'}
        </div>
      </div>
    </div>
  `;
}

function setDiagTab(tab) {
  State.diagTab = tab;
  State.currentDiagId = null;
  renderDiagReportsPage();
}

function openReportDetail(reportId) {
  State.currentDiagId = reportId;
  renderDiagReportsPage();
}

function changeReportStatus(reportId, status) {
  const report = Service.updateStatus(reportId, status);
  if (!report) {
    showToast('Laporan tidak ditemukan.', 'err');
    return;
  }
  showToast(`✓ Status laporan menjadi ${report.status}.`, 'ok');
  renderDiagReportsPage();
}

function openReportForm(type, encounterId = null, reportId = null) {
  if (!Auth_Module.canAccess('edit_diag_reports')) {
    showToast('Akses ditolak.', 'err');
    return;
  }
  if (!State.currentPatient) {
    showToast('Pilih pasien terlebih dahulu.', 'err');
    return;
  }
  const existing = reportId ? Service.getReportById(reportId) : null;
  const mode = existing ? 'Edit' : 'Tambah';
  const title = `${mode} ${type === 'lab' ? 'Hasil Lab' : 'Hasil Radiologi'}`;
  const body = type === 'lab'
    ? reportFormLab(existing, encounterId)
    : reportFormImaging(existing, encounterId);
  openModal(title, body);
}

function reportFormLab(report, encounterId) {
  const lab = report?.labData || { testName:'', results:[{ paramName:'', value:'', unit:'', referenceRange:'' }] };
  const result = lab.results?.[0] || { paramName:'', value:'', unit:'', referenceRange:'' };
  return `
    <div class="val-box" id="rf-box" style="display:none;"></div>
    <div class="grid-2">
      <div class="field"><label>Nama Tes <span class="req">*</span></label><input id="rf-test" value="${esc(lab.testName || '')}"><div class="f-msg" id="rf-test-err"></div></div>
      <div class="field"><label>Tanggal <span class="req">*</span></label><input type="date" id="rf-date" value="${esc(report?.date || '')}"><div class="f-msg" id="rf-date-err"></div></div>
      <div class="field"><label>Nama Parameter <span class="req">*</span></label><input id="rf-param" value="${esc(result.paramName || '')}"><div class="f-msg" id="rf-param-err"></div></div>
      <div class="field"><label>Nilai Hasil <span class="req">*</span></label><input id="rf-value" value="${esc(result.value || '')}"><div class="f-msg" id="rf-value-err"></div></div>
      <div class="field"><label>Satuan <span class="req">*</span></label><input id="rf-unit" value="${esc(result.unit || '')}"><div class="f-msg" id="rf-unit-err"></div></div>
      <div class="field"><label>Nilai Referensi <span class="req">*</span></label><input id="rf-ref" value="${esc(result.referenceRange || '')}"><div class="f-msg" id="rf-ref-err"></div></div>
    </div>
    <div class="field"><label>Interpretasi</label><textarea id="rf-int">${esc(report?.interpretation || '')}</textarea></div>
    <div class="field"><label>Encounter ID (opsional)</label><input id="rf-enc" value="${esc(encounterId || report?.encounterId || '')}" placeholder="Kosongkan jika standalone"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="submitReportForm('lab', '${esc(report?.reportId || '')}')">Simpan</button>
    </div>`;
}

function reportFormImaging(report, encounterId) {
  const imaging = report?.imagingData || { modality:'', bodyPart:'', findings:'', impression:'' };
  return `
    <div class="val-box" id="rf-box" style="display:none;"></div>
    <div class="grid-2">
      <div class="field"><label>Jenis Pemeriksaan <span class="req">*</span></label>
        <select id="ri-mod"><option value="">-- Pilih --</option>${['X-Ray','USG','CT Scan','MRI'].map(v => `<option value="${v}" ${imaging.modality===v ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <div class="f-msg" id="ri-mod-err"></div>
      </div>
      <div class="field"><label>Tanggal <span class="req">*</span></label><input type="date" id="ri-date" value="${esc(report?.date || '')}"><div class="f-msg" id="ri-date-err"></div></div>
      <div class="field"><label>Bagian Tubuh</label><input id="ri-body" value="${esc(imaging.bodyPart || '')}"></div>
      <div class="field"><label>Kesan</label><input id="ri-imp" value="${esc(imaging.impression || '')}"></div>
    </div>
    <div class="field"><label>Temuan / Findings <span class="req">*</span></label><textarea id="ri-find">${esc(imaging.findings || '')}</textarea><div class="f-msg" id="ri-find-err"></div></div>
    <div class="field"><label>Interpretasi</label><textarea id="ri-int">${esc(report?.interpretation || '')}</textarea></div>
    <div class="field"><label>Encounter ID (opsional)</label><input id="ri-enc" value="${esc(encounterId || report?.encounterId || '')}" placeholder="Kosongkan jika standalone"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="submitReportForm('imaging', '${esc(report?.reportId || '')}')">Simpan</button>
    </div>`;
}

function submitReportForm(type, reportId = '') {
  const data = {
    patientId: State.currentPatient?.id || '',
    encounterId: val(type === 'lab' ? 'rf-enc' : 'ri-enc') || null,
    type,
    date: val(type === 'lab' ? 'rf-date' : 'ri-date'),
    status: reportId ? (Service.getReportById(reportId)?.status || 'pending') : 'pending',
    interpretation: val(type === 'lab' ? 'rf-int' : 'ri-int'),
  };

  if (type === 'lab') {
    data.labData = {
      testName: val('rf-test'),
      results: [{
        paramName: val('rf-param'),
        value: val('rf-value'),
        unit: val('rf-unit'),
        referenceRange: val('rf-ref'),
        referenceMin: null,
        referenceMax: null,
        flag: null,
      }],
    };
  } else {
    data.imagingData = {
      modality: val('ri-mod'),
      bodyPart: val('ri-body'),
      findings: val('ri-find'),
      impression: val('ri-imp'),
    };
  }

  const validation = Service.validateReport(data);
  if (!validation.valid) {
    const errs = validation.errors;
    Object.entries(errs).forEach(([key, msg]) => {
      const map = {
        date: type === 'lab' ? 'rf-date-err' : 'ri-date-err',
        testName: 'rf-test-err',
        paramName: 'rf-param-err',
        value: 'rf-value-err',
        unit: 'rf-unit-err',
        referenceRange: 'rf-ref-err',
        modality: 'ri-mod-err',
        findings: 'ri-find-err',
      };
      const el = map[key] ? document.getElementById(map[key]) : null;
      if (el) el.textContent = msg;
    });
    const vb = document.getElementById('rf-box');
    if (vb) {
      vb.style.display = 'block';
      vb.innerHTML = '<strong>Mohon perbaiki:</strong><ul>' + Object.values(errs).map(v => `<li>${v}</li>`).join('') + '</ul>';
    }
    return;
  }

  let result;
  if (reportId) {
    result = Service.updateReport(reportId, data);
    if (result && result.status === 'final') result = Service.updateReport(reportId, data);
  } else {
    result = Service.addReport(data);
  }

  if (result.errors) {
    showToast('Validasi laporan gagal.', 'err');
    return;
  }

  closeModal();
  State.currentDiagId = result.report?.reportId || reportId || null;
  showToast('✓ Laporan diagnostik berhasil disimpan.', 'ok');
  renderDiagReportsPage();
}

function checkUsernameAvailability() {
  const username = val('au-username').trim();
  const errEl = document.getElementById('au-username-err');
  const inpEl = document.getElementById('au-username');
  if (!errEl || !inpEl) return;

  if (!username) {
    errEl.textContent = '';
    inpEl.closest('.field').classList.remove('f-err');
    return;
  }

  if (!Admin_Module.isUsernameAvailable(username)) {
    errEl.textContent = 'Username sudah digunakan.';
    inpEl.closest('.field').classList.add('f-err');
  } else {
    errEl.textContent = '';
    inpEl.closest('.field').classList.remove('f-err');
  }
}

function submitAddUser() {
  ['au-name', 'au-username', 'au-password', 'au-role'].forEach(id => {
    const errEl = document.getElementById(id + '-err');
    const inpEl = document.getElementById(id);
    if (errEl) errEl.textContent = '';
    if (inpEl) inpEl.closest('.field')?.classList.remove('f-err');
  });
  const valBox = document.getElementById('admin-val-box');
  if (valBox) valBox.style.display = 'none';

  const data = {
    name:     val('au-name'),
    username: val('au-username'),
    password: val('au-password'),
    role:     val('au-role'),
  };

  const result = Admin_Module.addUser(data);

  if (result.errors) {
    const errs = result.errors;
    if (errs.name) {
      document.getElementById('au-name-err').textContent = errs.name;
      document.getElementById('au-name').closest('.field').classList.add('f-err');
    }
    if (errs.username) {
      document.getElementById('au-username-err').textContent = errs.username;
      document.getElementById('au-username').closest('.field').classList.add('f-err');
    }
    if (errs.password) {
      document.getElementById('au-password-err').textContent = errs.password;
      document.getElementById('au-password').closest('.field').classList.add('f-err');
    }
    if (errs.role) {
      document.getElementById('au-role-err').textContent = errs.role;
      document.getElementById('au-role').closest('.field').classList.add('f-err');
    }
    if (valBox) {
      valBox.style.display = 'block';
      valBox.innerHTML = '<strong>Mohon perbaiki:</strong><ul>' +
        Object.values(errs).map(e => `<li>${e}</li>`).join('') + '</ul>';
      valBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    return;
  }

  document.getElementById('au-name').value = '';
  document.getElementById('au-username').value = '';
  document.getElementById('au-password').value = '';
  document.getElementById('au-role').value = '';
  showToast(`✓ Pengguna ${result.user.name} berhasil ditambahkan.`, 'ok');
  renderAdminPage();
}

function deactivateUser(userId, name) {
  if (!confirm(`Nonaktifkan akun "${name}"?\n\nPengguna ini tidak akan dapat login setelah dinonaktifkan.`)) {
    return;
  }
  const result = Admin_Module.deactivateUser(userId);
  if (result) {
    showToast(`✓ Akun ${result.name} berhasil dinonaktifkan.`, 'ok');
    renderAdminPage();
  } else {
    showToast('Pengguna tidak ditemukan.', 'err');
  }
}

/* ===================================================================
   INIT
=================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  seedDemoUsers();
  Auth_Module.requireAuth();
  document.getElementById('inp-pwd').addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });
});
