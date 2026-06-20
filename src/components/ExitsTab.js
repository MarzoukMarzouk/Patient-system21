import { useState } from 'react';
import * as API from '@/lib/api';

export default function ExitsTab({ exits, hasPerm, loadPatients, loadExits }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedExit, setSelectedExit] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleOpenModal = (exit) => {
    setSelectedExit(exit);
    setEditForm({
      ...exit,
      status: 'متواجد',
      outDate: '',
      outType: '',
      outNote: ''
    });
    setShowModal(true);
  };

  const handleReturn = async () => {
    try {
      await API.returnPatientToDepartment(editForm);
      await loadPatients();
      await loadExits();
      setShowModal(false);
      setSelectedExit(null);
    } catch (err) {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: 'خطأ: ' + (err.message || 'حدث خطأ'), type: 'danger' } }));
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
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
                    <button className="btn btn-sm btn-outline-success" onClick={() => handleOpenModal(e)}>
                      <i className="bi bi-arrow-return-left"></i> إرجاع
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">إرجاع {editForm.patientName} للقسم</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">رقم الملف</label>
                  <input type="text" className="form-control" value={editForm.fileNumber || ''}
                    onChange={e => handleInputChange('fileNumber', e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">اسم المريض</label>
                  <input type="text" className="form-control" value={editForm.patientName || ''}
                    onChange={e => handleInputChange('patientName', e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">التشخيص</label>
                  <input type="text" className="form-control" value={editForm.diagnosis || ''}
                    onChange={e => handleInputChange('diagnosis', e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">رقم القيد</label>
                  <input type="text" className="form-control" value={editForm.enrolmentNumber || ''}
                    onChange={e => handleInputChange('enrolmentNumber', e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">تاريخ الدخول</label>
                  <input type="date" className="form-control" value={editForm.dateOfEntry || ''}
                    onChange={e => handleInputChange('dateOfEntry', e.target.value)} lang="en-GB" />
                </div>
                <div className="mb-3">
                  <label className="form-label">الفئة</label>
                  <input type="text" className="form-control" value={editForm.category || ''}
                    onChange={e => handleInputChange('category', e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">الهوية</label>
                  <input type="text" className="form-control" value={editForm.identity || ''}
                    onChange={e => handleInputChange('identity', e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="button" className="btn btn-success" onClick={handleReturn}>
                  <i className="bi bi-check-lg me-1"></i>إرجاع للقسم
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
