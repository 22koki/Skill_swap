const REASONS=[
 ["harassment","Harassment"],
 ["spam","Spam"],
 ["scam","Scam or fraud"],
 ["inappropriate","Inappropriate behaviour"],
 ["fake_profile","Fake profile"],
 ["other","Other"],
];

export default function ReportModal({target,form,setForm,onClose,onSubmit,saving}){
 if(!target) return null;
 return (
  <div className="modal-backdrop safety-report-backdrop" onMouseDown={onClose}>
   <form className="safety-report-modal glass" onMouseDown={e=>e.stopPropagation()} onSubmit={onSubmit}>
    <button type="button" className="modal-close" onClick={onClose}>×</button>
    <div className="safety-shield">🛡</div>
    <div className="eyebrow">REPORT TO SKILLSWAP</div>
    <h2>Tell us what happened.</h2>
    <p>Reports are private. SkillSwap stores a small evidence snapshot so moderators can review what was reported.</p>

    <div className="safety-report-target">
      <span>{target.icon||"⚠"}</span>
      <div><small>REPORTING</small><b>{target.label}</b></div>
    </div>

    <label>
      <span>Reason</span>
      <select value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}>
        {REASONS.map(([value,label])=><option key={value} value={value}>{label}</option>)}
      </select>
    </label>

    <label>
      <span>What should moderators know?</span>
      <textarea
        maxLength="3000"
        rows="5"
        placeholder="Add context that will help us review this report."
        value={form.details}
        onChange={e=>setForm({...form,details:e.target.value})}
      />
    </label>

    <div className="safety-report-actions">
      <button type="button" className="outline" onClick={onClose}>Cancel</button>
      <button className="danger-soft safety-submit" disabled={saving}>{saving?"Sending…":"Submit report"}</button>
    </div>
   </form>
  </div>
 );
}
