import { useState, useEffect, useCallback, useRef } from 'react';
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
  dateOfBirth: '', age: '', ageClassification: '', familyPhone: '',
  clozapax: '', internalPatient: '', status: 'متواجد',
  holidayDate: '', returnDate: '', vacationDurationType: '', vacationDays: '',
  outDate: '', outType: '', outNote: '',
};

export default function PatientsTab({ patients, hasPerm, loadPatients, loadExits }) {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState(null);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState(null);

  const displayList = filtered || patients;

  useEffect(() => {
    const pendingId = localStorage.getItem('editPatientNext');
    if (pendingId) {
      localStorage.removeItem('editPatientNext');
      const p = patients.find(x => x.id === pendingId);
      if (p) { setEditId(pendingId); setShowModal(true); }
    }
  }, [patients]);

  useEffect(() => {
    if (filter) {
      setFiltered(patients.filter(p => (p[filter.key] || '').includes(filter.value)));
    } else {
      setFiltered(null);
    }
  }, [filter, patients]);

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
      alert('خطأ: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المريض؟')) return;
    try {
      await API.deletePatient(id);
      await loadPatients();
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const patientForEdit = editId ? patients.find(p => p.id === editId) : null;

  return (
    <>
    <div className="d-print-none">
      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <div className="d-flex gap-2 flex-wrap">
          <input type="text" className="form-control form-control-sm" placeholder="بحث بالاسم أو رقم الملف..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ maxWidth: 220 }} />
          <button className="btn btn-sm btn-outline-secondary" data-bs-toggle="collapse" data-bs-target="#filtersCollapse">
            <i className="bi bi-funnel"></i> فلتر
          </button>
          {filter && (
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setFilter(null)}>
              إلغاء الفلتر
            </button>
          )}
        </div>
        <div className="d-flex gap-2">
          {hasPerm('patients', 'print') && (
            <button className="btn btn-outline-primary btn-sm d-print-none" onClick={() => setShowPrintModal(true)}>
              <i className="bi bi-printer"></i> طباعة
            </button>
          )}
          {hasPerm('patients', 'add') && (
            <button className="btn btn-success btn-sm d-print-none" onClick={() => { setEditId(null); setShowModal(true); }}>
              <i className="bi bi-plus-lg"></i> إضافة
            </button>
          )}
        </div>
      </div>

      <div className="collapse mb-2" id="filtersCollapse">
        <div className="card card-body py-2 px-3">
          <div className="d-flex flex-wrap gap-1 align-items-center">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setFilter(null)}>إلغاء</button>
            <div className="dropdown me-2">
              <button className="btn btn-sm btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                التشخيص
              </button>
              <ul className="dropdown-menu" style={{ maxHeight: 200, overflowY: 'auto' }}>
                {[...new Set(patients.map(p => p.diagnosis).filter(Boolean))].map(d => (
                  <li key={d}><a className="dropdown-item small" href="#" onClick={e => { e.preventDefault(); setFilter({ key: 'diagnosis', value: d }); }}>{d}</a></li>
                ))}
              </ul>
            </div>
            <div className="dropdown me-2">
              <button className="btn btn-sm btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                الأمراض الباطنية
              </button>
              <ul className="dropdown-menu" style={{ maxHeight: 200, overflowY: 'auto' }}>
                {[...new Set(patients.flatMap(p => (p.internalDiseases || '').split(',').map(s => s.trim())).filter(Boolean))].map(d => (
                  <li key={d}><a className="dropdown-item small" href="#" onClick={e => { e.preventDefault(); setFilter({ key: 'internalDiseases', value: d }); }}>{d}</a></li>
                ))}
              </ul>
            </div>
            <span className="small text-muted mx-1">|</span>
            {[
              { k: 'category', v: 'مجانى', c: 'info' },
              { k: 'category', v: 'نفقة الدولة', c: 'info' },
              { k: 'category', v: 'درجة', c: 'info' },
              { k: 'category', v: 'تأمين', c: 'info' },
              { k: 'identity', v: 'بطاقة', c: 'warning' },
              { k: 'identity', v: 'مجهول الهوية', c: 'warning' },
              { k: 'clozapax', v: 'نعم', c: 'danger', l: 'كلوزابكس' },
              { k: 'internalPatient', v: 'نعم', c: 'success', l: 'مرضى الباطنة' },
              { k: 'ageClassification', v: 'فوق 50 عام', c: 'dark' },
              { k: 'ageClassification', v: 'تحت 50 عام', c: 'dark' },
            ].map(f => (
              <button key={`${f.k}-${f.v}`}
                className={`btn btn-sm ${filter?.key === f.k && filter?.value === f.v ? 'btn-' + f.c : 'btn-outline-' + f.c}`}
                onClick={() => setFilter({ key: f.k, value: f.v })}>
                {f.l || f.v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover" style={{ whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th>رقم الملف</th><th>اسم المريض</th><th>تاريخ الدخول</th><th>التشخيص</th>
              <th>رقم القيد</th><th>الفئة</th><th>الهوية</th><th>الرقم القومي</th>
              <th>تاريخ الميلاد</th><th>العمر</th><th>تصنيف العمر</th><th>هاتف الاهل</th>
              <th>كلوزاباكس</th><th>مريض باطنة</th><th>الأمراض الباطنية</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {displayList
              .filter(p => !search || (p.patientName || '').includes(search) || (p.fileNumber || '').includes(search))
              .sort((a, b) => parseInt(a.fileNumber || 0) - parseInt(b.fileNumber || 0))
              .map(p => {
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
                    <td>{p.diagnosis}</td>
                    <td>{p.enrolmentNumber}</td>
                    <td>{p.category}</td>
                    <td>{p.identity}</td>
                    <td>{p.nationalId}</td>
                    <td>{formatDate(p.dateOfBirth)}</td>
                    <td>{p.age}</td>
                    <td>{p.ageClassification}</td>
                    <td>{p.familyPhone}</td>
                    <td>{p.clozapax}</td>
                    <td>{p.internalPatient}</td>
                    <td>{(p.internalDiseases || '').split(',').map(s => s.trim()).filter(Boolean).map(d =>
                      <span key={d} className="badge bg-primary me-1">{d}</span>
                    )}</td>
                    <td>{p.status}</td>
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
          patients={displayList.filter(p => !search || (p.patientName || '').includes(search) || (p.fileNumber || '').includes(search)).sort((a, b) => parseInt(a.fileNumber || 0) - parseInt(b.fileNumber || 0))}
          filter={filter}
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

  useEffect(() => {
    if (patient) {
      setForm({ ...EMPTY_FORM, ...patient });
      setSelectedDiseases((patient.internalDiseases || '').split(',').map(s => s.trim()).filter(Boolean));
    } else {
      setForm(EMPTY_FORM);
      setSelectedDiseases([]);
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
      alert('الرجاء إدخال رقم قومي صحيح مكون من 14 رقم');
      return;
    }
    const result = API.calculateAgeFromNationalId(form.nationalId);
    if (!result.age) { alert('الرقم القومي غير صحيح'); return; }
    setForm(prev => ({
      ...prev,
      dateOfBirth: result.dateOfBirth,
      age: result.age,
      ageClassification: result.ageClassification,
    }));
  };

  const calcReturnDate = () => {
    if (!form.holidayDate) return;
    const start = new Date(form.holidayDate);
    let days = 0;
    if (form.vacationDurationType === 'أسبوع') days = 7;
    else if (form.vacationDurationType === 'أسبوعين') days = 14;
    else if (form.vacationDurationType === 'عدد') {
      days = parseInt(form.vacationDays);
      if (!days || days < 1) return;
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
      alert('الحقول المطلوبة مفقودة: ' + missing.join('، '));
      return;
    }
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
            <h5 className="modal-title">{patient ? 'تعديل بيانات المريض' : 'إضافة مريض جديد'}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form id="patientForm" onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">اسم المريض *</label>
                  <input type="text" className="form-control" value={form.patientName}
                    onChange={e => handleChange('patientName', e.target.value)} required />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">تاريخ الدخول *</label>
                  <input type="date" className="form-control" value={form.dateOfEntry}
                    onChange={e => handleChange('dateOfEntry', e.target.value)} lang="en-GB" required />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">هاتف الاهل</label>
                  <input type="tel" className="form-control" value={form.familyPhone}
                    onChange={e => handleChange('familyPhone', e.target.value)} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">التشخيص *</label>
                <input type="text" className="form-control" value={form.diagnosis}
                  onChange={e => handleChange('diagnosis', e.target.value)} required />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">رقم القيد *</label>
                  <input type="text" className="form-control" value={form.enrolmentNumber}
                    onChange={e => handleChange('enrolmentNumber', e.target.value)} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">رقم الملف *</label>
                  <input type="text" className="form-control" value={form.fileNumber}
                    onChange={e => handleChange('fileNumber', e.target.value)} required />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">التصنيف *</label>
                <div className="btn-group w-100">
                  {CATEGORIES.map(v => (
                    <button key={v} type="button" className={btnClass('category', v)}
                      onClick={() => handleChange('category', v)}>{v}</button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">الهوية *</label>
                <div className="btn-group w-100">
                  {IDENTITIES.map(v => (
                    <button key={v} type="button" className={btnClass('identity', v)}
                      onClick={() => handleChange('identity', v)}>{v}</button>
                  ))}
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
              {showBirth && (
                <div className="row mb-3">
                  <div className="col-md-4">
                    <label className="form-label">تاريخ الميلاد</label>
                    <input type="date" className="form-control" value={form.dateOfBirth}
                      onChange={e => handleChange('dateOfBirth', e.target.value)} lang="en-GB" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">العمر</label>
                    <input type="number" className="form-control" value={form.age}
                      onChange={e => handleChange('age', e.target.value)} />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label">تصنيف العمر *</label>
                    <div className="btn-group w-100">
                      {AGE_CLASS.map(v => (
                        <button key={v} type="button" className={btnClass('ageClassification', v)}
                          onClick={() => handleChange('ageClassification', v)}>{v}</button>
                      ))}
                    </div>
                  </div>
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
    fileNumber: true, patientName: true, dateOfEntry: true, diagnosis: true, enrolmentNumber: true, category: true, identity: true, nationalId: true, dateOfBirth: true, age: true, ageClassification: true, familyPhone: true, clozapax: true, internalPatient: true, internalDiseases: true, status: true
  });
  const [loading, setLoading] = useState(false);

  const colLabels = {
    fileNumber: 'رقم الملف', patientName: 'اسم المريض', dateOfEntry: 'تاريخ الدخول', diagnosis: 'التشخيص', enrolmentNumber: 'رقم القيد', category: 'الفئة', identity: 'الهوية', nationalId: 'الرقم القومي', dateOfBirth: 'تاريخ الميلاد', age: 'العمر', ageClassification: 'تصنيف العمر', familyPhone: 'هاتف الاهل', clozapax: 'كلوزاباكس', internalPatient: 'مريض باطنة', internalDiseases: 'الأمراض الباطنية', status: 'الحالة'
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

