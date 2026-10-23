import { CODECUT_NAME } from "../config.js";
import type { AudioEvent, SoundCue } from "../schema/render-types.js";
import type { ResolvedFont, ResolvedProject } from "../resolve/types.js";
import type { BakedChannel, StaticValue } from "./bake.js";
import { bakeHz } from "./bake.js";
import { buildIR } from "./ir.js";
import type { CompileOptions, CompileResult, IRLayer } from "./types.js";

const BASE_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{margin:0;overflow:hidden}
.cc-l{pointer-events:none}
.cc-xf{will-change:auto}
.cc-xf>*{max-width:none}`;

function fontFaceCss(fonts: ResolvedFont[]): string {
  const rules: string[] = [];
  for (const f of fonts) {
    if (f.source === "system") continue;
    for (const file of f.files) {
      const w = Array.isArray(file.weight)
        ? `${file.weight[0]} ${file.weight[1]}`
        : String(file.weight ?? 400);
      rules.push(
        `@font-face{font-family:${JSON.stringify(f.family)};src:url(${JSON.stringify(file.path)}) format(${JSON.stringify(file.format)});font-weight:${w};font-style:${file.style ?? "normal"};font-display:block${
          file.unicodeRange ? `;unicode-range:${file.unicodeRange}` : ""
        }}`,
      );
    }
  }
  return rules.join("\n");
}

const numFmt = (n: number) => String(Math.round(n * 10000) / 10000);

function collect(
  layer: IRLayer,
  acc: {
    css: string[];
    defs: string[];
    baked: BakedChannel[];
    statics: StaticValue[];
    sounds: SoundCue[];
    audio: AudioEvent[];
    ids: string[];
  },
) {
  if (layer.css) acc.css.push(layer.css);
  acc.defs.push(...layer.defs);
  acc.baked.push(...layer.baked);
  for (const [prop, value] of Object.entries(layer.statics)) {
    acc.statics.push({ target: `#${layer.id}-xf`, prop, value });
  }
  acc.statics.push(...layer.statics2);
  acc.sounds.push(...layer.sounds);
  acc.audio.push(...layer.audio);
  acc.ids.push(layer.id);
  layer.children.forEach((c) => collect(c, acc));
}

/** Allocate every layer incl. hidden ones (audio lives on hidden layers). */
function walkAll(layer: IRLayer, fn: (l: IRLayer) => void) {
  fn(layer);
  layer.children.forEach((c) => walkAll(c, fn));
}

const RUNTIME = `(function(){
  var G=window.gsap, S=window.__ccStatic||[], B=window.__ccBaked||[], D=window.__ccDur||1, els={};
  function el(sel){return els[sel]||(els[sel]=document.querySelector(sel));}
  function put(target,props){var e=el(target); if(!e)return; if(props.__text!==undefined){e.textContent=props.__text; delete props.__text;} var at=props.__attr; if(at){for(var k in at)e.setAttribute(k,at[k]); delete props.__attr;} if(Object.keys(props).length)G.set(e,props);}
  function groupBy(list){var m={};list.forEach(function(c){(m[c[0]]=m[c[0]]||[]).push(c);});return m;}
  var st=groupBy(S); Object.keys(st).forEach(function(t){var p={};st[t].forEach(function(c){assign(p,c[1],c[2],c[3]);});put(t,p);});
  function assign(p,prop,v,unit){
    if(prop==="text"){p.__text=v;return;}
    if(prop.indexOf("attr:")===0){(p.__attr=p.__attr||{})[prop.slice(5)]=v;return;}
    p[prop]=(unit&&typeof v==="number")?v+unit:v;
  }
  var bg=groupBy(B);
  function renderAt(t){
    Object.keys(bg).forEach(function(target){
      var p={};
      bg[target].forEach(function(c){
        var prop=c[1],t0=c[2],hz=c[3],a=c[4],unit=c[5];
        var x=(t-t0)*hz,n=a.length,v;
        if(x<=0)v=a[0]; else if(x>=n-1)v=a[n-1];
        else{var i=Math.floor(x),f=x-i,u=a[i],w=a[i+1];v=(typeof u==="number"&&typeof w==="number")?u+(w-u)*f:u;}
        assign(p,prop,v,unit);
      });
      put(target,p);
    });
  }
  var proxy={t:0};
  var tl=G.timeline({paused:true});
  tl.to(proxy,{t:D,duration:D,ease:"none",onUpdate:function(){renderAt(proxy.t);}},0);
  renderAt(0);
  window.__ccRenderAt=renderAt;
  window.__timelines=window.__timelines||{};
  window.__timelines[window.__ccId]=tl;
  tl.seek(0);
})();`;

/** Emit the HyperFrames-compatible index.html for a resolved project. */
export function compileProject(project: ResolvedProject, opts: CompileOptions = {}): CompileResult {
  const { root, issues, fontsUsed } = buildIR(project, opts);
  const comp = project.comp;
  const acc = {
    css: [] as string[],
    defs: [] as string[],
    baked: [] as BakedChannel[],
    statics: [] as StaticValue[],
    sounds: [] as SoundCue[],
    audio: [] as AudioEvent[],
    ids: [] as string[],
  };
  const all: IRLayer[] = [];
  walkAll(root, (l) => all.push(l));
  for (const l of all) {
    if (l.css) acc.css.push(l.css);
    acc.defs.push(...l.defs);
    acc.baked.push(...l.baked);
    for (const [prop, value] of Object.entries(l.statics))
      acc.statics.push({ target: `#${l.id}-xf`, prop, value });
    acc.statics.push(...l.statics2);
    acc.sounds.push(...l.sounds);
    acc.audio.push(...l.audio);
  }
  void collect;

  const staticRows = acc.statics.map((s) => [s.target, s.prop, s.value, s.unit ?? ""]);
  const bakedRows = acc.baked.map((b) => [b.target, b.prop, b.t0, b.hz, b.samples, b.unit ?? ""]);
  const gsap = opts.gsapPath ?? "vendor/gsap.min.js";
  const res =
    comp.width >= comp.height ? (comp.width === comp.height ? "square" : "landscape") : "portrait";
  const mix = opts.mix
    ? `<audio id="cc-mix" src="${opts.mix.src}" data-start="0" data-duration="${numFmt(opts.mix.duration ?? comp.duration)}" data-volume="1"></audio>`
    : "";
  const defs = acc.defs.length
    ? `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${acc.defs.join("")}</defs></svg>`
    : "";

  const html = `<!doctype html>
<html lang="en" data-resolution="${res}" data-generator="${CODECUT_NAME}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=${comp.width}, height=${comp.height}">
<script src="${gsap}"></script>
<style>
${BASE_CSS}
html,body{width:${comp.width}px;height:${comp.height}px;background:${comp.background}}
${fontFaceCss(comp.fonts)}
${acc.css.join("\n")}
</style>
</head>
<body>
${defs}
<div id="root" data-composition-id="${comp.id}" data-start="0" data-duration="${numFmt(comp.duration)}" data-width="${comp.width}" data-height="${comp.height}" style="position:absolute;left:0;top:0;width:${comp.width}px;height:${comp.height}px;background:${comp.background}">
${root.html}
${mix}
</div>
<script>
window.__ccId=${JSON.stringify(comp.id)};
window.__ccDur=${numFmt(comp.duration)};
window.__ccStatic=${JSON.stringify(staticRows)};
window.__ccBaked=${JSON.stringify(bakedRows)};
</script>
<script>
${RUNTIME}
</script>
</body>
</html>
`;

  const outline = outlineOf(root);
  void bakeHz;
  return {
    html,
    ir: root,
    audio: acc.audio,
    sounds: acc.sounds,
    issues,
    fontsUsed: [...fontsUsed],
    outline,
  };
}

function outlineOf(l: IRLayer): unknown {
  return {
    id: l.id,
    name: l.name,
    kind: l.kind,
    start: l.start,
    end: l.end,
    z: l.z,
    statics: l.statics,
    animated: [
      ...l.baked.map((b) => `${b.target} ${b.prop} @${b.t0} x${b.samples.length}`),
      ...l.statics2.map((s) => `${s.target} ${s.prop}=${s.value}`),
    ],
    children: l.children.map(outlineOf),
  };
}
