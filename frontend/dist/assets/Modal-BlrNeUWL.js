import{c as o,r as d,j as e}from"./index-99QHFb8d.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=o("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=o("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);function m({isOpen:a,onClose:t,title:s,children:n,maxWidth:c="max-w-lg"}){const l=d.useRef(null);return d.useEffect(()=>{if(!a)return;const r=i=>i.key==="Escape"&&t();return document.addEventListener("keydown",r),document.body.style.overflow="hidden",()=>{document.removeEventListener("keydown",r),document.body.style.overflow=""}},[a,t]),a?e.jsx("div",{ref:l,className:"fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm",onClick:r=>r.target===l.current&&t(),children:e.jsxs("div",{className:`relative w-full ${c} rounded-3xl border border-slate-200 bg-white shadow-xl`,role:"dialog","aria-modal":"true","aria-label":s,children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-slate-100 px-6 py-4",children:[e.jsx("h2",{className:"text-lg font-semibold text-slate-900",children:s}),e.jsx("button",{onClick:t,className:"rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors","aria-label":"Close modal",children:e.jsx(x,{size:18})})]}),e.jsx("div",{className:"max-h-[80vh] overflow-y-auto px-6 py-5",children:n})]})}):null}export{m as M,y as T,x as X};
