{const e=this,{window:t}=e,a="scripts",l="responseType",{Boolean:n,Error:o,Object:i,Promise:s,addEventListener:u,removeEventListener:r,chrome:c,performance:v}=e,{apply:d}=Reflect,g=(d.call.bind({}.hasOwnProperty),i.call.bind(i.call)),f=(c.app,"#"+a),m=(c.runtime.getURL("/").slice(0,-1),c.runtime.getManifest()),p=c.runtime.getURL(m.options_ui.page).split("#",1)[0];c.runtime.getURL(m.icons[16].replace("16.png","")),(()=>{var e,a={8017:(e,a,o)=>{"use strict";o(1871);var u=o(5313),r=(o(6711),o(5010)),c=o(6906),d=(o(3700),o(9994),o(6252)),m=o(2502),w=o(2262),h=o(9963),y=o(9824),b=o(6877),k=o(7458),x=o(8464),C=o(6115),_=o(7407),S=o(2477),U=o(2380),H=o(9518);const $={key:0,id:"wall"},D=["textContent"],L=["textContent"],z=(0,d._)("hr",null,null,-1),Z=["href","textContent"],T=(0,d._)("hr",null,null,-1),W={class:"frame-block"},j={class:"flex"},O=(0,d._)("div",{class:"image"},[(0,d._)("img",{src:"/public/images/icon128.png"})],-1),E={class:"info"},F=["textContent"],I=["textContent"],q=["textContent"],R={class:"flex"},P=["textContent"],Y=["href"],M=["textContent"],B=["textContent"],G=["data-collapsed"],N=["data-type","hidden"],A=["textContent"],J=["textContent"],K={key:0,class:"flex"},Q={class:"image flex"},X=["src"],V=["data-hotkey","textContent"],ee=["data-verb","data-hotkey","textContent"],te=["data-verb","data-hotkey","textContent"],ae=["data-hotkey","disabled","textContent"],le=["textContent"],ne=["textContent","title"],oe=["textContent"],ie={class:"frame-block flex-1 pos-rel"},se="file:///*drag-n-drop*/",ue={__name:"app",setup(e){const a=("m"===k.LY.ctrlcmd?"\u2318":"Ctrl-")+"Enter",o=(0,x.Z)({lifetime:9e3}),ue=(0,u.ag)("labelRunAtDefault"),re=(0,w.iH)(),ce=(0,w.iH)(),ve=(0,w.iH)(),de=(0,w.iH)(),ge=(0,w.iH)(),fe=(0,w.iH)({lineWrapping:!0}),me=(0,w.iH)(""),pe=(0,w.iH)({close:nt}),we=(0,w.iH)({}),he=(0,w.iH)(""),ye=(0,w.iH)(),be=(0,w.iH)((0,u.ag)("msgLoadingData")),ke=(0,w.iH)({}),xe=(0,w.iH)(!1),Ce=(0,w.iH)(!1),_e=(0,d.Fl)(()=>!(0,u.Q1)(ke.value.url)),Se=(0,w.iH)(),Ue=(0,w.iH)(!0),He=(0,w.iH)(""),$e=(0,w.iH)("..."),De=(0,w.iH)(!1),Le=(0,w.iH)(),ze=(0,w.iH)(!1),Ze=(0,w.iH)(),Te=(0,w.iH)(!1),We=(0,d.Fl)(()=>{var e,t,l;return{[_e.value&&null!=(e=de.value)&&e.value?"track":null!=(t=ve.value)&&t.value?"edit":null!=(l=ce.value)&&l.value?"close":0]:a}}),je=(0,d.Fl)(()=>{const e=Ze.value,t=e&&(0,u.t$)(e),a=null==e?void 0:e.meta.supportURL;return[t&&[t,"home",(0,u.ag)("labelHomepage")],a&&[a,"question",(0,u.ag)("buttonSupport")]].filter(n)});let Oe,Ee,Fe,Ie,qe,Re,Pe,Ye,Me,Be,Ge,Ne,Ae,Je,Ke,Qe;async function Xe(){await tt(),await at()&&(await s.all([rt(),(async()=>{let e=2;for(;!await lt()&&e;)await(0,u.dL)(3e3),e-=1})()]),xe.value&&(be.value=De.value?(0,u.ag)("labelReinstall"):(0,u.ag)("labelInstall")))}function Ve(){Me=[k.$J.register("ctrlcmd-enter",()=>{re.value.querySelector("[data-hotkey]").click()})],k.$J.enable()}async function et(e){ke.value.fs=xe.value=Te.value=!1,null==Pe||Pe(),await Qe,await(0,d.Y3)(),Oe=e,Ge=ke.value={url:e._url||se+e.name},ye.value=Le.value=He.value=Ne=Je=null,await Xe(),Me||Ve()}async function tt(e){var t;xe.value=!1;const a=Ie?await new s(ct):await it(Ge.url);if(null==a||e&&me.value===a)throw 0;const l=null==(t=ge.value)?void 0:t.$code.cm,n=l&&a.split(/\r?\n/);let o,i=-1;null==l||l.eachLine(({text:e})=>o=e!==n[++i]),me.value=a,(o||l&&i<n.length-1)&&(await(0,d.Y3)(),l.setCursor(i),l.scrollIntoView(null,l.display.lastWrapHeight/3))}async function at(){const e=await(0,u.gj)("ParseMeta",me.value),{meta:t,errors:a}=e,l=(0,u.iQ)(t,"name");if(document.title=`${l.slice(0,100)||a[0]}${l.length>100?"...":""} - ${qe||(qe=document.title)}`,$e.value=g(u.Hv,[l,t.version],", "),he.value=(0,u.iQ)(t,"description"),Se.value=i.assign(t?(0,U.zr)(t,["antifeature","grant","match","include","exclude","excludeMatch","compatible","connect"],e=>(null==e?void 0:e.map(e=>[e.replace(/^\W+/,"")||e,e]).sort(([e],[t])=>e<t?-1:e>t).map(([,e])=>e).join("\n"))||""):{},{"":(null==a?void 0:a.join("\n"))||""}),Ze.value={meta:t||{},custom:{},props:{}},t&&(Ae=[...new Set(t.require)],Ke=[...new Set(i.values(t.resources))]),l)return e;be.value=(0,u.ag)("msgInvalidScript")}async function lt(){if(Le.value||(0,S.d)(Ze.value).then(e=>{Le.value=e}),Ne&&(0,U.vZ)([...Ae].sort(),i.keys(Ne).sort())&&(0,U.vZ)([...Ke].sort(),i.keys(Je).sort()))return;Ne={},Je={};let e=0;const t=Ae.length+Ke.length,a=v.now(),l=()=>{v.now()-a>500&&(He.value=(0,u.ag)("msgLoadingDependency",[e,t]))},n=async(t,a,n)=>{const o=(0,u.mn)(t,Ge.url),i=`${+n}${t}`;try{we.value[i]=a[o]=await ot(o,{isBlob:n,useCache:!0}),e+=1,l()}catch(e){return we.value[i]=!1,t}},o=setTimeout(l,500),r=[...Ae.map(e=>n(e,Ne,!1)),...Ke.map(e=>n(e,Je,!0))],c=g(u.Hv,await s.all(r),"\n");if(clearTimeout(o),!c)return ye.value=null,xe.value=!0,He.value=null,!0;He.value=(0,u.ag)("msgErrorLoadingDependency"),ye.value=c}function nt(){(0,u.gj)("TabClose")}async function ot(e,{isBlob:t,useCache:a}={}){const n=t?`blob+${e}`:`text+${e}`;if(a&&o.has(n))return o.get(n);const i=await(0,u.WY)(e,{[l]:t?"blob":null}),s=t?await(0,u.LZ)(i):i.data;return a&&o.put(n,s),s}async function it(e){try{return Oe?await(await Oe.getFile()).text():Re&&await Re||await ot(e)}catch(t){throw He.value=(0,u.ag)("msgErrorLoadingData"),e}finally{Re=null}}async function st(e,t){const a=null==e?void 0:e.target.id,l="confirm"===a,n="+track"===a;if(n&&Te.value)null==Pe||Pe(!0);else{xe.value=!1;try{const{update:e}=await(0,u.gj)("ParseScript",{...t,code:me.value,url:Ge.url,from:Ge.from,require:Ne,cache:Je,reloadTab:r.Z.get("autoReloadTracked")}),o=(new Date).toLocaleTimeString(["fr"]),i=Ye||(Ye=o);He.value=`${e.message} ${i}${i===o?"":` --\x3e ${o}`}`,Ce.value=!0,(l?_e.value&&de.value.value:n)?(He.value=(0,u.ag)("trackEditsNote")+(Ge.ff>=68?" "+(0,u.ag)("installOptionTrackTooltip"):""),ut()):"+edit"===a?location.href=p+f+"/"+e.props.id:(l?ce.value.value:"+close"===a)&&nt()}catch(e){He.value=`${e}`,xe.value=!0}}}async function ut(){if(!Te.value&&_e.value&&Ce.value){for(Re=null,Te.value=!0;Te.value&&!await s.race([(0,u.dL)(500),Qe=new s(e=>{Pe=e})]);){try{await tt(!0);const e=await at();await lt(),await st(null,e),ze.value=!1}catch(e){}Pe()}Qe=Te.value=!1}}async function rt(){const{name:e,namespace:t}=Ze.value.meta||{},a=await(0,u.gj)("GetScript",{meta:{name:e,namespace:t}});De.value=!!a,ze.value=a&&me.value===await(0,u.gj)("GetScriptCode",a.props.id)}function ct(e){Fe=e,Ee||(Ee=browser.tabs.connect(Ge.tabId,{name:"FetchSelf"}),Ee.onMessage.addListener(e=>Fe(e)),Ee.onDisconnect.addListener(()=>{null==Pe||Pe(!0),Ee=null})),Ee.postMessage(null)}return(0,d.bv)(async()=>{const e=`confirm-${H.BC.paths[0]}`;Oe=t.fsh,i.defineProperty(t,"fsh",{set:et}),Ge=ke.value=Oe?{url:Oe._url||se+Oe.name}:await(0,u.gj)("CacheLoad",e),Ge?Ge.fs?ke.value.fs=(0,u.ag)("fileInstallBlocked").split(/<\d+>/):(Oe||(Ie=Ge.ff>=68&&Ge.url.startsWith("file:"),Re=(0,u.gj)("CachePop",Ge.url),Be=setInterval(u.gj,5e3,"CacheHit",{key:e})),await Xe(),Ve()):nt()}),(0,d.Jd)(()=>{var e;clearInterval(Be),null==(e=Me)||e.forEach(e=>e())}),(e,t)=>((0,d.wg)(),(0,d.iD)("div",{class:(0,m.C_)(["page-confirm frame flex flex-col h-screen",{reinstall:De.value}])},[ke.value.fs?((0,d.wg)(),(0,d.iD)("div",$,[(0,d._)("b",{textContent:(0,m.zw)(ke.value.fs[0])},null,8,D),(0,d._)("ol",null,[((0,d.wg)(!0),(0,d.iD)(d.HY,null,(0,d.Ko)(ke.value.fs.slice(1),(e,t)=>((0,d.wg)(),(0,d.iD)("li",{key:t,textContent:(0,m.zw)(e),class:"mt-1"},null,8,L))),128))]),z,(0,d._)("a",{class:"mt-1",href:(0,w.SU)(c.XB),textContent:(0,m.zw)((0,w.SU)(c.XB))},null,8,Z),T,(0,d.Wm)((0,w.SU)(_.Z),{name:"helpForLocalFile",label:(0,w.SU)(u.ag)("helpForLocalFile")},null,8,["label"])])):((0,d.wg)(),(0,d.iD)(d.HY,{key:1},[(0,d._)("div",W,[(0,d._)("div",j,[O,(0,d._)("div",E,[(0,d._)("h1",null,[(0,d._)("div",null,[(0,d._)("span",{textContent:(0,m.zw)(be.value)},null,8,F),ze.value?((0,d.wg)(),(0,d.iD)("span",{key:0,textContent:(0,m.zw)((0,w.SU)(u.ag)("msgSameCode")),style:{"font-weight":"normal"}},null,8,I)):(0,d.kq)("",!0)]),(0,d._)("div",{class:"ellipsis",textContent:(0,m.zw)($e.value)},null,8,q)]),(0,d._)("div",R,[(0,d.Wm)((0,w.SU)(y.Z),{content:(0,w.SU)(u.ag)("editNavCode"),class:"abs-center",placement:"right"},{default:(0,d.w5)(()=>[(0,d.Wm)((0,w.SU)(b.Z),{name:"code"})]),_:1},8,["content"]),(0,d._)("span",{class:"ellipsis",textContent:(0,m.zw)(ke.value.url?decodeURIComponent(ke.value.url):"...")},null,8,P)]),((0,d.wg)(!0),(0,d.iD)(d.HY,null,(0,d.Ko)(je.value,([e,t,a])=>((0,d.wg)(),(0,d.iD)("a",{key:t,class:"flex",target:"_blank",href:e},[(0,d.Wm)((0,w.SU)(y.Z),{content:a,class:"abs-center",placement:"right"},{default:(0,d.w5)(()=>[(0,d.Wm)((0,w.SU)(b.Z),{name:t},null,8,["name"])]),_:2},1032,["content"]),(0,d._)("span",{class:"ellipsis",textContent:(0,m.zw)(decodeURIComponent(e))},null,8,M)],8,Y))),128)),(0,d._)("p",{class:"descr",textContent:(0,m.zw)(he.value)},null,8,B),(0,d._)("div",{class:"lists flex flex-wrap","data-collapsed":!Ue.value},[(0,d._)("div",{class:"toggle abs-center",onClick:t[0]||(t[0]=e=>Ue.value=!Ue.value)},[Se.value?((0,d.wg)(),(0,d.j4)((0,w.SU)(y.Z),{key:0,content:(0,w.SU)(u.ag)("msgShowHide"),placement:"bottom",align:"left"},{default:(0,d.w5)(()=>[(0,d.Wm)((0,w.SU)(b.Z),{name:"info"})]),_:1},8,["content"])):(0,d.kq)("",!0)]),((0,d.wg)(!0),(0,d.iD)(d.HY,null,(0,d.Ko)(Se.value,(e,t)=>((0,d.wg)(),(0,d.iD)("dl",{key:t,"data-type":t,hidden:!e.length,tabindex:"0"},[(0,d._)("dt",{textContent:(0,m.zw)(t?`@${t}`:(0,w.SU)(u.ag)("genericError"))},null,8,A),(0,d._)("dd",{textContent:(0,m.zw)(e),class:"ellipsis"},null,8,J)],8,N))),128))],8,G)])]),Ze.value?((0,d.wg)(),(0,d.iD)("div",K,[(0,d._)("div",Q,[(0,d._)("img",{src:Le.value},null,8,X)]),(0,d._)("div",{class:"actions flex flex-wrap ml-1c",ref_key:"$buttons",ref:re},[(0,d._)("button",(0,d.dG)({id:"confirm","data-hotkey":We.value[0],textContent:(0,m.zw)(e._verb=De.value?(0,w.SU)(u.ag)("reinstall"):(0,w.SU)(u.ag)("install"))},e._bind={disabled:!xe.value,onclick:st}),null,16,V),(0,d._)("button",(0,d.dG)({id:"+close","data-verb":e._verb,"data-hotkey":We.value.close,textContent:(0,m.zw)((0,w.SU)(u.ag)("buttonClose"))},e._bind),null,16,ee),(0,d.Wm)((0,w.SU)(_.Z),{name:"closeAfterInstall",ref_key:"$close",ref:ce,class:(0,m.C_)(["btn-ghost",{dim:We.value.track||We.value.edit}]),title:(0,w.SU)(ue)},null,8,["class","title"]),(0,d._)("button",(0,d.dG)({id:"+edit","data-verb":e._verb,"data-hotkey":We.value.edit,textContent:(0,m.zw)((0,w.SU)(u.ag)("buttonEdit"))},e._bind),null,16,te),(0,d.Wm)((0,w.SU)(_.Z),{name:"editAfterInstall",ref_key:"$edit",ref:ve,class:(0,m.C_)(["btn-ghost",{dim:We.value.track}]),title:(0,w.SU)(ue)},null,8,["title","class"]),_e.value?((0,d.wg)(),(0,d.iD)(d.HY,{key:0},[(0,d._)("button",{id:"+track",onClick:st,"data-hotkey":We.value.track,disabled:!Te.value&&!xe.value&&!Ce.value,textContent:(0,m.zw)(Te.value?(0,w.SU)(u.ag)("stopTracking"):`\u271a ${(0,w.SU)(u.ag)("trackEdits")}`)},null,8,ae),(0,d.wy)((0,d.Wm)((0,w.SU)(_.Z),{name:"trackLocalFile",ref_key:"$track",ref:de,class:"btn-ghost",onChange:ut,title:(0,w.SU)(ue)},null,8,["title"]),[[h.F8,!Te.value]]),(0,d.wy)((0,d.Wm)((0,w.SU)(_.Z),{name:"autoReloadTracked"},{default:(0,d.w5)(()=>[(0,d.Wm)((0,w.SU)(y.Z),{content:(0,w.SU)(u.ag)("reloadTabTrackHint")},{default:(0,d.w5)(()=>[(0,d.Uk)((0,m.zw)((0,w.SU)(u.ag)("reloadTab")),1)]),_:1},8,["content"])]),_:1},512),[[h.F8,Te.value]])],64)):(0,d.kq)("",!0),(0,d._)("button",{textContent:(0,m.zw)((0,w.SU)(u.ag)("buttonClose")),onClick:nt},null,8,le),He.value?((0,d.wg)(),(0,d.iD)("div",{key:1,textContent:(0,m.zw)(He.value),title:ye.value,class:"status stretch-self flex center-items ml-2"},null,8,ne)):(0,d.kq)("",!0)],512)])):(0,d.kq)("",!0),ke.value.incognito?((0,d.wg)(),(0,d.iD)("div",{key:1,class:"incognito",textContent:(0,m.zw)((0,w.SU)(u.ag)("msgIncognitoChanges"))},null,8,oe)):(0,d.kq)("",!0)]),(0,d._)("div",ie,[Ze.value?((0,d.wg)(),(0,d.j4)((0,w.SU)(C.Z),{key:0,ref_key:"$externals",ref:ge,value:Ze.value,class:"abs-full","cm-options":fe.value,commands:pe.value,install:{code:me.value,deps:we.value,url:ke.value.url}},null,8,["value","cm-options","commands","install"])):(0,d.kq)("",!0)])],64))],2))}};document.title=`${(0,u.ag)("labelInstall")} - ${(0,u.ag)("extName")}`,r.Z.ready.then(()=>{(0,c.sY)(ue)})},6291:(e,t,a)=>{var l={"./arrow.svg":943,"./author.svg":7767,"./code.svg":4064,"./cog.svg":9640,"./command.svg":4507,"./filter.svg":5698,"./home.svg":7030,"./info.svg":6501,"./more.svg":8614,"./plus.svg":2996,"./question.svg":1902,"./refresh.svg":1694,"./search.svg":1112,"./toggle-off.svg":6817,"./toggle-on.svg":385,"./trash.svg":4289,"./undo.svg":8947};function n(e){var t=s(e);return a(t)}function s(e){if(!a.o(l,e)){var t=new o("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}return l[e]}n.keys=()=>i.keys(l),n.resolve=s,e.exports=n,n.id=6291}},u={};function r(e){var t=u[e];if(void 0!==t)return t.exports;var l=u[e]={exports:{}};return a[e].call(l.exports,l,l.exports,r),l.exports}r.m=a,e=[],r.O=(t,a,l,n)=>{if(!a){var o=1/0;for(v=0;v<e.length;v++){for(var[a,l,n]=e[v],s=!0,u=0;u<a.length;u++)(!1&n||o>=n)&&i.keys(r.O).every(e=>r.O[e](a[u]))?a.splice(u--,1):(s=!1,n<o&&(o=n));if(s){e.splice(v--,1);var c=l();void 0!==c&&(t=c)}}return t}n=n||0;for(var v=e.length;v>0&&e[v-1][2]>n;v--)e[v]=e[v-1];e[v]=[a,l,n]},r.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return r.d(t,{a:t}),t},r.d=(e,t)=>{for(var a in t)r.o(t,a)&&!r.o(e,a)&&i.defineProperty(e,a,{enumerable:!0,get:t[a]})},r.o=(e,t)=>i.prototype.hasOwnProperty.call(e,t),r.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&i.defineProperty(e,Symbol.toStringTag,{value:"Module"}),i.defineProperty(e,"__esModule",{value:!0})},r.j=47,(()=>{var e={47:0};r.O.j=t=>0===e[t];var t=(t,a)=>{var l,n,[o,i,s]=a,u=0;if(o.some(t=>0!==e[t])){for(l in i)r.o(i,l)&&(r.m[l]=i[l]);if(s)var c=s(r)}for(t&&t(a);u<o.length;u++)n=o[u],r.o(e,n)&&e[n]&&e[n][0](),e[n]=0;return r.O(c)},a=self.webpackChunkviolentmonkey=self.webpackChunkviolentmonkey||[];a.forEach(t.bind(null,0)),a.push=t.bind(null,a.push.bind(a))})();var c=r.O(void 0,[386,84],()=>r(8017));c=r.O(c)})()}