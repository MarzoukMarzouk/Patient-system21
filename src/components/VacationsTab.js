import { useState } from 'react';

function getDurationLabel(p) {
  if (p.vacationDurationType === 'أسبوع') return 'أسبوع';
  if (p.vacationDurationType === 'أسبوعين') return 'أسبوعين';
  if (p.vacationDurationType === 'عدد' && p.vacationDays) return `${p.vacationDays} يوم`;
  if (p.holidayDate && p.returnDate) {
    const diff = Math.round((new Date(p.returnDate) - new Date(p.holidayDate)) / (1000 * 60 * 60 * 24));
    if (diff === 7) return 'أسبوع';
    if (diff === 14) return 'أسبوعين';
    if (diff > 0) return `${diff} يوم`;
  }
  return '';
}

function getDurationColor(label) {
  if (label === 'أسبوع') return '#0d6efd';
  if (label === 'أسبوعين') return '#6f42c1';
  return '#198754';
}

export default function VacationsTab({ patients, hasPerm, onEditPatient }) {
  const [view, setView] = useState('cards');
  const vacations = patients.filter(p => p.status === 'إجازة');
  const today = new Date();

  const sorted = [...vacations].sort((a, b) => {
    if (!a.returnDate) return 1;
    if (!b.returnDate) return -1;
    return new Date(a.returnDate) - new Date(b.returnDate);
  });

  const handleClick = (p) => {
    if (hasPerm('vacations', 'click') && hasPerm('patients', 'edit') && onEditPatient) {
      onEditPatient(p.id);
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-2 gap-2 flex-wrap">
        <h5 className="mb-0">الإجازات</h5>
        <span className="badge bg-primary" style={{ fontSize: '.9rem' }}>في إجازة: {vacations.length}</span>
        <div className="btn-group btn-group-sm ms-auto">
          <button type="button"
            className={`btn ${view === 'cards' ? 'btn-primary active' : 'btn-outline-primary'}`}
            onClick={() => setView('cards')}>
            <i className="bi bi-grid-3x3-gap"></i> كارت
          </button>
          <button type="button"
            className={`btn ${view === 'table' ? 'btn-primary active' : 'btn-outline-primary'}`}
            onClick={() => setView('table')}>
            <i className="bi bi-list"></i> جدول
          </button>
        </div>
      </div>

      {view === 'cards' ? (
        <div className="row">
          {sorted.map(p => {
            let statusLabel = 'في إجازة', statusClass = 'bg-success', cardBorder = 'border-warning', cardBg = '#fffbe6';
            if (p.returnDate) {
              const rd = new Date(p.returnDate); rd.setHours(0, 0, 0, 0);
              if (rd < today) { statusLabel = 'تجاوز إجازة'; statusClass = 'bg-danger'; cardBorder = 'border-danger'; cardBg = '#fff0f0'; }
            }
            const durationLabel = getDurationLabel(p);
            const durationColor = getDurationColor(durationLabel);
            return (
              <div className="col-md-6 col-lg-4 mb-3" key={p.id}>
                <div className={`card mb-3 ${cardBorder}`}
                  style={{ background: cardBg, cursor: hasPerm('vacations', 'click') ? 'pointer' : 'default' }}
                  onClick={() => handleClick(p)}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="mb-0 fw-bold fs-6">
                        {p.patientName}
                        {durationLabel && (
                          <span style={{ color: durationColor, fontSize: '.8em', fontWeight: 700 }}>
                            {' '}({durationLabel})
                          </span>
                        )}
                      </h6>
                      <span className={`badge ${statusClass} px-2 py-1`}>{statusLabel}</span>
                    </div>
                    <div className="row g-2 text-center">
                      <div className="col-6">
                        <div className="text-primary small fw-bold">رقم الملف:</div>
                        <div className="fw-bold">{p.fileNumber || '-'}</div>
                      </div>
                      <div className="col-6">
                        <div className="text-primary small fw-bold">رقم القيد:</div>
                        <div className="fw-bold">{p.enrolmentNumber || '-'}</div>
                      </div>
                      <div className="col-6">
                        <div className="text-primary small fw-bold">تاريخ الإجازة:</div>
                        <div className="fw-bold">{p.holidayDate}</div>
                      </div>
                      <div className="col-6">
                        <div className="text-primary small fw-bold">تاريخ العودة:</div>
                        <div className="fw-bold">{p.returnDate}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm table-striped table-hover align-middle" style={{ fontSize: '.78rem' }}>
            <thead className="table-primary">
              <tr>
                <th>ملف</th><th>مريض</th><th>بداية</th><th>عودة</th><th>المدة</th><th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => {
                let status = 'في إجازة', statusBadge = 'bg-success', rowBg = '';
                if (p.returnDate) {
                  const rd = new Date(p.returnDate); rd.setHours(0, 0, 0, 0);
                  if (rd < today) { status = 'تجاوز'; statusBadge = 'bg-danger'; rowBg = 'background:#fff0f0'; }
                }
                const durationLabel = getDurationLabel(p);
                const durationColor = getDurationColor(durationLabel);
                const fmt = d => {
                  if (!d) return '';
                  const [, m, day] = d.split('-');
                  return `${parseInt(day)}/${parseInt(m)}`;
                };
                return (
                  <tr key={p.id} className={status === 'تجاوز' ? 'vac-overdue' : ''}
                    style={{ cursor: hasPerm('vacations', 'click') ? 'pointer' : 'default' }}
                    onClick={() => handleClick(p)}>
                    <td>{p.fileNumber}</td>
                    <td className="fw-bold">{p.patientName}</td>
                    <td>{fmt(p.holidayDate)}</td>
                    <td>{fmt(p.returnDate)}</td>
                    <td>
                      {durationLabel
                        ? <span style={{ color: durationColor, fontWeight: 700 }}>{durationLabel}</span>
                        : '-'}
                    </td>
                    <td><span className={`badge ${statusBadge}`} style={{ fontSize: '.7rem' }}>{status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
