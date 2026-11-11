import { useMemo, useState } from "react";

const DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export default function AvailabilityModal({open,slots,setSlots,onClose,onSave,saving}){
  const [draft,setDraft]=useState({weekday:5,start_time:"10:00",end_time:"12:00"});
  const grouped=useMemo(()=>DAYS.map((day,index)=>({
    day,index,slots:slots.filter(slot=>Number(slot.weekday)===index)
  })),[slots]);

  if(!open) return null;

  function addSlot(){
    if(!draft.start_time || !draft.end_time || draft.end_time<=draft.start_time) return;
    const exists=slots.some(slot=>
      Number(slot.weekday)===Number(draft.weekday) &&
      slot.start_time===draft.start_time &&
      slot.end_time===draft.end_time
    );
    if(exists) return;
    setSlots([...slots,{...draft,weekday:Number(draft.weekday)}]);
  }

  return (
    <div className="availability-backdrop" onMouseDown={onClose}>
      <section className="availability-modal" onMouseDown={e=>e.stopPropagation()}>
        <button className="availability-close" onClick={onClose}>×</button>

        <div className="availability-hero">
          <div className="availability-orbit"><span>🗓</span></div>
          <div>
            <div className="availability-kicker">SMART SCHEDULING</div>
            <h2>When are you usually free?</h2>
            <p>Add recurring weekly windows. SkillSwap uses these only to find compatible times — not to expose your private calendar.</p>
          </div>
        </div>

        <div className="availability-builder">
          <label>
            <span>Day</span>
            <select value={draft.weekday} onChange={e=>setDraft({...draft,weekday:Number(e.target.value)})}>
              {DAYS.map((day,index)=><option key={day} value={index}>{day}</option>)}
            </select>
          </label>
          <label>
            <span>From</span>
            <input type="time" value={draft.start_time} onChange={e=>setDraft({...draft,start_time:e.target.value})}/>
          </label>
          <label>
            <span>To</span>
            <input type="time" value={draft.end_time} onChange={e=>setDraft({...draft,end_time:e.target.value})}/>
          </label>
          <button className="primary" type="button" onClick={addSlot}>+ Add window</button>
        </div>

        <div className="availability-week">
          {grouped.map(group=>(
            <div className={"availability-day "+(group.slots.length?"active":"")} key={group.day}>
              <div className="availability-day-head">
                <span>{group.day.slice(0,3)}</span>
                <b>{group.slots.length||"—"}</b>
              </div>
              <div className="availability-day-slots">
                {group.slots.length ? group.slots.map((slot,i)=>(
                  <button
                    className="availability-slot-chip"
                    key={group.day+slot.start_time+slot.end_time+i}
                    onClick={()=>setSlots(slots.filter(item=>item!==slot))}
                    title="Click to remove"
                  >
                    {slot.start_time.slice(0,5)}–{slot.end_time.slice(0,5)} <span>×</span>
                  </button>
                )) : <small>Not set</small>}
              </div>
            </div>
          ))}
        </div>

        <div className="availability-tip">
          <span>✦</span>
          <div>
            <b>Why this matters</b>
            <p>Matching gets up to 20 extra compatibility points when your weekly schedules overlap, and SkillSwap can suggest the next shared time automatically.</p>
          </div>
        </div>

        <div className="availability-actions">
          <button className="outline" onClick={onClose}>Cancel</button>
          <button className="primary" disabled={saving} onClick={onSave}>{saving?"Saving...":"Save availability ✓"}</button>
        </div>
      </section>
    </div>
  );
}
