function fmt(value){
 if(!value) return "";
 try{return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",year:"numeric"}).format(new Date(value));}
 catch{return value}
}

export default function SafetyCenter({
 open,
 data,
 loading,
 isStaff,
 moderationQueue,
 moderationLoading,
 onClose,
 onUnblock,
 onRefresh,
 onModerationAction,
}){
 if(!open) return null;
 const standing=data?.standing||{};
 const reports=data?.reports||[];
 const blocked=data?.blocked||[];

 return (
  <div className="safety-center-backdrop" onMouseDown={onClose}>
   <section className="safety-center-shell" onMouseDown={e=>e.stopPropagation()}>
    <header className="safety-center-header">
      <div>
        <div className="eyebrow">TRUST & SAFETY</div>
        <h2>Safety Center</h2>
        <p>Control who can interact with you and review your account standing.</p>
      </div>
      <div className="safety-center-actions">
        <button className="outline" onClick={onRefresh}>↻ Refresh</button>
        <button className="safety-close" onClick={onClose}>×</button>
      </div>
    </header>

    {loading ? <div className="safety-loading">Loading safety information…</div> : (
      <div className="safety-center-body">
        <section className={"safety-standing-card "+(standing.suspended?"danger":standing.restricted?"warn":"good")}>
          <div className="safety-standing-icon">{standing.suspended?"⛔":standing.restricted?"⚠":"✓"}</div>
          <div>
            <small>ACCOUNT STANDING</small>
            <h3>{standing.suspended?"Suspended":standing.restricted?"Temporarily restricted":"Good standing"}</h3>
            <p>
              {standing.suspended
                ? "This account is currently suspended from SkillSwap interactions."
                : standing.restricted
                  ? "Some SkillSwap interactions are temporarily restricted."
                  : "No active restrictions on your account."}
            </p>
          </div>
          <div className="safety-standing-meta">
            <b>{standing.warning_count||0}</b><span>warnings</span>
          </div>
        </section>

        <div className="safety-columns">
          <section className="safety-panel">
            <div className="safety-panel-head">
              <div><small>PRIVACY CONTROLS</small><h3>Blocked users</h3></div>
              <span>{blocked.length}</span>
            </div>
            <div className="safety-block-list">
              {blocked.length?blocked.map(item=>(
                <article key={item.id}>
                  <div className="safety-user-avatar">
                    {item.avatar_url?<img src={item.avatar_url} alt=""/>:<span>{(item.name||item.username||"S")[0]}</span>}
                  </div>
                  <div><b>{item.name}</b><small>@{item.username}</small></div>
                  <button className="outline" onClick={()=>onUnblock(item.user_id)}>Unblock</button>
                </article>
              )):<div className="safety-empty-mini">You have not blocked anyone.</div>}
            </div>
          </section>

          <section className="safety-panel">
            <div className="safety-panel-head">
              <div><small>YOUR REPORTS</small><h3>Report history</h3></div>
              <span>{reports.length}</span>
            </div>
            <div className="safety-report-history">
              {reports.length?reports.map(item=>(
                <article key={item.id}>
                  <div className={"safety-report-status "+item.status}>{item.status}</div>
                  <div>
                    <b>{item.reason.replaceAll("_"," ")}</b>
                    <small>{item.reported_user_name||item.target_type} · {fmt(item.created_at)}</small>
                  </div>
                </article>
              )):<div className="safety-empty-mini">No reports submitted.</div>}
            </div>
          </section>
        </div>

        {isStaff&&<section className="safety-panel moderation-queue">
          <div className="safety-panel-head">
            <div><small>STAFF ONLY</small><h3>Moderation queue</h3></div>
            <span>{moderationQueue?.filter(x=>x.status==="open"||x.status==="reviewing").length||0} open</span>
          </div>

          {moderationLoading?<div className="safety-loading compact">Loading moderation queue…</div>:
           <div className="moderation-list">
            {(moderationQueue||[]).length?(moderationQueue||[]).map(item=>(
              <article key={item.id} className="moderation-card">
                <div className="moderation-card-top">
                  <div>
                    <small>{item.target_type.toUpperCase()} · {item.reason.replaceAll("_"," ").toUpperCase()}</small>
                    <h4>{item.reported_user_name||"Reported content"}</h4>
                    <p>Reported by {item.reporter_name} · {fmt(item.created_at)}</p>
                  </div>
                  <span className={"safety-report-status "+item.status}>{item.status}</span>
                </div>
                {item.details&&<blockquote>{item.details}</blockquote>}
                {item.evidence?.body&&<div className="moderation-evidence"><small>EVIDENCE</small><p>{item.evidence.body}</p></div>}
                <div className="moderation-actions">
                  {item.status==="open"&&<button className="outline" onClick={()=>onModerationAction(item.id,"review")}>Review</button>}
                  <button className="outline" onClick={()=>onModerationAction(item.id,"dismiss")}>Dismiss</button>
                  {item.reported_user&&<>
                    <button className="outline warn-action" onClick={()=>onModerationAction(item.id,"warn")}>Warn</button>
                    <button className="outline restrict-action" onClick={()=>onModerationAction(item.id,"restrict")}>Restrict 7d</button>
                    <button className="danger-soft" onClick={()=>onModerationAction(item.id,"suspend")}>Suspend</button>
                  </>}
                </div>
              </article>
            )):<div className="safety-empty-mini">No reports in the moderation queue.</div>}
           </div>}
        </section>}
      </div>
    )}
   </section>
  </div>
 );
}
