import { useState, useEffect } from 'react';

// Ø¹Ø±Ø¶ Ù…Ø´ØªØ±Ùƒ Ù„ØªØ¨ÙˆÙŠØ¨ÙŠ Ù†ÙÙ‚Ø© Ø§Ù„Ø¯ÙˆÙ„Ø© ÙˆÙ…ØªØ§Ø¨Ø¹Ø© Ù†ÙÙ‚Ø© Ø§Ù„Ø¯ÙˆÙ„Ø©
// Ø§Ù„Ø¹Ø±Ø¶ Ø§Ù„Ø­Ø§Ù„ÙŠ (ÙƒØ§Ù…Ù„) Ø£Ùˆ Ø§Ù„Ø¹Ø±Ø¶ Ø§Ù„Ù…Ø®ØªØµØ± (Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ Ø¹Ù„Ù‰ Ø§Ù„Ù‡Ø§ØªÙ)
export function useViewMode() {
  const [mode, setMode] = useState('full');
  useEffect(() => {
    if (window.innerWidth < 768) setMode('compact');
  }, []);
  return [mode, setMode];
}

export function ViewTabs({ mode, setMode }) {
  return (
    <ul className="nav nav-pills nav-fill mb-2 w-100">
      <li className="nav-item">
        <button type="button" className={`nav-link py-1 ${mode === 'compact' ? 'active' : ''}`} onClick={() => setMode('compact')}>Ø§Ù„Ù‡Ø§ØªÙ</button>
      </li>
      <li className="nav-item">
        <button type="button" className={`nav-link py-1 ${mode === 'full' ? 'active' : ''}`} onClick={() => setMode('full')}>Ø§Ù„ÙˆÙŠÙ†Ø¯ÙˆØ²</button>
      </li>
    </ul>
  );
}

export default function StateExpenseTable({ list, mode, canEdit, onChange, onCopy, onRenew }) {
  const copyBtn = (id) => (
    <button className="btn btn-sm btn-outline-primary" onClick={() => onCopy(id)} title="Ù†Ø³Ø®">
      <i className="bi bi-clipboard"></i>
    </button>
  );
  const renewBtn = (id) => canEdit && (
    <button className="btn btn-sm btn-outline-success" title="ØªØ¬Ø¯ÙŠØ¯ +30 ÙŠÙˆÙ…" onClick={() => onRenew(id)}>
      <i className="bi bi-arrow-repeat"></i>
    </button>
  );
  const dateInput = (p) => (
    <input type="date" className="form-control form-control-sm" style={{ minWidth: 118 }}
      value={p.stateExpenseEndDate || ''}
      onChange={e => onChange(p.id, 'stateExpenseEndDate', e.target.value)}
      disabled={!canEdit} />
  );
  const notesInput = (p) => (
    <input type="text" className="form-control form-control-sm" style={{ minWidth: 90 }}
      value={p.stateExpenseNotes || ''}
      onChange={e => onChange(p.id, 'stateExpenseNotes', e.target.value)}
      disabled={!canEdit} />
  );

  if (mode === 'compact') {
    // Ø§Ù„Ù…Ù„Ù | Ø²Ø± Ø§Ù„Ù†Ø³Ø® | Ø§Ù„Ø§Ø³Ù… | Ø§Ù„ØªØ§Ø±ÙŠØ® | Ø²Ø± Ø§Ù„ØªØ¬Ø¯ÙŠØ¯ | Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª
    return (
      <div className="table-responsive">
        <style>{`.state-compact th,.state-compact td{padding:.25rem .3rem !important}.state-compact input{padding:.15rem .3rem}`}</style>
        <table className="table table-sm table-hover table-striped align-middle mb-0 state-compact" style={{ whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th>Ø§Ù„Ù…Ù„Ù</th><th></th><th>Ø§Ù„Ø§Ø³Ù…</th><th>Ø§Ù„ØªØ§Ø±ÙŠØ®</th><th></th><th>Ù…Ù„Ø§Ø­Ø¸Ø§Øª</th>
            </tr>
          </thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id}>
                <td>{p.fileNumber}</td>
                <td>{copyBtn(p.id)}</td>
                <td>{(p.patientName || '').trim().split(/\s+/).slice(0, 3).join(' ')}</td>
                <td>{dateInput(p)}</td>
                <td>{renewBtn(p.id)}</td>
                <td>{notesInput(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover table-striped align-middle" style={{ whiteSpace: 'nowrap' }}>
        <thead>
          <tr>
            <th>Ø§Ù„Ù…Ù„Ù</th><th>Ø§Ù„Ø§Ø³Ù…</th><th>Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ù‚ÙˆÙ…ÙŠ</th>
            <th>ØªØ§Ø±ÙŠØ® Ø§Ù„Ù†Ù‡Ø§ÙŠØ©</th><th></th><th>Ù…Ù„Ø§Ø­Ø¸Ø§Øª</th>
          </tr>
        </thead>
        <tbody>
          {list.map(p => (
            <tr key={p.id}>
              <td>{p.fileNumber}</td>
              <td>{p.patientName}</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  {copyBtn(p.id)}
                  {p.nationalId}
                </div>
              </td>
              <td>{dateInput(p)}</td>
              <td>{renewBtn(p.id)}</td>
              <td>{notesInput(p)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
