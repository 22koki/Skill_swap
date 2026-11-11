import { useEffect } from "react";

function formatSuggestion(value){
  try{
    return new Intl.DateTimeFormat(undefined,{
      weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"
    }).format(new Date(value));
  }catch{return value}
}

export default function RescheduleModal({
  booking,
  form,
  setForm,
  suggestions,
  loadingSuggestions,
  onClose,
  onSubmit,
  onRefreshSuggestions,
}){
  useEffect(()=>{
    if(booking) onRefreshSuggestions?.(Number(form.duration_minutes||booking.duration_minutes||60));
  },[booking?.id]);

  if(!booking) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="reschedule-modal glass" onMouseDown={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="reschedule-hero">
          <div>
            <div className="eyebrow">PROPOSE A NEW TIME</div>
            <h2>Reschedule with {booking.partner_name}</h2>
            <p>Your current session stays unchanged until your partner accepts the new time.</p>
          </div>
          <div className="reschedule-current">
            <small>CURRENT SESSION</small>
            <b>{formatSuggestion(booking.starts_at)}</b>
          </div>
        </div>

        <div className="smart-time-section">
          <div className="smart-time-head">
            <div><small>BEST TIMES FOR BOTH OF YOU</small><h3>Smart suggestions</h3></div>
            <button className="outline" type="button" onClick={()=>onRefreshSuggestions?.(Number(form.duration_minutes||60))}>↻ Refresh</button>
          </div>

          {loadingSuggestions ? <div className="smart-time-loading">Checking shared availability…</div> :
           suggestions?.length ? <div className="smart-time-grid">
            {suggestions.slice(0,4).map((item,index)=>(
              <button
                type="button"
                className={"smart-time-card "+(index===0?"best":"")}
                key={item.starts_at}
                onClick={()=>setForm({...form,starts_at:item.starts_at.slice(0,16)})}
              >
                <span>{index===0?"⭐":"🕒"}</span>
                <div><b>{formatSuggestion(item.starts_at)}</b><small>{item.duration_minutes} min · {item.fit_score}% fit</small></div>
                {index===0&&<em>Best fit</em>}
              </button>
            ))}
           </div> : <div className="smart-time-empty">No shared availability found yet. You can still choose a time manually if both schedules allow it.</div>}
        </div>

        <form className="schedule-form" onSubmit={onSubmit}>
          <div className="schedule-grid">
            <label>
              <span>New date & time</span>
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
                <input placeholder="Where will you meet?" value={form.location_note} onChange={e=>setForm({...form,location_note:e.target.value})}/>
              </label>
            )}
          </div>

          <label className="schedule-note">
            <span>Reason / note</span>
            <textarea placeholder="Why are you proposing a new time?" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
          </label>

          <div className="schedule-actions">
            <button type="button" className="outline" onClick={onClose}>Keep current time</button>
            <button className="primary">Send reschedule proposal →</button>
          </div>
        </form>
      </div>
    </div>
  );
}
