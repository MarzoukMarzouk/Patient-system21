import { useState } from 'react';
import * as API from '@/lib/api';
import StateExpenseTable, { ViewTabs, useViewMode } from './StateExpenseTable';

export default function StateExpenseTab({ patients, hasPerm, loadPatients }) {
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [copyMsg, setCopyMsg] = useState('');
  const [viewMode, setViewMode] = useViewMode();

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

  const displayList = patients
    .filter(p => p.category === 'نفقة الدولة')
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (p.patientName || '').toLowerCase().includes(q) || String(p.fileNumber || '').includes(q);
    })
    .filter(p => {
      // date range filter on stateExpenseEndDate (from/to)
      if (!fromDate && !toDate) return true;
      if (!p.stateExpenseEndDate) return false;
      const d = new Date(p.stateExpenseEndDate + 'T00:00:00');
      if (fromDate) {
        const f = new Date(fromDate + 'T00:00:00');
        if (d < f) return false;
      }
      if (toDate) {
        const t = new Date(toDate + 'T23:59:59');
        if (d > t) return false;
      }
      return true;
    })
    .sort((a, b) => parseInt(a.fileNumber || 0) - parseInt(b.fileNumber || 0));

  return (
    <div>
      <div dir="rtl" className="d-flex align-items-center mb-3 flex-wrap gap-2 justify-content-start">
        <div className="d-flex gap-2 align-items-center flex-row-reverse flex-wrap w-100">
          <div className="d-flex align-items-center gap-1 bg-white border rounded px-2 py-1 shadow-sm" style={{ minHeight: '36px' }}>
            <i className="bi bi-calendar3 text-muted"></i>
            <label className="small text-muted mb-0 me-1">من</label>
            <input type="date" className="form-control form-control-sm border-0 bg-transparent p-0" style={{ width: '130px', boxShadow: 'none' }} value={fromDate} onChange={e => setFromDate(e.target.value)} lang="en-GB" />
            <span className="text-muted mx-1">—</span>
            <label className="small text-muted mb-0">إلى</label>
            <input type="date" className="form-control form-control-sm border-0 bg-transparent p-0" style={{ width: '130px', boxShadow: 'none' }} value={toDate} onChange={e => setToDate(e.target.value)} lang="en-GB" />
          </div>
          {copyMsg && <span className="text-success small">{copyMsg}</span>}
          <div className="w-100" style={{ maxWidth: 400 }}><input type="text" className="form-control form-control-sm" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
      </div>

      <ViewTabs mode={viewMode} setMode={setViewMode} />
      <StateExpenseTable list={displayList} mode={viewMode} canEdit={hasPerm('state_expense', 'edit')} onChange={handleFieldChange} onCopy={handleCopy} onRenew={handleRenew} />
    </div>
  );
}

