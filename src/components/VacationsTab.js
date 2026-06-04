export default function VacationsTab({ patients, hasPerm }) {
  const vacations = patients.filter(p => p.status === 'إجازة');

  const getDurationLabel = (p) => {
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
  };

  const today = new Date();

  return (
    <div>
      <div className="d-flex align-items-center mb-2">
        <h5 className="mb-0 me-3">الإجازات</h5>
        <span className="badge bg-primary">{vacations.length} في إجازة</span>
      </div>
      <div className="row">
        {vacations.map(p => {
          let statusLabel = 'في إجازة', statusClass = 'success';
          if (p.returnDate) {
            const rd = new Date(p.returnDate);
            if (rd < today) { statusLabel = 'تجاوز إجازة'; statusClass = 'danger'; }
          }
          const durationLabel = getDurationLabel(p);
          return (
            <div className="col-md-6 col-lg-4 mb-3" key={p.id}>
              <div className="card border-warning h-100" style={{ background: '#fffbe6' }}>
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="mb-0 fw-bold">{p.patientName}</h6>
                    <span className={`badge bg-${statusClass}`}>{statusLabel}</span>
                  </div>
                  <div className="row g-2 text-center small">
                    <div className="col-6">رقم الملف: {p.fileNumber}</div>
                    <div className="col-6">رقم القيد: {p.enrolmentNumber}</div>
                    <div className="col-6">تاريخ الإجازة: {p.holidayDate}</div>
                    <div className="col-6">تاريخ العودة: {p.returnDate}</div>
                    {durationLabel && <div className="col-12">المدة: {durationLabel}</div>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
