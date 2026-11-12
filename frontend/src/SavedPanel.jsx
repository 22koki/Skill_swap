import { useEffect, useMemo, useState } from "react";
import "./SavedPanel.css";

const API = "http://127.0.0.1:8000/api";
const types = [{value:"all",label:"All saved"},{value:"user",label:"Mentors"},{value:"skill",label:"Skills"},{value:"circle",label:"Circles"}];
const icons = {user:"👤",skill:"✦",circle:"◎"};

export default function SavedPanel({open,onClose,token,catalog=[],people=[],circles=[]}){
 const [items,setItems]=useState([]);
 const [collections,setCollections]=useState([]);
 const [name,setName]=useState("");
 const [addingCollection,setAddingCollection]=useState(false);
 const [query,setQuery]=useState("");
 const [type,setType]=useState("all");
 const [collection,setCollection]=useState("all");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(false);

 async function call(path,options={}){
  const access=localStorage.getItem("skillswap_access")||token;
  const response=await fetch(API+path,{...options,headers:{"Authorization":"Bearer "+access,"Content-Type":"application/json",...options.headers}});
  if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.detail||data.name?.[0]||JSON.stringify(data).slice(0,240));}
  return response.status===204?null:response.json();
 }
 async function reload(){
  const [saved,folders]=await Promise.all([call("/bookmarks/"),call("/bookmarks/collections/")]);
  setItems(saved);setCollections(folders);
 }
 useEffect(()=>{
  if(!open||!token)return;
  let cancelled=false;
  setLoading(true);
  Promise.all([call("/bookmarks/"),call("/bookmarks/collections/")]).then(([saved,folders])=>{
   if(!cancelled){setItems(saved);setCollections(folders);setError("");}
  }).catch(e=>{if(!cancelled)setError(e.message)}).finally(()=>{if(!cancelled)setLoading(false)});
  return ()=>{cancelled=true};
 },[open,token]);
 useEffect(()=>{
  if(!open)return;
  function onEscape(event){if(event.key==="Escape")onClose()}
  document.addEventListener("keydown",onEscape);
  return ()=>document.removeEventListener("keydown",onEscape);
 },[open,onClose]);

 const candidates=useMemo(()=>[
  ...catalog.filter(x=>x.id).map(x=>({target_type:"skill",target_id:x.id,title:x.name})),
  ...people.filter(x=>x.id||x.user_id).map(x=>({target_type:"user",target_id:x.user_id||x.id,title:x.name||x.username})),
  ...circles.filter(x=>x.id&&x.is_public!==false).map(x=>({target_type:"circle",target_id:x.id,title:x.title})),
 ],[catalog,people,circles]);
 const savedKeys=new Set(items.map(x=>x.target_type+":"+x.target_id));
 const found=candidates.filter(x=>x.title&&(type==="all"||x.target_type===type)&&x.title.toLowerCase().includes(query.toLowerCase())&&!savedKeys.has(x.target_type+":"+x.target_id)).slice(0,9);
 const visible=items.filter(x=>(type==="all"||x.target_type===type)&&(collection==="all"||x.collection_ids.includes(Number(collection)))&&x.title?.toLowerCase().includes(query.toLowerCase()));
 const selectedFolder=collections.find(c=>String(c.id)===String(collection));
 async function action(fn){
  setBusy(true);setError("");
  try{await fn();await reload();return true}catch(e){setError(e.message);return false}finally{setBusy(false)}
 }
 async function add(target){await action(()=>call("/bookmarks/",{method:"POST",body:JSON.stringify(target)}))}
 async function remove(id){await action(()=>call("/bookmarks/"+id+"/",{method:"DELETE"}))}
 async function create(e){
  e.preventDefault();if(!name.trim())return;
  if(await action(()=>call("/bookmarks/collections/",{method:"POST",body:JSON.stringify({name:name.trim()})}))){setName("");setAddingCollection(false)}
 }
 async function toggleCollection(item,id){
  const ids=item.collection_ids.includes(id)?item.collection_ids.filter(x=>x!==id):[...item.collection_ids,id];
  await action(()=>call("/bookmarks/"+item.id+"/",{method:"PATCH",body:JSON.stringify({collection_ids:ids})}));
 }
 async function deleteCollection(){
  if(!selectedFolder||!window.confirm("Delete collection '"+selectedFolder.name+"'? Your saved items will stay in your library."))return;
  if(await action(()=>call("/bookmarks/collections/"+selectedFolder.id+"/",{method:"DELETE"})))setCollection("all");
 }

 if(!open)return null;
 return <div className="saved-backdrop" onMouseDown={onClose}>
  <section className="saved-dialog" onMouseDown={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Saved bookmarks and collections">
   <header className="saved-head">
    <div className="saved-head-top"><span className="saved-kicker">✦ YOUR PERSONAL LEARNING LIBRARY</span><button className="saved-close" onClick={onClose} aria-label="Close saved library">×</button></div>
    <h2 className="saved-title">Your little corner of inspiration <span aria-hidden="true">💜</span></h2>
    <p className="saved-subtitle">A home for the mentors you admire, skills you want to learn, and Circles you love.</p>
    <div className="saved-stats" aria-label="Library totals">
     <div className="saved-stat"><strong>{items.length}</strong><span>Saved items</span></div>
     <div className="saved-stat"><strong>{collections.length}</strong><span>Collections</span></div>
     <div className="saved-stat"><strong>{items.filter(x=>x.target_type==="user").length}</strong><span>Mentors</span></div>
    </div>
   </header>
   <div className="saved-body">
    {error&&<p className="saved-error" role="alert">{error}</p>}
    <div className="saved-section-header"><h3>📁 My collections</h3><span style={{fontSize:12,color:"#897b9a"}}>Organize your learning journey</span></div>
    <div className="saved-collections">
     <button className={"saved-folder"+(collection==="all"?" selected":"")} onClick={()=>setCollection("all")}>
      <span className="saved-folder-icon">💜</span><strong>All saved</strong><small>{items.length} items</small>
     </button>
     {collections.map((folder,i)=><button key={folder.id} className={"saved-folder"+(String(collection)===String(folder.id)?" selected":"")} onClick={()=>setCollection(String(folder.id))}>
      <span className="saved-folder-icon">{["✨","🎯","📚","🌱","🚀"][i%5]}</span>
      <strong title={folder.name}>{folder.name}</strong><small>{folder.bookmark_count} items</small>
     </button>)}
     <button className="saved-folder saved-create" onClick={()=>setAddingCollection(v=>!v)} aria-expanded={addingCollection}><span>＋</span><strong>New collection</strong></button>
    </div>
    {addingCollection&&<form className="saved-new-form" onSubmit={create}>
     <input autoFocus aria-label="New collection name" value={name} maxLength={80} onChange={e=>setName(e.target.value)} placeholder="e.g. My dream skills"/>
     <button className="saved-action" disabled={busy||!name.trim()}>Create collection</button>
     <button className="saved-link-button" type="button" onClick={()=>setAddingCollection(false)}>Cancel</button>
    </form>}
    {selectedFolder&&<div className="saved-collection-actions"><button className="saved-delete" disabled={busy} onClick={deleteCollection}>Delete "{selectedFolder.name}" collection</button></div>}
    <div className="saved-toolbar">
     <div className="saved-tabs" role="group" aria-label="Filter saved content">{types.map(t=><button key={t.value} className={"saved-tab"+(type===t.value?" active":"")} aria-pressed={type===t.value} onClick={()=>setType(t.value)}>{t.label}</button>)}</div>
     <label className="saved-search-wrap"><span>⌕</span><input className="saved-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your library..." aria-label="Search your library"/></label>
    </div>
    <div className="saved-section-header"><h3>{selectedFolder?selectedFolder.name:"Your saved treasures"} <span style={{fontWeight:500,color:"#917ca6",fontSize:13}}>· {visible.length}</span></h3></div>
    <div className="saved-items">
     {visible.map(item=><article className="saved-item" key={item.id}>
      <div className="saved-item-main">
       <div className={"saved-item-icon "+item.target_type} aria-hidden="true">{icons[item.target_type]||"✦"}</div>
       <div className="saved-item-title"><small>{item.target_type==="user"?"MENTOR":item.target_type==="circle"?"SKILL CIRCLE":"SKILL"}</small><strong>{item.title}</strong></div>
       <button className="saved-remove" onClick={()=>remove(item.id)} disabled={busy} title="Remove bookmark" aria-label={"Remove "+item.title}>♡</button>
      </div>
      <div className="saved-assign">
       <span className="saved-assign-label">Add to:</span>
       {collections.length===0?<button className="saved-chip" onClick={()=>setAddingCollection(true)}>+ Create a collection</button>:collections.map(c=><button key={c.id} className={"saved-chip"+(item.collection_ids.includes(c.id)?" on":"")} aria-pressed={item.collection_ids.includes(c.id)} disabled={busy} onClick={()=>toggleCollection(item,c.id)}>{item.collection_ids.includes(c.id)?"✓ ":"＋ "}{c.name}</button>)}
      </div>
     </article>)}
     {!loading&&visible.length===0&&<div className="saved-empty">
      <div className="saved-empty-icon">🔖</div><h4>{items.length===0?"Your library starts with one spark": "No items match this view"}</h4>
      <p>{items.length===0?"Find something inspiring below and save it for later.":"Try another category, collection, or search term."}</p>
     </div>}
     {loading&&<p>Loading your library...</p>}
    </div>
    <section className="saved-discover">
     <div className="saved-section-header"><h3>✨ Discover something new</h3><span style={{fontSize:12,color:"#897b9a"}}>Handy picks from SkillSwap</span></div>
     <div className="saved-discover-grid">
      {found.map(x=><div className="saved-suggestion" key={x.target_type+":"+x.target_id}>
       <span title={x.title}>{icons[x.target_type]} {x.title}</span>
       <button className="saved-mini-action" disabled={busy} onClick={()=>add({target_type:x.target_type,target_id:x.target_id})}>+ Save</button>
      </div>)}
      {found.length===0&&<p style={{fontSize:13,color:"#837890"}}>No additional suggestions for this filter. Try All saved.</p>}
     </div>
    </section>
   </div>
  </section>
 </div>;
}
