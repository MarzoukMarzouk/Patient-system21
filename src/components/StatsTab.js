'use client';

import { useEffect, useMemo } from 'react';
import * as API from '@/lib/api';
import { downloadImage } from '@/lib/downloadImage';

function formatDate(d) {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
}

export default function StatsTab({ patients, hasPerm }) {
  const stats = useMemo(() => {
    const total = patients.length;
    const present = patients.filter(p => p.status === 'متواجد').length;
    const onVac = patients.filter(p => p.status === 'إجازة').length;
    const cat = { 'مجانى': 0, 'نفقة الدولة': 0, 'درجة': 0, 'تأمين': 0 };
    const idt = { 'مجهول الهوية': 0, 'بطاقة': 0 };
    const age = { 'فوق 50 عام': 0, 'تحت 50 عام': 0 };
    let cloz = 0, intern = 0;
    const dm = new Map(), dgm = new Map();

    patients.forEach(p => {
      const ct = (p.category || '').trim(); if (ct in cat) cat[ct]++;
      const id = (p.identity || '').trim(); if (id in idt) idt[id]++;
      const ac = (p.ageClassification || '').trim(); if (ac in age) age[ac]++;
      if ((p.clozapax || '').trim() === 'نعم') cloz++;
      if ((p.internalPatient || '').trim() === 'نعم') intern++;
      (p.internalDiseases || '').split(',').map(s => s.trim()).filter(Boolean).forEach(d => dm.set(d, (dm.get(d) || 0) + 1));
      (p.diagnosis || '').split(',').map(s => s.trim()).filter(Boolean).forEach(d => dgm.set(d, (dgm.get(d) || 0) + 1));
    });

    return { total, present, onVac, cat, idt, age, cloz, intern, dm, dgm };
  }, [patients]);

  return (
    <div>
      <div className="d-flex mb-2">
        {hasPerm('statistics', 'print') && (
          <button className="btn btn-success btn-sm" onClick={() => downloadImage('statsContent', 'احصائيات_المرضى')}>
            <i className="bi bi-download me-1"></i> تحميل صورة
          </button>
        )}
      </div>
      <div id="statsContent" className="row g-2 bg-light p-2 rounded">
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 stats-card">
            <div className="card-body p-2">
              <h6 className="card-title mb-2 small">حالة المرضى</h6>
              <div className="small d-flex flex-wrap gap-1">
                <span className="custom-pill-badge">الإجمالي: {stats.total}</span>
                <span className="custom-pill-badge">متواجد: {stats.present}</span>
                <span className="custom-pill-badge">في إجازة: {stats.onVac}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 stats-card">
            <div className="card-body p-2">
              <h6 className="card-title mb-2 small">حسب الفئة</h6>
              <div className="small d-flex flex-wrap gap-1">
                {Object.entries(stats.cat).map(([k, v]) => (
                  <span key={k} className="custom-pill-badge">{k}: {v}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 stats-card">
            <div className="card-body p-2">
              <h6 className="card-title mb-2 small">حسب الهوية</h6>
              <div className="small d-flex flex-wrap gap-1">
                {Object.entries(stats.idt).map(([k, v]) => (
                  <span key={k} className="custom-pill-badge">{k}: {v}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 stats-card">
            <div className="card-body p-2">
              <h6 className="card-title mb-2 small">تصنيف العمر</h6>
              <div className="small d-flex flex-wrap gap-1">
                {Object.entries(stats.age).map(([k, v]) => (
                  <span key={k} className="custom-pill-badge">{k}: {v}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 stats-card">
            <div className="card-body p-2">
              <h6 className="card-title mb-2 small">كلوزابكس / الباطنة</h6>
              <div className="small d-flex flex-wrap gap-1">
                <span className="custom-pill-badge">كلوزابكس: {stats.cloz}</span>
                <span className="custom-pill-badge">مرضى الباطنة: {stats.intern}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="card h-100 stats-card">
            <div className="card-body p-2">
              <h6 className="card-title mb-2 small">الأمراض الباطنية</h6>
              <div className="small d-flex flex-wrap gap-1">
                {stats.dm.size > 0
                  ? Array.from(stats.dm.entries()).map(([n, c]) => (
                      <span key={n} className="custom-pill-badge">{n}: {c}</span>
                    ))
                  : <span className="text-muted">لا توجد بيانات</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12">
          <div className="card h-100 stats-card">
            <div className="card-body p-2">
              <h6 className="card-title mb-2 small">حسب التشخيص</h6>
              <div className="small d-flex flex-wrap gap-1">
                {stats.dgm.size > 0
                  ? Array.from(stats.dgm.entries()).map(([n, c]) => (
                      <span key={n} className="custom-pill-badge">{n}: {c}</span>
                    ))
                  : <span className="text-muted">لا توجد بيانات</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
