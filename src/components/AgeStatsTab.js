'use client';

import { useMemo } from 'react';
import { downloadImage } from '@/lib/downloadImage';

export default function AgeStatsTab({ patients, hasPerm }) {
  const data = useMemo(() => {
    return ['تحت 50 عام', 'فوق 50 عام'].map(cls => {
      const cp = patients.filter(p => (p.ageClassification || '').trim() === cls);
      const dm = new Map(), dgm = new Map(), cm = new Map(), im = new Map();
      cp.forEach(p => {
        (p.internalDiseases || '').split(',').map(s => s.trim()).filter(Boolean).forEach(d => dm.set(d, (dm.get(d) || 0) + 1));
        (p.diagnosis || '').split(',').map(s => s.trim()).filter(Boolean).forEach(d => dgm.set(d, (dgm.get(d) || 0) + 1));
        const cat = (p.category || '').trim() || 'غير محدد'; cm.set(cat, (cm.get(cat) || 0) + 1);
        const idt = (p.identity || '').trim() || 'غير محدد'; im.set(idt, (im.get(idt) || 0) + 1);
      });
      return {
        cls,
        total: cp.length,
        cloz: cp.filter(p => p.clozapax === 'نعم').length,
        intern: cp.filter(p => p.internalPatient === 'نعم').length,
        present: cp.filter(p => p.status === 'متواجد').length,
        vacation: cp.filter(p => p.status === 'إجازة').length,
        dm, dgm, cm, im
      };
    });
  }, [patients]);

  const mb = m => Array.from(m.entries()).map(([n, c]) => (
    <span key={n} className="custom-pill-badge me-1 mb-1">{n}: {c}</span>
  ));

  return (
    <div>
      <div className="d-flex mb-2">
        {hasPerm('age_statistics', 'print') && (
          <button className="btn btn-success btn-sm" onClick={() => downloadImage('ageStatsContent', 'احصائيات_السن')}>
            <i className="bi bi-download me-1"></i> تحميل صورة
          </button>
        )}
      </div>
      <div id="ageStatsContent" className="row g-2 bg-light p-2 rounded">
        {data.map(d => (
          <div className="col-12 col-md-6" key={d.cls}>
            <div className="card h-100 stats-card border-primary">
              <div className="card-body p-3">
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <strong className="fs-5 text-primary">{d.cls}</strong>
                  <span className="badge bg-primary rounded-pill fs-6">{d.total} مريض</span>
                </div>
                <div className="mb-3">
                  <span className="custom-pill-badge bg-secondary me-1">كلوزابكس: {d.cloz}</span>
                  <span className="custom-pill-badge bg-secondary me-1">باطنة: {d.intern}</span>
                  <span className="custom-pill-badge bg-success me-1">متواجد: {d.present}</span>
                  <span className="custom-pill-badge bg-warning text-dark me-1">إجازة: {d.vacation}</span>
                </div>
                <div className="mt-3">
                  <small className="fw-bold d-block text-muted mb-2"><i className="bi bi-clipboard2-pulse me-1"></i>حسب التشخيص</small>
                  <div>{d.dgm.size > 0 ? mb(d.dgm) : <span className="text-muted small">لا توجد بيانات</span>}</div>
                </div>
                <div className="mt-3">
                  <small className="fw-bold d-block text-muted mb-2"><i className="bi bi-tags me-1"></i>حسب الفئة</small>
                  <div>{d.cm.size > 0 ? mb(d.cm) : <span className="text-muted small">لا توجد بيانات</span>}</div>
                </div>
                <div className="mt-3">
                  <small className="fw-bold d-block text-muted mb-2"><i className="bi bi-person-badge me-1"></i>حسب الهوية</small>
                  <div>{d.im.size > 0 ? mb(d.im) : <span className="text-muted small">لا توجد بيانات</span>}</div>
                </div>
                <div className="mt-3">
                  <small className="fw-bold d-block text-muted mb-2"><i className="bi bi-heart-pulse me-1"></i>الأمراض الباطنية</small>
                  <div>{d.dm.size > 0 ? mb(d.dm) : <span className="text-muted small">لا توجد بيانات</span>}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
