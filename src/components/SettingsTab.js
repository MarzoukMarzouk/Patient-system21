import { useState, useEffect } from 'react';

export const DAYS_OF_WEEK = [
  { value: 6, label: 'السبت' },
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الإثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
];

export const SETTINGS_STORAGE_KEY = 'patient_app_week_start';

export function getWeekStartDay() {
  if (typeof window === 'undefined') return 1; // الافتراضي: الإثنين
  const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
  return saved !== null ? parseInt(saved, 10) : 1;
}

export default function SettingsTab({ hasPerm, user }) {
  const canEdit = user?.position === 'مدير' || (hasPerm ? hasPerm('settings', 'edit') : true);
  const [weekStart, setWeekStart] = useState(1);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    setWeekStart(getWeekStartDay());
  }, []);

  const handleSave = (val) => {
    const num = parseInt(val, 10);
    setWeekStart(num);
    localStorage.setItem(SETTINGS_STORAGE_KEY, num.toString());
    // إرسال حدث ليتحدث الجدول فوراً إذا كان مفتوحاً
    window.dispatchEvent(new Event('patient_app_settings_changed'));
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const selectedDayObj = DAYS_OF_WEEK.find(d => d.value === weekStart);

  return (
    <div className="card shadow-sm border-0" style={{ maxWidth: '650px', margin: '0 auto' }}>
      <div className="card-header bg-primary text-white d-flex align-items-center gap-2 py-3">
        <i className="bi bi-gear-fill fs-5"></i>
        <h5 className="mb-0">إعدادات النظام</h5>
      </div>
      <div className="card-body p-4">
        <div className="mb-4">
          <label className="form-label fw-bold mb-2 fs-6">
            <i className="bi bi-calendar-week ms-2 text-primary"></i>
            بداية الأسبوع لفلتر نفقة الدولة ومتابعة النفقة:
          </label>
          <p className="text-muted small mb-3">
            حدد اليوم الذي يبدأ به أسبوع العمل ليتم حساب تواريخ الأسبوع وتصفية الحالات بناءً عليه تلقائياً.
          </p>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <select
              className="form-select form-select-lg border-primary shadow-sm"
              style={{ maxWidth: '250px' }}
              value={weekStart}
              onChange={(e) => handleSave(e.target.value)} disabled={!canEdit}
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            {savedMsg && (
              <span className="badge bg-success py-2 px-3 fs-6 d-flex align-items-center gap-1 animate__animated animate__fadeIn">
                <i className="bi bi-check-circle-fill"></i>
                تم الحفظ بنجاح
              </span>
            )}
          </div>
        </div>

        <div className="alert alert-info border-0 shadow-sm d-flex align-items-center gap-2 mb-0">
          <i className="bi bi-info-circle-fill fs-5 text-primary"></i>
          <div>
            الأسبوع الحالي محدد ليبدأ من يوم <strong>{selectedDayObj?.label}</strong> ويستمر لمدة 7 أيام.
          </div>
        </div>
      </div>
    </div>
  );
}
