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

export default function StateExpenseTable({ list: rawList, mode, canEdit, onChange, onCopy, onRenew }) {
  const [sortKey, setSortKey] = useState('file');
  const [sortDir, setSortDir] = useState('asc');
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };
  const list = [...rawList].sort((a, b) => {
    let r;
    if (sortKey === 'date') {
      const da = a.stateExpenseEndDate, db = b.stateExpenseEndDate;
      if (!da && !db) r = 0;
      else if (!da) return 1;   // الفارغ دائمًا في الآخر
      else if (!db) return -1;
      else r = da < db ? -1 : da > db ? 1 : 0;
    } else {
      r = parseInt(a.fileNumber || 0) - parseInt(b.fileNumber || 0);
    }
    return sortDir === 'asc' ? r : -r;
  });
  const sortIcon = (key) => (
    <i className={`bi ms-1 ${sortKey === key ? (sortDir === 'asc' ? 'bi-sort-up' : 'bi-sort-down') : 'bi-arrow-down-up text-muted'}`}></i>
  );
  const sortTh = (key, label, props = {}) => (
    <th {...props} role="button" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort(key)}>{label}{sortIcon(key)}</th>
  );
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
              {sortTh('file', 'الملف', { colSpan: 2 })}<th>الاسم</th>{sortTh('date', 'التاريخ')}<th></th><th>ملاحظات</th>
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
            {sortTh('file', 'الملف')}<th>الاسم</th><th>الرقم القومي</th>
            {sortTh('date', 'تاريخ النهاية')}<th></th><th>ملاحظات</th>
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
