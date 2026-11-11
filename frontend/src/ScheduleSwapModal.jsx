import { useEffect } from "react";
import { getSkillVisual } from "./skillVisuals";

function prettyTime(value){
  try{
    return new Intl.DateTimeFormat(undefined,{
      weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"
    }).format(new Date(value));
  }catch{return value}
}

export default function ScheduleSwapModal({
  swap,
  form,
  setForm,
  onClose,
  onSubmit,
  suggestions=[],
  suggestionsLoading=false,
  availabilityComplete=false,
  onRefreshSuggestions,
  scheduleError,
}) {
  if (!swap) return null;
  const left = getSkillVisual(swap.requested_skill_name);
  const right = getSkillVisual(swap.offered_skill_name);

  useEffect(()=>{
    onRefreshSuggestions?.(Number(form.duration_minutes||60));
  },[swap?.id]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="schedule-modal glass schedule-modal-advanced" onMouseDown={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="schedule-hero">
          <div>
            <div className="eyebrow">SMART SCHEDULING</div>
            <h2>Pick a time that works for both of you.</h2>
            <p>SkillSwap checks weekly availability and existing sessions before creating the booking.</p>
          </div>
          <div className="schedule-pair">
            <span className={left.className}>{left.icon} {swap.requested_skill_name}</span>
            <b>↔</b>
            <span className={right.className}>{right.icon} {swap.offered_skill_name}</span>
          </div>
        </div>

        <section className="smart-time-section">
          <div className="smart-time-head">
            <div>
              <small>BEST TIMES FOR BOTH OF YOU</small>
              <h3>Shared availability</h3>
            </div>
            <span className={"availability-status "+(availabilityComplete?"complete":"partial")}>
              {availabilityComplete?"✓ Both schedules configured":"◐ Partial availability"}
            </span>
          </div>

          {suggestionsLoading ? <div className="smart-time-loading">Checking schedules and conflicts…</div> :
           suggestions.length ? <div className="smart-time-grid">
            {suggestions.slice(0,4).map((item,index)=>(
              <button
                type="button"
                className={"smart-time-card "+(index===0?"best":"")}
                key={item.starts_at}
                onClick={()=>setForm({...form,starts_at:item.starts_at.slice(0,16)})}
              >
                <span>{index===0?"⭐":"🕒"}</span>
                <div><b>{prettyTime(item.starts_at)}</b><small>{item.duration_minutes} min · {item.fit_score}% fit</small></div>
                {index===0&&<em>Best fit</em>}
              </button>
            ))}
           </div> : <div className="smart-time-empty">
             <b>No shared slot found automatically.</b>
             <span>You can choose a time manually. SkillSwap will still check for conflicts before saving.</span>
           </div>}
        </section>

        {scheduleError&&<div className="schedule-conflict-banner">
          <span>⚠</span>
          <div><b>Scheduling conflict</b><p>{scheduleError}</p></div>
        </div>}

        <form className="schedule-form" onSubmit={onSubmit}>
          <div className="schedule-grid">
            <label>
              <span>Date & time</span>
              <input required type="datetime-local" value={form.starts_at} onChange={e=>setForm({...form,starts_at:e.target.value})}/>
            </label>

            <label>
              <span>Duration</span>
              <select value={form.duration_minutes} onChange={e=>{
                const next=e.target.value;
                setForm({...form,duration_minutes:next});
                onRefreshSuggestions?.(Number(next));
              }}>
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
