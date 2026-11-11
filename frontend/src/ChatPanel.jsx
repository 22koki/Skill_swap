import { useEffect, useRef, useState } from "react";
import { getSkillVisual } from "./skillVisuals";

function formatTime(value){
  if(!value) return "";
  return new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit"}).format(new Date(value));
}

export default function ChatPanel({
  open,
  conversation,
  messages,
  currentUserId,
  draft,
  setDraft,
  onClose,
  onSend,
  onRefresh,
  sending,
  booking,
}){
  const endRef=useRef(null);
  const [showContext,setShowContext]=useState(true);

  useEffect(()=>{
    if(!open) return;
    endRef.current?.scrollIntoView({behavior:"smooth"});
  },[open,messages]);

  useEffect(()=>{
    if(!open || !onRefresh) return;
    const id=setInterval(onRefresh,5000);
    return ()=>clearInterval(id);
  },[open,onRefresh]);

  if(!open || !conversation) return null;

  const offer=getSkillVisual(conversation.offered_skill_name);
  const request=getSkillVisual(conversation.requested_skill_name);
  const initials=(conversation.partner_name||"SS").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();

  function submit(e){
    e.preventDefault();
    if(!draft.trim() || sending) return;
    onSend();
  }

  return (
    <div className="chat-backdrop" onMouseDown={onClose}>
      <aside className="chat-panel" onMouseDown={e=>e.stopPropagation()}>
        <header className="chat-header">
          <div className="chat-person">
            {conversation.partner_avatar_url
              ? <img src={conversation.partner_avatar_url} className="chat-avatar" alt="" />
              : <div className="chat-avatar chat-avatar-fallback">{initials}</div>}
            <div>
              <div className="chat-kicker">SkillSwap chat</div>
              <h3>{conversation.partner_name}</h3>
              <p>{conversation.partner_location || "SkillSwap partner"}</p>
            </div>
          </div>
          <button className="chat-close" onClick={onClose}>×</button>
        </header>

        <div className="chat-swap-strip">
          <div className={"chat-skill-pill "+offer.className}>
            <span>{offer.icon}</span><b>{conversation.offered_skill_name}</b>
          </div>
          <div className="chat-swap-icon">⇄</div>
          <div className={"chat-skill-pill "+request.className}>
            <span>{request.icon}</span><b>{conversation.requested_skill_name}</b>
          </div>
        </div>

        {booking && showContext && (
          <div className="chat-session-context">
            <div>
              <span>📅</span>
              <div>
                <small>Upcoming session</small>
                <b>{new Date(booking.starts_at).toLocaleString()}</b>
              </div>
            </div>
            <button onClick={()=>setShowContext(false)}>×</button>
          </div>
        )}

        <div className="chat-messages">
          {!messages.length && (
            <div className="chat-empty">
              <div>💬</div>
              <h4>Start planning your swap.</h4>
              <p>Say hello, agree on what to prepare, or share what you want to cover.</p>
            </div>
          )}

          {messages.map(message=>{
            const mine=message.sender===currentUserId;
            return (
              <div className={"chat-message-row "+(mine?"mine":"theirs")} key={message.id}>
                {!mine && (
                  message.sender_avatar_url
                    ? <img src={message.sender_avatar_url} className="chat-mini-avatar" alt="" />
                    : <div className="chat-mini-avatar chat-mini-fallback">{message.sender_name?.[0]||"S"}</div>
                )}
                <div className="chat-bubble-wrap">
                  <div className="chat-bubble">{message.body}</div>
                  <small>{formatTime(message.created_at)}{mine && message.read_at ? " · Read" : ""}</small>
                </div>
              </div>
            );
          })}
          <div ref={endRef}></div>
        </div>

        <form className="chat-composer" onSubmit={submit}>
          <textarea
            rows="1"
            maxLength="2000"
            placeholder={"Message "+conversation.partner_name+"…"}
            value={draft}
            onChange={e=>setDraft(e.target.value)}
            onKeyDown={e=>{
              if(e.key==="Enter" && !e.shiftKey){
                e.preventDefault();
                submit(e);
              }
            }}
          />
          <button className="chat-send" disabled={!draft.trim()||sending}>
            {sending ? "…" : "➤"}
          </button>
        </form>
      </aside>
    </div>
  );
}
