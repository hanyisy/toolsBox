/* 달력 배경화면 생성기 — 순수 JS 버전 (빌드 불필요) */
(() => {
'use strict';

/* ================= 상수 ================= */
const STYLES=[
 {id:'mesh',label:'메시',desc:'번지는 그라데이션'},
 {id:'waves',label:'물결',desc:'겹겹의 파도'},
 {id:'topo',label:'등고선',desc:'유기적인 링'},
 {id:'geo',label:'기하학',desc:'바우하우스 타일'},
 {id:'sunset',label:'미니멀',desc:'해와 수평선'},
 {id:'typo',label:'타이포',desc:'큰 문구'},
 {id:'photo',label:'내 사진',desc:'이미지 업로드'}];
const DEVICES=[
 {id:'iphone',label:'아이폰',w:1179,h:2556,phone:true},
 {id:'android',label:'안드로이드',w:1080,h:2400,phone:true},
 {id:'fhd',label:'PC FHD',w:1920,h:1080},
 {id:'qhd',label:'PC QHD',w:2560,h:1440},
 {id:'uhd',label:'4K',w:3840,h:2160},
 {id:'ultra',label:'울트라와이드',w:3440,h:1440},
 {id:'custom',label:'직접 입력'}];
const HARM=[{id:'analog',label:'유사'},{id:'comp',label:'보색'},{id:'mono',label:'단색'},{id:'pastel',label:'파스텔'},{id:'neon',label:'네온'}];
// 되돌리기·링크 공유에 저장되는 값
const KEYS=['style','seed','colors','harmony','complexity','softness','grain','text','calOn','calYear','calMonth','calV','calH','calSize','calText','calPos','calFont','satColor','sunColor','calTone','weekStart','calCard','calHoliday','calToday','imgFit','imgX','imgY','imgDim','imgBlur','marks','markLabels','markLegend'];
const TYPES=[{id:'leave',label:'연차',color:'#2f6fdb',shape:'fill'},{id:'bday',label:'생일',color:'#e0457b',shape:'ring'},{id:'exam',label:'시험',color:'#e8892a',shape:'line'},{id:'anniv',label:'기념일',color:'#8e4fd6',shape:'fill'},{id:'etc',label:'기타',color:'#2f9e6b',shape:'dot'}];
const TYPE_MAP=Object.fromEntries(TYPES.map(t=>[t.id,t]));
const MCOLORS=['#2f6fdb','#e0457b','#e8892a','#8e4fd6','#2f9e6b','#161616'];
const N_CAND=10;
const MONTH_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const WD=['일','월','화','수','목','금','토'];
const HOLI=new Set(['1-1','3-1','5-5','6-6','8-15','10-3','10-9','12-25']);
const HOLI_Y={2026:['2-16','2-17','2-18','3-2','5-24','5-25','6-3','8-17','9-24','9-25','9-26','10-5'],2027:['2-6','2-7','2-8','2-9','5-13','8-16','9-14','9-15','9-16','10-4','10-11','12-27']};
const isHoliday=(y,m,d)=>HOLI.has(`${m}-${d}`)||(HOLI_Y[y]||[]).includes(`${m}-${d}`);

/* ================= 유틸 ================= */
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const hsl=(h,s,l)=>{h=((h%360)+360)%360;s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));return'#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const rgba=(h,a)=>{const[r,g,b]=rgb(h);return`rgba(${r},${g},${b},${a})`;};
const lerp=(a,b,t)=>{const A=rgb(a),B=rgb(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');};
const pick=(C,t)=>{t=Math.max(0,Math.min(1,t))*(C.length-1);const i=Math.min(C.length-2,Math.floor(t));return lerp(C[i],C[i+1],t-i);};
const lum=h=>{const[r,g,b]=rgb(h);return .2126*r+.7152*g+.0722*b;};
const newSeed=()=>Math.floor(Math.random()*1e6);
const FONT='"IBM Plex Sans KR", sans-serif';
const BASE_FONTS=[['IBM Plex Sans KR','IBM Plex Sans KR (기본)'],['Pretendard','프리텐다드'],['GmarketSans','G마켓 산스'],['Noto Sans KR','본고딕 (Noto Sans KR)'],['Gothic A1','고딕 A1'],['Nanum Gothic','나눔고딕'],['Gowun Dodum','고운돋움'],['Sunflower','선플라워'],['Noto Serif KR','본명조 (Noto Serif KR)'],['Nanum Myeongjo','나눔명조'],['Gowun Batang','고운바탕'],['Song Myung','송명'],['Black Han Sans','검은고딕'],['Do Hyeon','도현'],['Jua','주아'],['Dongle','동글'],['Gaegu','개구'],['Hi Melody','하이멜로디'],['Nanum Pen Script','나눔손글씨 펜'],['Apple SD Gothic Neo','애플 SD 산돌고딕 Neo (시스템)'],['Malgun Gothic','맑은 고딕 (시스템)']];
const ff=p=>p&&p.calFont&&p.calFont!=='IBM Plex Sans KR'?`"${p.calFont}", ${FONT}`:FONT;
const xesc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* 캔버스 명령을 SVG로 옮겨 적는 가짜 컨텍스트 (달력 레이어를 벡터로 내보낼 때 사용) */
class SvgCtx{
 constructor(real){this.real=real;this.m=document.createElement('canvas').getContext('2d');this.out=[];this.defs={};this.st=[];this.path='';
  Object.assign(this,{fillStyle:'#000',strokeStyle:'#000',lineWidth:1,font:'10px sans-serif',textAlign:'start',textBaseline:'alphabetic',globalAlpha:1,shadowColor:'rgba(0,0,0,0)',shadowBlur:0});}
 save(){this.st.push(['fillStyle','strokeStyle','lineWidth','font','textAlign','textBaseline','globalAlpha','shadowColor','shadowBlur'].map(k=>[k,this[k]]));}
 restore(){const s=this.st.pop();if(s)s.forEach(([k,v])=>this[k]=v);}
 getImageData(...a){return this.real.getImageData(...a);}
 measureText(t){this.m.font=this.font;return this.m.measureText(t);}
 beginPath(){this.path='';}
 arc(x,y,r){this.path+=`M${x-r} ${y}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`;}
 rect(x,y,w,h){this.path+=`M${x} ${y}h${w}v${h}h${-w}Z`;}
 roundRect(x,y,w,h,r){this.path+=`M${x+r} ${y}H${x+w-r}A${r} ${r} 0 0 1 ${x+w} ${y+r}V${y+h-r}A${r} ${r} 0 0 1 ${x+w-r} ${y+h}H${x+r}A${r} ${r} 0 0 1 ${x} ${y+h-r}V${y+r}A${r} ${r} 0 0 1 ${x+r} ${y}Z`;}
 fx(){if(!this.shadowBlur)return'';const id='sh'+Math.round(this.shadowBlur);this.defs[id]=`<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="0" stdDeviation="${this.shadowBlur/2}" flood-color="${this.shadowColor}"/></filter>`;return` filter="url(#${id})"`;}
 op(){return this.globalAlpha<1?` opacity="${this.globalAlpha}"`:'';}
 fill(){if(this.path)this.out.push(`<path d="${this.path}" fill="${this.fillStyle}"${this.op()}${this.fx()}/>`);}
 stroke(){if(this.path)this.out.push(`<path d="${this.path}" fill="none" stroke="${this.strokeStyle}" stroke-width="${this.lineWidth}"${this.op()}/>`);}
 fillRect(x,y,w,h){this.out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${this.fillStyle}"${this.op()}${this.fx()}/>`);}
 fillText(t,x,y){const m=/^(\d+)\s+([\d.]+)px\s+(.*)$/.exec(this.font)||[0,400,10,'sans-serif'],an={left:'start',start:'start',center:'middle',right:'end',end:'end'}[this.textAlign]||'start',bl=this.textBaseline==='middle'?' dominant-baseline="central"':'';
  this.out.push(`<text x="${x}" y="${y}" font-family="${xesc(m[3])}" font-size="${m[2]}" font-weight="${m[1]}" text-anchor="${an}"${bl} fill="${this.fillStyle}"${this.op()}${this.fx()}>${xesc(t)}</text>`);}
}

/* ================= 그리기 ================= */
function palette(seed,type){const r=rng(seed*7+3),h=r()*360,j=()=>(r()-.5)*16;
 switch(type){
  case'comp':return[hsl(h,25,92),hsl(h+j(),70,45),hsl(h+180+j(),70,55),hsl(h+20,60,70),hsl(h+200,50,30)];
  case'mono':return[hsl(h,35,10),hsl(h,45,28),hsl(h,55,46),hsl(h,60,66),hsl(h,50,86)];
  case'pastel':return[hsl(h,40,94),hsl(h+j(),60,80),hsl(h+60+j(),55,78),hsl(h+140,50,80),hsl(h+220,55,76)];
  case'neon':return[hsl(h,40,7),hsl(h,95,55),hsl(h+90+j(),95,60),hsl(h+180,90,58),hsl(h+270,95,62)];
  default:return[hsl(h,30,12+r()*8),hsl(h-25+j(),70,45),hsl(h+j(),75,55),hsl(h+25+j(),80,65),hsl(h+50,70,80)];}}

function drawBg(ctx,w,h,p){
 const r=rng(p.seed),C=p.colors,c=p.complexity/100,s=p.softness/100,m=Math.min(w,h),M=Math.max(w,h);
 ctx.save();ctx.fillStyle=C[0];ctx.fillRect(0,0,w,h);
 if(p.style==='mesh'){
  const n=3+Math.round(c*7);
  for(let i=0;i<n;i++){const x=r()*w,y=r()*h,R=M*(.35+r()*.5),col=C[1+i%4],g=ctx.createRadialGradient(x,y,0,x,y,R);
   g.addColorStop(0,rgba(col,.95));g.addColorStop(Math.max(.05,(1-s)*.55),rgba(col,.75));g.addColorStop(1,rgba(col,0));ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
 }else if(p.style==='waves'){
  const L=3+Math.round(c*8),T=C.slice(1);
  for(let i=0;i<L;i++){const t=L>1?i/(L-1):0,base=h*(.18+.78*(i+1)/(L+1)),amp=h*(.015+.05*s)*(.6+r()),f1=(1+r()*2)*Math.PI*2/w,f2=(2+r()*4)*Math.PI*2/w,p1=r()*7,p2=r()*7;
   ctx.beginPath();ctx.moveTo(0,h);for(let k=0;k<=160;k++){const x=w*k/160;ctx.lineTo(x,base+amp*Math.sin(x*f1+p1)+amp*.45*Math.sin(x*f2+p2));}
   ctx.lineTo(w,h);ctx.closePath();ctx.fillStyle=pick(T,t);ctx.fill();}
 }else if(p.style==='topo'){
  const cx=w*(.15+.7*r()),cy=h*(.15+.7*r()),N=6+Math.round(c*22),R=M*1.05,k1=2+Math.floor(r()*3),k2=3+Math.floor(r()*4),p1=r()*7,p2=r()*7,T=C.slice(1),wob=.08+.22*(1-s);
  for(let j=0;j<N;j++){const t=j/N,rr=R*(1-t)+m*.02;ctx.beginPath();
   for(let a=0;a<=180;a++){const th=a/180*Math.PI*2,rad=rr*(1+wob*(.6*Math.sin(k1*th+p1+t*2.5)+.4*Math.sin(k2*th+p2-t*3.5)));const x=cx+Math.cos(th)*rad,y=cy+Math.sin(th)*rad;a?ctx.lineTo(x,y):ctx.moveTo(x,y);}
   ctx.closePath();ctx.fillStyle=pick(T,t);ctx.fill();}
 }else if(p.style==='geo'){
  const n=2+Math.round(c*8),sz=m/n,cols=Math.ceil(w/sz),rows=Math.ceil(h/sz),ox=(w-cols*sz)/2,oy=(h-rows*sz)/2,hs=sz/2;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const bi=Math.floor(r()*5);let fi=Math.floor(r()*5);if(fi===bi)fi=(fi+1+Math.floor(r()*4))%5;const type=Math.floor(r()*6),rot=Math.floor(r()*4);
   ctx.save();ctx.translate(ox+x*sz+hs,oy+y*sz+hs);ctx.fillStyle=C[bi];ctx.fillRect(-hs-.5,-hs-.5,sz+1,sz+1);ctx.rotate(rot*Math.PI/2);ctx.fillStyle=C[fi];ctx.beginPath();
   if(type===0){ctx.moveTo(-hs,-hs);ctx.arc(-hs,-hs,sz,0,Math.PI/2);}
   else if(type===1){ctx.arc(0,-hs,hs,0,Math.PI);}
   else if(type===2){ctx.arc(0,0,hs*(.55+.4*s),0,Math.PI*2);}
   else if(type===3){ctx.moveTo(-hs,-hs);ctx.lineTo(hs,-hs);ctx.lineTo(-hs,hs);}
   else if(type===4){ctx.arc(0,0,hs*.32,0,Math.PI*2);}
   ctx.closePath();ctx.fill();ctx.restore();}
 }else if(p.style==='sunset'){
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,C[0]);g.addColorStop(1,lerp(C[0],C[1],.55));ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  const hz=h*(.58+r()*.08),R=m*(.16+.14*s),sx=w*(.5+(r()-.5)*.2);
  ctx.fillStyle=C[3];ctx.beginPath();ctx.arc(sx,hz-R*.3,R,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=lerp(C[0],C[1],.2);ctx.fillRect(0,hz,w,h-hz);
  const n=3+Math.round(c*10),gap=(h-hz)/(n+2);
  for(let i=0;i<n;i++){const ww=R*2*(1-i/(n+1))*(.7+r()*.3);ctx.fillStyle=rgba(C[3],.75-.5*i/n);ctx.fillRect(sx-ww/2,hz+gap*(i+.6),ww,Math.max(1,gap*.32));}
 }else if(p.style==='photo'){
  const im=p.img;
  if(im){const iw=im.naturalWidth,ih=im.naturalHeight,fx=p.imgX/100,fy=p.imgY/100,bl=p.imgBlur/100*m*.03;
   const place=(k)=>{const dw=iw*k,dh=ih*k;return[(w-dw)*fx,(h-dh)*fy,dw,dh];};
   const cover=Math.max(w/iw,h/ih);
   if(p.imgFit==='contain'){ctx.save();ctx.filter=`blur(${m*.04}px)`;const[x,y,dw,dh]=place(cover*1.1);ctx.drawImage(im,x,y,dw,dh);ctx.restore();
    ctx.fillStyle='rgba(0,0,0,0.15)';ctx.fillRect(0,0,w,h);
    ctx.save();if(bl>0)ctx.filter=`blur(${bl}px)`;const k=Math.min(w/iw,h/ih),cw2=iw*k,ch2=ih*k;ctx.drawImage(im,(w-cw2)/2,(h-ch2)/2,cw2,ch2);ctx.restore();}
   else{ctx.save();if(bl>0)ctx.filter=`blur(${bl}px)`;const ex=bl>0?1.04:1,[x,y,dw,dh]=place(cover*ex);ctx.drawImage(im,x,y,dw,dh);ctx.restore();}
   if(p.imgDim>0){ctx.fillStyle=`rgba(0,0,0,${p.imgDim/100*.7})`;ctx.fillRect(0,0,w,h);}
  }
 }else if(p.style==='typo'){
  const g=ctx.createLinearGradient(0,0,w*.3,h);g.addColorStop(0,C[0]);g.addColorStop(1,lerp(C[0],C[1],.6));ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  const txt=(p.text||' ').trim()||' ',words=txt.split(/\s+/);let fs=m*.3,lines=[];
  for(let it=0;it<40;it++){ctx.font=`700 ${fs}px ${ff(p)}`;lines=[];let cur='';
   for(const wd of words){const t=cur?cur+' '+wd:wd;if(cur&&ctx.measureText(t).width>w*.84){lines.push(cur);cur=wd;}else cur=t;}lines.push(cur);
   if(Math.max(...lines.map(l=>ctx.measureText(l).width))<=w*.84&&lines.length*fs*1.12<=h*.6)break;fs*=.92;}
  const bl=lum(C[0]),main=[C[2],C[3],C[4]].sort((a,b)=>Math.abs(lum(b)-bl)-Math.abs(lum(a)-bl))[0],lh=fs*1.12,y0=h/2-(lines.length-1)*lh/2,E=Math.round(c*8);
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(let e=E;e>=1;e--){ctx.strokeStyle=rgba(C[1],.25+.6*(1-e/(E+1)));ctx.lineWidth=Math.max(1,fs*.018);lines.forEach((l,i)=>ctx.strokeText(l,w/2+e*fs*.05*(s*2-1),y0+i*lh+e*fs*.07));}
  ctx.fillStyle=main;lines.forEach((l,i)=>ctx.fillText(l,w/2,y0+i*lh));
 }
 ctx.restore();
 if(p.grain>0){const img=ctx.getImageData(0,0,w,h),d=img.data,amt=p.grain*.7;let q=(p.seed*2654435761)>>>0;
  for(let i=0;i<d.length;i+=4){q=(Math.imul(q,1664525)+1013904223)>>>0;const n=((q>>>24)/255-.5)*amt;d[i]+=n;d[i+1]+=n;d[i+2]+=n;}ctx.putImageData(img,0,0);}
}

function drawCal(ctx,w,h,p){
 if(!p.calOn)return;
 const m=Math.min(w,h),phone=h>w,Y=p.calYear,Mo=p.calMonth,ws=p.weekStart;
 const cw=Math.min(w*.88,m*(.42+.5*p.calSize/100)),cell=cw/7,tf=.7+.6*(p.calText??50)/100;
 const first=new Date(Y,Mo,1).getDay(),days=new Date(Y,Mo+1,0).getDate(),off=(first-ws+7)%7,rows=Math.ceil((off+days)/7);
 const MK=p.marks||{},mlist=[];for(let d=1;d<=days;d++){const mk=MK[`${Y}-${Mo+1}-${d}`];if(mk)mlist.push([d,mk]);}
 const lab=p.markLabels&&mlist.some(x=>x[1].label),showLeg=p.markLegend&&mlist.length>0,legH=showLeg?cell*(.5+.46*Math.min(mlist.length,8)):0;
 const headH=cell*1.5,wdH=cell*.75,rowH=cell*(lab?1.08:.86),ch=headH+wdH+rows*rowH+legH,pad=p.calCard?cell*.55:0,bw=cw+pad*2,bh=ch+pad*2;
 const mx=m*.07,top=phone?h*.27:mx*1.2,bot=phone?h*.1:mx*1.2;
 let bx=p.calH==='left'?mx:p.calH==='right'?w-bw-mx:(w-bw)/2;
 let by=p.calV==='top'?top:p.calV==='bottom'?h-bh-bot:(phone?(top+(h-bot-bh))/2:(h-bh)/2);
 if(p.calPos){bx=Math.max(0,Math.min(w-bw,p.calPos.x*w-bw/2));by=Math.max(0,Math.min(h-bh,p.calPos.y*h-bh/2));}
 let dark=p.calTone==='dark';
 if(p.calTone==='auto'){try{const X=Math.max(0,Math.floor(bx)),Yy=Math.max(0,Math.floor(by)),W=Math.max(1,Math.min(w-X,Math.floor(bw))),H=Math.max(1,Math.min(h-Yy,Math.floor(bh))),d=ctx.getImageData(X,Yy,W,H).data;let s=0,n=0;for(let i=0;i<d.length;i+=4*37){s+=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];n++;}dark=s/n>150;}catch(e){}}
 const ink=dark?'#161616':'#ffffff',inv=dark?'#ffffff':'#161616',red=p.sunColor||(dark?'#cf3a2e':'#ff9d90'),blue=p.satColor||(dark?'#2f5ccc':'#a7c2ff');
 ctx.save();
 if(p.calCard){ctx.fillStyle=dark?'rgba(255,255,255,0.5)':'rgba(0,0,0,0.3)';ctx.beginPath();ctx.roundRect?ctx.roundRect(bx,by,bw,bh,cell*.4):ctx.rect(bx,by,bw,bh);ctx.fill();}
 else if(!dark){ctx.shadowColor='rgba(0,0,0,0.28)';ctx.shadowBlur=cell*.2;}
 const ox=bx+pad,oy=by+pad;
 ctx.fillStyle=ink;ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.font=`700 ${cell*tf*1.05}px ${ff(p)}`;
 ctx.fillText(String(Mo+1),ox+cell*.16,oy+cell*1.08);
 ctx.textAlign='right';ctx.font=`500 ${cell*tf*.27}px ${ff(p)}`;ctx.fillText(`${MONTH_EN[Mo]}  ${Y}`,ox+cw-cell*.16,oy+cell*1.04);
 ctx.textAlign='center';ctx.textBaseline='middle';
 for(let i=0;i<7;i++){const dw=(i+ws)%7;ctx.globalAlpha=.75;ctx.fillStyle=p.calHoliday&&dw===0?red:p.calHoliday&&dw===6?blue:ink;ctx.font=`500 ${cell*tf*.26}px ${ff(p)}`;ctx.fillText(WD[dw],ox+cell*(i+.5),oy+headH+wdH*.45);}
 ctx.globalAlpha=1;
 const now=new Date(),isCur=now.getFullYear()===Y&&now.getMonth()===Mo;
 for(let d=1;d<=days;d++){const idx=off+d-1,col=idx%7,row=Math.floor(idx/7),dw=(col+ws)%7,cx=ox+cell*(col+.5),cy=oy+headH+wdH+rowH*(row+.5)-(lab?cell*.1:0),mk=MK[`${Y}-${Mo+1}-${d}`],isT=p.calToday&&isCur&&d===now.getDate();
  let col_=ink;if(p.calHoliday){if(dw===0||isHoliday(Y,Mo+1,d))col_=red;else if(dw===6)col_=blue;}
  ctx.save();ctx.shadowBlur=0;
  if(isT&&!(mk&&mk.shape==='fill')){ctx.fillStyle=ink;ctx.beginPath();ctx.arc(cx,cy,cell*.32,0,Math.PI*2);ctx.fill();col_=inv;}
  if(mk){ctx.fillStyle=mk.color;ctx.strokeStyle=mk.color;
   if(mk.shape==='fill'){ctx.beginPath();ctx.arc(cx,cy,cell*.32,0,Math.PI*2);ctx.fill();col_='#ffffff';if(isT){ctx.strokeStyle=ink;ctx.lineWidth=cell*.04;ctx.beginPath();ctx.arc(cx,cy,cell*.4,0,Math.PI*2);ctx.stroke();}}
   else if(mk.shape==='ring'){ctx.lineWidth=cell*.055;ctx.beginPath();ctx.arc(cx,cy,isT?cell*.39:cell*.32,0,Math.PI*2);ctx.stroke();}
   else if(mk.shape==='dot'){ctx.beginPath();ctx.arc(cx,cy+cell*.25,cell*.055,0,Math.PI*2);ctx.fill();}
   else if(mk.shape==='line'){ctx.fillRect(cx-cell*.2,cy+cell*.21,cell*.4,cell*.06);}}
  ctx.restore();
  ctx.fillStyle=col_;ctx.font=`500 ${cell*tf*.34}px ${ff(p)}`;ctx.fillText(String(d),cx,cy+cell*.01);
  if(mk&&lab&&mk.label){ctx.font=`500 ${cell*tf*.17}px ${ff(p)}`;ctx.fillStyle=ink;let t=mk.label;while(t.length>1&&ctx.measureText(t+'…').width>cell*.94)t=t.slice(0,-1);ctx.fillText(t===mk.label?t:t+'…',cx,cy+cell*.47);}}
 if(showLeg){const ly=oy+headH+wdH+rows*rowH+cell*.5;ctx.textAlign='left';ctx.font=`500 ${cell*tf*.26}px ${ff(p)}`;
  mlist.slice(0,8).forEach(([d,mk],i)=>{const yy=ly+cell*.46*i+cell*.2;ctx.fillStyle=mk.color;ctx.beginPath();ctx.arc(ox+cell*.3,yy,cell*.09,0,Math.PI*2);ctx.fill();ctx.fillStyle=ink;ctx.fillText(`${d}일   ${mk.label||(TYPE_MAP[mk.type]||{}).label||''}`,ox+cell*.55,yy);});}
 ctx.restore();
 return{x:bx/w,y:by/h,w:bw/w,h:bh/h};
}
function draw(ctx,w,h,p){drawBg(ctx,w,h,p);return drawCal(ctx,w,h,p);}

/* ================= DOM 헬퍼 ================= */
const $=id=>document.getElementById(id);
function h(tag,props,...kids){
 const el=document.createElement(tag);
 for(const[k,v]of Object.entries(props||{})){
  if(v==null||v===false)continue;
  if(k==='class')el.className=v;
  else if(k==='style')el.style.cssText=v;
  else if(k.startsWith('on'))el.addEventListener(k.slice(2),v);
  else if(k in el)el[k]=v;
  else el.setAttribute(k,v);}
 el.append(...kids.flat().filter(x=>x!=null&&x!==false));
 return el;
}
const cls=(base,active)=>active?base+' is-active':base;
// 포커스 중인 입력칸은 덮어쓰지 않음 (커서 튐 방지)
const syncValue=(el,v)=>{if(document.activeElement!==el&&el.value!==String(v))el.value=v;};

/* ================= 상태 ================= */
function makeCandidates(hm){const gen=STYLES.filter(x=>x.id!=='photo');return Array.from({length:N_CAND},(_,i)=>{const sd=newSeed();return{seed:sd,colors:palette(sd,hm),style:gen[i%gen.length].id};});}

let init=null;
try{const hsh=location.hash.slice(1);if(hsh)init=JSON.parse(decodeURIComponent(escape(atob(hsh))));}catch(e){}
const seed0=newSeed(),now0=new Date();
const S=Object.assign({style:'mesh',seed:seed0,harmony:'analog',colors:palette(seed0,'analog'),complexity:50,softness:60,grain:14,text:'오늘도 천천히',
  calOn:true,calYear:now0.getFullYear(),calMonth:now0.getMonth(),calV:'center',calH:'center',calSize:50,calText:50,calPos:null,calFont:'IBM Plex Sans KR',satColor:null,sunColor:null,extraFonts:[],localFontLabel:'내 PC 폰트 불러오기',svgLabel:'SVG',calTone:'auto',weekStart:0,calCard:false,calHoliday:true,calToday:true,
  marks:{},markLabels:true,markLegend:false,selDay:null,imgFit:'cover',imgX:50,imgY:50,imgDim:15,imgBlur:0,img:null,candOpen:false,
  device:'iphone',customW:1440,customH:3040,showClock:true,past:[],future:[],now:now0,shareLabel:'링크 복사',downloadLabel:'PNG 다운로드',dragging:false},init||{});
S.candidates=makeCandidates(S.harmony);
if(S.style==='photo')S.style='mesh'; // 사진은 링크로 공유되지 않음

const snap=()=>{const o={};KEYS.forEach(k=>o[k]=S[k]);return o;};
function set(patch){Object.assign(S,patch);render();}
function pushPast(){S.past=[...S.past.slice(-49),snap()];S.future=[];}
function commit(ch){pushPast();set(ch);}
function snapshot(){pushPast();render();}
function undo(){if(!S.past.length)return;const prev=S.past[S.past.length-1];set(Object.assign({past:S.past.slice(0,-1),future:[snap(),...S.future]},prev));}
function redo(){if(!S.future.length)return;const nx=S.future[0];set(Object.assign({future:S.future.slice(1),past:[...S.past,snap()]},nx));}
function randomize(){const sd=newSeed();commit({seed:sd,colors:palette(sd,S.harmony),candidates:makeCandidates(S.harmony)});}
function shiftMonth(n){const d=new Date(S.calYear,S.calMonth+n,1);commit({calYear:d.getFullYear(),calMonth:d.getMonth(),selDay:null});}
function setMark(patch,doCommit=true){const k=`${S.calYear}-${S.calMonth+1}-${S.selDay}`,cur=S.marks[k]||{type:'etc',color:TYPE_MAP.etc.color,shape:'dot',label:''},marks=Object.assign({},S.marks,{[k]:Object.assign({},cur,patch)});doCommit?commit({marks}):set({marks});}

function dims(){const d=DEVICES.find(x=>x.id===S.device)||DEVICES[0];if(d.id==='custom'){const W=Math.max(100,Math.min(8000,+S.customW||1)),H=Math.max(100,Math.min(8000,+S.customH||1));return{w:W,h:H,phone:H>W};}return d;}
function params(over){const o={img:S.img};KEYS.forEach(k=>o[k]=S[k]);return Object.assign(o,over||{});}
function candOver(c){return S.style==='photo'?{seed:c.seed,colors:c.colors,style:c.style}:{seed:c.seed,colors:c.colors};}

/* ================= 캔버스 ================= */
const canvas=$('canvas');
let calBox=null,thumbEls=[],redrawTimer=0;
function paint(cv,maxSide,over){if(!cv)return;const{w,h}=dims(),k=Math.min(1,maxSide/Math.max(w,h)),W=Math.round(w*k),H=Math.round(h*k);if(cv.width!==W)cv.width=W;if(cv.height!==H)cv.height=H;return draw(cv.getContext('2d'),W,H,params(over));}
function redraw(){clearTimeout(redrawTimer);redrawTimer=setTimeout(()=>{calBox=paint(canvas,1100);
  if(S.candOpen)S.candidates.forEach((c,i)=>paint(thumbEls[i],320,candOver(c)));},16);}

/* 달력 드래그 이동 */
let calDrag=null;
function ptr(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};}
function inBox(q){const b=calBox;return b&&q.x>=b.x&&q.x<=b.x+b.w&&q.y>=b.y&&q.y<=b.y+b.h;}
canvas.addEventListener('pointerdown',e=>{const q=ptr(e);if(!inBox(q))return;const b=calBox;canvas.setPointerCapture&&canvas.setPointerCapture(e.pointerId);calDrag={dx:q.x-(b.x+b.w/2),dy:q.y-(b.y+b.h/2)};snapshot();canvas.style.cursor='grabbing';});
canvas.addEventListener('pointermove',e=>{const q=ptr(e);
  if(calDrag){const b=calBox,hw=Math.min(.5,b.w/2),hh=Math.min(.5,b.h/2);set({calPos:{x:Math.max(hw,Math.min(1-hw,q.x-calDrag.dx)),y:Math.max(hh,Math.min(1-hh,q.y-calDrag.dy))}});return;}
  canvas.style.cursor=inBox(q)?'grab':'default';});
const calUp=()=>{if(!calDrag)return;calDrag=null;canvas.style.cursor='grab';};
canvas.addEventListener('pointerup',calUp);canvas.addEventListener('pointercancel',calUp);

/* 후보 스트립 (마우스 드래그 스크롤) */
const strip=$('strip');
let stripDrag=null,wasDrag=false,builtCands=null;
strip.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;stripDrag={x:e.clientX,sl:strip.scrollLeft,moved:false};strip.classList.add('is-dragging');});
strip.addEventListener('pointermove',e=>{if(!stripDrag)return;const dx=e.clientX-stripDrag.x;if(Math.abs(dx)>5)stripDrag.moved=true;strip.scrollLeft=stripDrag.sl-dx;});
const stripUp=()=>{if(!stripDrag)return;wasDrag=stripDrag.moved;stripDrag=null;strip.classList.remove('is-dragging');setTimeout(()=>{wasDrag=false;},50);};
strip.addEventListener('pointerup',stripUp);strip.addEventListener('pointerleave',stripUp);
function renderCandidates(){
 if(builtCands===S.candidates)return;
 builtCands=S.candidates;thumbEls=[];
 strip.replaceChildren(...S.candidates.map(c=>{const cv=h('canvas');thumbEls.push(cv);
  return h('button',{type:'button',class:'thumb',draggable:false,onclick:()=>{if(wasDrag)return;commit(Object.assign(candOver(c),{candidates:makeCandidates(S.harmony)}));}},cv);}));
}

/* ================= 정적 컨트롤 이벤트 ================= */
$('undo').onclick=undo;$('redo').onclick=redo;
$('randomize').onclick=randomize;
$('candBtn').onclick=()=>set({candOpen:!S.candOpen});
$('calOn').onchange=e=>commit({calOn:e.target.checked});
$('prevMonth').onclick=()=>shiftMonth(-1);$('nextMonth').onclick=()=>shiftMonth(1);
$('monthLabel').onclick=()=>{const t=new Date();commit({calYear:t.getFullYear(),calMonth:t.getMonth()});};
$('showClock').onchange=e=>set({showClock:e.target.checked});
$('customW').oninput=e=>set({customW:e.target.value});
$('customH').oninput=e=>set({customH:e.target.value});
$('typoText').onfocus=snapshot;$('typoText').oninput=e=>set({text:e.target.value});
$('selLabel').onfocus=snapshot;$('selLabel').oninput=e=>setMark({label:e.target.value},false);
$('closeSel').onclick=()=>set({selDay:null});
$('removeMark').onclick=()=>{const m=Object.assign({},S.marks);delete m[`${S.calYear}-${S.calMonth+1}-${S.selDay}`];commit({marks:m});};
$('customMarkColor').onfocus=snapshot;$('customMarkColor').oninput=e=>setMark({color:e.target.value},false);
$('satColor').onfocus=snapshot;$('satColor').oninput=e=>set({satColor:e.target.value});
$('sunColor').onfocus=snapshot;$('sunColor').oninput=e=>set({sunColor:e.target.value});
$('resetWeekend').onclick=()=>commit({satColor:null,sunColor:null});
$('removePhoto').onclick=()=>commit({img:null,style:'mesh'});
$('shuffleColors').onclick=()=>commit({colors:palette(newSeed(),S.harmony)});

// 슬라이더: data-key 값과 자동 연결
document.querySelectorAll('input[type=range][data-key]').forEach(el=>{
 el.addEventListener('pointerdown',snapshot);
 el.addEventListener('input',()=>set({[el.dataset.key]:+el.value}));
});

// 배경 색 5칸
const swatchWrap=$('swatches');
const swatchEls=S.colors.map((_,i)=>{const inp=h('input',{type:'color',onfocus:snapshot,oninput:e=>{const c=[...S.colors];c[i]=e.target.value;set({colors:c});}});
 const lab=h('label',{class:'swatch'},inp);swatchWrap.append(lab);return{lab,inp};});

// 사진 업로드
const photoFile=$('photoFile');
photoFile.onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const im=new Image();
 im.onload=()=>commit({img:im,imgName:f.name,style:'photo',imgX:50,imgY:50});im.src=URL.createObjectURL(f);e.target.value='';};

// 글꼴
const fontSel=$('calFont');
fontSel.onchange=e=>{const v=e.target.value;commit({calFont:v});document.fonts&&document.fonts.load(`500 40px "${v}"`).then(redraw,()=>{});};
$('loadLocalFonts').onclick=async()=>{
 const reset=()=>setTimeout(()=>set({localFontLabel:'내 PC 폰트 불러오기'}),2400);
 if(!window.queryLocalFonts){set({localFontLabel:'이 브라우저는 미지원'});reset();return;}
 try{set({localFontLabel:'불러오는 중…'});const fs=await window.queryLocalFonts();const fam=[...new Set(fs.map(x=>x.family))].sort((a,b)=>a.localeCompare(b,'ko'));
  set({extraFonts:[...new Set([...S.extraFonts,...fam])],localFontLabel:`PC 폰트 ${fam.length}개`});}
 catch(e){set({localFontLabel:'권한이 거부됨'});reset();}};
const fontFile=$('fontFile');
$('pickFontFile').onclick=()=>fontFile.click();
fontFile.onchange=async e=>{const file=e.target.files&&e.target.files[0];if(!file)return;const name=file.name.replace(/\.[^.]+$/,'');
 try{const ffc=new FontFace(name,await file.arrayBuffer());await ffc.load();document.fonts.add(ffc);S.extraFonts=[name,...S.extraFonts.filter(x=>x!==name)];commit({calFont:name});}catch(err){alert('폰트 파일을 읽지 못했어요.');}
 e.target.value='';};
function fontList(){
 const extra=S.extraFonts.filter(x=>!BASE_FONTS.some(b=>b[0]===x)).map(x=>[x,x]);
 const cur=BASE_FONTS.some(b=>b[0]===S.calFont)||S.extraFonts.includes(S.calFont)?[]:[[S.calFont,S.calFont]];
 return[...BASE_FONTS,...extra,...cur];
}
let fontSig='';

/* ================= 내보내기 / 공유 ================= */
const fileName=(w,h,ext)=>`calendar-${S.calYear}-${String(S.calMonth+1).padStart(2,'0')}-${w}x${h}.${ext}`;
function saveBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
$('downloadPng').onclick=()=>{const{w,h}=dims(),cv=document.createElement('canvas');cv.width=w;cv.height=h;set({downloadLabel:'생성 중…'});
 setTimeout(()=>{draw(cv.getContext('2d'),w,h,params());cv.toBlob(b=>{saveBlob(b,fileName(w,h,'png'));set({downloadLabel:'PNG 다운로드'});},'image/png');},30);};
$('downloadSvg').onclick=()=>{const{w,h}=dims(),cv=document.createElement('canvas');cv.width=w;cv.height=h;set({svgLabel:'생성 중…'});
 setTimeout(()=>{const p=params(),ctx=cv.getContext('2d');drawBg(ctx,w,h,p);const bg=cv.toDataURL('image/jpeg',0.95),sc=new SvgCtx(ctx);drawCal(sc,w,h,p);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${Object.values(sc.defs).join('')}</defs><image x="0" y="0" width="${w}" height="${h}" href="${bg}" xlink:href="${bg}"/><g id="calendar">${sc.out.join('')}</g></svg>`;
  saveBlob(new Blob([svg],{type:'image/svg+xml'}),fileName(w,h,'svg'));set({svgLabel:'SVG'});},30);};
$('share').onclick=()=>{const o=snap();o.device=S.device;const enc=btoa(unescape(encodeURIComponent(JSON.stringify(o))));const url=location.href.split('#')[0]+'#'+enc;
 try{history.replaceState(null,'','#'+enc);}catch(e){}
 (navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(()=>set({shareLabel:'복사됨'}),()=>set({shareLabel:'주소창에 저장됨'}));
 setTimeout(()=>set({shareLabel:'링크 복사'}),1800);};

/* ================= 렌더 ================= */
function segButtons(el,opts,isActive,onPick){
 el.replaceChildren(...opts.map(([v,l])=>h('button',{type:'button',class:cls('seg-btn',isActive(v)),onclick:()=>onPick(v)},l)));
}
function toggleChip(label,key){return h('button',{type:'button',class:cls('chip',S[key]),onclick:()=>commit({[key]:!S[key]})},label);}

function renderCalSegs(){
 const groups=[['세로 위치','calV',[['top','위'],['center','가운데'],['bottom','아래']]],['가로 위치','calH',[['left','왼쪽'],['center','가운데'],['right','오른쪽']]],
  ['글자색','calTone',[['auto','자동'],['light','흰색'],['dark','검정']]],['시작 요일','weekStart',[[0,'일요일'],[1,'월요일']]]];
 $('calSegs').replaceChildren(...groups.map(([label,key,opts])=>{
  const pos=key==='calV'||key==='calH',seg=h('div',{class:'seg'});
  segButtons(seg,opts,v=>S[key]===v&&!(S.calPos&&pos),v=>commit(Object.assign({[key]:v},pos?{calPos:null}:{})));
  return h('div',{class:'seg-row'},h('span',{class:'seg-label'},label),seg);}));
}

function renderMarks(){
 const Y=S.calYear,Mo=S.calMonth,first=new Date(Y,Mo,1).getDay(),nd=new Date(Y,Mo+1,0).getDate(),off=(first-S.weekStart+7)%7,key=d=>`${Y}-${Mo+1}-${d}`;
 const sel=S.selDay&&S.selDay<=nd?S.selDay:null,cur=sel?S.marks[key(sel)]:null,t=new Date(),isCur=t.getFullYear()===Y&&t.getMonth()===Mo;
 const kids=[];
 for(let i=0;i<7;i++){const dw=(i+S.weekStart)%7;kids.push(h('span',{class:'wd',style:`color:${dw===0?'#cf3a2e':dw===6?'#2f5ccc':'#8a877f'}`},WD[dw]));}
 for(let i=0;i<off;i++)kids.push(h('span',{class:'day is-blank'}));
 for(let d=1;d<=nd;d++){const m=S.marks[key(d)],dw=(off+d-1+S.weekStart)%7;
  const fg=m?'#ffffff':dw===0?'#cf3a2e':dw===6?'#2f5ccc':'#1c1c1a',shadow=sel===d?'0 0 0 2px #1c1c1a':isCur&&t.getDate()===d?'inset 0 0 0 1px #b9b6ad':'none';
  kids.push(h('button',{type:'button',class:'day',style:`background:${m?m.color:'transparent'};color:${fg};box-shadow:${shadow};font-weight:${m||sel===d?700:400}`,onclick:()=>set({selDay:sel===d?null:d})},String(d)));}
 $('markGrid').replaceChildren(...kids);

 $('selBox').hidden=!sel;
 if(sel){
  $('selTitle').textContent=`${Mo+1}월 ${sel}일 ${WD[new Date(Y,Mo,sel).getDay()]}요일`;
  $('markTypes').replaceChildren(...TYPES.map(tp=>h('button',{type:'button',class:cls('chip',!!cur&&cur.type===tp.id),onclick:()=>{const keep=cur&&cur.label&&cur.label!==(TYPE_MAP[cur.type]||{}).label;setMark({type:tp.id,color:tp.color,shape:tp.shape,label:keep?cur.label:tp.label});}},
   h('span',{class:'chip-dot',style:`background:${tp.color}`}),h('span',null,tp.label))));
  $('selMarked').hidden=!cur;
  if(cur){
   syncValue($('selLabel'),cur.label||'');
   segButtons($('shapeOpts'),[['fill','채움'],['ring','테두리'],['dot','점'],['line','밑줄']],v=>cur.shape===v,v=>setMark({shape:v}));
   $('markColors').replaceChildren(...MCOLORS.map(c=>h('button',{type:'button',class:cls('mark-color',cur.color===c),style:`background:${c}`,'aria-label':c,onclick:()=>setMark({color:c})})));
   const custom=!MCOLORS.includes(cur.color);
   $('customMarkWrap').classList.toggle('is-active',custom);
   syncValue($('customMarkColor'),custom?cur.color:'#ff6a3d');
  }
 }

 const ml=[];for(let d=1;d<=nd;d++){const m=S.marks[key(d)];if(m)ml.push([d,m]);}
 $('monthMarks').hidden=!ml.length;
 $('monthMarks').replaceChildren(...ml.map(([d,m])=>h('button',{type:'button',class:'month-mark',onclick:()=>set({selDay:d})},
  h('span',{class:'chip-dot',style:`background:${m.color}`}),h('span',{class:'month-mark-day'},`${d}일`),h('span',null,m.label||(TYPE_MAP[m.type]||{}).label))));
 $('markToggles').replaceChildren(toggleChip('일정 이름 표시','markLabels'),toggleChip('일정 목록 표시','markLegend'));
}

function render(){
 const d=dims(),phone=!!d.phone,n=S.now,stage=$('stage'),frame=$('frame');

 // 헤더
 $('undo').disabled=!S.past.length;$('redo').disabled=!S.future.length;
 $('share').textContent=S.shareLabel;$('downloadSvg').textContent=S.svgLabel;$('downloadPng').textContent=S.downloadLabel;

 // 미리보기 프레임
 stage.style.setProperty('--aspect',`${d.w} / ${d.h}`);
 stage.style.setProperty('--thumb-w',(phone?120:240)+'px');
 frame.style.width=(phone?Math.round(580*d.w/d.h):(d.w/d.h>2?840:740))+'px';
 frame.classList.toggle('is-phone',phone);
 $('clock').hidden=!(phone&&S.showClock);
 $('dateLabel').textContent=`${n.getMonth()+1}월 ${n.getDate()}일 ${WD[n.getDay()]}요일`;
 $('timeLabel').textContent=`${n.getHours()%12||12}:${String(n.getMinutes()).padStart(2,'0')}`;
 $('resLabel').textContent=`${d.w} × ${d.h}`;
 $('styleName').textContent=(STYLES.find(x=>x.id===S.style)||{}).label||'';
 $('seedLabel').textContent=S.seed;
 const cb=$('candBtn');cb.textContent=S.candOpen?'다른 후보 닫기':'다른 후보 보기';cb.classList.toggle('is-active',S.candOpen);
 $('cand').hidden=!S.candOpen;
 renderCandidates();

 // CALENDAR
 $('calOn').checked=S.calOn;
 $('monthLabel').textContent=`${S.calYear}년 ${S.calMonth+1}월`;
 renderCalSegs();
 const fl=fontList(),sig=fl.map(x=>x[0]).join('|');
 if(sig!==fontSig){fontSig=sig;fontSel.replaceChildren(...fl.map(([v,l])=>h('option',{value:v},l)));}
 fontSel.value=S.calFont;
 $('loadLocalFonts').textContent=S.localFontLabel;
 const sat=S.satColor||'#2f5ccc',sun=S.sunColor||'#cf3a2e';
 $('satDot').style.background=sat;syncValue($('satColor'),sat);
 $('sunDot').style.background=sun;syncValue($('sunColor'),sun);
 $('calToggles').replaceChildren(toggleChip('카드 배경','calCard'),toggleChip('주말·공휴일 색','calHoliday'),toggleChip('오늘 표시','calToday'));

 // MY DAYS
 renderMarks();

 // DEVICE
 $('devices').replaceChildren(...DEVICES.map(x=>h('button',{type:'button',class:cls('chip',x.id===S.device),onclick:()=>set({device:x.id})},x.label)));
 $('customBox').hidden=S.device!=='custom';
 syncValue($('customW'),S.customW);syncValue($('customH'),S.customH);
 $('clockRow').hidden=!phone;$('showClock').checked=S.showClock;

 // BACKGROUND
 $('styles').replaceChildren(...STYLES.map(x=>h('button',{type:'button',class:cls('style-btn',x.id===S.style),onclick:()=>{if(x.id==='photo'&&!S.img){photoFile.click();return;}commit({style:x.id});}},
  h('span',{class:'style-name'},x.label),h('span',{class:'style-desc'},x.desc))));
 $('uploadLabel').textContent=S.img?'다른 사진으로 바꾸기':'+ 내 사진 업로드';
 $('photoBox').hidden=!(S.style==='photo'&&S.img);
 segButtons($('fitOpts'),[['cover','채우기'],['contain','전체 보기']],v=>S.imgFit===v,v=>commit({imgFit:v}));
 $('typoText').hidden=S.style!=='typo';syncValue($('typoText'),S.text);

 // COLOR
 swatchEls.forEach(({lab,inp},i)=>{lab.style.background=S.colors[i];syncValue(inp,S.colors[i]);});
 segButtons($('harmonies'),HARM.map(x=>[x.id,x.label]),v=>v===S.harmony,v=>commit({harmony:v,colors:palette(newSeed(),v),candidates:makeCandidates(v)}));

 // 슬라이더 값
 document.querySelectorAll('input[type=range][data-key]').forEach(el=>{const v=S[el.dataset.key];if(el.value!==String(v))el.value=v;});
 document.querySelectorAll('[data-out]').forEach(el=>{el.textContent=S[el.dataset.out];});

 redraw();
}

/* ================= 시작 ================= */
window.addEventListener('keydown',e=>{const tg=e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT')return;
 if(e.code==='Space'){e.preventDefault();randomize();}
 else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}});
setInterval(()=>set({now:new Date()}),30000);
render();
if(document.fonts){document.fonts.load(`500 40px "${S.calFont}"`).then(redraw,()=>{});document.fonts.ready.then(redraw);}
})();
