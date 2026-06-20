import { useState, useEffect } from 'react';
import * as API from '@/lib/api';

function formatDate(d) {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
}

const INTERNAL_DISEASES = ['سكر', 'ضغط', 'قلب', 'دهون', 'جراحة', 'صدر', 'أخرى'];
const CATEGORIES = ['مجانى', 'نفقة الدولة', 'درجة', 'تأمين'];
const IDENTITIES = ['مجهول الهوية', 'بطاقة'];
const STATUSES = ['متواجد', 'إجازة', 'خروج'];
const CLOZAPAX = ['نعم', 'لا'];
const INTERNAL = ['نعم', 'لا'];
const AGE_CLASS = ['فوق 50 عام', 'تحت 50 عام'];
const VACATION_TYPES = ['أسبوع', 'أسبوعين', 'عدد'];
const OUT_TYPES = ['بصحبة نفسه', 'بصحبة الأهل', 'بصحبة التمريض', 'انتقال لقسم آخر', 'وفاه', 'هروب'];

const EMPTY_FORM = {
  patientName: '', dateOfEntry: '', diagnosis: '', enrolmentNumber: '',
  fileNumber: '', category: '', identity: '', nationalId: '',
  dateOfBirth: '', age: '', ageClassification: '', departmentEntryDate: '',
  clozapax: '', internalPatient: '', status: 'متواجد',
  holidayDate: '', returnDate: '', vacationDurationType: '', vacationDays: '',
  outDate: '', outType: '', outNote: '',
};

export default function PatientsTab({ patients, hasPerm, loadPatients, loadExits }) {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    diagnosis: '', internalDisease: '', category: '', identity: '',
    clozapax: '', internalPatient: '', ageClassification: ''
  });
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (field) => {
    setSortDir(prev => sortField === field && prev === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  const sortArrow = (field) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  const filteredList = patients
    .filter(p => !search || (p.patientName || '').includes(search) || String(p.fileNumber || '').includes(search))
    .filter(p => !filters.diagnosis || (p.diagnosis || '') === filters.diagnosis)
    .filter(p => !filters.internalDisease || (p.internalDiseases || '').includes(filters.internalDisease))
    .filter(p => !filters.category || (p.category || '') === filters.category)
    .filter(p => !filters.identity || (p.identity || '') === filters.identity)
    .filter(p => !filters.clozapax || (p.clozapax || '') === filters.clozapax)
    .filter(p => !filters.internalPatient || (p.internalPatient || '') === filters.internalPatient)
    .filter(p => !filters.ageClassification || (p.ageClassification || '') === filters.ageClassification)
    .sort((a, b) => {
      if (!sortField) return parseInt(a.fileNumber || 0) - parseInt(b.fileNumber || 0);
      const va = (a[sortField] || '').toString();
      const vb = (b[sortField] || '').toString();
      const cmp = va.localeCompare(vb, 'ar', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const allDiagnoses = [...new Set(patients.map(p => p.diagnosis).filter(Boolean))].sort();
  const allDiseases = [...new Set(patients.flatMap(p => (p.internalDiseases || '').split(',').map(s => s.trim()).filter(Boolean)))].sort();

  useEffect(() => {
    const pendingId = localStorage.getItem('editPatientNext');
    if (pendingId) {
      localStorage.removeItem('editPatientNext');
      const p = patients.find(x => x.id === pendingId);
      if (p) { setEditId(pendingId); setShowModal(true); }
    }
  }, [patients]);

  

  const handleSave = async (formData, diseases) => {
    try {
      const data = {
        ...formData,
        internalDiseases: diseases.join(','),
        id: editId || API.generateUniquePatientId(),
      };
      if (editId) {
        data.id = editId;
        if (data.internalPatient !== 'نعم') {
          data.reviewNumber = null;
        } else {
          const existing = patients.find(x => x.id === editId);
          data.reviewNumber = existing?.reviewNumber || null;
        }
        await API.updatePatient(data);
      } else {
        data.reviewNumber = null;
        await API.addPatient(data);
      }
      setShowModal(false);
      await loadPatients();
      await loadExits();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: 'خطأ: ' + (err.message || 'حدث خطأ'), type: 'danger' } }));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المريض؟')) return;
    try {
      await API.deletePatient(id);
      await loadPatients();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: 'خطأ: ' + (err.message || 'حدث خطأ'), type: 'danger' } }));
    }
  };

  const patientForEdit = editId ? patients.find(p => p.id === editId) : null;

  return (
    <>
    <div className="d-print-none">
      <div className="d-flex justify-content-start align-items-center mb-2 flex-wrap gap-2">
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <input type="text" className="form-control form-control-sm" placeholder="بحث بالاسم أو رقم الملف..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ maxWidth: 220 }} />
          <button className={`btn btn-sm ${showFilters ? 'btn-info' : 'btn-outline-info'}`}
            onClick={() => setShowFilters(!showFilters)}>
            <i className="bi bi-funnel"></i> فلتر
          </button>
          <div className="d-flex gap-2">
            {hasPerm('patients', 'print') && (
              <button className="btn btn-outline-primary btn-sm d-print-none" onClick={() => setShowPrintModal(true)}>
                طباعة
              </button>
            )}
            {hasPerm('patients', 'add') && (
              <button className="btn btn-success btn-sm d-print-none" onClick={() => { setEditId(null); setShowModal(true); }}>
                إضافة
              </button>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="card mb-3 shadow-sm">
          <div className="card-body py-2">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <select className="form-select form-select-sm" style={{ width: 140 }} value={filters.diagnosis}
                onChange={e => setFilters(f => ({ ...f, diagnosis: e.target.value }))}>
                <option value="">التشخيص</option>
                {allDiagnoses.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className="form-select form-select-sm" style={{ width: 160 }} value={filters.internalDisease}
                onChange={e => setFilters(f => ({ ...f, internalDisease: e.target.value }))}>
                <option value="">أمراض باطنية</option>
                {allDiseases.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {['مجانى', 'نفقة الدولة', 'درجة', 'تأمين'].map(c => (
                <button key={c} className={`btn btn-sm ${filters.category === c ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilters(f => ({ ...f, category: f.category === c ? '' : c }))}>{c}</button>
              ))}
              {['بطاقة', 'مجهول الهوية'].map(i => (
                <button key={i} className={`btn btn-sm ${filters.identity === i ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilters(f => ({ ...f, identity: f.identity === i ? '' : i }))}>{i}</button>
              ))}
              <button className={`btn btn-sm ${filters.clozapax === 'نعم' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilters(f => ({ ...f, clozapax: f.clozapax === 'نعم' ? '' : 'نعم' }))}>كلوزاباكس</button>
              <button className={`btn btn-sm ${filters.internalPatient === 'نعم' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilters(f => ({ ...f, internalPatient: f.internalPatient === 'نعم' ? '' : 'نعم' }))}>باطنة</button>
              {['فوق 50 عام', 'تحت 50 عام'].map(a => (
                <button key={a} className={`btn btn-sm ${filters.ageClassification === a ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilters(f => ({ ...f, ageClassification: f.ageClassification === a ? '' : a }))}>{a}</button>
              ))}
              <button className="btn btn-sm btn-outline-danger" onClick={() => setFilters({ diagnosis: '', internalDisease: '', category: '', identity: '', clozapax: '', internalPatient: '', ageClassification: '' })}>
                <i className="bi bi-arrow-counterclockwise"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-striped table-hover" style={{ whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th style={{cursor:'pointer'}} onClick={() => handleSort('fileNumber')}>رقم الملف{sortArrow('fileNumber')}</th>
              <th style={{cursor:'pointer'}} onClick={() => handleSort('patientName')}>اسم المريض{sortArrow('patientName')}</th>
              <th>تاريخ الدخول</th><th>ت.دخول القسم</th><th>التشخيص</th>
              <th>رقم القيد</th>
              <th style={{cursor:'pointer'}} onClick={() => handleSort('category')}>الفئة{sortArrow('category')}</th>
              <th>الهوية</th><th>الرقم القومي</th>
              <th>تاريخ الميلاد</th><th>العمر</th><th>تصنيف العمر</th>
              <th>كلوزاباكس</th><th>مريض باطنة</th><th>الأمراض الباطنية</th>
              <th>الحالة</th>
              <th>تاريخ الإجازة</th><th>تاريخ العودة</th><th>حالة الإجازة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map(p => {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                let vacStatus = '';
                let rowClass = '';
                if (p.status === 'إجازة') {
                  vacStatus = 'في إجازة';
                  rowClass = 'table-warning';
                  if (p.returnDate) {
                    const rd = new Date(p.returnDate); rd.setHours(0, 0, 0, 0);
                    if (rd < today) { vacStatus = 'تجاوز إجازة'; rowClass = 'table-danger'; }
                  }
                }
                return (
                  <tr key={p.id} className={rowClass}>
                    <td>{p.fileNumber}</td>
                    <td>{p.patientName}</td>
                    <td>{formatDate(p.dateOfEntry)}</td>
                    <td>{formatDate(p.departmentEntryDate)}</td>
                    <td>{p.diagnosis}</td>
                    <td>{p.enrolmentNumber}</td>
                    <td>{p.category}</td>
                    <td>{p.identity}</td>
                    <td>{p.nationalId}</td>
                    <td>{formatDate(p.dateOfBirth)}</td>
                    <td>{p.age}</td>
                    <td>{p.ageClassification}</td>
                    <td>{p.clozapax}</td>
                    <td>{p.internalPatient}</td>
                    <td>{(p.internalDiseases || '').split(',').map(s => s.trim()).filter(Boolean).map(d =>
                      <span key={d} className="badge bg-primary me-1">{d}</span>
                    )}</td>
                    <td>{p.status}</td>
                    <td>{formatDate(p.holidayDate)}</td>
                    <td>{formatDate(p.returnDate)}</td>
                    <td>
                      {p.status === 'إجازة' ? (
                        <span className={`badge ${rowClass === 'table-danger' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {vacStatus}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      {hasPerm('patients', 'edit') && (
                        <button className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => { setEditId(p.id); setShowModal(true); }}>
                          <i className="bi bi-pencil"></i>
                        </button>
                      )}
                      {hasPerm('patients', 'delete') && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <PatientModal
          patient={patientForEdit}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          onDelete={patientForEdit && hasPerm('patients', 'delete') ? () => handleDelete(patientForEdit.id) : null}
        />
      )}

      {showPrintModal && (
        <PrintModal
          patients={filteredList}
          filter={null}
          onClose={() => setShowPrintModal(false)}
          onConfirm={(data) => {
            setPrintData(data);
            setShowPrintModal(false);
            setTimeout(() => window.print(), 300);
          }}
        />
      )}
    </div>

    {/* Print Only Section */}
    {printData && (
      <div className="d-none d-print-block" dir="rtl" style={{ backgroundColor: 'white', padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>نظام إدارة المرضى - قائمة المرضى</h2>
          <div style={{ fontSize: '16px', color: '#555' }}>
            {printData.filter ? `الفلتر: ${printData.filter.v} | ` : ''}
            عدد المرضى: {printData.patients.length} | 
            التاريخ: {new Date().toLocaleDateString('ar-EG')}
          </div>
        </div>
        <table className="table table-bordered table-sm" style={{ fontSize: '14px' }}>
          <thead className="table-light">
            <tr>
              {Object.entries(printData.cols).filter(([_, show]) => show).map(([key]) => (
                <th key={key} className="text-center bg-primary text-white">{printData.colLabels[key]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {printData.patients.map((p, idx) => (
              <tr key={idx}>
                {Object.entries(printData.cols).filter(([_, show]) => show).map(([key]) => {
                  let val = p[key] || '';
                  if (key === 'dateOfEntry' || key === 'dateOfBirth') {
                    const parts = val.split('-');
                    if (parts.length === 3) val = `${parts[2]}-${parts[1]}-${parts[0]}`;
                  }
                  if (key === 'internalDiseases') val = (val || '').split(',').map(s => s.trim()).filter(Boolean).join('، ');
                  return <td key={key} className="text-center">{val}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    </>
  );
}

function PatientModal({ patient, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedDiseases, setSelectedDiseases] = useState([]);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (patient) {
      setForm({ ...EMPTY_FORM, ...patient });
      setSelectedDiseases((patient.internalDiseases || '').split(',').map(s => s.trim()).filter(Boolean));
      setModalError('');
    } else {
      setForm(EMPTY_FORM);
      setSelectedDiseases([]);
      setModalError('');
    }
  }, [patient]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleDisease = (d) => {
    setSelectedDiseases(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  const calculateAge = () => {
    if (!form.nationalId || form.nationalId.length !== 14) {
      setModalError('الرجاء إدخال رقم قومي صحيح مكون من 14 رقم');
      return;
    }
    const result = API.calculateAgeFromNationalId(form.nationalId);
    if (!result.age) { setModalError('الرقم القومي غير صحيح'); return; }
    setForm(prev => ({
      ...prev,
      dateOfBirth: result.dateOfBirth,
      age: result.age,
      ageClassification: result.ageClassification,
    }));
    setModalError('');
  };

  const calcReturnDate = () => {
    if (!form.holidayDate) return;
    const start = new Date(form.holidayDate);
    let days = 0;
    if (form.vacationDurationType === 'أسبوع') days = 7;
    else if (form.vacationDurationType === 'أسبوعين') days = 14;
    else if (form.vacationDurationType === 'عدد') {
      days = parseInt(form.vacationDays);
      if (!days || days < 1) { setModalError('الرجاء إدخال عدد أيام صالح للإجازة'); return; }
    } else return;

    const returnDate = new Date(start);
    returnDate.setDate(returnDate.getDate() + days);
    const pad = n => String(n).padStart(2, '0');
    setForm(prev => ({
      ...prev,
      returnDate: `${returnDate.getFullYear()}-${pad(returnDate.getMonth() + 1)}-${pad(returnDate.getDate())}`,
    }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const required = ['patientName', 'dateOfEntry', 'diagnosis', 'enrolmentNumber', 'fileNumber',
      'category', 'identity', 'ageClassification', 'clozapax', 'internalPatient'];
    const fieldLabels = {
      patientName: 'اسم المريض', dateOfEntry: 'تاريخ الدخول', diagnosis: 'التشخيص', enrolmentNumber: 'رقم القيد', fileNumber: 'رقم الملف',
      category: 'التصنيف', identity: 'الهوية', ageClassification: 'تصنيف العمر', clozapax: 'كلوزاباكس', internalPatient: 'مريض باطنة',
      internalDiseases: 'الأمراض الباطنية', outDate: 'تاريخ الخروج', outType: 'نوع الخروج', holidayDate: 'تاريخ بداية الإجازة'
    };

    const missing = required.filter(k => !form[k] || !String(form[k]).trim());
    if (form.internalPatient === 'نعم' && selectedDiseases.length === 0) {
      missing.push('internalDiseases');
    }
    if (form.status === 'خروج') {
      if (!form.outDate) missing.push('outDate');
      if (!form.outType) missing.push('outType');
    }
    if (form.status === 'إجازة' && !form.holidayDate) missing.push('holidayDate');

    if (missing.length) {
      const msgs = missing.map(m => fieldLabels[m] || m);
      setModalError('الحقول المطلوبة مفقودة: ' + msgs.join('، '));
      return;
    }
    setModalError('');
    onSave(form, selectedDiseases);
  };

  const btnClass = (field, val) =>
    `btn btn-sm ${form[field] === val ? 'btn-primary' : 'btn-outline-primary'}`;

  const showHoliday = form.status === 'إجازة';
  const showOut = form.status === 'خروج';
  const showBirth = !!form.identity;
  const showNational = form.identity === 'بطاقة';
  const showDiseases = form.internalPatient === 'نعم';

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable modal-fullscreen-sm-down">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">إدارة المريض</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              {/* الحقول الأساسية للمريض */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">اسم المريض *</label>
                  <input type="text" className="form-control" value={form.patientName}
                    onChange={e => handleChange('patientName', e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">رقم الملف *</label>
                  <input type="text" className="form-control" value={form.fileNumber}
                    onChange={e => handleChange('fileNumber', e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">رقم القيد *</label>
                  <input type="text" className="form-control" value={form.enrolmentNumber}
                    onChange={e => handleChange('enrolmentNumber', e.target.value)} />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">تاريخ الدخول *</label>
                  <input type="date" className="form-control" value={form.dateOfEntry}
                    onChange={e => handleChange('dateOfEntry', e.target.value)} lang="en-GB" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">ت.دخول القسم</label>
                  <input type="date" className="form-control" value={form.departmentEntryDate}
                    onChange={e => handleChange('departmentEntryDate', e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">الفئة *</label>
                  <select className="form-select" value={form.category}
                    onChange={e => handleChange('category', e.target.value)}>
                    <option value="">-- اختر --</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-8">
                  <label className="form-label">التشخيص *</label>
                  <input type="text" className="form-control" value={form.diagnosis}
                    onChange={e => handleChange('diagnosis', e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">الهوية *</label>
                  <select className="form-select" value={form.identity}
                    onChange={e => handleChange('identity', e.target.value)}>
                    <option value="">-- اختر --</option>
                    {IDENTITIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              {showNational && (
                <div className="row mb-3">
                  <div className="col-md-8">
                    <label className="form-label">الرقم القومي</label>
                    <input type="text" className="form-control" maxLength={14} value={form.nationalId}
                      onChange={e => handleChange('nationalId', e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <button type="button" className="btn btn-outline-primary mt-4" onClick={calculateAge}>
                      استخراج البيانات
                    </button>
                  </div>
                </div>
              )}
              {showBirth ? (
                <div className="row mb-3">
                  <div className="col-md-5">
                    <label className="form-label">تاريخ الميلاد</label>
                    <input type="date" className="form-control" value={form.dateOfBirth}
                      onChange={e => handleChange('dateOfBirth', e.target.value)} lang="en-GB" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">العمر</label>
                    <input type="number" className="form-control" value={form.age}
                      onChange={e => handleChange('age', e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">تصنيف العمر *</label>
                    <div className="btn-group w-100">
                      {AGE_CLASS.map(v => (
                        <button key={v} type="button" className={btnClass('ageClassification', v)}
                          onClick={() => handleChange('ageClassification', v)}>{v}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-3">
                  <label className="form-label">تصنيف العمر *</label>
                  <div className="btn-group w-100">
                    {AGE_CLASS.map(v => (
                      <button key={v} type="button" className={btnClass('ageClassification', v)}
                        onClick={() => handleChange('ageClassification', v)}>{v}</button>
                    ))}
                  </div>
                  <div className="form-text text-muted">المريض مجهول الهوية - اختر التصنيف المناسب من شكله</div>
                </div>
              )}
              <div className="mb-3">
                <label className="form-label">حالة المريض *</label>
                <div className="btn-group w-100">
                  {STATUSES.map(v => (
                    <button key={v} type="button" className={btnClass('status', v)}
                      onClick={() => handleChange('status', v)}>{v}</button>
                  ))}
                </div>
              </div>
              {showHoliday && (
                <div className="mb-3">
                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">تاريخ بداية الإجازة *</label>
                      <input type="date" className="form-control" value={form.holidayDate}
                        onChange={e => { handleChange('holidayDate', e.target.value); }}
                        onBlur={calcReturnDate} lang="en-GB" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">مدة الإجازة</label>
                    <div className="btn-group w-100">
                      {VACATION_TYPES.map(v => (
                        <button key={v} type="button" className={btnClass('vacationDurationType', v)}
                          onClick={() => { handleChange('vacationDurationType', v); setTimeout(calcReturnDate, 0); }}>
                          {v === 'عدد' ? 'عدد أيام' : v}
                        </button>
                      ))}
                    </div>
                  </div>
                  {form.vacationDurationType === 'عدد' && (
                    <div className="mb-3">
                      <label className="form-label">عدد الأيام</label>
                      <input type="number" min="1" className="form-control" value={form.vacationDays}
                        onChange={e => handleChange('vacationDays', e.target.value)}
                        onBlur={calcReturnDate} />
                    </div>
                  )}
                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">تاريخ العودة</label>
                      <input type="date" className="form-control" value={form.returnDate}
                        onChange={e => handleChange('returnDate', e.target.value)} lang="en-GB" />
                    </div>
                  </div>
                </div>
              )}
              {showOut && (
                <div className="mb-3">
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">تاريخ الخروج *</label>
                      <input type="date" className="form-control" value={form.outDate}
                        onChange={e => handleChange('outDate', e.target.value)} lang="en-GB" />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">نوع الخروج *</label>
                      <select className="form-select" value={form.outType}
                        onChange={e => handleChange('outType', e.target.value)}>
                        <option value="">-- اختر --</option>
                        {OUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">ملاحظات</label>
                      <input type="text" className="form-control" value={form.outNote}
                        onChange={e => handleChange('outNote', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
              <div className="mb-3">
                <label className="form-label">كلوزاباكس *</label>
                <div className="btn-group w-100">
                  {CLOZAPAX.map(v => (
                    <button key={v} type="button" className={btnClass('clozapax', v)}
                      onClick={() => handleChange('clozapax', v)}>{v}</button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">مريض باطنة *</label>
                <div className="btn-group w-100">
                  {INTERNAL.map(v => (
                    <button key={v} type="button" className={btnClass('internalPatient', v)}
                      onClick={() => handleChange('internalPatient', v)}>{v}</button>
                  ))}
                </div>
              </div>
              {showDiseases && (
                <div className="mb-3">
                  <label className="form-label">الأمراض الباطنية <span className="text-danger">*</span></label>
                  <div>
                    {INTERNAL_DISEASES.map(d => (
                      <div className="form-check form-check-inline" key={d}>
                        <input className="form-check-input internal-disease-checkbox" type="checkbox" value={d} id={`disease-${d}`}
                          checked={selectedDiseases.includes(d)}
                          onChange={() => toggleDisease(d)} />
                        <label className="form-check-label" htmlFor={`disease-${d}`}>{d}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
            {onDelete && patient && (
              <button type="button" className="btn btn-danger me-auto" onClick={onDelete}>حذف</button>
            )}
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>حفظ</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintModal({ patients, filter, onClose, onConfirm }) {
  const [cols, setCols] = useState({
    fileNumber: true, patientName: true, dateOfEntry: true, diagnosis: true, enrolmentNumber: true, category: true, identity: true, nationalId: true, dateOfBirth: true, age: true, ageClassification: true, departmentEntryDate: true, clozapax: true, internalPatient: true, internalDiseases: true, status: true
  });
  const [loading, setLoading] = useState(false);

  const colLabels = {
    fileNumber: 'رقم الملف', patientName: 'اسم المريض', dateOfEntry: 'تاريخ الدخول', diagnosis: 'التشخيص', enrolmentNumber: 'رقم القيد', category: 'الفئة', identity: 'الهوية', nationalId: 'الرقم القومي', dateOfBirth: 'تاريخ الميلاد', age: 'العمر', ageClassification: 'تصنيف العمر', departmentEntryDate: 'ت.دخول القسم', clozapax: 'كلوزاباكس', internalPatient: 'مريض باطنة', internalDiseases: 'الأمراض الباطنية', status: 'الحالة'
  };

  const handlePrint = () => {
    onConfirm({ patients, filter, cols, colLabels });
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">خيارات طباعة المرضى</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3 fw-bold text-primary">اختر الأعمدة التي تريد تضمينها في الطباعة:</div>
            <div className="row g-3">
              {Object.keys(colLabels).map(key => (
                <div className="col-12 col-sm-6 col-md-4" key={key}>
                  <div className="d-flex align-items-center gap-2">
                    <input className="form-check-input m-0" type="checkbox" id={`print-col-${key}`} checked={cols[key]} onChange={e => setCols(prev => ({ ...prev, [key]: e.target.checked }))} disabled={loading} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
                    <label className="form-check-label mb-0" htmlFor={`print-col-${key}`} style={{ cursor: 'pointer', userSelect: 'none' }}>{colLabels[key]}</label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary me-auto" onClick={() => setCols(Object.keys(cols).reduce((acc, k) => ({ ...acc, [k]: true }), {}))} disabled={loading}>تحديد الكل</button>
            <button type="button" className="btn btn-outline-secondary me-2" onClick={() => setCols(Object.keys(cols).reduce((acc, k) => ({ ...acc, [k]: false }), {}))} disabled={loading}>إلغاء التحديد</button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>إلغاء</button>
            <button type="button" className="btn btn-primary" onClick={handlePrint} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-printer me-2"></i>}
              تأكيد الطباعة (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



