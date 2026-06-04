'use client';

import { useMemo } from 'react';

export default function MissingNumbersTab({ patients }) {
  const { missing, max } = useMemo(() => {
    const nums = patients.map(p => parseInt(p.fileNumber)).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b);
    if (!nums.length) return { missing: null, max: null };
    const mx = Math.max(...nums);
    const existing = new Set(nums);
    const miss = [];
    for (let i = 1; i <= mx; i++) if (!existing.has(i)) miss.push(i);
    return { missing: miss, max: mx };
  }, [patients]);

  if (!max) {
    return <div className="alert alert-info text-center">لا توجد أرقام ملفات</div>;
  }

  return (
    <div>
      {missing.length === 0 ? (
        <div className="alert alert-success text-center mb-3">
          <i className="bi bi-check-circle me-2"></i>
          لا توجد أرقام ناقصة من 1 إلى {max}
        </div>
      ) : (
        <div className="card border-warning mb-3">
          <div className="card-header bg-warning text-dark text-center py-2">
            <h6 className="mb-0">الأرقام الناقصة ({missing.length} رقم)</h6>
          </div>
          <div className="card-body p-2">
            <div className="d-flex flex-wrap justify-content-center gap-2">
              {missing.map(n => (
                <span key={n} className="badge bg-warning text-dark fs-6 px-3 py-2">{n}</span>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="row g-2">
        <div className="col-4">
          <div className="card border-primary">
            <div className="card-body text-center p-2">
              <small className="text-primary fw-bold d-block">نطاق البحث</small>
              <div className="text-primary fw-bold">1 - {max}</div>
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="card border-success">
            <div className="card-body text-center p-2">
              <small className="text-success fw-bold d-block">أكبر رقم ملف</small>
              <div className="text-success fw-bold">{max}</div>
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="card border-warning">
            <div className="card-body text-center p-2">
              <small className="text-warning fw-bold d-block">عدد الناقص</small>
              <div className="text-warning fw-bold">{missing.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
