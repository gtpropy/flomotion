/**
 * The live view: one self-contained page (no build step, no network). The script avoids template literals so it
 * can live inside this String.raw template.
 */
export const PAGE_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>flomotion live view</title>
<style>
:root{
  --bg:#0e1017;--panel:#161925;--panel2:#1c2030;--line:#2a2f45;--text:#eceef6;--muted:#9097b0;
  --accent:#7c8cff;--ok:#3ddc97;--warn:#ffb454;--bad:#ff6b7a;--write:#7c8cff;--check:#34d3c8;--asset:#ffb454;--render:#ff7ab6;--read:#7d849c;
  --radius:12px;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
@media (prefers-color-scheme: light){
  :root{--bg:#f3f4f9;--panel:#ffffff;--panel2:#f0f2f8;--line:#dcdfec;--text:#161827;--muted:#5d6480;--accent:#4b5cff;--ok:#16915c;--warn:#b9650a;--bad:#d6293e;--write:#4b5cff;--check:#0b8f86;--asset:#b9650a;--render:#c42d78;--read:#6a7190}
}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--text);font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;flex-direction:column;min-height:100vh}
header{display:flex;align-items:center;gap:14px;padding:10px 18px;border-bottom:1px solid var(--line);background:var(--panel);position:sticky;top:0;z-index:5}
.brand{font-weight:700;letter-spacing:.02em}
.brand b{color:var(--accent)}
.proj{color:var(--muted);font-family:var(--mono);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.sp{flex:1}
.status{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted)}
.dot{width:9px;height:9px;border-radius:50%;background:var(--read);flex:none}
.dot.live{background:var(--ok);box-shadow:0 0 0 0 var(--ok);animation:pulse 1.4s infinite}
.dot.off{background:var(--bad)}
@keyframes pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ok) 60%,transparent)}100%{box-shadow:0 0 0 9px transparent}}
main{display:grid;grid-template-columns:minmax(260px,330px) minmax(0,1fr) minmax(300px,400px);gap:14px;padding:14px 18px;flex:1;min-height:0}
@media (max-width:1100px){main{grid-template-columns:1fr}}
.col{display:flex;flex-direction:column;gap:14px;min-width:0}
.card{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:14px;min-width:0}
.card h2{margin:0 0 10px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);font-weight:600;display:flex;align-items:center;gap:8px}
.card h2 .n{margin-left:auto;font-weight:500;letter-spacing:0;text-transform:none}
.empty{color:var(--muted);font-size:13px;padding:6px 0}
/* progress */
.steps{list-style:none;margin:0;padding:0;display:grid;gap:2px}
.steps li{display:flex;gap:10px;align-items:flex-start;padding:5px 0}
.ic{width:18px;height:18px;border-radius:50%;border:2px solid var(--line);flex:none;margin-top:1px;display:grid;place-items:center;font-size:11px;font-weight:700;color:var(--panel)}
.steps .done .ic{background:var(--ok);border-color:var(--ok)}
.steps .active .ic{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 25%,transparent)}
.steps .bad .ic{background:var(--bad);border-color:var(--bad)}
.steps .t{font-weight:600}
.steps .d{color:var(--muted);font-size:12px}
.steps .pending .t{color:var(--muted);font-weight:500}
/* activity */
.feed{list-style:none;margin:0;padding:0;display:grid;gap:8px;max-height:calc(100vh - 430px);min-height:180px;overflow:auto}
.ev{border:1px solid var(--line);border-left:3px solid var(--read);border-radius:8px;padding:8px 10px;background:var(--panel2)}
.ev.write{border-left-color:var(--write)}.ev.check{border-left-color:var(--check)}.ev.asset{border-left-color:var(--asset)}.ev.render{border-left-color:var(--render)}
.ev.fail{border-color:color-mix(in srgb,var(--bad) 55%,var(--line));border-left-color:var(--bad)}
.ev.fresh{animation:fresh 1.6s ease-out}
@keyframes fresh{from{background:color-mix(in srgb,var(--accent) 28%,var(--panel2))}to{background:var(--panel2)}}
.ev .top{display:flex;gap:8px;align-items:center}
.chip{font:600 11px var(--mono);padding:2px 7px;border-radius:999px;background:color-mix(in srgb,var(--read) 22%,transparent);color:var(--text)}
.ev.write .chip{background:color-mix(in srgb,var(--write) 24%,transparent)}.ev.check .chip{background:color-mix(in srgb,var(--check) 24%,transparent)}.ev.asset .chip{background:color-mix(in srgb,var(--asset) 24%,transparent)}.ev.render .chip{background:color-mix(in srgb,var(--render) 24%,transparent)}.ev.fail .chip{background:color-mix(in srgb,var(--bad) 28%,transparent)}
.ev .when{margin-left:auto;color:var(--muted);font-size:12px;white-space:nowrap}
.ev .sum{margin-top:4px;word-break:break-word}
.ev details{margin-top:4px;color:var(--muted);font:12px var(--mono)}
.ev details summary{cursor:pointer;font-family:inherit}
.ev pre{margin:4px 0 0;white-space:pre-wrap;word-break:break-all}
/* preview */
.stage{display:grid;place-items:center;background:var(--panel2);border-radius:10px;padding:12px;min-height:300px;position:relative}
.frame{position:relative;background:#000;border-radius:8px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,.35)}
.frame img{display:block;width:100%;height:100%;object-fit:contain}
.frame .busy{position:absolute;inset:0;display:grid;place-items:center;background:rgba(10,12,20,.55);color:#fff;font-size:13px;gap:8px;text-align:center;padding:16px}
.spin{width:26px;height:26px;border:3px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 8px}
@keyframes spin{to{transform:rotate(360deg)}}
.err{color:var(--bad);font-size:13px;max-width:420px;text-align:center}
.ctl{display:flex;gap:10px;align-items:center;margin-top:10px}
.ctl input[type=range]{flex:1;accent-color:var(--accent)}
.ctl .tm{font:12px var(--mono);color:var(--muted);min-width:96px;text-align:right}
button{background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:5px 10px;font:inherit;cursor:pointer}
button:hover{border-color:var(--accent)}
button.primary{background:var(--accent);border-color:var(--accent);color:#fff}
.thumbs{display:flex;gap:8px;margin-top:10px;overflow:auto;padding-bottom:4px}
.thumbs img{height:84px;border-radius:6px;border:1px solid var(--line);cursor:zoom-in;flex:none}
.note{font-size:12px;color:var(--muted);margin-top:6px}
/* timeline */
.tl{position:relative;margin-top:2px}
.ruler{height:18px;position:relative;margin-left:62px;color:var(--muted);font:11px var(--mono)}
.ruler span{position:absolute;transform:translateX(-50%)}
.trk{display:grid;grid-template-columns:54px 1fr;align-items:center;gap:8px;margin-top:6px}
.trk .nm{font:11px var(--mono);color:var(--muted);overflow:hidden;text-overflow:ellipsis}
.lane{position:relative;height:30px;background:var(--panel2);border-radius:6px;overflow:hidden}
.bar{position:absolute;top:3px;bottom:3px;border-radius:5px;background:color-mix(in srgb,var(--accent) 38%,var(--panel2));border:1px solid color-mix(in srgb,var(--accent) 70%,transparent);font:11px/22px var(--mono);padding:0 6px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;cursor:pointer}
.bar.sel{background:var(--accent);color:#fff}
.bar.t-Scene{background:color-mix(in srgb,var(--write) 34%,var(--panel2))}
.bar.t-Circle,.bar.t-Rect{background:color-mix(in srgb,var(--render) 32%,var(--panel2));border-color:var(--render)}
.bar.t-Audio,.bar.t-Voiceover{background:color-mix(in srgb,var(--asset) 32%,var(--panel2));border-color:var(--asset)}
.mk{position:absolute;top:0;bottom:0;width:2px;background:var(--warn)}
.playhead{position:absolute;top:0;bottom:0;width:2px;background:var(--ok);pointer-events:none;z-index:2}
.tlwrap{position:relative;margin-left:62px}
/* tabs */
.tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px}
.tab{padding:5px 8px;border-radius:8px;border:1px solid transparent;background:none;color:var(--muted)}
.tab.on{background:var(--panel2);border-color:var(--line);color:var(--text)}
.panel{max-height:calc(100vh - 190px);overflow:auto}
.tree{list-style:none;margin:0;padding-left:14px;border-left:1px solid var(--line)}
.tree.root{padding-left:0;border:0}
.node{display:flex;gap:8px;align-items:baseline;padding:2px 4px;border-radius:6px;cursor:pointer}
.node:hover{background:var(--panel2)}.node.sel{background:color-mix(in srgb,var(--accent) 28%,transparent)}
.node .ty{font-weight:600}.node .id{color:var(--accent);font-family:var(--mono);font-size:12px}.node .tm{margin-left:auto;color:var(--muted);font:11px var(--mono)}
pre.code{margin:0;font:12px/1.55 var(--mono);white-space:pre;overflow:auto}
.cl{display:block;padding:0 8px 0 0}
.cl .ln{display:inline-block;width:38px;text-align:right;color:var(--muted);margin-right:10px;user-select:none}
.cl.add{background:color-mix(in srgb,var(--ok) 20%,transparent)}
.cl.flash{background:color-mix(in srgb,var(--accent) 35%,transparent)}
.pill{font:600 11px var(--mono);padding:2px 7px;border-radius:999px;display:inline-block}
.pill.pass{background:color-mix(in srgb,var(--ok) 26%,transparent);color:var(--ok)}
.pill.fail{background:color-mix(in srgb,var(--bad) 26%,transparent);color:var(--bad)}
.pill.warn{background:color-mix(in srgb,var(--warn) 26%,transparent);color:var(--warn)}
.pill.manual,.pill.skipped{background:color-mix(in srgb,var(--read) 24%,transparent);color:var(--muted)}
.chk{padding:8px 0;border-bottom:1px solid var(--line)}
.chk .h{display:flex;gap:8px;align-items:center}.chk .d{color:var(--muted);font-size:12px;margin-top:3px}.chk .f{font-size:12px;margin-top:3px}
table{width:100%;border-collapse:collapse;font-size:12px}
td,th{text-align:left;padding:5px 6px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--muted);font-weight:600}
a{color:var(--accent)}
video{width:100%;border-radius:8px;background:#000;max-height:360px}
.hist{display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)}
.hist .id{font:12px var(--mono);color:var(--accent)}.hist .d{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lightbox{position:fixed;inset:0;background:rgba(5,6,10,.86);display:none;place-items:center;z-index:20;cursor:zoom-out}
.lightbox.on{display:grid}.lightbox img{max-width:94vw;max-height:94vh;border-radius:8px}
.toast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:var(--panel);border:1px solid var(--line);padding:8px 14px;border-radius:10px;z-index:30;display:none}
.toast.on{display:block}
/* storyboard board */
.strip{position:relative;height:34px;background:var(--panel2);border-radius:8px;margin:2px 0 12px;overflow:hidden}
.seg{position:absolute;top:3px;bottom:3px;border-radius:5px;border:1px solid color-mix(in srgb,var(--read) 60%,transparent);background:color-mix(in srgb,var(--read) 18%,var(--panel2));font:600 10px/26px var(--mono);text-align:center;color:var(--muted);cursor:pointer;overflow:hidden;white-space:nowrap}
.seg.built{background:color-mix(in srgb,var(--ok) 28%,var(--panel2));border-color:var(--ok);color:var(--text)}
.seg.active{background:color-mix(in srgb,var(--accent) 45%,var(--panel2));border-color:var(--accent);color:#fff}
.seg.now{outline:2px solid var(--warn)}
.bcard{border:1px solid var(--line);border-radius:10px;padding:9px 11px;margin-bottom:8px;background:var(--panel2)}
.bcard.now{border-color:var(--warn)}
.bcard .bh{display:flex;gap:8px;align-items:center;cursor:pointer}
.bcard .bh b{flex:1;min-width:0}
.bcard .bt{font:11px var(--mono);color:var(--muted)}
.bcard dl{margin:6px 0 0;display:grid;grid-template-columns:78px 1fr;gap:3px 8px;font-size:12px}
.bcard dt{color:var(--muted)}.bcard dd{margin:0;word-break:break-word}
.idea{display:flex;gap:8px;align-items:flex-start;padding:7px 9px;margin-bottom:6px;border-radius:9px;background:color-mix(in srgb,var(--warn) 14%,var(--panel2));border:1px solid color-mix(in srgb,var(--warn) 35%,var(--line))}
.idea.claude{background:color-mix(in srgb,var(--accent) 14%,var(--panel2));border-color:color-mix(in srgb,var(--accent) 40%,var(--line))}
.idea.done{opacity:.5;text-decoration:line-through}
.idea .from{margin-left:auto;font:600 10px var(--mono);color:var(--muted);text-transform:uppercase}
.addidea{display:flex;gap:8px;margin:6px 0 10px}
.addidea input{flex:1;min-width:0;background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:6px 9px;font:inherit}
.sec{margin:14px 0 6px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);font-weight:600}
</style>
</head>
<body>
<header>
  <div class="brand">flo<b>motion</b> <span style="color:var(--muted);font-weight:500">live view</span></div>
  <div class="proj" id="proj"></div>
  <div class="sp"></div>
  <div class="status" id="status"><span class="dot"></span><span>Connecting…</span></div>
  <div class="status" title="Connection to the local server"><span class="dot" id="conn"></span></div>
</header>
<main>
  <section class="col">
    <div class="card"><h2>Progress</h2><ol class="steps" id="steps"></ol></div>
    <div class="card"><h2>Claude's activity <span class="n" id="actn"></span></h2><ul class="feed" id="feed"></ul></div>
  </section>
  <section class="col">
    <div class="card">
      <h2>Preview <span class="n" id="size"></span></h2>
      <div class="stage"><div class="frame" id="frame"><img id="img" alt="Frame preview" style="visibility:hidden"><div class="busy" id="busy"><div><div class="spin"></div><div id="busytxt">Rendering…</div></div></div></div></div>
      <div class="ctl">
        <button id="prev" title="Back one frame">‹</button>
        <input type="range" id="scrub" min="0" max="1" step="0.01" value="0">
        <button id="next" title="Forward one frame">›</button>
        <span class="tm" id="tm">0.00 s</span>
      </div>
      <div class="note" id="pvnote">The preview renders the project as it is on disk, on demand. It refreshes when the file changes.</div>
      <div class="thumbs" id="thumbs"></div>
    </div>
    <div class="card"><h2>Timeline <span class="n" id="tln"></span></h2><div class="tl" id="tl"></div></div>
  </section>
  <section class="col">
    <div class="card">
      <div class="tabs" id="tabs"></div>
      <div class="panel" id="panel"></div>
    </div>
  </section>
</main>
<div class="lightbox" id="lb"><img id="lbimg" alt=""></div>
<div class="toast" id="toast"></div>
<script>
(function(){
"use strict";
var S=null, started=false, sel=null, time=0, tab="board", src=null, frameN=0, frameBusy=false, frameWant=null, lastProjectMtime=0, lastActT=0, seenAct={};
var $=function(id){return document.getElementById(id)};
function h(tag,attrs,kids){var e=document.createElement(tag);if(attrs)for(var k in attrs){if(k==="class")e.className=attrs[k];else if(k==="text")e.textContent=attrs[k];else if(k.slice(0,2)==="on")e.addEventListener(k.slice(2),attrs[k]);else e.setAttribute(k,attrs[k])}
  (kids||[]).forEach(function(c){if(c==null)return;e.appendChild(typeof c==="string"?document.createTextNode(c):c)});return e}
function ago(t){var s=Math.max(0,Math.round((Date.now()-t)/1000));if(s<5)return "just now";if(s<60)return s+"s ago";if(s<3600)return Math.floor(s/60)+" min ago";return Math.floor(s/3600)+" h ago"}
function fmt(t){return (Math.round(t*100)/100).toFixed(2)+" s"}
function toast(m){var t=$("toast");t.textContent=m;t.className="toast on";setTimeout(function(){t.className="toast"},2600)}
function cat(tool){
  if(/^(element_|effect_add|keyframe_set|edit|scene_write|align_to_voice|project_create|history_restore)/.test(tool))return "write";
  if(/^(lint|review|contact_sheet|frame_render|mix_preview)/.test(tool))return "check";
  if(/^(sound_|font_|voice_|transcribe)/.test(tool))return "asset";
  if(/^render/.test(tool))return "render";
  return "read"}
function api(p,o){return fetch(p,o).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j&&j.error?j.error.message:r.statusText);return j})})}

/* ---------- progress ---------- */
function steps(){
  var g={};S.gates.forEach(function(x){g[x.name]=x});
  var p=S.project, scenes=0, els=0;
  (function walk(n,d){if(!n)return;if(n.type==="Scene")scenes++;if(d>0)els++;(n.children||[]).forEach(function(c){walk(c,d+1)})})(p&&p.outline,0);
  var rv=S.review, drafts=S.renders.filter(function(r){return /-draft\.mp4$/.test(r.file)}), fin=S.renders.filter(function(r){return /-final\.mp4$/.test(r.file)});
  var list=[
    {t:"Interview",d:g["brief.md"].exists?"brief.md written":"Waiting for the brief",ok:g["brief.md"].exists},
    {t:"Script",d:g["script.md"].exists?"script.md written":"Not written yet",ok:g["script.md"].exists},
    {t:"Style frames",d:S.frames.length||S.sheet?"Frames rendered":"No frames yet",ok:S.frames.length>0||!!S.sheet},
    {t:"Storyboard",d:g["storyboard.md"].exists?"storyboard.md written":"Not written yet",ok:g["storyboard.md"].exists},
    {t:"Build",d:scenes?scenes+" scene"+(scenes>1?"s":"")+", "+els+" elements":"No scenes yet",ok:els>3},
    {t:"Review",d:rv?(rv.pass?"Passed":"Failing: checks "+(rv.failing||[]).join(", "))+" · "+ago(rv.at):"Not run yet",ok:!!rv&&rv.pass,bad:!!rv&&!rv.pass},
    {t:"Draft render",d:drafts.length?drafts[0].file:"Not rendered",ok:drafts.length>0},
    {t:"Final render",d:fin.length?fin[0].file:"After the draft is approved",ok:fin.length>0}
  ];
  var firstOpen=list.findIndex(function(x){return !x.ok});
  var ol=$("steps");ol.textContent="";
  list.forEach(function(x,i){
    var cls=x.ok?"done":x.bad?"bad":i===firstOpen?"active":"pending";
    ol.appendChild(h("li",{class:cls},[h("span",{class:"ic",text:x.ok?"✓":x.bad?"!":""}),h("div",null,[h("div",{class:"t",text:x.t}),h("div",{class:"d",text:x.d})])]));
  });
}

/* ---------- activity ---------- */
function activity(){
  var ul=$("feed");ul.textContent="";
  var a=S.activity;$("actn").textContent=a.length?a.length+" calls":"";
  if(!a.length){ul.appendChild(h("li",{class:"empty",text:"Nothing yet. Tool calls appear here the moment Claude makes them."}));return}
  a.forEach(function(e){
    var key=e.t+"|"+e.tool, fresh=!seenAct[key]&&Object.keys(seenAct).length>0;seenAct[key]=1;
    var li=h("li",{class:"ev "+cat(e.tool)+(e.ok?"":" fail")+(fresh?" fresh":"")},[
      h("div",{class:"top"},[h("span",{class:"chip",text:e.tool}),h("span",{class:"when",text:ago(e.t)+" · "+e.ms+" ms"})]),
      h("div",{class:"sum",text:e.summary}),
      h("details",null,[h("summary",{text:"arguments"+(e.undo?" · undo "+e.undo:"")}),h("pre",{text:e.args})])]);
    ul.appendChild(li)});
  var last=a[0];lastActT=last.t;
}
function header(){
  var p=S.project;
  $("proj").textContent=p.exists?(p.name||"project")+"  ·  "+S.root:"No project in "+S.root+" yet";
  var st=$("status");st.textContent="";
  var last=S.activity[0], busy=last&&Date.now()-last.t<10000;
  st.appendChild(h("span",{class:"dot"+(busy?" live":"")}));
  st.appendChild(h("span",{text:busy?"Claude is working: "+last.tool:last?"Idle · last action "+ago(last.t):"Waiting for Claude"}));
}

/* ---------- preview ---------- */
function tlInfo(){return S.project&&S.project.timeline}
function setTime(t,reload){
  var tl=tlInfo();if(!tl)return;
  t=Math.max(0,Math.min(tl.duration-1/tl.fps,t));time=Math.round(t*tl.fps)/tl.fps;
  $("scrub").value=time;$("tm").textContent=fmt(time)+" / "+fmt(tl.duration);
  var ph=document.querySelector(".playhead");if(ph)ph.style.left=(time/tl.duration*100)+"%";
  var bp=document.querySelector(".bplay");if(bp)bp.style.left=(time/tl.duration*100)+"%";
  if(reload)loadFrame();
}
function loadFrame(){
  if(!S.project.exists||S.project.error&&!tlInfo())return;
  if(frameBusy){frameWant=time;return}
  frameBusy=true;frameWant=null;var n=++frameN, t=time;
  $("busy").style.display="grid";$("busytxt").textContent="Rendering "+fmt(t)+"…";
  var img=$("img"), probe=new Image();
  probe.onload=function(){if(n===frameN){img.src=probe.src;img.style.visibility="visible";$("busy").style.display="none"}done()};
  probe.onerror=function(){
    fetch("/api/frame?t="+t+"&v="+n).then(function(r){return r.json()}).then(function(j){
      $("busy").style.display="grid";$("busy").textContent="";$("busy").appendChild(h("div",{class:"err",text:"Preview unavailable: "+(j.error?j.error.message:"render failed")+(j.error&&j.error.fix?" ("+j.error.fix+")":"")}))
    }).catch(function(){}).then(done)};
  probe.src="/api/frame?t="+t+"&v="+n;
  function done(){frameBusy=false;if(frameWant!==null&&frameWant!==t)loadFrame()}
}
function sizeFrame(){var tl=tlInfo();if(!tl)return;var f=$("frame"),w=tl.size[0],hh=tl.size[1],st=f.parentNode,aw=Math.max(200,st.clientWidth-26),ah=Math.min(Math.round(window.innerHeight*0.62),720),k=Math.min(aw/w,ah/hh);f.style.width=Math.round(w*k)+"px";f.style.height=Math.round(hh*k)+"px";$("size").textContent=w+" × "+hh+" · "+tl.fps+" fps"}
function thumbs(){
  var t=$("thumbs");t.textContent="";var items=[];
  if(S.sheet)items.push({f:S.sheet.file,l:"Contact sheet",m:S.sheet.mtime});
  S.frames.slice(0,6).forEach(function(x){items.push({f:x.file,l:x.file.split("/").pop(),m:x.mtime})});
  if(!items.length){t.appendChild(h("div",{class:"note",text:"Frames Claude renders (frame_render, contact_sheet) show up here."}));return}
  items.forEach(function(x){var u="/files/"+x.f+"?m="+(x.m||"");t.appendChild(h("img",{src:u,title:x.l,alt:x.l,onclick:function(){$("lbimg").src=u;$("lb").className="lightbox on"}}))});
}

/* ---------- timeline ---------- */
function timeline(){
  var box=$("tl");box.textContent="";var tl=tlInfo();
  if(!tl){box.appendChild(h("div",{class:"empty",text:S.project.error?"The project file has a problem: "+S.project.error:"No project yet."}));return}
  $("tln").textContent=fmt(tl.duration);
  var D=tl.duration,wrap=h("div",{class:"tlwrap"});
  var ruler=h("div",{class:"ruler"});var step=D>40?10:D>16?5:2;
  for(var s=0;s<=D;s+=step)ruler.appendChild(h("span",{style:"left:"+(s/D*100)+"%",text:s+"s"}));
  wrap.appendChild(ruler);
  var wrapTracks=h("div",{style:"position:relative;margin-left:-62px"});
  tl.tracks.forEach(function(tr){
    var lane=h("div",{class:"lane"});
    tr.items.forEach(function(it){
      var b=h("div",{class:"bar t-"+it.type+(sel===it.id?" sel":""),style:"left:"+(it.start/D*100)+"%;width:"+Math.max(0.6,it.duration/D*100)+"%",title:it.type+" #"+it.id+" "+fmt(it.start)+" +"+fmt(it.duration),text:it.id,
        onclick:function(ev){ev.stopPropagation();select(it.id);setTime(it.start+Math.min(it.duration/2,1),true)}});
      lane.appendChild(b)});
    tl.markers.forEach(function(m){lane.appendChild(h("div",{class:"mk",title:(m.label||m.id)+" "+fmt(m.at),style:"left:"+(m.at/D*100)+"%"}))});
    wrapTracks.appendChild(h("div",{class:"trk"},[h("div",{class:"nm",text:tr.id+(tr.locked?" 🔒":"")}),lane]))});
  var ph=h("div",{class:"playhead",style:"left:"+(time/D*100)+"%"});
  var holder=h("div",{style:"position:relative"});
  holder.appendChild(wrapTracks);
  var overlay=h("div",{style:"position:absolute;top:0;bottom:0;left:62px;right:0"});overlay.appendChild(ph);holder.appendChild(overlay);
  holder.addEventListener("click",function(ev){var r=overlay.getBoundingClientRect();setTime((ev.clientX-r.left)/r.width*D,true)});
  wrap.appendChild(holder);box.appendChild(wrap);
}

/* ---------- right panel ---------- */
var TABS=[["board","Storyboard"],["outline","Outline"],["code","Code"],["review","Review"],["assets","Assets"],["renders","Renders"],["history","History"]];
function tabs(){var t=$("tabs");t.textContent="";TABS.forEach(function(x){t.appendChild(h("button",{class:"tab"+(tab===x[0]?" on":""),text:x[1],onclick:function(){tab=x[0];tabs();panel()}}))})}
function select(id){sel=id;timeline();if(tab==="outline")panel();if(tab==="code")flashCode(id)}
function tree(n,root){
  var ul=h("ul",{class:"tree"+(root?" root":"")});
  var tm=n.props&&(n.props.start!==undefined||n.props.duration!==undefined)?[n.props.start,n.props.duration].filter(function(x){return x!==undefined}).join(" + "):"";
  var li=h("li",null,[h("div",{class:"node"+(sel===n.id?" sel":""),onclick:function(){if(n.id)select(n.id)}},[h("span",{class:"ty",text:n.type}),n.id?h("span",{class:"id",text:"#"+n.id}):null,h("span",{class:"tm",text:tm})])]);
  if(n.children&&n.children.length){var c=h("ul",{class:"tree"});n.children.forEach(function(k){c.appendChild(tree(k,false))});li.appendChild(c)}
  else if(n.more)li.appendChild(h("div",{class:"note",text:"+"+n.more+" more"}));
  ul.appendChild(li);return ul}
function panel(){
  var p=$("panel");p.textContent="";
  if(tab==="outline"){
    if(S.project.error)p.appendChild(h("div",{class:"err",text:"The file does not load right now: "+S.project.error+". Claude may be mid-edit."}));
    if(!S.project.outline){p.appendChild(h("div",{class:"empty",text:"No project yet. Claude creates it with project_create."}));return}
    p.appendChild(tree(S.project.outline,true));
  }else if(tab==="code"){loadSource()}
  else if(tab==="board"){boardPanel(p)}
  else if(tab==="review"){reviewPanel(p)}
  else if(tab==="assets"){assetsPanel(p)}
  else if(tab==="renders"){rendersPanel(p)}
  else if(tab==="history"){historyPanel(p)}
}
function loadSource(){
  api("/api/source").then(function(j){
    src=j;var p=$("panel");if(tab!=="code")return;p.textContent="";
    var prev={};j.previous.split("\n").forEach(function(l){prev[l]=1});
    var lines=j.source.split("\n"),changed=0;
    var pre=h("pre",{class:"code"});
    lines.forEach(function(l,i){var add=j.previousId&&l.trim()&&!prev[l];if(add)changed++;
      pre.appendChild(h("span",{class:"cl"+(add?" add":""),"data-l":String(i)},[h("span",{class:"ln",text:String(i+1)}),document.createTextNode(l+"\n")]))});
    p.appendChild(h("div",{class:"note",text:j.previousId?changed+" line"+(changed===1?"":"s")+" new or changed since snapshot "+j.previousId+" (green).":"No earlier snapshot yet."}));
    p.appendChild(pre);if(sel)flashCode(sel);
  }).catch(function(e){$("panel").textContent=e.message})
}
function flashCode(id){if(!src)return;var lines=src.source.split("\n"),i=lines.findIndex(function(l){return l.indexOf('id="'+id+'"')>=0});if(i<0)return;
  var el=document.querySelector('.cl[data-l="'+i+'"]');if(!el)return;el.classList.add("flash");el.scrollIntoView({block:"center"});setTimeout(function(){el.classList.remove("flash")},1800)}
function typing(){var a=document.activeElement;return !!(a&&a.tagName==="INPUT"&&a.type==="text"&&$("panel").contains(a))}
function sceneIds(){var ids={};(function walk(n){if(!n)return;if(n.type==="Scene"&&n.id)ids[n.id]=1;(n.children||[]).forEach(walk)})(S.project&&S.project.outline);return ids}
function beatStatus(b,ids){
  var built=b.scenes&&b.scenes.length&&b.scenes.every(function(x){return ids[x]});
  var recent=(S.activity||[]).filter(function(a){return Date.now()-a.t<90000});
  var active=b.scenes&&b.scenes.some(function(x){return recent.some(function(a){return (a.args||"").indexOf('"'+x+'"')>=0||(a.summary||"").indexOf("#"+x)>=0})});
  return active?"active":built?"built":"planned"}
function boardPanel(p){
  var B=S.board||{beats:[],ideas:[],intro:""},tl=tlInfo(),ids=sceneIds();
  var dur=tl?tl.duration:B.beats.reduce(function(m,b){return Math.max(m,b.end||0)},0)||30;
  if(B.title)p.appendChild(h("div",{style:"font-weight:700;margin-bottom:2px",text:B.title}));
  if(B.intro)p.appendChild(h("div",{class:"note",style:"margin:0 0 8px;white-space:pre-wrap",text:B.intro}));
  if(!B.beats.length){
    p.appendChild(h("div",{class:"empty",text:"No storyboard yet. Claude writes storyboard.md: one ## heading per beat (## 1. Hook · 0–3.3 s) with - Voice, - On screen, - Motion, - Sound and - Scene lines. Add your ideas below and Claude will read them."}));
  }else{
    var cur=time,strip=h("div",{class:"strip"});
    B.beats.forEach(function(b){if(b.start===undefined||b.end===undefined)return;
      var st=beatStatus(b,ids),now=cur>=b.start&&cur<b.end;
      strip.appendChild(h("div",{class:"seg "+st+(now?" now":""),title:b.n+". "+b.title+" ("+st+")",style:"left:"+(b.start/dur*100)+"%;width:"+Math.max(1.5,(b.end-b.start)/dur*100-0.4)+"%",text:String(b.n),onclick:function(){setTime(b.start,true)}}))});
    strip.appendChild(h("div",{class:"playhead bplay",style:"left:"+(Math.min(cur,dur)/dur*100)+"%"}));
    p.appendChild(strip);
    var built=0,active=0;
    B.beats.forEach(function(b){var st=beatStatus(b,ids);if(st==="built")built++;if(st==="active")active++});
    p.appendChild(h("div",{class:"note",style:"margin:-6px 0 10px",text:built+" of "+B.beats.length+" beats built"+(active?" · Claude is working on "+active:"")+" · click a beat to jump the preview"}));
    B.beats.forEach(function(b){
      var st=beatStatus(b,ids),now=cur>=(b.start||0)&&cur<(b.end===undefined?0:b.end);
      var dl=h("dl");
      [["block","Block"],["voice","Voice"],["on screen","On screen"],["motion","Motion"],["sound","Sound"],["why","Why it works"],["scene","Scene"]].forEach(function(k){
        if(b.fields[k[0]]){dl.appendChild(h("dt",{text:k[1]}));dl.appendChild(h("dd",{text:b.fields[k[0]]}))}});
      p.appendChild(h("div",{class:"bcard"+(now?" now":"")},[
        h("div",{class:"bh",onclick:function(){if(b.start!==undefined)setTime(b.start,true)}},[h("span",{class:"pill "+(st==="built"?"pass":st==="active"?"warn":"manual"),text:st}),h("b",{text:b.n+". "+b.title}),h("span",{class:"bt",text:b.start!==undefined?fmt(b.start)+" – "+fmt(b.end):""})]),dl]))});
  }
  p.appendChild(h("div",{class:"sec",text:"Ideas (you and Claude)"}));
  var inp=h("input",{type:"text",placeholder:"Add an idea for Claude…",maxlength:"300"});
  function add(){var t=inp.value.trim();if(!t)return;fetch("/api/board/idea",{method:"POST",headers:{"content-type":"application/json","x-flomotion-ui":"1"},body:JSON.stringify({text:t})}).then(function(r){return r.json()}).then(function(j){if(j.error)throw new Error(j.error.message);inp.value="";toast("Idea saved to ideas.md");refresh()}).catch(function(x){toast(x.message)})}
  inp.addEventListener("keydown",function(e){if(e.key==="Enter")add()});
  p.appendChild(h("div",{class:"addidea"},[inp,h("button",{class:"primary",text:"Add",onclick:add})]));
  if(!B.ideas.length)p.appendChild(h("div",{class:"empty",text:"No ideas yet. Notes land in ideas.md, so Claude reads them like any other file."}));
  B.ideas.forEach(function(i){
    p.appendChild(h("div",{class:"idea "+i.from+(i.done?" done":"")},[
      h("input",{type:"checkbox",title:"Tick when used or dropped",onchange:function(){fetch("/api/board/idea/toggle",{method:"POST",headers:{"content-type":"application/json","x-flomotion-ui":"1"},body:JSON.stringify({index:i.index})}).then(function(){refresh()})}}),
      h("span",{text:i.text}),h("span",{class:"from",text:i.from})]));
  });
  var boxes=p.querySelectorAll(".idea input[type=checkbox]");B.ideas.forEach(function(i,k){if(boxes[k])boxes[k].checked=i.done});
}
function reviewPanel(p){
  var r=S.review;
  if(!r){p.appendChild(h("div",{class:"empty",text:"No review yet. Claude runs review before it shows a draft: 17 checks, a contact sheet, and a second look at the frames."}));return}
  p.appendChild(h("div",{class:"hist"},[h("span",{class:"pill "+(r.pass?"pass":"fail"),text:r.pass?"no failing checks":"failing: "+(r.failing||[]).join(", ")}),h("span",{class:"d",text:"warnings: "+((r.warnings||[]).join(", ")||"none")+" · needs eyes: "+((r.needsEyes||[]).join(", ")||"none")}),h("span",{class:"note",text:ago(r.at)})]));
  (r.checks||[]).forEach(function(c){
    p.appendChild(h("div",{class:"chk"},[h("div",{class:"h"},[h("span",{class:"pill "+c.status,text:c.status}),h("b",{text:c.n+". "+c.title})]),h("div",{class:"d",text:c.detail}),(c.status==="fail"||c.status==="warn")&&c.fix?h("div",{class:"f",text:"Fix: "+c.fix}):null]))});
  if(r.contactSheet)p.appendChild(h("img",{src:"/files/"+r.contactSheet+"?m="+r.at,style:"width:100%;border-radius:8px;margin-top:10px;cursor:zoom-in",alt:"Contact sheet",onclick:function(){$("lbimg").src="/files/"+r.contactSheet+"?m="+r.at;$("lb").className="lightbox on"}}));
}
function assetsPanel(p){
  var L=S.ledger;if(!L.length){p.appendChild(h("div",{class:"empty",text:"Nothing fetched yet. Sounds, fonts and voices Claude gets are recorded here with their licence."}));return}
  ["sound","font","voice","image","model","video"].forEach(function(k){
    var rows=L.filter(function(e){return e.kind===k});if(!rows.length)return;
    p.appendChild(h("h2",{text:k+"s ("+rows.length+")",style:"margin:12px 0 6px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)"}));
    var t=h("table",null,[h("tr",null,[h("th",{text:"Name"}),h("th",{text:"Licence"}),h("th",{text:k==="sound"?"Peak / length":"Source"})])]);
    rows.forEach(function(e){
      var pk=e.peak&&typeof e.peak==="object"?Object.keys(e.peak).filter(function(x){return x!=="main"}).map(function(x){return x+" "+e.peak[x]+"s"}).join(", ")||e.peak.main+"s":(e.peak!==undefined?e.peak+"s":"");
      t.appendChild(h("tr",null,[h("td",null,[e.url?h("a",{href:e.url,target:"_blank",rel:"noopener",text:e.title||e.family||e.id}):document.createTextNode(e.title||e.family||e.id),e.author?h("div",{class:"note",text:"by "+e.author}):null]),
        h("td",null,[h("span",{class:"pill "+(e.commercialOk?(e.attributionRequired?"warn":"pass"):"fail"),text:e.license}),e.attributionRequired?h("div",{class:"note",text:"credit required"}):null]),
        h("td",{text:k==="sound"?(pk?pk+" · ":"")+(e.duration?e.duration.toFixed(1)+" s":""):e.source})]))});
    p.appendChild(t)});
}
function rendersPanel(p){
  if(!S.renders.length){p.appendChild(h("div",{class:"empty",text:"No renders yet. The draft appears here when Claude renders it."}));return}
  S.renders.forEach(function(r){
    p.appendChild(h("div",{style:"margin-bottom:14px"},[h("div",{class:"hist"},[h("b",{text:r.file.split("/").pop()}),h("span",{class:"note",text:(r.bytes/1048576).toFixed(2)+" MB · "+ago(r.mtime)})]),
      h("video",{controls:"",preload:"metadata",src:"/files/"+r.file+"?m="+r.mtime}),
      h("div",{class:"note"},[r.credits?h("a",{href:"/files/"+r.credits.replace(/\.txt$/,".txt"),target:"_blank",text:"credits.txt"}):document.createTextNode("no credits needed"),document.createTextNode("  ·  "),r.licenses?h("a",{href:"/files/"+r.licenses,target:"_blank",text:"licenses.json"}):document.createTextNode("")])]))});
}
function historyPanel(p){
  if(!S.history.length){p.appendChild(h("div",{class:"empty",text:"Every write snapshots the file first. Snapshots appear here."}));return}
  S.history.forEach(function(e){
    p.appendChild(h("div",{class:"hist"},[h("span",{class:"id",text:e.id}),h("span",{class:"d",title:e.description,text:e.description}),h("span",{class:"note",text:ago(e.time*1000)}),
      h("button",{text:"Restore",title:"Put project.tsx back to this snapshot (the current file is snapshotted first)",onclick:function(){
        if(!confirm("Restore "+e.id+"?\n"+e.description+"\n\nThe current file is snapshotted first, so this can be undone."))return;
        fetch("/api/restore",{method:"POST",headers:{"content-type":"application/json","x-flomotion-ui":"1"},body:JSON.stringify({id:e.id})}).then(function(r){return r.json()}).then(function(j){if(j.error)throw new Error(j.error.message);toast("Restored "+e.id+". Undo with "+j.undoToken);refresh()}).catch(function(x){toast(x.message)})}})]))});
}

/* ---------- refresh ---------- */
var pending=null;
function refresh(){if(pending)return;pending=setTimeout(function(){pending=null;
  api("/api/state").then(function(s){
    var projChanged=!S||!S.project.exists||s.project.mtime!==lastProjectMtime;
    S=s;lastProjectMtime=s.project.mtime||0;
    header();steps();activity();timeline();thumbs();sizeFrame();
    var tl=tlInfo();if(tl){var sc=$("scrub");sc.max=tl.duration;sc.step=1/tl.fps;if(!started){started=true;var ht=/[#&]t=([\d.]+)/.exec(location.hash);time=Math.round((ht?Math.min(Number(ht[1]),tl.duration):Math.min(1.2,tl.duration/3))*tl.fps)/tl.fps;sc.value=time}$("tm").textContent=fmt(time)+" / "+fmt(tl.duration)}
    if((tab!=="code"||projChanged)&&!typing())panel();
    if(projChanged&&tl&&!s.project.error){clearTimeout(refresh.t);refresh.t=setTimeout(function(){loadFrame()},700)}
    $("conn").className="dot"}).catch(function(){$("conn").className="dot off"})},120)}
$("scrub").addEventListener("input",function(e){setTime(Number(e.target.value),false);clearTimeout(refresh.s);refresh.s=setTimeout(loadFrame,250)});
$("prev").addEventListener("click",function(){var tl=tlInfo();if(tl)setTime(time-1/tl.fps,true)});
$("next").addEventListener("click",function(){var tl=tlInfo();if(tl)setTime(time+1/tl.fps,true)});
$("lb").addEventListener("click",function(){$("lb").className="lightbox"});
document.addEventListener("keydown",function(e){if(e.key==="Escape")$("lb").className="lightbox";if(e.target.tagName==="INPUT")return;var tl=tlInfo();if(!tl)return;if(e.key==="ArrowRight")setTime(time+1/tl.fps,true);if(e.key==="ArrowLeft")setTime(time-1/tl.fps,true)});
window.addEventListener("resize",function(){if(S)sizeFrame()});
(function(){var m=/[#&]tab=(\w+)/.exec(location.hash);if(m&&TABS.some(function(t){return t[0]===m[1]}))tab=m[1]})();
tabs();
try{var es=new EventSource("/events");es.addEventListener("change",refresh);es.addEventListener("hello",function(){$("conn").className="dot";refresh()});es.onerror=function(){$("conn").className="dot off"}}catch(e){}
setInterval(function(){if(S){header()}},3000);
setInterval(refresh,6000);
refresh();
})();
</script>
</body>
</html>`;
