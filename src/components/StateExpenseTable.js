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
export function StateExpenseHeader({
  fromDate, setFromDate, toDate, setToDate,
  search, setSearch, copyMsg,
  viewMode, setViewMode,
  filterType, setFilterType,
  weekOffset, setWeekOffset, totalCount
}) {
  const [weekRange, setWeekRange] = useState({ label: '', startStr: '', endStr: '' });

  useEffect(() => {
    const update = () => {
      const range = getWeekRange(weekOffset || 0);
      setWeekRange(range);
      if (filterType === 'week') {
        setFromDate(range.startStr);
        setToDate(range.endStr);
      }
    };
    update();
    window.addEventListener('patient_app_settings_changed', update);
    return () => window.removeEventListener('patient_app_settings_changed', update);
  }, [weekOffset, filterType]);

  const handleTabChange = (type) => {
    setFilterType(type);
    if (type === 'week') {
      const range = getWeekRange(weekOffset || 0);
      setFromDate(range.startStr);
      setToDate(range.endStr);
    } else {
      setFromDate('');
      setToDate('');
    }
  };

  return (
    <div dir="rtl" className="mb-3">
      <style>{`
        .seh-container {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .seh-dates {
          min-width: 260px;
        }
        .seh-search {
          flex: 1 1 180px;
          max-width: 280px;
        }
        @media (max-width: 767px) {
          .seh-dates, .seh-search {
            width: 100%;
            max-width: 100%;
          }
          .seh-viewtabs {
            width: 100%;
          }
          .seh-viewtabs .nav {
            width: 100%;
          }
          .seh-viewtabs .nav-item {
            flex: 1;
          }
          .seh-viewtabs .nav-link {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>

      <div className="d-flex flex-column gap-2">
        <style>{`
          .seh-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }
          .seh-tabs-group {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: nowrap;
          }
          .seh-dates {
            min-width: 250px;
          }
          .seh-search {
            width: 180px;
          }
          @media (max-width: 991px) {
            .seh-tabs-group {
              width: 100%;
              justify-content: space-between;
              overflow-x: auto;
              padding-bottom: 2px;
            }
            .seh-dates {
              flex: 1 1 240px;
            }
            .seh-search {
              flex: 1 1 160px;
            }
          }
          @media (max-width: 767px) {
            .seh-dates, .seh-search {
              width: 100%;
              flex: 1 1 100%;
            }
          }
        `}</style>

        {/* سطر العناصر: على الكمبيوتر / الشاشات الكبيرة سطر واحد متكامل تماماً */}
        <div className="seh-row">
          {/* الأربع تابات معاً */}
          <div className="seh-tabs-group">
            {/* تاب الكل / أسبوع */}
            <div className="btn-group shadow-sm" role="group">
              <button
                type="button"
                className={`btn btn-sm px-2 py-1 ${filterType === 'all' ? 'btn-primary fw-bold' : 'btn-outline-primary bg-white'}`}
                onClick={() => handleTabChange('all')}
              >
                الكل
              </button>
              <button
                type="button"
                className={`btn btn-sm px-2 py-1 ${filterType === 'week' ? 'btn-primary fw-bold' : 'btn-outline-primary bg-white'}`}
                onClick={() => handleTabChange('week')}
              >
                <i className="bi bi-calendar-week ms-1"></i>
                أسبوع
              </button>
            </div>

            {/* تاب الهاتف / الويندوز */}
            <div className="btn-group shadow-sm" role="group">
              <button
                type="button"
                className={`btn btn-sm px-2 py-1 ${viewMode === 'compact' ? 'btn-primary fw-bold' : 'btn-outline-primary bg-white'}`}
                onClick={() => setViewMode('compact')}
              >
                الهاتف
              </button>
              <button
                type="button"
                className={`btn btn-sm px-2 py-1 ${viewMode === 'full' ? 'btn-primary fw-bold' : 'btn-outline-primary bg-white'}`}
                onClick={() => setViewMode('full')}
              >
                الويندوز
              </button>
            </div>

            {/* على الهاتف يظهر العداد بجانبهم لو الشاشة صغيرة */}
            {totalCount !== undefined && (
              <span className="badge bg-secondary rounded-pill px-3 py-1 fs-6 shadow-sm d-lg-none">
                {totalCount}
              </span>
            )}
          </div>

          {/* التواريخ: من - إلى */}
          <div className="seh-dates d-flex align-items-center justify-content-between gap-1 bg-white border rounded px-2 py-1 shadow-sm" style={{ minHeight: '36px' }}>
            <div className="d-flex align-items-center gap-1">
              <i className="bi bi-calendar3 text-muted"></i>
              <label className="small text-muted mb-0 me-1">من</label>
              <DateField style={{ minWidth: '75px' }} value={fromDate} onChange={setFromDate} />
            </div>
            <span className="text-muted mx-1">—</span>
            <div className="d-flex align-items-center gap-1">
              <label className="small text-muted mb-0">إلى</label>
              <DateField style={{ minWidth: '75px' }} value={toDate} onChange={setToDate} />
            </div>
          </div>

          {/* حقل البحث */}
          <div className="seh-search">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="بحث..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {copyMsg && <span className="text-success small fw-bold text-nowrap">{copyMsg}</span>}

          {/* على الشاشات الكبيرة يظهر العداد في الطرف الأيسر بنفس السطر */}
          {totalCount !== undefined && (
            <span className="badge bg-secondary rounded-pill px-3 py-2 fs-6 shadow-sm ms-auto d-none d-lg-inline-block">
              {totalCount}
            </span>
          )}
        </div>

        {/* سطر تنقل الأسابيع إن كان مفعل أسبوع */}
        {filterType === 'week' && (
          <div className="d-flex align-items-center justify-content-between gap-1 bg-white border rounded px-2 py-1 shadow-sm w-100" style={{ maxWidth: '450px' }}>
            <button
              className="btn btn-sm btn-outline-secondary py-0 px-2 border-0"
              title="الأسبوع السابق"
              onClick={() => setWeekOffset(prev => (prev || 0) - 1)}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
            <span className="small fw-bold px-1 text-primary text-nowrap">
              {weekOffset === 0 ? '' : weekOffset > 0 ? `(+${weekOffset}) ` : `(${weekOffset}) `}
              {weekRange.label}
            </span>
            <button
              className="btn btn-sm btn-outline-secondary py-0 px-2 border-0"
              title="الأسبوع التالي"
              onClick={() => setWeekOffset(prev => (prev || 0) + 1)}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            {weekOffset !== 0 && (
              <button
                className="btn btn-sm btn-link p-0 px-1 small text-muted text-decoration-none"
                onClick={() => setWeekOffset(0)}
              >
                (الحالي)
              </button>
            )}
          </div>
        )}
      </div>
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

import { getWeekStartDay } from './SettingsTab';

export function getWeekRange(offset = 0) {
  const startDay = getWeekStartDay(); // 0: Sun, 1: Mon, ... 6: Sat
  const now = new Date();
  const currentDay = now.getDay();
  // diff between current day and start day
  let diff = currentDay - startDay;
  if (diff < 0) diff += 7;

  const startDate = new Date(now);
  startDate.setDate(now.getDate() - diff + (offset * 7));
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  const pad = n => String(n).padStart(2, '0');
  const formatYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return {
    start: startDate,
    end: endDate,
    startStr: formatYMD(startDate),
    endStr: formatYMD(endDate),
    label: `${formatYMD(startDate).split('-').join('/')} — ${formatYMD(endDate).split('-').join('/')}`
  };
}