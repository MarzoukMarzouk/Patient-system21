import { useState, useEffect, useCallback } from 'react';
import * as API from '@/lib/api';

function formatDate(d) {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
}

function getSelectedDiseases() {
  const cbs = document.querySelectorAll('.internal-disease-checkbox:checked');
  return Array.from(cbs).map(cb => cb.value).join(',');
}

export default function PatientsTab({ patients, hasPerm, loadPatients, loadExits }) {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState(null);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(null);

  const displayList = filtered || patients;

  useEffect(() => {
    if (filter) {
      setFiltered(patients.filter(p => (p[filter.key] || '').includes(filter.value)));
    } else {
      setFiltered(null);
    }
  }, [filter, patients]);

  const handleSave = async (formData) => {
    try {
      const data = {
        ...formData,
        internalDiseases: getSelectedDiseases(),
        id: editId || API.generateUniquePatientId(),
      };
      if (editId) {
        data.id = editId;
        await API.updatePatient(data);
      } else {
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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <div className="d-flex gap-2">
          <input type="text" className="form-control form-control-sm" placeholder="بحث..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ maxWidth: 200 }} />
          {filter && (
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setFilter(null)}>
              إلغاء الفلتر
            </button>
          )}
        </div>
        {hasPerm('patients', 'add') && (
          <button className="btn btn-success btn-sm" onClick={() => { setEditId(null); setShowModal(true); }}>
            <i className="bi bi-plus-lg"></i> إضافة
          </button>
        )}
      </div>

      <div className="d-flex flex-wrap gap-2 mb-2">
        {['مجانى', 'نفقة الدولة', 'درجة', 'تأمين'].map(cat => (
          <button key={cat} className={`btn btn-sm ${filter?.key === 'category' && filter?.value === cat ? 'btn-primary' : 'btn-outline-info'}`}
            onClick={() => setFilter({ key: 'category', value: cat })}>
            {cat}
          </button>
        ))}
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover" style={{ whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th>رقم الملف</th><th>اسم المريض</th><th>تاريخ الدخول</th><th>التشخيص</th>
              <th>رقم القيد</th><th>الفئة</th><th>الهوية</th><th>الرقم القومي</th>
              <th>تاريخ الميلاد</th><th>العمر</th><th>تصنيف العمر</th><th>هاتف الاهل</th>
              <th>كلوزاباكس</th><th>مريض باطنة</th><th>الأمراض الباطنية</th>
              <th>الحالة</th><th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {displayList
              .filter(p => !search || p.patientName?.includes(search) || p.fileNumber?.includes(search))
              .sort((a, b) => parseInt(a.fileNumber || 0) - parseInt(b.fileNumber || 0))
              .map(p => (
                <tr key={p.id}>
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
                  <td>{p.internalDiseases}</td>
                  <td>{p.status}</td>
                  <td>
                    {hasPerm('patients', 'edit') && (
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => { setEditId(p.id); setShowModal(true); }}>
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
              ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <PatientModal
          patient={patientForEdit}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function PatientModal({ patient, onSave, onClose }) {
  const [form, setForm] = useState({
    patientName: '', dateOfEntry: '', diagnosis: '', enrolmentNumber: '',
    fileNumber: '', category: '', identity: '', nationalId: '',
    dateOfBirth: '', age: '', ageClassification: '', familyPhone: '',
    clozapax: '', internalPatient: '', status: 'متواجد',
    holidayDate: '', returnDate: '', vacationDurationType: '', vacationDays: '',
    outDate: '', outType: '', outNote: '',
  });

  useEffect(() => {
    if (patient) {
      setForm({ ...patient });
    }
  }, [patient]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.patientName || !form.dateOfEntry || !form.diagnosis || !form.enrolmentNumber || !form.fileNumber || !form.category || !form.identity || !form.ageClassification || !form.clozapax || !form.internalPatient) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    onSave(form);
  };

  const btnClass = (field, val) =>
    `btn btn-sm ${form[field] === val ? 'btn-primary' : 'btn-outline-primary'}`;

  const showHoliday = form.status === 'إجازة';
  const showOut = form.status === 'خروج';

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable modal-fullscreen-sm-down">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{patient ? 'تعديل مريض' : 'إضافة مريض جديد'}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form id="patientForm">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">اسم المريض</label>
                  <input type="text" className="form-control" value={form.patientName}
                    onChange={e => handleChange('patientName', e.target.value)} required />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">تاريخ الدخول</label>
                  <input type="date" className="form-control" value={form.dateOfEntry}
                    onChange={e => handleChange('dateOfEntry', e.target.value)} required />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">هاتف الاهل</label>
                  <input type="tel" className="form-control" value={form.familyPhone}
                    onChange={e => handleChange('familyPhone', e.target.value)} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">التشخيص</label>
                <input type="text" className="form-control" value={form.diagnosis}
                  onChange={e => handleChange('diagnosis', e.target.value)} required />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">رقم القيد</label>
                  <input type="text" className="form-control" value={form.enrolmentNumber}
                    onChange={e => handleChange('enrolmentNumber', e.target.value)} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">رقم الملف</label>
                  <input type="text" className="form-control" value={form.fileNumber}
                    onChange={e => handleChange('fileNumber', e.target.value)} required />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">التصنيف</label>
                <div className="btn-group w-100">
                  {['مجانى', 'نفقة الدولة', 'درجة', 'تأمين'].map(v => (
                    <button key={v} type="button" className={btnClass('category', v)}
                      onClick={() => handleChange('category', v)}>{v}</button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">الهوية</label>
                <div className="btn-group w-100">
                  {['مجهول الهوية', 'بطاقة'].map(v => (
                    <button key={v} type="button" className={btnClass('identity', v)}
                      onClick={() => handleChange('identity', v)}>{v}</button>
                  ))}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">الرقم القومي</label>
                  <input type="text" className="form-control" maxLength={14} value={form.nationalId}
                    onChange={e => handleChange('nationalId', e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">تاريخ الميلاد</label>
                  <input type="date" className="form-control" value={form.dateOfBirth}
                    onChange={e => handleChange('dateOfBirth', e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">العمر</label>
                  <input type="number" className="form-control" value={form.age}
                    onChange={e => handleChange('age', e.target.value)} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">تصنيف العمر</label>
                <div className="btn-group w-100">
                  {['فوق 50 عام', 'تحت 50 عام'].map(v => (
                    <button key={v} type="button" className={btnClass('ageClassification', v)}
                      onClick={() => handleChange('ageClassification', v)}>{v}</button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">حالة المريض</label>
                <div className="btn-group w-100">
                  {['متواجد', 'إجازة', 'خروج'].map(v => (
                    <button key={v} type="button" className={btnClass('status', v)}
                      onClick={() => handleChange('status', v)}>{v}</button>
                  ))}
                </div>
              </div>
              {showHoliday && (
                <div className="mb-3">
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label">تاريخ الإجازة</label>
                      <input type="date" className="form-control" value={form.holidayDate}
                        onChange={e => handleChange('holidayDate', e.target.value)} />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label">تاريخ العودة</label>
                      <input type="date" className="form-control" value={form.returnDate}
                        onChange={e => handleChange('returnDate', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
              {showOut && (
                <div className="mb-3">
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">تاريخ الخروج</label>
                      <input type="date" className="form-control" value={form.outDate}
                        onChange={e => handleChange('outDate', e.target.value)} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">نوع الخروج</label>
                      <select className="form-select" value={form.outType}
                        onChange={e => handleChange('outType', e.target.value)}>
                        <option value="">-- اختر --</option>
                        <option value="بصحبة نفسه">بصحبة نفسه</option>
                        <option value="بصحبة الأهل">بصحبة الأهل</option>
                        <option value="بصحبة التمريض">بصحبة التمريض</option>
                        <option value="انتقال لقسم آخر">انتقال لقسم آخر</option>
                        <option value="وفاه">وفاه</option>
                        <option value="هروب">هروب</option>
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
                <label className="form-label">كلوزاباكس</label>
                <div className="btn-group w-100">
                  {['نعم', 'لا'].map(v => (
                    <button key={v} type="button" className={btnClass('clozapax', v)}
                      onClick={() => handleChange('clozapax', v)}>{v}</button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">مريض باطنة</label>
                <div className="btn-group w-100">
                  {['نعم', 'لا'].map(v => (
                    <button key={v} type="button" className={btnClass('internalPatient', v)}
                      onClick={() => handleChange('internalPatient', v)}>{v}</button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">الأمراض الباطنية</label>
                <div>
                  {['سكر', 'ضغط', 'قلب', 'دهون', 'جراحة', 'صدر', 'أخرى'].map(d => (
                    <div className="form-check form-check-inline" key={d}>
                      <input className="form-check-input internal-disease-checkbox" type="checkbox" value={d} id={`disease-${d}`}
                        defaultChecked={patient?.internalDiseases?.includes(d)} />
                      <label className="form-check-label" htmlFor={`disease-${d}`}>{d}</label>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>حفظ</button>
          </div>
        </div>
      </div>
    </div>
  );
}
