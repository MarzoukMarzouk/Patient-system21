import { useState, useEffect, useRef } from 'react';

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
    <ul className="nav nav-pills nav-fill se-tabs">
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
    <DateField className="form-control form-control-sm" style={{ minWidth: mode === 'compact' ? 0 : 135, fontSize: mode === 'compact' ? '.8rem' : undefined, padding: '.15rem .35rem' }}
      value={p.stateExpenseEndDate || ''}
      onChange={v => onChange(p.id, 'stateExpenseEndDate', v)}
      disabled={!canEdit} showIcon={mode !== 'compact'} />
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
        <style>{`.state-compact th,.state-compact td{padding:.25rem .2rem !important}.state-compact{width:auto !important}.state-compact input{padding:.15rem .3rem}`}</style>
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

// رأس الصفحة المشترك: التاريخ + البحث + تابين (هاتف / ويندوز) على خط واحد في الشاشات الكبيرة
export function StateExpenseHeader({ fromDate, setFromDate, toDate, setToDate, search, setSearch, copyMsg, viewMode, setViewMode }) {
  return (
    <div dir="rtl" className="d-flex align-items-center mb-2 flex-wrap gap-2 justify-content-start">
      <style>{`.se-search{width:100%;max-width:400px}.se-tabs{width:100%}@media(min-width:768px){.se-search{width:250px}.se-tabs{width:auto}.se-tabs .nav-item{flex:0 0 auto}}`}</style>
      <div className="se-search d-flex align-items-center justify-content-between gap-1 bg-white border rounded px-2 py-1 shadow-sm" style={{ minHeight: '36px' }}>
        <div className="d-flex align-items-center gap-1">
          <i className="bi bi-calendar3 text-muted"></i>
          <label className="small text-muted mb-0 me-1">من</label>
          <DateField style={{ flex: 1, minWidth: '70px' }} value={fromDate} onChange={setFromDate} />
        </div>
        <span className="text-muted mx-1">—</span>
        <div className="d-flex align-items-center gap-1">
          <label className="small text-muted mb-0">إلى</label>
          <DateField style={{ flex: 1, minWidth: '70px' }} value={toDate} onChange={setToDate} />
        </div>
      </div>
      {copyMsg && <span className="text-success small">{copyMsg}</span>}
      <div className="se-search">
        <input type="text" className="form-control form-control-sm" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <ViewTabs mode={viewMode} setMode={setViewMode} />
    </div>
  );
}

// حقل تاريخ يعرض النص بصيغة ثابتة (يوم/شهر/سنة) بدل نص المتصفح المترجم حسب لغة الجهاز،
// وفوقه حقل التاريخ الأصلي شفاف لفتح منتقي التاريخ
export function DateField({ value, onChange, disabled, showIcon = true, className = '', style }) {
  const ref = useRef(null);
  // عكس الترتيب ليكون سنة / شهر / يوم حسب طلب المستخدم
  const text = value ? value.split('-').join('/') : '----/--/--';
  return (
    <div dir="ltr" className={`position-relative d-inline-flex align-items-center justify-content-center gap-1 ${className}`} style={style}>
      {showIcon && <i className="bi bi-calendar3 text-muted" style={{ fontSize: '.8em' }}></i>}
      <span className={value ? '' : 'text-muted'}>{text}</span>
      <input ref={ref} type="date" value={value || ''} disabled={disabled}
        onChange={e => onChange(e.target.value)}
        onClick={() => { try { ref.current && ref.current.showPicker && ref.current.showPicker(); } catch {} }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: disabled ? 'default' : 'pointer', padding: 0, border: 0 }} />
    </div>
  );
}