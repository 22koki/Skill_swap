import { getSkillVisual } from "./skillVisuals";

export default function ScheduleSwapModal({ swap, form, setForm, onClose, onSubmit }) {
  if (!swap) return null;
  const left = getSkillVisual(swap.requested_skill_name);
  const right = getSkillVisual(swap.offered_skill_name);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="schedule-modal glass" onMouseDown={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="schedule-hero">
          <div>
            <div className="eyebrow">SCHEDULE YOUR SKILLSWAP</div>
            <h2>Turn the match into a real session.</h2>
            <p>Choose when and how you want to meet. You can adjust the details later.</p>
          </div>
          <div className="schedule-pair">
            <span className={left.className}>{left.icon} {swap.requested_skill_name}</span>
            <b>↔</b>
            <span className={right.className}>{right.icon} {swap.offered_skill_name}</span>
          </div>
        </div>

        <form className="schedule-form" onSubmit={onSubmit}>
          <div className="schedule-grid">
            <label>
              <span>Date & time</span>
              <input required type="datetime-local" value={form.starts_at} onChange={e=>setForm({...form,starts_at:e.target.value})}/>
            </label>

            <label>
              <span>Duration</span>
              <select value={form.duration_minutes} onChange={e=>setForm({...form,duration_minutes:e.target.value})}>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </label>

            <label>
              <span>Session type</span>
              <select value={form.mode} onChange={e=>setForm({...form,mode:e.target.value})}>
                <option value="online">💻 Online</option>
                <option value="in_person">📍 In person</option>
              </select>
            </label>

            {form.mode==="online" ? (
              <label>
                <span>Meeting link</span>
                <input placeholder="https://meet.google.com/..." value={form.meeting_link} onChange={e=>setForm({...form,meeting_link:e.target.value})}/>
              </label>
            ) : (
              <label>
                <span>Meeting place</span>
                <input placeholder="e.g. Westlands, Nairobi" value={form.location_note} onChange={e=>setForm({...form,location_note:e.target.value})}/>
              </label>
            )}
          </div>

          <label className="schedule-note">
            <span>Session note</span>
            <textarea placeholder="Anything your swap partner should prepare?" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
          </label>

          <div className="schedule-summary">
            <div>📅 <span>{form.starts_at ? new Date(form.starts_at).toLocaleString() : "Choose a date and time"}</span></div>
            <div>⏱ <span>{form.duration_minutes} minutes</span></div>
            <div>{form.mode==="online" ? "💻" : "📍"} <span>{form.mode==="online" ? "Online session" : "In-person session"}</span></div>
          </div>

          <div className="schedule-actions">
            <button type="button" className="outline" onClick={onClose}>Not yet</button>
            <button className="primary">Schedule session →</button>
          </div>
        </form>
      </div>
    </div>
  );
}
