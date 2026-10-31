'use strict';
// Interactives for the later AC lessons: phase shifters and bridges (ac-analysis), resonance, three-phase and coupled circuits.
(function(){
const $=id=>document.getElementById(id),num=id=>Number($(id).value),fmt=x=>Math.abs(x)<1e-10?'0':Number(x.toPrecision(3)).toString(),R=String.raw,math=(id,t)=>{if($(id))katex.render(t,$(id),{displayMode:true,throwOnError:false})},TAU=2*Math.PI,rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI,wrap=a=>((a+180)%360+360)%360-180;
const ink='#213d3a',green='#087e78',purple='#8b59b5',coral='#cc694a',grey='#9aa99f';
const txt=(x,y,s,c='#526b64',a='middle',fs=14)=>`<text x="${x}" y="${y}" text-anchor="${a}" fill="${c}" font-size="${fs}">${s}</text>`,line=(x,y,a,b,c='#d8e0d9',dash=false,w=2)=>`<path d="M${x} ${y}L${a} ${b}" fill="none" stroke="${c}" stroke-width="${w}" ${dash?'stroke-dasharray="5 4"':''}/>`;
const held={},NICE=[1,1.2,1.5,2,2.5,3,4,5,6,8,10],nice=x=>{if(!(x>0))return 0;const m=10**Math.floor(Math.log10(x));return NICE.find(k=>k*m>=x*(1-1e-9))*m};
// Axes stay fixed while sliders move: a held range only grows to fit the data, and resets when its key changes or the data shrinks below 1/shrink of it.
function hold(id,key,lo,hi,shrink=1e9){let h=held[id];if(h&&h.key===key&&(hi-lo)*shrink>=h.hi-h.lo){if(lo>=h.lo&&hi<=h.hi)return h;lo=Math.min(lo,h.lo);hi=Math.max(hi,h.hi)}return held[id]={key,lo:-nice(-lo),hi:nice(hi)}}
const samples=(fn,lo,hi,n=600)=>Array.from({length:n+1},(_,i)=>{const x=lo+(hi-lo)*i/n;return[x,fn(x)]});
// Complex numbers as {r,i}
const cx=(r,i=0)=>({r,i}),cadd=(a,b)=>cx(a.r+b.r,a.i+b.i),csub=(a,b)=>cx(a.r-b.r,a.i-b.i),cmul=(a,b)=>cx(a.r*b.r-a.i*b.i,a.r*b.i+a.i*b.r),cdiv=(a,b)=>{const q=b.r*b.r+b.i*b.i;return cx((a.r*b.r+a.i*b.i)/q,(a.i*b.r-a.r*b.i)/q)},cabs=a=>Math.hypot(a.r,a.i),carg=a=>deg(Math.atan2(a.i,a.r)),cpol=(m,d)=>cx(m*Math.cos(rad(d)),m*Math.sin(rad(d))),csc=(a,k)=>cx(a.r*k,a.i*k);
const rect=a=>`${fmt(a.r)}${a.i<0?'-':'+'}j${fmt(Math.abs(a.i))}`,pol=a=>`${fmt(cabs(a))}\\angle{${fmt(carg(a))}^\\circ}`,si=(v,u)=>{const a=Math.abs(v);return a>=1e6?fmt(v/1e6)+' M'+u:a>=1e3?fmt(v/1e3)+' k'+u:a>=1||a===0?fmt(v)+' '+u:a>=1e-3?fmt(v*1e3)+' m'+u:fmt(v*1e6)+' µ'+u},tsi=(v,u)=>{const s=si(v,u),k=s.lastIndexOf(' ');return s.slice(0,k)+'\\ \\mathrm{'+s.slice(k+1)+'}'};
// Time or frequency plot on fixed axes. o: {marks:[{x,c}], dots:[{x,y,c}], hlines:[{y,c,label}], xticks:[x], xfmt:x=>label}
function chart(id,curves,[xlo,xhi],[ylo,yhi],label,o={}){const X=x=>60+(x-xlo)/(xhi-xlo)*560,Y=y=>240-(y-ylo)/(yhi-ylo)*205,xt=o.xticks||[0,1,2,3,4].map(i=>xlo+(xhi-xlo)*i/4),xf=o.xfmt||fmt;let h=`<defs><clipPath id="clip-${id}"><rect x="60" y="22" width="560" height="236"/></clipPath></defs>`;xt.forEach(x=>h+=line(X(x),35,X(x),240)+txt(X(x),262,xf(x)));for(let i=0;i<=4;i++){const y=ylo+(yhi-ylo)*i/4;h+=line(60,Y(y),620,Y(y),Math.abs(y)<1e-9?'#b9c7b5':'#d8e0d9')+txt(52,Y(y)+5,fmt(y),'#526b64','end')}h+=`<g clip-path="url(#clip-${id})">`;curves.forEach(c=>{const d=c.data.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1)).join('');h+=`<path d="${d}" fill="none" stroke="${c.c}" stroke-width="${c.w||2.5}" ${c.dash?'stroke-dasharray="6 5"':''}/>`});(o.hlines||[]).forEach(l=>h+=line(60,Y(l.y),620,Y(l.y),l.c,true,2));(o.marks||[]).forEach(m=>h+=line(X(m.x),35,X(m.x),240,m.c,true,1.5));(o.dots||[]).forEach(d=>h+=`<circle cx="${X(d.x)}" cy="${Y(d.y)}" r="5.5" fill="${d.c}"/>`);h+='</g>';(o.hlines||[]).forEach(l=>{if(l.label)h+=txt(66,Y(l.y)-7,l.label,l.c,'start',14)});$(id).innerHTML=h+txt(340,290,label)}
// Complex plane with fixed scale: lim is drawn 120 px from the centre. vectors: [{a,b,c,label,dash,w}]
function plane(id,vectors,lim,extra=''){const k=120/lim,X=x=>325+x*k,Y=y=>150-y*k;let h=line(165,150,485,150,'#9fb0a5')+line(325,15,325,285,'#9fb0a5')+txt(520,155,'real')+txt(325,12,'imaginary');[-1,-.5,.5,1].forEach(q=>{h+=line(X(q*lim),146,X(q*lim),154,'#9fb0a5')+txt(X(q*lim),172,fmt(q*lim),'#71837a','middle',12)+line(321,Y(q*lim),329,Y(q*lim),'#9fb0a5')+txt(316,Y(q*lim)+4,fmt(q*lim)+'j','#71837a','end',12)});h+=typeof extra==='function'?extra(X,Y,k):extra;vectors.forEach(v=>{const x0=X(v.a.r),y0=Y(v.a.i),x=X(v.b.r),y=Y(v.b.i),L=Math.hypot(x-x0,y-y0);if(L<1)return;const t=Math.atan2(y0-y,x0-x),w=v.w||2.6;h+=line(x0,y0,x,y,v.c,v.dash,w);if(!v.dash)h+=line(x,y,x+9*Math.cos(t+.4),y+9*Math.sin(t+.4),v.c,false,w)+line(x,y,x+9*Math.cos(t-.4),y+9*Math.sin(t-.4),v.c,false,w);if(v.label){const ux=(x-x0)/L,uy=(y-y0)/L;if(v.mid){const mx=(x+x0)/2,my=(y+y0)/2,s=uy*(mx-325)-ux*(my-150)<0?-1:1,nx=s*uy,ny=-s*ux;h+=txt(mx+18*nx,my+18*ny+5,v.label,v.c,nx<-.3?'end':nx>.3?'start':'middle',15)}else h+=txt(x+16*ux,y+16*uy+5,v.label,v.c,ux<-.3?'end':ux>.3?'start':'middle',15)}});$(id).innerHTML=h}
const O=cx(0),wire=(ids,fn)=>{ids.forEach(id=>{if($(id))$(id).addEventListener('input',fn)});fn()};

// ---------- AC analysis: the RC phase shifter
if($('psPlane')){function shifter(){const lead=$('psMode').value==='lead',x=10**num('psX'),Vs=cx(10),VC=cdiv(Vs,cx(1,x)),VR=csub(Vs,VC),Vo=lead?VR:VC,th=carg(Vo);$('psXVal').textContent=fmt(x);
plane('psPlane',[{a:O,b:Vs,c:grey,dash:true},{a:O,b:VR,c:green,label:'V_R',w:lead?3.6:2},{a:VR,b:Vs,c:coral,label:'V_C',w:lead?2:3.6}],12,(X,Y,k)=>`<path d="M${X(0)} ${Y(0)}A${5*k} ${5*k} 0 0 0 ${X(10)} ${Y(0)}" fill="none" stroke="#e3e9e0" stroke-width="2" stroke-dasharray="4 4"/>`+txt(X(10),Y(0)+22,'Vₛ','#71837a','middle',14));
chart('psWave',[{data:samples(u=>10*Math.cos(TAU*u),0,2),c:grey,dash:true},{data:samples(u=>cabs(Vo)*Math.cos(TAU*u+rad(th)),0,2),c:lead?green:coral}],[0,2],[-10,10],'time in periods; vₛ (grey dashed) and the output (solid) in V');
math('psEq',lead?R`\frac{\mathbf V_o}{\mathbf V_s}=\frac{R}{R+\frac1{j\omega C}}=\frac{j\omega RC}{1+j\omega RC}=\frac{j${fmt(x)}}{1+j${fmt(x)}}=${pol(csc(Vo,.1))}`:R`\frac{\mathbf V_o}{\mathbf V_s}=\frac{\frac1{j\omega C}}{R+\frac1{j\omega C}}=\frac{1}{1+j\omega RC}=\frac{1}{1+j${fmt(x)}}=${pol(csc(Vo,.1))}`);
$('psNote').textContent=`The output ${lead?'leads':'lags'} the source by ${fmt(Math.abs(th))}° and is ${fmt(cabs(Vo)/10)} times as big. ${lead?'Across R':'Across C'}, a single stage can never reach a full 90°.`}
wire(['psMode','psX'],shifter)}

// ---------- AC analysis: capacitance bridge. Z1 = R1, Z2 = R2 = 1 kΩ, Z3 = Cs = 1 µF, Zx = Cx (unknown); 10 V at 1 kHz.
if($('brR1')){const W=TAU*1000,R2=1000,Cs=1e-6,list=[0.47,0.68,1,1.5,2.2,3.3,4.7],Zc=c=>cx(0,-1/(W*c));let Cx=2.2e-6;
const vd=r1=>cabs(csub(csc(cdiv(cx(R2),cx(r1+R2)),10),csc(cdiv(Zc(Cx),cadd(Zc(Cs),Zc(Cx))),10)));
function bridge(){const R1=num('brR1'),V=vd(R1),f=Math.max(0,Math.min(1,(Math.log10(Math.max(V,1e-4))+3)/4)),ok=V<0.01;
$('brMeter').innerHTML=`<rect x="40" y="40" width="570" height="34" rx="6" fill="#eef2ec"/><rect x="40" y="40" width="${(570*f).toFixed(1)}" height="34" rx="6" fill="${ok?green:coral}"/>`+txt(40,28,'detector reading |V_d|, log scale','#526b64','start',14)+['1 mV','10 mV','100 mV','1 V','10 V'].map((s,i)=>txt(40+570*i/4,96,s,'#71837a','middle',13)).join('')+txt(610,28,fmt(V)+' V',ok?green:coral,'end',16);
chart('brCurve',[{data:samples(r=>vd(r),100,5000,800),c:green}],[100,5000],[0,10],'R₁ / Ω; detector voltage |V_d| in V',{marks:[{x:R1,c:purple}],dots:[{x:R1,y:V,c:purple}]});
$('brStatus').textContent=ok?`Balanced! The detector reads almost zero, so Cx = (R₁/R₂)Cₛ = (${R1}/1000) × 1 µF = ${fmt(R1/1000)} µF.`:`Not balanced yet: ${fmt(V)} V across the detector. Keep turning R₁ to bring it to zero.`}
$('brNew').onclick=()=>{let c;do c=list[Math.floor(Math.random()*list.length)]*1e-6;while(c===Cx);Cx=c;$('brR1').value=1000;bridge()};wire(['brR1'],bridge)}

// ---------- Resonance: series and parallel RLC
if($('rsCurve')){function reson(){const par=$('rsMode').value==='parallel',Rv=10**num('rsR'),L=num('rsL')*1e-3,C=num('rsC')*1e-6,lw=num('rsW'),w=10**lw,w0=1/Math.sqrt(L*C),Q=par?w0*Rv*C:w0*L/Rv,B=w0/Q,w1=-B/2+Math.sqrt(B*B/4+w0*w0),w2=B/2+Math.sqrt(B*B/4+w0*w0),g=x=>{const v=10**x;return 1/Math.sqrt(1+Q*Q*(v/w0-w0/v)**2)};
$('rsRVal').textContent=si(Rv,'Ω');$('rsWVal').textContent=si(w,'rad/s');$('rsOut').textContent=par?'parallel: |V| ÷ its peak':'series: |I| ÷ its peak';
const marks=[{x:Math.log10(w0),c:ink},...[w1,w2].map(v=>({x:Math.log10(v),c:purple}))];
chart('rsCurve',[{data:samples(g,2.5,5.5,900),c:green}],[2.5,5.5],[0,1.2],'angular frequency ω / rad/s (log scale); '+(par?'|V| ÷ I_s R':'|I| ÷ (V_s/R)'),{xticks:[3,3.5,4,4.5,5],xfmt:x=>si(10**x,''),hlines:[{y:Math.SQRT1_2,c:coral,label:'half-power level, 1/√2'}],marks,dots:[{x:lw,y:g(lw),c:purple}]});
let vec,lim,unit;if(!par){const Z=cx(Rv,w*L-1/(w*C)),I=cdiv(cx(10),Z),VR=csc(I,Rv),VL=cmul(I,cx(0,w*L)),VC=cmul(I,cx(0,-1/(w*C)));lim=hold('rsP','s',0,Math.max(10,cabs(VL),cabs(VC))*1.05,10).hi;vec=[{a:O,b:cx(10),c:grey,dash:true},{a:O,b:VR,c:green,label:'V_R'},{a:VR,b:cadd(VR,VL),c:coral,label:'V_L'},{a:cadd(VR,VL),b:cadd(cadd(VR,VL),VC),c:purple,label:'V_C'}];unit='V'}else{const Y=cx(1/Rv,w*C-1/(w*L)),V=cdiv(cx(10),Y),IR=csc(V,1/Rv),IL=cdiv(V,cx(0,w*L)),IC=cmul(V,cx(0,w*C));lim=hold('rsP','p',0,Math.max(10,cabs(IL),cabs(IC))*1.05,10).hi;vec=[{a:O,b:cx(10),c:grey,dash:true},{a:O,b:IR,c:green,label:'I_R'},{a:IR,b:cadd(IR,IL),c:coral,label:'I_L'},{a:cadd(IR,IL),b:cadd(cadd(IR,IL),IC),c:purple,label:'I_C'}];unit='mA'}
plane('rsPlane',vec,lim);$('rsPlane').innerHTML+=txt(20,288,`${par?'currents in mA, source Iₛ = 10 mA':'voltages in V, source Vₛ = 10 V'} (dashed grey)`,'#71837a','start',13);
math('rsEq',R`\begin{aligned}\omega_0&=\frac1{\sqrt{LC}}=${tsi(w0,'rad/s')},\qquad Q=${par?R`\omega_0RC`:R`\frac{\omega_0L}{R}`}=${fmt(Q)},\qquad B=${par?R`\frac1{RC}`:R`\frac RL`}=\frac{\omega_0}Q=${tsi(B,'rad/s')}\\\omega_1&=${tsi(w1,'rad/s')},\qquad \omega_2=${tsi(w2,'rad/s')}\qquad(\omega_1\omega_2=\omega_0^2)\end{aligned}`);
$('rsNote').textContent=Math.abs(Math.log10(w/w0))<.01?(par?`At resonance the L and C currents cancel. Each one is Q = ${fmt(Q)} times the source current.`:`At resonance the L and C voltages cancel. Each one is Q = ${fmt(Q)} times the source voltage.`):w<w0?(par?'Below resonance the inductor takes the larger current: the circuit looks inductive.':'Below resonance the capacitor takes the larger voltage: the circuit looks capacitive.'):(par?'Above resonance the capacitor takes the larger current: the circuit looks capacitive.':'Above resonance the inductor takes the larger voltage: the circuit looks inductive.')}
wire(['rsMode','rsR','rsL','rsC','rsW'],reson);$('rsTo0').onclick=()=>{$('rsW').value=Math.log10(1/Math.sqrt(num('rsL')*1e-3*num('rsC')*1e-6)).toFixed(3);reson()}}

// ---------- Three-phase: balanced phase voltages (325 V peak = 230 V rms)
const seq=()=>$('tpSeq')&&$('tpSeq').value==='acb'?[0,120,-120]:[0,-120,120],cols=[coral,ink,green],names=['a','b','c'];
if($('tpPlane')){let spin=null;function three(){const u=num('tpT'),ph=seq(),Vp=325,tips=ph.map(p=>cpol(Vp,deg(TAU*u)+p));
plane('tpPlane',tips.map((t,i)=>({a:O,b:t,c:cols[i],label:'v'+names[i]})),400,(X,Y,k)=>`<circle cx="325" cy="150" r="${Vp*k}" fill="none" stroke="#eef2ec" stroke-width="2"/>`+tips.map((t,i)=>`<circle cx="${X(t.r)}" cy="150" r="5" fill="${cols[i]}"/>`).join(''));
chart('tpWave',[...ph.map((p,i)=>({data:samples(x=>Vp*Math.cos(TAU*x+rad(p)),0,2),c:cols[i]})),{data:samples(x=>ph.reduce((s,p)=>s+Vp*Math.cos(TAU*x+rad(p)),0),0,2),c:purple,dash:true,w:3}],[0,2],[-400,400],'time in periods; phase voltages in V; dashed purple: their sum',{marks:[{x:u,c:purple}],dots:tips.map((t,i)=>({x:u,y:t.r,c:cols[i]}))});
math('tpEq',R`v_a+v_b+v_c=${fmt(tips[0].r)}${tips[1].r<0?'':'+'}${fmt(tips[1].r)}${tips[2].r<0?'':'+'}${fmt(tips[2].r)}=${fmt(Math.abs(tips.reduce((s,t)=>s+t.r,0))<1e-6?0:tips.reduce((s,t)=>s+t.r,0))}\ \mathrm V`)}
wire(['tpT','tpSeq'],three);$('tpPlay').onclick=()=>{if(spin){cancelAnimationFrame(spin);spin=null;$('tpPlay').textContent='▶ Turn the generator';return}$('tpPlay').textContent='Ⅱ Pause';let last=performance.now();const step=now=>{$('tpT').value=((num('tpT')+(now-last)/3000)%2).toFixed(3);last=now;three();spin=requestAnimationFrame(step)};spin=requestAnimationFrame(step)}}

// ---------- Three-phase: line voltages form a triangle between the phase-voltage tips (230 V rms)
if($('tpLine')){function lines(){const ph=seq(),V=ph.map(p=>cpol(230,p)),L=[[0,1],[1,2],[2,0]],pick=Number($('tpLinePick').value);
plane('tpLine',[...V.map((v,i)=>({a:O,b:v,c:cols[i],label:'V'+names[i]+'n',w:2})),...L.map(([p,q],i)=>({a:V[q],b:V[p],c:purple,label:i===pick?'V'+names[p]+names[q]:'',w:i===pick?3.6:1.6,dash:i!==pick,mid:true}))],450);
const [p,q]=L[pick],Vl=csub(V[p],V[q]);math('tpLineEq',R`\mathbf V_{${names[p]+names[q]}}=\mathbf V_{${names[p]}n}-\mathbf V_{${names[q]}n}=${pol(V[p])}-${pol(V[q])}=${pol(Vl)}\ \mathrm V\quad(=\sqrt3\times230)`)}
wire(['tpLinePick','tpSeq'],lines)}

// ---------- Three-phase: Y-connected load with an adjustable phase c
if($('tpLoad')){function load(){const Rv=num('tpR'),Xv=num('tpX'),Rc=num('tpRc'),V=seq().map(p=>cpol(230,p)),Z=[cx(Rv,Xv),cx(Rv,Xv),cx(Rc,Xv)],I=V.map((v,i)=>cdiv(v,Z[i])),IN=I.reduce(cadd,O),lim=hold('tpI','',0,Math.max(...I.map(cabs))*1.1,10).hi;
plane('tpLoad',[...I.map((c,i)=>({a:O,b:c,c:cols[i],label:'I'+names[i]})),{a:O,b:IN,c:purple,label:'I_N',w:3.6}],lim);$('tpLoad').innerHTML+=txt(20,288,'currents in A (rms)','#71837a','start',13);
math('tpLoadEq',R`\begin{aligned}\mathbf I_a&=\frac{\mathbf V_{an}}{Z_a}=${pol(I[0])},\quad \mathbf I_b=${pol(I[1])},\quad \mathbf I_c=${pol(I[2])}\ \mathrm A\\\mathbf I_N&=\mathbf I_a+\mathbf I_b+\mathbf I_c=${cabs(IN)<1e-9?'0':pol(IN)}\ \mathrm A\end{aligned}`);
$('tpLoadNote').textContent=Math.abs(Rc-Rv)<1e-9?'Balanced: the three currents are equal in size and 120° apart, so they add to zero. The neutral wire carries nothing.':`Unbalanced: phase c now draws a different current, so the three no longer cancel. The neutral wire carries ${fmt(cabs(IN))} A.`}
wire(['tpR','tpX','tpRc'],load);$('tpBalance').onclick=()=>{$('tpRc').value=$('tpR').value;load()}}

// ---------- Three-phase: instantaneous power of each phase and the total (230 V, 10 A rms per phase)
if($('tpPow')){function tpow(){const th=num('tpTh'),VI=2300,p=k=>x=>2*VI*Math.cos(TAU*x+rad(k))*Math.cos(TAU*x+rad(k-th))/1000,ph=[0,-120,120];
chart('tpPow',[...ph.map((k,i)=>({data:samples(p(k),0,2),c:cols[i],w:1.8})),{data:samples(x=>ph.reduce((s,k)=>s+p(k)(x),0),0,2),c:purple,w:3.4}],[0,2],[-2.5,7.5],'time in periods; power in kW: each phase (thin) and the total (purple)');
math('tpPowEq',R`p_a+p_b+p_c=3V_pI_p\cos\theta=3(230)(10)\cos(${th}^\circ)=${fmt(3*VI*Math.cos(rad(th))/1000)}\ \mathrm{kW}\quad\text{at every instant}`)}
wire(['tpTh'],tpow)}

// ---------- Coupled coils: the dot convention
if($('tfDotSvg')){function dots(){const top=$('tfDot').value==='top',s=top?'+':'-',coil=(x)=>`<path d="M${x} 70a14 14 0 0 1 0 28a14 14 0 0 1 0 28a14 14 0 0 1 0 28a14 14 0 0 1 0 28" fill="none" stroke="${ink}" stroke-width="3" transform="${x>300?`translate(${2*x} 0) scale(-1 1)`:''}"/>`;
$('tfDotSvg').innerHTML=`<path d="M120 70H60M120 182H60M480 70H560M480 182H560" stroke="${ink}" stroke-width="3"/>`+coil(120)+coil(480)+`<path d="M200 60V192M218 60V192M382 60V192M400 60V192" stroke="#9fb0a5" stroke-width="3"/><circle cx="98" cy="74" r="6" fill="${ink}"/><circle cx="502" cy="${top?74:178}" r="6" fill="${purple}"/><path d="M60 50H105m-10 -6l10 6-10 6" stroke="${green}" stroke-width="2.5" fill="none"/><path d="M560 50H515m10 -6l-10 6 10 6" stroke="${green}" stroke-width="2.5" fill="none"/>`+txt(82,40,'i₁ in',green,'middle',15)+txt(538,40,'i₂ in',green,'middle',15)+txt(40,130,'v₁',ink,'middle',17)+txt(585,130,'v₂',ink,'middle',17)+txt(300,40,'shared iron core','#71837a')+txt(300,230,top?'Both currents enter dotted ends: the mutual terms add (+M).':'i₂ enters the undotted end: the mutual terms subtract (−M).',top?green:coral,'middle',15)+txt(40,75,'+',ink)+txt(40,190,'−',ink)+txt(585,75,'+',ink)+txt(585,190,'−',ink);
math('tfDotEq',R`\mathbf V_1=j\omega L_1\mathbf I_1${s}j\omega M\mathbf I_2,\qquad \mathbf V_2=j\omega L_2\mathbf I_2${s}j\omega M\mathbf I_1`)}
wire(['tfDot'],dots)}

// ---------- Linear transformer: reflected impedance. L1 = L2 = 0.1 H, ω = 100 rad/s, load R_L.
if($('tfZin')){function refl(){const k=num('tfK'),RL=num('tfRL'),w=100,L1=.1,L2=.1,M=k*Math.sqrt(L1*L2),ZL1=cx(0,w*L1),ZR=cdiv(cx((w*M)**2),cx(RL,w*L2)),Zin=cadd(ZL1,ZR);
plane('tfZin',[{a:O,b:ZL1,c:coral,label:'jωL₁'},{a:ZL1,b:Zin,c:green,label:'Z_R'},{a:O,b:Zin,c:purple,label:'Z_in',w:3.4}],15);$('tfZin').innerHTML+=txt(20,288,'impedances in Ω','#71837a','start',13);
math('tfZinEq',R`\begin{aligned}M&=k\sqrt{L_1L_2}=${fmt(M)}\ \mathrm H,\qquad Z_R=\frac{\omega^2M^2}{R_L+j\omega L_2}=\frac{${fmt((w*M)**2)}}{${fmt(RL)}+j10}=${rect(ZR)}\ \Omega\\Z_{\rm in}&=j\omega L_1+Z_R=${rect(Zin)}=${pol(Zin)}\ \Omega\end{aligned}`)}
wire(['tfK','tfRL'],refl)}

// ---------- Ideal transformer: matching a 50 Ω source to a load. Vs = 100 V rms.
if($('tfMatch')){function match(){const n=10**num('tfN'),RL=10**num('tfRLi'),Rs=50,Vs=100,P=m=>{const Zi=RL/(m*m),I1=Vs/(Rs+Zi);return I1*I1*Zi},Zi=RL/(n*n),I1=Vs/(Rs+Zi),V1=I1*Zi,V2=n*V1,I2=I1/n,best=Math.sqrt(RL/Rs);
$('tfNVal').textContent=fmt(n);$('tfRLiVal').textContent=si(RL,'Ω');
chart('tfMatch',[{data:samples(x=>P(10**x),-1,1,600),c:green}],[-1,1],[0,60],'turns ratio n = N₂/N₁ (log scale); load power in W',{xticks:[-1,-.5,0,.5,1],xfmt:x=>fmt(10**x),hlines:[{y:50,c:ink,label:'most possible: Vₛ²/(4Rₛ) = 50 W'}],marks:[{x:Math.log10(best),c:coral},{x:Math.log10(n),c:purple}],dots:[{x:Math.log10(n),y:P(n),c:purple}]});
math('tfMatchEq',R`\begin{aligned}Z_{\rm in}&=\frac{R_L}{n^2}=\frac{${fmt(RL)}}{(${fmt(n)})^2}=${fmt(Zi)}\ \Omega,\qquad I_1=\frac{100}{50+${fmt(Zi)}}=${fmt(I1)}\ \mathrm A,\qquad V_1=${fmt(V1)}\ \mathrm V\\V_2&=nV_1=${fmt(V2)}\ \mathrm V,\qquad I_2=\frac{I_1}n=${fmt(I2)}\ \mathrm A,\qquad P=V_1I_1=V_2I_2=${fmt(V1*I1)}\ \mathrm W\end{aligned}`);
$('tfMatchNote').textContent=`Best ratio for this load: n = √(R_L/Rₛ) = ${fmt(best)} (orange line), which makes the load look like 50 Ω from the source.`}
wire(['tfN','tfRLi'],match);$('tfBest').onclick=()=>{$('tfN').value=Math.max(-1,Math.min(1,Math.log10(Math.sqrt(10**num('tfRLi')/50)))).toFixed(3);match()}}
})();
