'use client';

import { useMemo } from 'react';
import { downloadImage } from '@/lib/downloadImage';

export default function NormalStatsTab({ patients, hasPerm }) {
  const stats = useMemo(() => {
    const total = patients.length;
    const intern = patients.filter(p => p.internalPatient === 'نعم').length;
    const cloz = patients.filter(p => p.clozapax === 'نعم').length;
    
    return { total, intern, cloz };
  }, [patients]);

  return (
    <div>
      <div className="d-flex mb-2">
        {hasPerm('normal_statistics', 'print') && (
          <button className="btn btn-success btn-sm" onClick={() => downloadImage('normalStatsContent', 'احصائيات_طبيعيين')}>
            <i className="bi bi-download me-1"></i> تحميل صورة
          </button>
        )}
      </div>
      <div id="normalStatsContent" className="row mt-3 bg-light p-2 rounded">
        <div className="col-12 col-md-8 col-lg-6 mx-auto">
          <div className="card stats-card shadow-sm border-primary">
            <div className="card-body p-0">
              <table className="table table-striped table-hover mb-0" style={{ fontSize: '.95rem' }}>
                <thead>
                  <tr>
                    <th colSpan={2} className="text-center bg-primary text-white py-2" style={{ fontSize: '1.1rem' }}>
                      <i className="bi bi-bar-chart ms-2"></i>إحصائيات شاملة (طبيعيين)
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
