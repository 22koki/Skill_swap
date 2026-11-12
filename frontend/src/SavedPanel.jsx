import { useEffect, useMemo, useState } from "react";

const API = "http://127.0.0.1:8000/api";
export default function SavedPanel({open, onClose, token, catalog=[], people=[], circles=[]}){
 const [items,setItems]=useState([]);
 const [collections,setCollections]=useState([]);
 const [name,setName]=useState("");
 const [query,setQuery]=useState("");
 const [type,setType]=useState("all");
 const [collection,setCollection]=useState("all");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 async function call(path,options={}){
  const access=localStorage.getItem("skillswap_access")||token;
  const response=await fetch(API+path,{...options,headers:{"Authorization":"Bearer "+access,"Content-Type":"application/json",...options.headers}});
  if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(JSON.stringify(data).slice(0,240));}
  return response.status===204?null:response.json();
 }
 async function reload(){
  try{
   const [saved,folders]=await Promise.all([call("/bookmarks/"),call("/bookmarks/collections/")]);
   setItems(saved);setCollections(folders);setError("");
  }catch(e){setError(e.message)}
 }
 useEffect(()=>{if(open&&token) reload()},[open,token]);
 const candidates=useMemo(()=>[
  ...catalog.filter(x=>x.id).map(x=>({target_type:"skill",target_id:x.id,title:x.name})),
  ...people.filter(x=>x.id||x.user_id).map(x=>({target_type:"user",target_id:x.user_id||x.id,title:x.name||x.username})),
  ...circles.filter(x=>x.id&&x.is_public!==false).map(x=>({target_type:"circle",target_id:x.id,title:x.title})),
 ],[catalog,people,circles]);
 const found=candidates.filter(x=>(type==="all"||x.target_type===type)&&x.title?.toLowerCase().includes(query.toLowerCase())).slice(0,30);
 const visible=items.filter(x=>(type==="all"||x.target_type===type)&&(collection==="all"||x.collection_ids.includes(Number(collection)))&&x.title?.toLowerCase().includes(query.toLowerCase()));
 const savedKeys=new Set(items.map(x=>x.target_type+":"+x.target_id));
 async function action(fn){setBusy(true);setError("");try{await fn();await reload()}catch(e){setError(e.message)}finally{setBusy(false)}}
 async function add(target){await action(()=>call("/bookmarks/",{method:"POST",body:JSON.stringify(target)}))}
 async function remove(id){await action(()=>call("/bookmarks/"+id+"/",{method:"DELETE"}))}
 async function create(e){e.preventDefault();if(!name.trim())return;await action(()=>call("/bookmarks/collections/",{method:"POST",body:JSON.stringify({name:name.trim()})}));setName("")}
 async function toggleCollection(item,id){const ids=item.collection_ids.includes(id)?item.collection_ids.filter(x=>x!==id):[...item.collection_ids,id];await action(()=>call("/bookmarks/"+item.id+"/",{method:"PATCH",body:JSON.stringify({collection_ids:ids})}))}
 if(!open)return null;
 return <div className="modal-backdrop" onMouseDown={onClose} style={{zIndex:1200}}>
  <section className="glass" onMouseDown={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Saved bookmarks and collections" style={{position:"relative",width:"min(850px,94vw)",maxHeight:"88vh",overflowY:"auto",padding:28,borderRadius:24}}>
   <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
   <div className="eyebrow">YOUR LEARNING LIBRARY</div><h2>✦ Saved & Collections</h2>
   <p>Keep great mentors, interesting skills and inspiring Circles in one place.</p>
   {error&&<p role="alert" style={{color:"#ff9b91"}}>{error}</p>}
   <form onSubmit={create} style={{display:"flex",gap:8,flexWrap:"wrap",margin:"16px 0"}}>
    <input aria-label="New collection name" placeholder="New collection (e.g. Career goals)" maxLength={80} value={name} onChange={e=>setName(e.target.value)} style={{flex:1,minWidth:180}}/>
    <button className="primary" disabled={busy||!name.trim()}>+ Create collection</button>
   </form>
   <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
    <select aria-label="Filter type" value={type} onChange={e=>setType(e.target.value)}><option value="all">All types</option><option value="user">Mentors</option><option value="skill">Skills</option><option value="circle">Circles</option></select>
    <select aria-label="Filter collection" value={collection} onChange={e=>setCollection(e.target.value)}><option value="all">Every collection</option>{collections.map(c=><option key={c.id} value={c.id}>{c.name} ({c.bookmark_count})</option>)}</select>
    <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your library..." aria-label="Search saved items" style={{flex:1,minWidth:180}}/>
   </div>
   <h3>Saved items · {visible.length}</h3>
   {!visible.length&&<p>Nothing saved here yet. Explore below to bookmark your first item.</p>}
   <div style={{display:"grid",gap:10}}>
    {visible.map(item=><article key={item.id} className="glass" style={{padding:14,borderRadius:14}}>
     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
      <div><small>{item.target_type.toUpperCase()}</small><h4 style={{margin:"5px 0"}}>{item.title}</h4></div>
      <button className="ghost" disabled={busy} onClick={()=>remove(item.id)}>Remove bookmark</button>
     </div>
     <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
      {collections.map(c=><label key={c.id} style={{display:"flex",gap:5,alignItems:"center",fontSize:13}}>
       <input type="checkbox" disabled={busy} checked={item.collection_ids.includes(c.id)} onChange={()=>toggleCollection(item,c.id)}/>{c.name}
      </label>)}
     </div>
    </article>)}
   </div>
   <h3 style={{marginTop:24}}>Discover & save</h3>
   <p>Suggestions from SkillSwap's available skills, people and Circles.</p>
   <div style={{display:"grid",gap:8}}>
    {found.map(x=><div key={x.target_type+":"+x.target_id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
     <span>{x.target_type==="user"?"👤":x.target_type==="circle"?"◎":"✦"} {x.title}</span>
     <button className="ghost" disabled={busy||savedKeys.has(x.target_type+":"+x.target_id)} onClick={()=>add({target_type:x.target_type,target_id:x.target_id})}>{savedKeys.has(x.target_type+":"+x.target_id)?"✓ Saved":"+ Save"}</button>
    </div>)}
   </div>
  </section>
 </div>
}
