import * as API from '@/lib/api';

export default function ExitsTab({ exits, hasPerm, loadPatients, loadExits }) {
  const handleReturn = async (exit) => {
    if (!confirm(`إرجاع ${exit.patientName} للقسم؟`)) return;
    try {
      await API.returnPatientToDepartment(exit);
      await loadPatients();
      await loadExits();
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">سجل الخروج</h5>
        <span className="badge bg-secondary">{exits.length}</span>
      </div>
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>رقم الملف</th><th>اسم المريض</th><th>تاريخ الخروج</th>
              <th>نوع الخروج</th><th>ملاحظات</th><th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {exits.map(e => (
              <tr key={e.id}>
                <td>{e.fileNumber}</td>
                <td>{e.patientName}</td>
                <td>{e.outDate}</td>
                <td>{e.outType}</td>
                <td>{e.outNote}</td>
                <td>
                  {hasPerm('checkout_log', 'edit') && (
                    <button className="btn btn-sm btn-outline-success" onClick={() => handleReturn(e)}>
                      <i className="bi bi-arrow-return-left"></i> إرجاع
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
