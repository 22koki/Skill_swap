import {useEffect,useState} from "react";
import "./CommunityFeed.css";

const kinds=[["all","All updates"],["update","Learning"],["project","Projects"],["question","Questions"],["win","Wins"]];
const labels={update:"📖 Learning update",project:"🚀 Project showcase",question:"💡 Question",win:"🏆 Milestone win"};
function when(value){try{return new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))}catch{return ""}}
function initials(name){return (name||"S").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()}

export default function CommunityFeed({open,onClose,api,user}){
 const [posts,setPosts]=useState([]);
 const [kind,setKind]=useState("all");
 const [text,setText]=useState("");
 const [postKind,setPostKind]=useState("update");
 const [link,setLink]=useState("");
 const [comments,setComments]=useState({});
 const [drafts,setDrafts]=useState({});
 const [shown,setShown]=useState({});
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(false);
 const [compose,setCompose]=useState(false);

 async function request(path,options={}){
  const res=await api("/community/"+path,options);
  if(!res.ok){const data=await res.json().catch(()=>({}));throw new Error(data.detail||data.body?.[0]||JSON.stringify(data).slice(0,180))}
  return res.status===204?null:res.json();
 }
 async function refresh(){setPosts(await request(""))}
 useEffect(()=>{
  if(!open)return;
  let active=true;
  setLoading(true);setError("");
  request("").then(data=>{if(active)setPosts(data)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});
  return ()=>{active=false};
 },[open]);
 useEffect(()=>{
  if(!open)return;
  const handler=e=>{if(e.key==="Escape")onClose()};
  window.addEventListener("keydown",handler);
  return ()=>window.removeEventListener("keydown",handler);
 },[open,onClose]);
 async function act(fn){
  setBusy(true);setError("");
  try{await fn();await refresh();return true}catch(e){setError(e.message);return false}finally{setBusy(false)}
 }
 async function publish(e){
  e.preventDefault();
  if(!text.trim())return;
  const success=await act(()=>request("",{method:"POST",body:JSON.stringify({kind:postKind,body:text.trim(),link:link.trim()})}));
  if(success){setText("");setLink("");setCompose(false);setKind("all")}
 }
 async function react(post){
  await act(()=>request(post.id+"/react/",{method:post.reacted?"DELETE":"POST"}));
 }
 async function loadComments(post){
  if(shown[post.id]){setShown(p=>({...p,[post.id]:false}));return}
  setError("");
  try{const data=await request(post.id+"/comments/");setComments(p=>({...p,[post.id]:data}));setShown(p=>({...p,[post.id]:true}))}
  catch(e){setError(e.message)}
 }
 async function addComment(e,post){
  e.preventDefault();
  const body=(drafts[post.id]||"").trim();
  if(!body)return;
  const success=await act(async()=>{
   await request(post.id+"/comments/",{method:"POST",body:JSON.stringify({body})});
   const list=await request(post.id+"/comments/");
   setComments(p=>({...p,[post.id]:list}));
  });
  if(success)setDrafts(p=>({...p,[post.id]:""}));
 }
 async function deletePost(post){
  if(!window.confirm("Delete this update?"))return;
  await act(()=>request(post.id+"/",{method:"DELETE"}));
 }
 async function deleteComment(post,id){
  await act(async()=>{
   await request(post.id+"/comments/"+id+"/",{method:"DELETE"});
   setComments(p=>({...p,[post.id]:(p[post.id]||[]).filter(c=>c.id!==id)}));
  });
 }
 const visible=kind==="all"?posts:posts.filter(p=>p.kind===kind);
 if(!open)return null;
 return <div className="feed-overlay" onMouseDown={onClose}>
  <section className="feed-shell" role="dialog" aria-modal="true" aria-label="SkillSwap Community" onMouseDown={e=>e.stopPropagation()}>
   <header className="feed-hero">
    <div className="feed-hero-top"><span>✦ THE SKILLSWAP COMMUNITY</span><button onClick={onClose} aria-label="Close community">×</button></div>
    <h2>Learning is better together. 💜</h2>
    <p>Share what you're building, celebrate small wins, and learn from one another.</p>
    <div className="feed-hero-bottom"><span>✨ A place to inspire & be inspired</span><button onClick={()=>setCompose(v=>!v)}>{compose?"Close composer":"+ Share an update"}</button></div>
   </header>
   <div className="feed-content">
    {error&&<p className="feed-error" role="alert">{error}</p>}
    {compose&&<form className="feed-composer" onSubmit={publish}>
     <div className="feed-composer-header"><span className="feed-avatar">{initials(user?.first_name||user?.username)}</span><strong>What have you been learning?</strong></div>
     <select aria-label="Post type" value={postKind} onChange={e=>setPostKind(e.target.value)}>{kinds.slice(1).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>
     <textarea required maxLength={1500} rows={4} value={text} onChange={e=>setText(e.target.value)} placeholder="Share a skill you practiced, a project you built, or a question for the community..."/>
     <input type="url" value={link} onChange={e=>setLink(e.target.value)} placeholder="Project link (optional) — https://..." aria-label="Optional project URL"/>
     <div className="feed-composer-actions"><span>{text.length}/1500 characters</span><button disabled={busy||!text.trim()}>Publish post ↗</button></div>
    </form>}
    <div className="feed-tabs">{kinds.map(([key,label])=><button key={key} className={kind===key?"active":""} onClick={()=>setKind(key)}>{label}</button>)}</div>
    <div className="feed-list">
     {loading&&<p className="feed-muted">Loading community updates...</p>}
     {!loading&&visible.length===0&&<div className="feed-empty"><span>🌱</span><h3>Let's start a conversation</h3><p>{kind==="all"?"Be the first to share something with the community.":"No updates in this category yet."}</p><button onClick={()=>setCompose(true)}>Write a post</button></div>}
     {visible.map(post=><article key={post.id} className="feed-post">
      <div className="feed-post-head">
       <span className="feed-avatar">{post.author_avatar?<img src={post.author_avatar} alt=""/>:initials(post.author_name)}</span>
       <div className="feed-post-person"><strong>{post.author_name}</strong><small>{when(post.created_at)}</small></div>
       {post.is_mine&&<button className="feed-delete" disabled={busy} onClick={()=>deletePost(post)}>Delete</button>}
      </div>
      <span className="feed-kind">{labels[post.kind]||labels.update}</span>
      <p className="feed-post-body">{post.body}</p>
      {post.link&&<a href={post.link} target="_blank" rel="noopener noreferrer" className="feed-post-link">🔗 View shared resource ↗</a>}
      <div className="feed-post-actions">
       <button className={post.reacted?"reacted":""} disabled={busy} aria-pressed={post.reacted} onClick={()=>react(post)}>{post.reacted?"♥":"♡"} {post.reaction_count} Appreciations</button>
       <button onClick={()=>loadComments(post)}>💬 {post.comment_count} Comments</button>
      </div>
      {shown[post.id]&&<div className="feed-comments">
       {(comments[post.id]||[]).map(comment=><div key={comment.id} className="feed-comment"><div><strong>{comment.author_name}</strong><p>{comment.body}</p></div>{comment.is_mine&&<button disabled={busy} onClick={()=>deleteComment(post,comment.id)}>Remove</button>}</div>)}
       <form onSubmit={e=>addComment(e,post)}><input maxLength={500} value={drafts[post.id]||""} onChange={e=>setDrafts(p=>({...p,[post.id]:e.target.value}))} placeholder="Write a supportive comment..." aria-label="Write a comment"/><button disabled={busy||!(drafts[post.id]||"").trim()}>Post</button></form>
      </div>}
     </article>)}
    </div>
   </div>
  </section>
 </div>;
}
