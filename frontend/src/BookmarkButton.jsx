import {useState} from "react";
import "./BookmarkButton.css";

export default function BookmarkButton({type,id,bookmarks=[],collections=[],onSave,onRemove,onAssign,compact=false}){
 const [open,setOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const item=bookmarks.find(x=>x.target_type===type&&Number(x.target_id)===Number(id));
 if(!id)return null;
 async function run(callback){
  setBusy(true);setError("");
  try{await callback()}catch(e){setError(e.message||"Could not update bookmark")}finally{setBusy(false)}
 }
 async function toggle(e){
  e?.stopPropagation();
  if(item){await run(()=>onRemove(item.id));setOpen(false)}
  else await run(()=>onSave(type,id));
 }
 return <div className="quick-bookmark" onClick={e=>e.stopPropagation()}>
  <button type="button" disabled={busy} className={"quick-bookmark-toggle"+(item?" is-saved":"")} title={item?"Remove bookmark":"Save for later"} aria-label={item?"Remove bookmark":"Save for later"} aria-pressed={!!item} onClick={toggle}>{item?"♥":"♡"} {!compact&&<span>{item?"Saved":"Save"}</span>}</button>
  {!!item&&collections.length>0&&<button type="button" className="quick-bookmark-folder" title="Organize bookmark" aria-label="Add bookmark to collections" aria-expanded={open} onClick={e=>{e.stopPropagation();setOpen(!open)}}>▾</button>}
  {open&&item&&<div className="quick-bookmark-popover">
   <strong>Add to collection</strong>
   {collections.map(c=><button key={c.id} type="button" disabled={busy} className="quick-bookmark-choice" onClick={e=>{e.stopPropagation();run(()=>onAssign(item,c.id))}}>
    <span>{item.collection_ids.includes(c.id)?"☑":"☐"}</span> {c.name}
   </button>)}
   <button type="button" className="quick-bookmark-done" onClick={e=>{e.stopPropagation();setOpen(false)}}>Done</button>
  </div>}
  {error&&<span role="alert" className="quick-bookmark-error">{error}</span>}
 </div>;
}
