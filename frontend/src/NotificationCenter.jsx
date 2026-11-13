import { useMemo, useState } from "react";

const FILTERS=[
  ["all","All"],
  ["swap","Swaps"],
  ["message","Messages"],
  ["session","Sessions"],
  ["progress","Progress"],
];

const ICONS={
  swap:"🤝",
  message:"💬",
  session:"📅",
  review:"⭐",
  progress:"🏆",
  match:"🧠",
  system:"✦",
};

function timeAgo(value){
  if(!value) return "";
  const diff=Math.max(0,Date.now()-new Date(value).getTime());
  const min=Math.floor(diff/60000);
  if(min<1) return "Just now";
  if(min<60) return min+"m ago";
  const hr=Math.floor(min/60);
  if(hr<24) return hr+"h ago";
  const day=Math.floor(hr/24);
  if(day<7) return day+"d ago";
  return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric"}).format(new Date(value));
}

export default function NotificationCenter({
  open,
  notifications,
  unreadCount,
  preferences,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onAction,
  onPreferenceChange,
}){
  const [filter,setFilter]=useState("all");
  const [settingsOpen,setSettingsOpen]=useState(false);

  const visible=useMemo(()=>{
    if(filter==="all") return notifications;
    if(filter==="progress") return notifications.filter(item=>["progress","review"].includes(item.kind));
    return notifications.filter(item=>item.kind===filter);
  },[notifications,filter]);

  if(!open) return null;

  return (
    <div className="notification-backdrop" onMouseDown={onClose}>
      <aside className="notification-drawer" onMouseDown={e=>e.stopPropagation()}>
        <header className="notification-header">
          <div>
            <div className="notification-kicker">YOUR SKILLSWAP ACTIVITY</div>
            <h2>Notifications</h2>
            <p>{unreadCount ? unreadCount+" unread update"+(unreadCount===1?"":"s") : "You're all caught up ✦"}</p>
          </div>
          <div className="notification-header-actions">
            <button className="notification-settings-button" onClick={()=>setSettingsOpen(!settingsOpen)}>⚙</button>
            <button className="notification-close" onClick={onClose}>×</button>
          </div>
        </header>

        {settingsOpen && (
          <section className="notification-preferences">
            <div>
              <div className="notification-kicker">PREFERENCES</div>
              <h3>What should SkillSwap notify you about?</h3>
            </div>
            <div className="notification-pref-grid">
              {[
                ["swaps","🤝","Swap requests"],
                ["messages","💬","Messages"],
                ["sessions","📅","Sessions & reminders"],
                ["reviews","⭐","Reviews"],
                ["progress","🏆","Achievements"],
                ["matches","🧠","New matches"],
              ].map(([key,icon,label])=>(
                <label className="notification-pref" key={key}>
                  <span>{icon}</span>
                  <b>{label}</b>
                  <input
                    type="checkbox"
                    checked={preferences?.[key]??true}
                    onChange={e=>onPreferenceChange(key,e.target.checked)}
                  />
                  <i></i>
                </label>
              ))}
            </div>
          </section>
        )}

        <div className="notification-toolbar">
          <div className="notification-filters">
            {FILTERS.map(([key,label])=>(
              <button key={key} className={filter===key?"active":""} onClick={()=>setFilter(key)}>
                {label}
                {key==="all" && unreadCount>0 && <span>{unreadCount}</span>}
              </button>
            ))}
          </div>
          {unreadCount>0 && <button className="notification-mark-all" onClick={onMarkAllRead}>Mark all read</button>}
        </div>

        <div className="notification-list">
          {visible.length ? visible.map(item=>{
            const initials=(item.actor_name||"SkillSwap").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
            return (
              <article className={"notification-card "+(!item.is_read?"unread":"")} key={item.id}>
                <button className="notification-card-main" onClick={()=>onMarkRead(item)}>
                  <div className="notification-visual">
                    {item.actor_avatar_url
                      ? <img src={item.actor_avatar_url} alt="" />
                      : <div className={"notification-icon kind-"+item.kind}>{item.actor_name?initials:(ICONS[item.kind]||"✦")}</div>}
                    {!item.is_read && <span className="notification-unread-dot"></span>}
                  </div>

                  <div className="notification-copy">
                    <div className="notification-title-row">
                      <h4>{item.title}</h4>
                      <time>{timeAgo(item.created_at)}</time>
                    </div>
                    {item.body && <p>{item.body}</p>}
                    <div className="notification-meta">
                      <span className={"notification-kind kind-"+item.kind}>{ICONS[item.kind]||"✦"} {item.kind}</span>
                      {item.actor_name && <span>from {item.actor_name}</span>}
                    </div>
                  </div>
                </button>

                {item.action_type && (
                  <button className="notification-action" onClick={()=>onAction(item)}>
                    {item.action_type==="message"?"Reply":
                     item.action_type==="swap"?"View request":
                     item.action_type==="booking"?"Open session":
                     item.action_type==="review"?"View review":
                     item.action_type==="progression"?"View progress":
                     item.action_type==="passport"?"Open passport":"View"} <span>→</span>
                  </button>
                )}
              </article>
            );
          }) : (
            <div className="notification-empty">
              <div>✨</div>
              <h3>Nothing here yet.</h3>
              <p>{filter==="all"?"New SkillSwap activity will appear here.":"No notifications in this category yet."}</p>
            </div>
          )}
        </div>

        <footer className="notification-footer">
          <span>SkillSwap keeps your learning journey connected.</span>
          <b>↔</b>
        </footer>
      </aside>
    </div>
  );
}
