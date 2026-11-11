import { useMemo, useState } from "react";

function startOfWeek(date){
  const d=new Date(date);
  const day=(d.getDay()+6)%7;
  d.setDate(d.getDate()-day);
  d.setHours(0,0,0,0);
  return d;
}
function addDays(date,n){const d=new Date(date);d.setDate(d.getDate()+n);return d}
function sameDay(a,b){
  return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
}
function fmtTime(value){
  return new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit"}).format(new Date(value));
}
function fmtDay(value){
  return new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric"}).format(new Date(value));
}
function monthTitle(date){
  return new Intl.DateTimeFormat(undefined,{month:"long",year:"numeric"}).format(date);
}

export default function CalendarPanel({open,events,onClose,onOpenBooking,onOpenCircle}){
  const [mode,setMode]=useState("week");
  const [cursor,setCursor]=useState(new Date());

  const days=useMemo(()=>{
    if(mode==="day") return [new Date(cursor)];
    if(mode==="week"){
      const start=startOfWeek(cursor);
      return Array.from({length:7},(_,i)=>addDays(start,i));
    }
    const first=new Date(cursor.getFullYear(),cursor.getMonth(),1);
    const start=startOfWeek(first);
    return Array.from({length:42},(_,i)=>addDays(start,i));
  },[cursor,mode]);

  const grouped=useMemo(()=>{
    const map=new Map();
    days.forEach(day=>map.set(day.toDateString(),[]));
    (events||[]).forEach(event=>{
      const d=new Date(event.starts_at);
      const key=d.toDateString();
      if(map.has(key)) map.get(key).push(event);
    });
    map.forEach(list=>list.sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at)));
    return map;
  },[days,events]);

  if(!open) return null;

  function move(direction){
    const next=new Date(cursor);
    if(mode==="day") next.setDate(next.getDate()+direction);
    else if(mode==="week") next.setDate(next.getDate()+7*direction);
    else next.setMonth(next.getMonth()+direction);
    setCursor(next);
  }

  function openEvent(event){
    if(event.event_type==="skillswap") onOpenBooking?.(event.booking_id);
    else onOpenCircle?.(event.circle_id);
  }

  return (
    <div className="calendar-backdrop" onMouseDown={onClose}>
      <section className="calendar-shell" onMouseDown={e=>e.stopPropagation()}>
        <header className="calendar-header">
          <div>
            <div className="calendar-kicker">YOUR LEARNING SCHEDULE</div>
            <h2>SkillSwap Calendar</h2>
            <p>One place for SkillSwaps, Circle sessions and upcoming learning time.</p>
          </div>
          <div className="calendar-header-actions">
            <button className="outline" onClick={()=>setCursor(new Date())}>Today</button>
            <button className="calendar-close" onClick={onClose}>×</button>
          </div>
        </header>

        <div className="calendar-toolbar">
          <div className="calendar-nav">
            <button onClick={()=>move(-1)}>‹</button>
            <h3>{mode==="day"?fmtDay(cursor):monthTitle(cursor)}</h3>
            <button onClick={()=>move(1)}>›</button>
          </div>
          <div className="calendar-modes">
            {["day","week","month"].map(item=><button key={item} className={mode===item?"active":""} onClick={()=>setMode(item)}>{item[0].toUpperCase()+item.slice(1)}</button>)}
          </div>
          <div className="calendar-legend">
            <span><i className="skillswap"></i> SkillSwap</span>
            <span><i className="circle"></i> Circle</span>
          </div>
        </div>

        {mode==="month" ? (
          <div className="calendar-month">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day=><div className="calendar-weekday" key={day}>{day}</div>)}
            {days.map(day=>{
              const inMonth=day.getMonth()===cursor.getMonth();
              const list=grouped.get(day.toDateString())||[];
              return <div className={"calendar-day-cell "+(!inMonth?"muted ":"")+(sameDay(day,new Date())?"today":"")} key={day.toISOString()}>
                <div className="calendar-day-number">{day.getDate()}</div>
                <div className="calendar-day-events">
                  {list.slice(0,3).map(event=>(
                    <button className={"calendar-event "+event.event_type} key={event.id} onClick={()=>openEvent(event)}>
                      <b>{fmtTime(event.starts_at)}</b><span>{event.title}</span>
                    </button>
                  ))}
                  {list.length>3&&<small>+{list.length-3} more</small>}
                </div>
              </div>;
            })}
          </div>
        ) : (
          <div className={"calendar-agenda "+mode}>
            {days.map(day=>{
              const list=grouped.get(day.toDateString())||[];
              return <section className={"calendar-agenda-day "+(sameDay(day,new Date())?"today":"")} key={day.toISOString()}>
                <div className="calendar-agenda-date">
                  <small>{new Intl.DateTimeFormat(undefined,{weekday:"short"}).format(day)}</small>
                  <strong>{day.getDate()}</strong>
                  <span>{new Intl.DateTimeFormat(undefined,{month:"short"}).format(day)}</span>
                </div>
                <div className="calendar-agenda-events">
                  {list.length?list.map(event=>(
                    <button className={"calendar-agenda-event "+event.event_type} key={event.id} onClick={()=>openEvent(event)}>
                      <div className="calendar-event-time">{fmtTime(event.starts_at)}</div>
                      <div className="calendar-event-copy">
                        <small>{event.event_type==="skillswap"?"SKILLSWAP":"SKILL CIRCLE"}</small>
                        <h4>{event.title}</h4>
                        <p>{event.subtitle} · {event.duration_minutes} min · {event.mode==="online"?"Online":"In person"}</p>
                      </div>
                      <span>→</span>
                    </button>
                  )):<div className="calendar-no-events">No sessions</div>}
                </div>
              </section>;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
