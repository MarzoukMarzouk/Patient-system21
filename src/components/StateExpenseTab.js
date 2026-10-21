import { useState } from 'react';
import * as API from '@/lib/api';
import StateExpenseTable, { StateExpenseHeader, useViewMode } from './StateExpenseTable';

export default function StateExpenseTab({ patients, hasPerm, loadPatients }) {
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [copyMsg, setCopyMsg] = useState('');
  const [viewMode, setViewMode] = useViewMode();
  const [filterType, setFilterType] = useState('all');
  const [weekOffset, setWeekOffset] = useState(0);

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
      <StateExpenseHeader fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate}
        search={search} setSearch={setSearch} copyMsg={copyMsg} viewMode={viewMode} setViewMode={setViewMode}
        filterType={filterType} setFilterType={setFilterType} weekOffset={weekOffset} setWeekOffset={setWeekOffset} totalCount={displayList.length} />
      <StateExpenseTable list={displayList} mode={viewMode} canEdit={hasPerm('state_expense', 'edit')} onChange={handleFieldChange} onCopy={handleCopy} onRenew={handleRenew} />
    </div>
  );
}