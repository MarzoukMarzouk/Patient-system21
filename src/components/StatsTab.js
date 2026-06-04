'use client';

import { useEffect, useMemo } from 'react';
import * as API from '@/lib/api';

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
      <div className="row g-2">
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

      {/* Normal Stats */}
      <div className="row mt-3">
        <div className="col-12 col-md-8 col-lg-5 mx-auto">
          <div className="card stats-card">
            <div className="card-body p-0">
              <table className="table table-striped table-hover mb-0" style={{ fontSize: '.95rem' }}>
                <thead>
                  <tr>
                    <th colSpan={2} className="text-center bg-primary text-white py-2" style={{ fontSize: '1rem' }}>
                      <i className="bi bi-bar-chart ms-2"></i>إحصائيات شاملة - قسم 25
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="fw-bold"><i className="bi bi-hospital ms-2 text-primary"></i>القسم</td><td className="text-center fw-bold text-primary fs-5">25</td></tr>
                  <tr><td className="fw-bold"><i className="bi bi-people ms-2 text-success"></i>عدد المرضى</td><td className="text-center fw-bold text-success fs-5">{stats.total}</td></tr>
                  <tr><td className="fw-bold"><i className="bi bi-clock ms-2 text-info"></i>تحت 50 سنة</td><td className="text-center fw-bold fs-5">{patients.filter(p => p.ageClassification === 'تحت 50 عام').length}</td></tr>
                  <tr><td className="fw-bold"><i className="bi bi-person-arms-up ms-2 text-info"></i>50 سنة وأكثر</td><td className="text-center fw-bold fs-5">{patients.filter(p => p.ageClassification === 'فوق 50 عام').length}</td></tr>
                  <tr><td className="fw-bold"><i className="bi bi-heart ms-2 text-success"></i>تحت 50 طبيعيين</td><td className="text-center fw-bold text-success fs-5">{patients.filter(p => p.ageClassification === 'تحت 50 عام' && p.internalPatient !== 'نعم').length}</td></tr>
                  <tr><td className="fw-bold"><i className="bi bi-heart ms-2 text-success"></i>فوق 50 طبيعيين</td><td className="text-center fw-bold text-success fs-5">{patients.filter(p => p.ageClassification === 'فوق 50 عام' && p.internalPatient !== 'نعم').length}</td></tr>
                  <tr><td className="fw-bold"><i className="bi bi-stethoscope ms-2 text-warning"></i>الباطنة</td><td className="text-center fw-bold text-warning fs-5">{stats.intern}</td></tr>
                  <tr><td className="fw-bold"><i className="bi bi-capsule ms-2 text-secondary"></i>كلوزاباكس</td><td className="text-center fw-bold fs-5">{stats.cloz}</td></tr>
                  <tr><td className="fw-bold"><i className="bi bi-heart-pulse ms-2 text-danger"></i>ضغط</td><td className="text-center fw-bold text-danger fs-5">{patients.filter(p => (p.internalDiseases || '').includes('ضغط')).length}</td></tr>
                  <tr><td className="fw-bold"><i className="bi bi-weight-scale ms-2 text-danger"></i>دهون</td><td className="text-center fw-bold text-danger fs-5">{patients.filter(p => (p.internalDiseases || '').includes('دهون')).length}</td></tr>
                  <tr><td className="fw-bold"><i className="bi bi-droplet ms-2 text-danger"></i>سكر</td><td className="text-center fw-bold text-danger fs-5">{patients.filter(p => (p.internalDiseases || '').includes('سكر')).length}</td></tr>
                  <tr><td className="fw-bold"><i className="bi bi-heartbreak ms-2 text-danger"></i>قلب</td><td className="text-center fw-bold text-danger fs-5">{patients.filter(p => (p.internalDiseases || '').includes('قلب')).length}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
