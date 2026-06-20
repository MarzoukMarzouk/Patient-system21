'use client';

import { useState, useMemo } from 'react';
import * as API from '@/lib/api';

export default function InternalReviewTab({ patients, hasPerm, loadPatients, onEditPatient }) {
  const internalPatients = useMemo(() => {
    return patients
      .filter(p => (p.internalPatient || '').trim() === 'نعم')
      .sort((a, b) => {
        const ra = parseInt(a.reviewNumber) || Infinity;
        const rb = parseInt(b.reviewNumber) || Infinity;
        return ra - rb;
      });
  }, [patients]);

  const handleReviewChange = async (id, val) => {
    try {
      await API.updateReviewNumber(id, val || null);
      await loadPatients();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: 'خطأ: ' + (err.message || 'حدث خطأ'), type: 'danger' } }));
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-2 gap-2">
        <h5 className="mb-0">مراجعة الباطنة</h5>
        <span className="badge bg-success">عدد مرضى الباطنة: {internalPatients.length}</span>
      </div>
      <div className="table-responsive">
        <table className="table table-striped table-hover align-middle">
          <thead>
            <tr>
              <th>المراجعة</th>
              <th>اسم المريض</th>
              <th>رقم الملف</th>
              <th>الأمراض الباطنية</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {internalPatients.map(p => (
              <tr key={p.id}>
                <td style={{ minWidth: 80 }}>
                  <input type="number" className="form-control form-control-sm"
                    style={{ width: 70 }}
                    value={p.reviewNumber || ''}
                    onChange={e => handleReviewChange(p.id, e.target.value)}
                    disabled={!hasPerm('internal_review', 'edit_order')}
                    min={1} />
                </td>
                <td>{p.patientName}</td>
                <td>{p.fileNumber}</td>
                <td>
                  {(p.internalDiseases || '').split(',').map(d => d.trim()).filter(Boolean).map(d => (
                    <span key={d} className="badge bg-primary me-1">{d}</span>
                  ))}
                </td>
                <td>
                  {hasPerm('internal_review', 'actions') && (
                    <button className="btn btn-sm btn-outline-secondary"
                      onClick={() => onEditPatient(p.id)}>
                      <i className="bi bi-pencil"></i>
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
