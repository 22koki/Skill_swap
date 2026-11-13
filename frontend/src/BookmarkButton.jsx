import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import "./BookmarkButton.css";

export default function BookmarkButton({type,id,bookmarks=[],collections=[],onSave,onRemove,onAssign,compact=false}){
 const [open,setOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [position,setPosition]=useState({top:0,left:0});
 const buttonRef=useRef(null);
 const menuRef=useRef(null);
 const item=bookmarks.find(x=>x.target_type===type&&Number(x.target_id)===Number(id));
 const valid=Boolean(id);

 useEffect(()=>{
  if(!open||!item)return;
  function updatePosition(){
   if(!buttonRef.current)return;
   const rect=buttonRef.current.getBoundingClientRect();
   const width=Math.min(220,window.innerWidth-24);
   setPosition({
    left:Math.max(12,Math.min(rect.right-width,window.innerWidth-width-12)),
    top:rect.bottom+10+250>window.innerHeight?Math.max(12,rect.top-220):rect.bottom+8
   });
  }
  function dismiss(e){
   if(buttonRef.current?.contains(e.target)||menuRef.current?.contains(e.target))return;
   setOpen(false);
  }
  function onKey(e){if(e.key==="Escape")setOpen(false)}
  updatePosition();
  document.addEventListener("pointerdown",dismiss);
  document.addEventListener("keydown",onKey);
  window.addEventListener("resize",updatePosition);
  window.addEventListener("scroll",updatePosition,true);
  return ()=>{
   document.removeEventListener("pointerdown",dismiss);
   document.removeEventListener("keydown",onKey);
   window.removeEventListener("resize",updatePosition);
   window.removeEventListener("scroll",updatePosition,true);
  };
 },[open,item?.id]);

 useEffect(()=>{if(!item)setOpen(false)},[item?.id]);

 async function run(fn){
  setBusy(true);setError("");
  try{await fn();return true}
  catch(e){setError(e.message||"Could not update bookmark");return false}
  finally{setBusy(false)}
 }
 async function handleClick(e){
  e.stopPropagation();
  if(busy)return;
  if(item){setOpen(v=>!v)}
  else await run(()=>onSave(type,id));
 }
 async function remove(){
  if(await run(()=>onRemove(item.id)))setOpen(false);
 }
 if(!valid)return null;
 return <div className="quick-bookmark" onClick={e=>e.stopPropagation()}>
  <button ref={buttonRef} type="button" disabled={busy}
   className={"quick-bookmark-toggle"+(item?" is-saved":"")}
   title={item?"Manage saved item":"Save for later"}
   aria-label={item?"Manage saved bookmark":"Save for later"}
   aria-expanded={item?open:undefined}
   aria-haspopup={item?"menu":undefined}
   onClick={handleClick}>
    <span aria-hidden="true">{item?"♥":"♡"}</span>
    {!compact&&<span className="quick-bookmark-text">{item?"Saved":"Save"}</span>}
  </button>
  {open&&item&&createPortal(
   <div ref={menuRef} className="quick-bookmark-popover" role="menu" aria-label="Organize saved item" style={{top:position.top,left:position.left}}>
    <strong>♥ Saved to your library</strong>
    <small className="quick-bookmark-hint">Organize in collections</small>
    {collections.length?collections.map(c=><button key={c.id} type="button" disabled={busy}
     className={"quick-bookmark-choice"+(item.collection_ids.includes(c.id)?" is-selected":"")}
     onClick={e=>{e.stopPropagation();run(()=>onAssign(item,c.id))}}>
      <span aria-hidden="true">{item.collection_ids.includes(c.id)?"✓":"+"}</span>
      <span>{c.name}</span>
     </button>):<small className="quick-bookmark-hint">Create a collection from Saved.</small>}
    <button type="button" className="quick-bookmark-remove" disabled={busy} onClick={remove}>Remove bookmark</button>
   </div>,document.body)}
  {error&&<span role="alert" className="quick-bookmark-error">{error}</span>}
 </div>;
}
