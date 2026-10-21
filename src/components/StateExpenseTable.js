import { useState, useEffect } from 'react';

// عرض مشترك لتبويبي نفقة الدولة ومتابعة نفقة الدولة
// العرض الحالي (كامل) أو العرض المختصر (الافتراضي على الهاتف)
export function useViewMode() {
  const [mode, setMode] = useState('full');
  useEffect(() => {
    if (window.innerWidth < 768) setMode('compact');
  }, []);
  return [mode, setMode];
}

export function ViewTabs({ mode, setMode }) {
  return (
    <ul className="nav nav-pills nav-fill mb-2 w-100">
      <li className="nav-item">
        <button type="button" className={`nav-link py-1 ${mode === 'compact' ? 'active' : ''}`} onClick={() => setMode('compact')}>الهاتف</button>
      </li>
      <li className="nav-item">
        <button type="button" className={`nav-link py-1 ${mode === 'full' ? 'active' : ''}`} onClick={() => setMode('full')}>الويندوز</button>
      </li>
    </ul>
  );
}

export default function StateExpenseTable({ list, mode, canEdit, onChange, onCopy, onRenew }) {
  const copyBtn = (id) => (
    <button className="btn btn-sm btn-outline-primary" onClick={() => onCopy(id)} title="نسخ">
      <i className="bi bi-clipboard"></i>
    </button>
  );
  const renewBtn = (id) => canEdit && (
    <button className="btn btn-sm btn-outline-success" title="تجديد +30 يوم" onClick={() => onRenew(id)}>
      <i className="bi bi-arrow-repeat"></i>
    </button>
  );
  const dateInput = (p) => (
    <input type="date" className="form-control form-control-sm" style={{ minWidth: 118 }}
      value={p.stateExpenseEndDate || ''}
      onChange={e => onChange(p.id, 'stateExpenseEndDate', e.target.value)}
      disabled={!canEdit} />
  );
  const notesInput = (p) => (
    <input type="text" className="form-control form-control-sm" style={{ minWidth: 90 }}
      value={p.stateExpenseNotes || ''}
      onChange={e => onChange(p.id, 'stateExpenseNotes', e.target.value)}
      disabled={!canEdit} />
  );

  if (mode === 'compact') {
    // الملف | زر النسخ | الاسم | التاريخ | زر التجديد | الملاحظات
    return (
      <div className="table-responsive">
        <style>{`.state-compact th,.state-compact td{padding:.25rem .2rem !important}.state-compact{width:auto !important}.state-compact input{padding:.15rem .3rem}.state-compact input[type=date]{min-width:0 !important;width:100px;padding:.15rem .2rem;font-size:.8rem}.state-compact input[type=date]::-webkit-calendar-picker-indicator{order:-1;margin:0 .15rem 0 0;padding:0}`}</style>
        <table className="table table-sm table-hover table-striped align-middle mb-0 state-compact w-auto" style={{ whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th colSpan={2}>الملف</th><th>الاسم</th><th>التاريخ</th><th></th><th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id}>
                <td colSpan={2}><div className="d-flex align-items-center gap-1"><span style={{ minWidth: 18, textAlign: 'center' }}>{p.fileNumber}</span>{copyBtn(p.id)}</div></td>
                <td>{(p.patientName || '').trim().split(/\s+/).slice(0, 3).join(' ')}</td>
                <td>{dateInput(p)}</td>
                <td>{renewBtn(p.id)}</td>
                <td>{notesInput(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover table-striped align-middle" style={{ whiteSpace: 'nowrap' }}>
        <thead>
          <tr>
            <th>الملف</th><th>الاسم</th><th>الرقم القومي</th>
            <th>تاريخ النهاية</th><th></th><th>ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {list.map(p => (
            <tr key={p.id}>
              <td>{p.fileNumber}</td>
              <td>{p.patientName}</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  {copyBtn(p.id)}
                  {p.nationalId}
                </div>
              </td>
              <td>{dateInput(p)}</td>
              <td>{renewBtn(p.id)}</td>
              <td>{notesInput(p)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
