'use strict';
/* Ideal two-branch divider, coefficients in ascending powers of s. */
(function(root){
const add=(a,b)=>Array.from({length:Math.max(a.length,b.length)},(_,i)=>(a[i]||0)+(b[i]||0));
const mul=(a,b)=>{const c=Array(a.length+b.length-1).fill(0);a.forEach((x,i)=>b.forEach((y,j)=>c[i+j]+=x*y));return c};
function clean(a){while(a.length>1&&a.at(-1)===0)a.pop();return a}
const series=(a,b)=>({n:add(mul(a.n,b.d),mul(b.n,a.d)),d:mul(a.d,b.d)});
const parallel=(a,b)=>({n:mul(a.n,b.n),d:add(mul(a.n,b.d),mul(b.n,a.d))});
function impedance(c){if(!(c.v>0&&Number.isFinite(c.v)))throw Error('Every active component needs a finite, positive value.');return c.type==='R'?{n:[c.v],d:[1]}:c.type==='C'?{n:[1],d:[0,c.v]}:{n:[0,c.v],d:[1]}}
function branch(list,mode){if(!list.length)throw Error('Place at least one component in each branch. Empty branches are not treated as wires.');return list.map(impedance).reduce(mode==='parallel'?parallel:series)}
function model(list,modes){for(const t of ['R','C','L'])if(list.filter(c=>c.type===t).length>2)throw Error('Use at most two resistors, two capacitors and two inductors.');let z1=branch(list.filter(c=>c.branch===1),modes[0]),z2=branch(list.filter(c=>c.branch===2),modes[1]);let n=clean(mul(z2.n,z1.d)),d=clean(add(mul(z1.n,z2.d),mul(z2.n,z1.d)));while(n.length>1&&d.length>1&&n[0]===0&&d[0]===0){n.shift();d.shift()}let scale=d.find(x=>x!==0);n=n.map(x=>x/scale);d=d.map(x=>x/scale);return {n,d,z1,z2}}
function peval(p,w){let re=0,im=0;for(let k=p.length-1;k>=0;k--){let a=re;re=-im*w+p[k];im=a*w}return {re,im}}
function response(m,w){let a=peval(m.n,w),b=peval(m.d,w),q=b.re*b.re+b.im*b.im;if(!q)return {mag:NaN,phase:NaN,re:NaN,im:NaN};let re=(a.re*b.re+a.im*b.im)/q,im=(a.im*b.re-a.re*b.im)/q;return {re,im,mag:Math.hypot(re,im),phase:Math.atan2(im,re)*180/Math.PI}}
function crossings(m,reference,lo=10,hi=1e7){if(!(reference>0&&Number.isFinite(reference)))return [];const target=reference/Math.sqrt(2),out=[];let prev=lo,y=response(m,2*Math.PI*prev).mag-target;for(let i=1;i<=2400;i++){let f=lo*(hi/lo)**(i/2400),v=response(m,2*Math.PI*f).mag-target;if(Number.isFinite(v)&&Number.isFinite(y)&&y*v<0){let a=prev,b=f,ya=y;for(let j=0;j<55;j++){let c=Math.sqrt(a*b),yc=response(m,2*Math.PI*c).mag-target;if(ya*yc<=0)b=c;else{a=c;ya=yc}}out.push(Math.sqrt(a*b))}prev=f;y=v}return out}
function square(m,f,amplitude,t){if(m.d.length>2||m.n.length>2||!(m.d[0]>0&&m.d[1]>0))throw Error('Square-wave mode requires a stable first-order circuit. Use a sine wave for this configuration.');let tau=m.d[1]/m.d[0],k=m.n[0]/m.d[0],direct=(m.n[1]||0)/m.d[1],half=1/(2*f),e=Math.exp(-half/tau),q0=-amplitude*(1-e)/(1+e),phase=((t%(2*half))+2*half)%(2*half),positive=phase<half,local=positive?phase:phase-half,x=positive?amplitude:-amplitude,qStart=positive?q0:-q0,q=x+(qStart-x)*Math.exp(-local/tau);return {x,y:direct*x+(k-direct)*q}}
// Exact state transition of a proper rational transfer function. Time is scaled
// before building the companion matrix to avoid mixing large SI coefficients.
function transient(m,duration,count=1001){
 if(!(duration>0&&Number.isFinite(duration)))throw Error('Enter a positive time window.');
 const n=m.d.length-1;if(m.n.length>m.d.length)throw Error('This ideal circuit has an improper transfer function; ordinary step and impulse curves are not available.');
 if(!n){let D=m.n[0]/m.d[0];return {direct:D,data:Array.from({length:count},(_,i)=>({t:i*duration/(count-1),step:D,impulse:0}))}}
 const rate=Math.max(...m.d.slice(0,n).map((v,i)=>Math.pow(Math.abs(v/m.d[n]),1/(n-i))));
 const T=rate>0?1/rate:duration,den=m.d.map((v,i)=>v/T**i),lead=den[n],a=den.map(v=>v/lead),b=Array.from({length:n+1},(_,i)=>(m.n[i]||0)/T**i/lead),D=b[n],C=b.slice(0,n).map((v,i)=>v-D*a[i]);
 const size=n+1,zero=()=>Array.from({length:size},()=>Array(size).fill(0)),identity=()=>zero().map((r,i)=>(r[i]=1,r)),mm=(A,B)=>A.map(r=>B[0].map((_,j)=>r.reduce((s,v,k)=>s+v*B[k][j],0))),mv=(A,x)=>A.map(r=>r.reduce((s,v,k)=>s+v*x[k],0));
 let A=zero();for(let i=0;i<n-1;i++)A[i][i+1]=1;for(let i=0;i<n;i++)A[n-1][i]=-a[i];A[n-1][n]=1;
 let dt=duration/(count-1)/T,M=A.map(r=>r.map(v=>v*dt)),norm=Math.max(...M.map(r=>r.reduce((s,v)=>s+Math.abs(v),0))),scale=Math.max(0,Math.ceil(Math.log2(norm||1)));M=M.map(r=>r.map(v=>v/2**scale));let E=identity(),term=identity();for(let k=1;k<=40;k++){term=mm(term,M).map(r=>r.map(v=>v/k));E=E.map((r,i)=>r.map((v,j)=>v+term[i][j]));if(Math.max(...term.flat().map(Math.abs))<1e-17)break}for(let i=0;i<scale;i++)E=mm(E,E);
 let step=Array(size).fill(0),imp=Array(size).fill(0);step[n]=1;imp[n-1]=1/T;const data=[];
 for(let i=0;i<count;i++){let ys=D+C.reduce((s,v,j)=>s+v*step[j],0),yi=C.reduce((s,v,j)=>s+v*imp[j],0);if(!Number.isFinite(ys)||!Number.isFinite(yi))throw Error('Response exceeds the numerical range. Use a shorter time window.');data.push({t:i*duration/(count-1),step:ys,impulse:yi});step=mv(E,step);imp=mv(E,imp)}return {direct:D,data};
}
const api={model,response,crossings,square,transient,add,mul};if(typeof module!=='undefined')module.exports=api;else root.AlphaEngine=api;
})(typeof window==='undefined'?{}:window);
