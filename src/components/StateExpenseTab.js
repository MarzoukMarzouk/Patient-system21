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
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">نفقة الدولة والتأمين</h5>
        <div>
          <input type="text" className="form-control form-control-sm" placeholder="بحث..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ maxWidth: 200 }} />
        </div>
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
