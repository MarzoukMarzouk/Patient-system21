import { useState, useEffect, useCallback } from 'react';
import * as API from '@/lib/api';

function formatDate(d) {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
}

export default function StateExpenseTab({ patients, hasPerm, loadPatients }) {
  const [sortCol, setSortCol] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [search, setSearch] = useState('');

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const sortIcon = (col) => {
    if (sortCol === col) return sortAsc ? '↑' : '↓';
    return '↕';
  };

  // Group by category
  const grouped = {};
  patients.forEach(p => {
    const cat = p.category ? p.category.trim() : 'غير محدد';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ ...p, committeeDate: p.committeeDate || '', stateExpenseStatus: p.stateExpenseStatus || '', stateExpenseEndDate: p.stateExpenseEndDate || '', stateExpenseNotes: p.stateExpenseNotes || '' });
  });

  const order = ['نفقة الدولة', 'درجة', 'تأمين', 'مجانى', 'غير محدد'];
  const categories = Object.keys(grouped).sort((a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const handleFieldChange = async (id, field, value) => {
    try {
      const p = patients.find(x => x.id == id);
      if (!p) return;
      const updates = {
        committeeDate: field === 'committeeDate' ? value : p.committeeDate,
        stateExpenseStatus: field === 'stateExpenseStatus' ? value : p.stateExpenseStatus,
        stateExpenseEndDate: field === 'stateExpenseEndDate' ? value : p.stateExpenseEndDate,
        stateExpenseNotes: field === 'stateExpenseNotes' ? value : p.stateExpenseNotes,
      };
      await API.updateStateExpenseFields(id, updates);
      await loadPatients();
    } catch (err) {
      alert('فشل التعديل: ' + err.message);
    }
  };

  const copyNationalId = (id) => {
    navigator.clipboard.writeText(id);
    // إشعار صغير
    const evt = new CustomEvent('show-toast', { detail: { msg: 'تم نسخ الرقم القومي ✓', type: 'success' } });
    window.dispatchEvent(evt);
  };

  const printStateExpense = () => {
    // افتح نافذة جديدة مع نسخة HTML للطباعة
    const containerHTML = document.getElementById('stateExpenseContainerPrint')?.innerHTML || '';
    if (!containerHTML) {
      alert('لا توجد بيانات للطباعة');
      return;
    }
    const win = window.open('', '_blank');
    win.document.write(`<!doctype html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<title>طباعة نفقة الدولة</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
<style>
@page { size: A4 portrait; margin: 15mm; }
body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 0; background: #fff; }
.table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
tr { page-break-inside: avoid; page-break-after: auto; }
th, td { border: 1px solid #dee2e6; padding: 6px; font-size: 13px; text-align: right; }
h5 { margin-top: 20px; font-weight: bold; font-size: 16px; padding: 5px; background: #f8f9fa; border: 1px solid #ddd; }
span.badge { color: #000 !important; background: none !important; border: 1px solid #000; padding: 2px 6px; border-radius: 10px; }
</style>
</head>
<body onload="setTimeout(() => { window.print(); window.close(); }, 500);">
<h3 class="text-center mb-4" style="text-decoration: underline;">كشف نفقة الدولة والتأمين</h3>
${containerHTML}
</body>
</html>`);
    win.document.close();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <h5 className="mb-0">نفقة الدولة والتأمين</h5>
        <div className="d-flex gap-2">
          <input type="text" className="form-control form-control-sm" placeholder="بحث بالاسم أو رقم الملف..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
          {hasPerm('state_expense', 'edit') && (
            <button className="btn btn-secondary btn-sm" onClick={printStateExpense}>
              <i className="bi bi-printer"></i> طباعة
            </button>
          )}
        </div>
      </div>

      {/* نسخة مخفية للطباعة */}
      <div id="stateExpenseContainerPrint" style={{ position: 'absolute', left: '-99999px', top: 0 }}>
        {categories.map(cat => {
          const list = grouped[cat] || [];
          if (list.length === 0) return null;
          return (
            <div key={`print-${cat}`}>
              <h5>{cat} ({list.length})</h5>
              <table className="table">
                <thead>
                  <tr>
                    <th>الملف</th><th>الاسم</th><th>الرقم القومي</th>
                    <th>تاريخ البداية</th><th>الحالة</th><th>تاريخ النهاية</th><th>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(p => (
                    <tr key={`print-${p.id}`}>
                      <td>{p.fileNumber}</td>
                      <td>{p.patientName}</td>
                      <td>{p.nationalId}</td>
                      <td>{p.committeeDate}</td>
                      <td>{p.stateExpenseStatus}</td>
                      <td>{p.stateExpenseEndDate}</td>
                      <td>{p.stateExpenseNotes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {categories.map(cat => {
        let list = grouped[cat];
        // Filter by search
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(p =>
            (p.patientName || '').toLowerCase().includes(q) ||
            (p.fileNumber || '').includes(q)
          );
        }
        if (list.length === 0) return null;

        // Sort
        if (sortCol) {
          list = [...list].sort((a, b) => {
            let va = a[sortCol] || '', vb = b[sortCol] || '';
            if (sortCol === 'fileNumber') { va = parseInt(va) || 0; vb = parseInt(vb) || 0; }
            return va < vb ? (sortAsc ? -1 : 1) : va > vb ? (sortAsc ? 1 : -1) : 0;
          });
        }

        const color = cat === 'نفقة الدولة' ? 'primary' : cat === 'تأمين' ? 'info' : cat === 'مجانى' ? 'success' : 'secondary';

        return (
          <div className="mb-4" key={cat}>
            <h5 className={`text-${color} fw-bold mb-2 border-bottom pb-1`} style={{ background: '#f8f9fa', padding: 5 }}>
              {cat} <span className={`badge bg-${color} rounded-pill ms-2`}>{list.length}</span>
            </h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle" style={{ whiteSpace: 'nowrap' }}>
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('fileNumber')}>
                      الملف {sortIcon('fileNumber')}
                    </th>
                    <th>الاسم</th>
                    <th>رقم البطاقة</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('committeeDate')}>
                      تاريخ البداية {sortIcon('committeeDate')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('stateExpenseStatus')}>
                      حالة الطلب {sortIcon('stateExpenseStatus')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('stateExpenseEndDate')}>
                      تاريخ النهاية {sortIcon('stateExpenseEndDate')}
                    </th>
                    <th>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(p => (
                    <tr key={p.id} className={
                      p.stateExpenseStatus === 'ساري' ? 'table-success' :
                      p.stateExpenseStatus === 'تم الرفع' ? 'table-warning' : ''
                    }>
                      <td>{p.fileNumber}</td>
                      <td>{p.patientName}</td>
                      <td>
                        {p.nationalId && (
                          <button className="btn btn-sm btn-outline-secondary border-0 p-1 me-2"
                            onClick={() => copyNationalId(p.nationalId)}
                            title="نسخ الرقم القومي">
                            📋
                          </button>
                        )}
                        {p.nationalId}
                      </td>
                      <td>
                        <input type="date" className="form-control form-control-sm"
                          value={p.committeeDate || ''}
                          onChange={e => handleFieldChange(p.id, 'committeeDate', e.target.value)}
                          disabled={!hasPerm('state_expense', 'edit')}
                          lang="en-GB" />
                      </td>
                      <td>
                        <select className="form-select form-select-sm"
                          value={p.stateExpenseStatus || ''}
                          onChange={e => handleFieldChange(p.id, 'stateExpenseStatus', e.target.value)}
                          disabled={!hasPerm('state_expense', 'edit')}>
                          <option value=""></option>
                          <option value="تم الرفع">تم الرفع</option>
                          <option value="ساري">ساري</option>
                        </select>
                      </td>
                      <td>
                        <input type="date" className="form-control form-control-sm"
                          value={p.stateExpenseEndDate || ''}
                          onChange={e => handleFieldChange(p.id, 'stateExpenseEndDate', e.target.value)}
                          disabled={!hasPerm('state_expense', 'edit')}
                          lang="en-GB" />
                      </td>
                      <td>
                        <input type="text" className="form-control form-control-sm"
                          value={p.stateExpenseNotes || ''}
                          onChange={e => handleFieldChange(p.id, 'stateExpenseNotes', e.target.value)}
                          disabled={!hasPerm('state_expense', 'edit')} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
