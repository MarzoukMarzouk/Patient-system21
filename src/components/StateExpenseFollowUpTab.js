import { useState } from 'react';
import * as API from '@/lib/api';

export default function StateExpenseFollowUpTab({ patients, hasPerm, loadPatients }) {
  const [search, setSearch] = useState('');
  // الفلتر الافتراضي: كل الحالات اللي تاريخ انتهائها فات أو فاضي (لا حاجة لأزرار اختيار)
  const [copyMsg, setCopyMsg] = useState('');

  const handleFieldChange = async (id, field, value) => {
    try {
      const p = patients.find(x => x.id == id);
      if (!p) return;
      await API.updateStateExpenseFields(id, {
        committeeDate: p.committeeDate,
        stateExpenseStatus: field === 'stateExpenseStatus' ? value : p.stateExpenseStatus,
        stateExpenseEndDate: field === 'stateExpenseEndDate' ? value : p.stateExpenseEndDate,
        stateExpenseNotes: field === 'stateExpenseNotes' ? value : p.stateExpenseNotes,
      });
      await loadPatients();
    } catch (err) {
      alert('فشل التعديل: ' + err.message);
    }
  };

  const handleCopy = async (id) => {
    try {
      const p = patients.find(x => x.id == id);
      if (!p || !p.nationalId) return;
      await navigator.clipboard.writeText(p.nationalId);
      setCopyMsg('تم النسخ');
      setTimeout(() => setCopyMsg(''), 2000);
    } catch {}
  };

  const handleRenew = async (id) => {
    try {
      const p = patients.find(x => x.id == id);
      if (!p) return;
      const currentEnd = p.stateExpenseEndDate ? new Date(p.stateExpenseEndDate) : new Date();
      currentEnd.setDate(currentEnd.getDate() + 30);
      const pad = n => String(n).padStart(2, '0');
      const newDate = `${currentEnd.getFullYear()}-${pad(currentEnd.getMonth() + 1)}-${pad(currentEnd.getDate())}`;
      await API.updateStateExpenseFields(id, {
        committeeDate: p.committeeDate,
        stateExpenseStatus: p.stateExpenseStatus,
        stateExpenseEndDate: newDate,
        stateExpenseNotes: p.stateExpenseNotes,
      });
      await loadPatients();
    } catch (err) {
      alert('فشل التجديد: ' + err.message);
    }
  };

  const today = new Date();
  today.setHours(23, 59, 59, 0);

  const displayList = patients
    .filter(p => p.category === 'نفقة الدولة')
    .filter(p => {
      // الفلتر الافتراضي: كل من انتهت صلاحيته أو لم يحدد له تاريخ نهاية
      if (!p.stateExpenseEndDate) return true;
      const endDate = new Date(p.stateExpenseEndDate);
      return endDate <= today;
    })
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (p.patientName || '').toLowerCase().includes(q) || String(p.fileNumber || '').includes(q);
    })
    .sort((a, b) => parseInt(a.fileNumber || 0) - parseInt(b.fileNumber || 0));

  return (
    <div>
      <div className="d-flex justify-content-start align-items-center mb-2 flex-wrap gap-2">
        <h5 className="mb-0 ms-3">متابعة نفقة الدولة</h5>
        <div className="d-flex gap-2 align-items-center">
          {copyMsg && <span className="text-success small">{copyMsg}</span>}
          <input type="text" className="form-control form-control-sm" placeholder="بحث..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ maxWidth: 250 }} />
        </div>
      </div>



      <div className="table-responsive">
        <table className="table table-hover table-striped align-middle" style={{ whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th>الملف</th><th>الاسم</th><th>الرقم القومي</th>
              <th>حالة الطلب</th><th>تاريخ النهاية</th><th></th><th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {displayList.map(p => (
              <tr key={p.id}>
                <td>{p.fileNumber}</td>
                <td>{p.patientName}</td>
                <td>
                  <div className="d-flex align-items-center gap-1">
                    <button className="btn btn-sm btn-outline-secondary border-0 p-0" onClick={() => handleCopy(p.id)} title="نسخ">
                      <i className="bi bi-clipboard"></i>
                    </button>
                    {p.nationalId}
                  </div>
                </td>
                <td>
                  <select className="form-select form-select-sm"
                    value={p.stateExpenseStatus || ''}
                    onChange={e => handleFieldChange(p.id, 'stateExpenseStatus', e.target.value)}
                    disabled={!hasPerm('state_expense_follow_up', 'edit')}>
                    <option value=""></option>
                    <option value="تم الرفع">تم الرفع</option>
                    <option value="ساري">ساري</option>
                  </select>
                </td>
                <td>
                  <input type="date" className="form-control form-control-sm"
                    value={p.stateExpenseEndDate || ''}
                    onChange={e => handleFieldChange(p.id, 'stateExpenseEndDate', e.target.value)}
                    disabled={!hasPerm('state_expense_follow_up', 'edit')} />
                </td>
                <td>
                  {hasPerm('state_expense_follow_up', 'edit') && (
                    <button className="btn btn-sm btn-outline-success" title="تجديد +30 يوم" onClick={() => handleRenew(p.id)}>
                      <i className="bi bi-arrow-repeat"></i>
                    </button>
                  )}
                </td>
                <td>
                  <input type="text" className="form-control form-control-sm"
                    value={p.stateExpenseNotes || ''}
                    onChange={e => handleFieldChange(p.id, 'stateExpenseNotes', e.target.value)}
                    disabled={!hasPerm('state_expense_follow_up', 'edit')} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



