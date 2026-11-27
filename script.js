(async()=>{"use strict";
const $=i=>document.getElementById(i),rnd=Math.random,R=200,PI=Math.PI;
let curMap='',lantK=1;
const sm=(a,b,x)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x)};
const pc=z=>22*Math.sin(z*.028)*(1-sm(R-70,R-26,z));
const pd=(x,z)=>{const r=Math.hypot(x,z);return Math.min(r<15?0:99,Math.abs(r-62),Math.abs(r-122),z>6&&z<R-10?Math.abs(x-pc(z)):99)}; // jarak ke jalan setapak
const H0=(x,z)=>{const r=Math.hypot(x,z),a=Math.atan2(z,x),t=sm(0,1,(R+7*Math.sin(a*3+1)+4*Math.sin(a*5+2)-r)/24);
 const h=t*(1.6+1.3*Math.sin(x*.03+1)*Math.cos(z*.027)+.9*Math.sin(z*.07+x*.05)*Math.cos(x*.06)+.4*Math.sin(x*.19)*Math.cos(z*.17))-2.8*(1-t);
 const o=h+(1.5-h)*(1-sm(11,19,r));return o+(1.5-o)*(1-sm(1.8,5,pd(x,z)))*(1-sm(R-34,R-26,r))}; // jalan setapak diratakan, tidak pernah tenggelam
// setiap peta berdiri di wilayahnya sendiri (sumbu x), jadi satu dunia 3D cukup untuk semuanya
const CAS_X=3000,CTY_X=-3000,PKR_X=6000,SWH_X=-6000,SLJ_X=9000,SLAKE={x:22,z:-14,r:13};
const zoneOf=x=>x>7500?'salju':x>4500?'parkour':x>1500?'castle':x<-4500?'sawah':x<-1500?'city':'sakura';
const hSawah=(x,z)=>{const d=-16-z;if(d<=0)return .3;const L=Math.min(4,d/12),i=Math.floor(L);return .3+.8*(i+sm(0,.2,L-i))}; // terasering
const hSalju=(x,z)=>{const lx=x-SLJ_X,h=.3+sm(34,72,Math.hypot(lx,z))*(2.4+1.5*Math.sin(lx*.09)*Math.cos(z*.075));return h+(.2-h)*(1-sm(SLAKE.r,SLAKE.r+5,Math.hypot(lx-SLAKE.x,z-SLAKE.z)))};
const H=(x,z)=>{const k=zoneOf(x);return k==='sakura'?H0(x,z):k==='sawah'?hSawah(x,z):k==='salju'?hSalju(x,z):k==='parkour'?0:.3};
const ok=(x,z)=>{const k=zoneOf(x);return k==='sakura'?ok0(x,z):k==='castle'?okC(x,z):k==='city'?okY(x,z):k==='sawah'?okS(x,z):okW(x,z)};
const pier=(x,z)=>Math.abs(x)<1.9&&z>R-22&&z<R+14;
const benches=[],trees=[],pinkT=[];
const ok0=(x,z)=>Math.hypot(x,z)>5.4&&(pier(x,z)||H(x,z)>-.45)&&trees.every(t=>{const q=(x-t[0])**2+(z-t[1])**2;return q>.3||q>=(pos.x-t[0])**2+(pos.z-t[1])**2})&&benches.every(b=>{const d=Math.hypot(x-b.x,z-b.z);return d>.75||d>=Math.hypot(pos.x-b.x,pos.z-b.z)}); // bisa menyusuri semua area, termasuk pantai dangkal; tembok tak terlihat dihapus

const tick=()=>new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0))),PG=async(p,t)=>{$('lb').firstElementChild.style.width=p+'%';$('lt2').textContent=t+' '+p+'%';await tick()};
await PG(3,'Menyiapkan');
// huruf untuk nama pemain & papan di dalam dunia 3D (menunggu sebentar saja; tanpa internet pakai huruf sistem)
if(document.fonts){try{await Promise.race([Promise.all([document.fonts.load('800 24px "National Park"'),document.fonts.load('600 24px Overpass')]),new Promise(r=>setTimeout(r,1500))])}catch(e){}
 document.fonts.ready.then(()=>{try{myTag.n=null}catch(e){}})}
/* ---------- scene ---------- */
const cv=$('c'),ren=new THREE.WebGLRenderer({canvas:cv,antialias:true}),scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(70,1,.1,2000);
ren.setPixelRatio(Math.min(devicePixelRatio,2));ren.setClearColor(0x0f1f3d);
scene.fog=new THREE.FogExp2(0x0f1f3d,.0034);cam.rotation.order='YXZ';scene.add(cam);
const skyG=new THREE.Group();scene.add(skyG);
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
 g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
const glow=(col,s,op)=>{const m=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:col,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:op}));m.scale.set(s,s,1);return m};

const nightSky=new THREE.Mesh(new THREE.SphereGeometry(500,32,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
 vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`varying vec3 p;
 float h(vec3 q){return fract(sin(dot(q,vec3(12.9898,78.233,37.719)))*43758.5453);}
 float n(vec3 q){vec3 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);
  return mix(mix(mix(h(i),h(i+vec3(1.,0.,0.)),f.x),mix(h(i+vec3(0.,1.,0.)),h(i+vec3(1.,1.,0.)),f.x),f.y),
             mix(mix(h(i+vec3(0.,0.,1.)),h(i+vec3(1.,0.,1.)),f.x),mix(h(i+vec3(0.,1.,1.)),h(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}
 void main(){vec3 d=normalize(p);float y=clamp(d.y,0.,1.);
  vec3 c=mix(vec3(.07,.15,.27),vec3(.004,.008,.03),pow(y,.4));
  c+=vec3(.05,.09,.12)*pow(1.-y,6.);
  float q=dot(d,normalize(vec3(.35,.75,.55)));
  float m=n(d*5.)*.6+n(d*13.)*.3+n(d*31.)*.1;
  float vis=smoothstep(0.,.25,d.y+.1);
  c+=(vec3(.5,.55,.85)*exp(-q*q*14.)+vec3(.9,.75,.6)*exp(-q*q*60.)*.35)*m*.35*vis;
  gl_FragColor=vec4(c,1.);}`}));skyG.add(nightSky);

// stars
const M=4500,sp=new Float32Array(M*3),sc=new Float32Array(M*3),sph=new Float32Array(M),ssz=new Float32Array(M);
for(let i=0;i<M;i++){const y=.03+rnd()*.97,q=Math.sqrt(1-y*y),a=rnd()*PI*2,w=rnd();
 sp.set([Math.cos(a)*q*480,y*480,Math.sin(a)*q*480],i*3);
 sc.set(w<.6?[.85,.9,1]:w<.85?[1,.95,.8]:[.7,.8,1],i*3);sph[i]=rnd()*6.28;ssz[i]=1.2+Math.pow(rnd(),5)*3;}
const sg=new THREE.BufferGeometry();
sg.setAttribute('position',new THREE.BufferAttribute(sp,3));sg.setAttribute('col',new THREE.BufferAttribute(sc,3));
sg.setAttribute('ph',new THREE.BufferAttribute(sph,1));sg.setAttribute('sz',new THREE.BufferAttribute(ssz,1));
const su={t:{value:0},dpr:{value:ren.getPixelRatio()}};
const starsPts=new THREE.Points(sg,new THREE.ShaderMaterial({uniforms:su,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
 vertexShader:'attribute vec3 col;attribute float ph,sz;uniform float t,dpr;varying vec3 c;void main(){c=col;gl_PointSize=sz*dpr*(.85+.25*sin(t*2.+ph*7.));gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'varying vec3 c;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(c,1.-d*1.8);}'}));skyG.add(starsPts);

// moon
const mp=new THREE.Vector3(-190,200,-370),moon=new THREE.Mesh(new THREE.SphereGeometry(13,24,16),new THREE.MeshBasicMaterial({color:0xf2efe0,fog:false}));
moon.position.copy(mp);skyG.add(moon);const mh=glow(0x9fb6ff,170,.4);mh.position.copy(mp);skyG.add(mh);

// aurora
const au=[];
function aur(a0,a1,rad,y0,hg,c1,c2,ph,k){
 const g=new THREE.PlaneGeometry(1,1,160,12),P=g.attributes.position;
 for(let i=0;i<P.count;i++){const u=P.getX(i)+.5,v=P.getY(i)+.5,a=a0+(a1-a0)*u,r=rad+34*Math.sin(u*8+ph)+14*Math.sin(u*21+ph*2);
  P.setXYZ(i,Math.cos(a)*r,y0+v*hg*(1+.25*Math.sin(u*6+ph))+10*Math.sin(u*5+ph+v),Math.sin(a)*r)}
 const m=new THREE.ShaderMaterial({uniforms:{t:{value:0},ph:{value:ph},k:{value:k},c1:{value:new THREE.Vector3(...c1)},c2:{value:new THREE.Vector3(...c2)}},
  transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
  vertexShader:'varying vec2 u;void main(){u=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec2 u;uniform float t,ph,k;uniform vec3 c1,c2;
  float hs(float x){return fract(sin(x*127.1)*43758.5);}
  float ns(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(hs(i),hs(i+1.),f);}
  void main(){
   float w=u.x*k+sin(u.x*7.+t*.25+ph)*1.4+sin(u.x*19.-t*.4)*.4;
   float ray=pow(ns(w*3.+t*.35)*.6+ns(w*9.-t*.5)*.4,1.8);
   float cur=.55+.45*sin(u.x*23.+t*.7+ph*3.);
   float f=smoothstep(0.,.07,u.y)*pow(1.-u.y,1.5)*smoothstep(0.,.08,u.x)*(1.-smoothstep(.92,1.,u.x));
   vec3 c=mix(c1,c2,smoothstep(.1,.95,u.y));
   float a=ray*cur*f*(.75+.25*sin(t*.6+u.x*9.+ph));
   gl_FragColor=vec4((c+vec3(.5,.9,.7)*pow(1.-u.y,6.)*.7)*1.7,a);}`});
 skyG.add(new THREE.Mesh(g,m));au.push(m)}
aur(-2.75,-.4,400,55,190,[.1,1,.5],[.7,.25,1],0,9);
aur(-2.4,-.75,360,95,150,[.2,.95,.8],[.95,.3,.7],2,6);
aur(-2.95,-.2,430,35,120,[.35,1,.35],[.2,.6,1],4,12);

// shooting stars
const shots=[];
for(let i=0;i<3;i++){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
 const m=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
 m.frustumCulled=false;skyG.add(m);shots.push({m,g,life:-2-rnd()*8,p:new THREE.Vector3(),d:new THREE.Vector3()})}
function shoot(s,dt){
 s.life+=dt;if(s.life<0)return;
 if(!s.on){const az=rnd()*PI*2,el=.55+rnd()*.5,q=Math.cos(el),tg=rnd()<.5?1:-1;
  s.p.set(Math.cos(az)*q*440,Math.sin(el)*440,Math.sin(az)*q*440);
  s.d.set(-Math.sin(az)*tg,-.55,Math.cos(az)*tg).normalize();s.on=1}
 const L=1,k=s.life/L,h=s.p.clone().addScaledVector(s.d,260*s.life),t=h.clone().addScaledVector(s.d,-80*Math.min(1,s.life*4));
 s.g.attributes.position.setXYZ(0,t.x,t.y,t.z);s.g.attributes.position.setXYZ(1,h.x,h.y,h.z);s.g.attributes.position.needsUpdate=true;
 s.m.material.opacity=Math.sin(PI*Math.min(1,k));
 if(k>=1){s.life=-4-rnd()*8;s.on=0;s.m.material.opacity=0}}

// lights
const hemiL=new THREE.HemisphereLight(0x34508f,0x0a1020,.6);scene.add(hemiL);
const dl=new THREE.DirectionalLight(0x8aa4ff,.55);dl.position.copy(mp).normalize();scene.add(dl);

await PG(12,'Langit & bintang');
// tekstur prosedural
function tex(w,h,fn,rep){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),d=x.createImageData(w,h);
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const v=fn(i,j),o=(j*w+i)*4;d.data[o]=v[0];d.data[o+1]=v[1];d.data[o+2]=v[2];d.data[o+3]=255}
 x.putImageData(d,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);t.anisotropy=4;return t}
const F=PI*2/128;
const gtex=tex(128,128,(i,j)=>{const v=205+40*rnd()-35*Math.abs(Math.sin(i*F*13+Math.sin(j*F*5)*3))*Math.abs(Math.sin(j*F*3+i*F));return[v,v,v]},[75,75]);
const wn=tex(256,256,(i,j)=>{let gx=0,gy=0;for(const[a,b,A]of[[3,1,1],[2,5,.8],[7,3,.5],[5,-4,.6],[11,2,.3]]){const c=Math.cos((a*i+b*j)*PI/128)*A*PI/128;gx+=a*c;gy+=b*c}
 const l=Math.hypot(gx*7,gy*7,1);return[128-127*gx*7/l,128-127*gy*7/l,128+127/l]},[90,90]);
const water=new THREE.Mesh(new THREE.PlaneGeometry(1600,1600),new THREE.MeshStandardMaterial({color:0x0b2a50,roughness:.12,metalness:.35,normalMap:wn,normalScale:new THREE.Vector2(.55,.55),transparent:true,opacity:.94}));
water.rotation.x=-PI/2;scene.add(water);
const S=222,N=300,tg=new THREE.PlaneGeometry(2*S,2*S,N,N);tg.rotateX(-PI/2);
const TP=tg.attributes.position,col=new Float32Array(TP.count*3);
for(let i=0;i<TP.count;i++){const x=TP.getX(i),z=TP.getZ(i),h=H(x,z);TP.setY(i,h);
 const m=sm(.4,1.4,h),n=.82+.22*Math.sin(x*.09+z*.05)*Math.sin(z*.08-x*.04)+.2*rnd(),pw=1-sm(1.5,2.9,pd(x,z));
 let r=.43-.36*m,g=.38-.19*m,b=.28-.19*m;
 r+=(.38-r)*pw;g+=(.36-g)*pw;b+=(.34-b)*pw;
 col.set([r*n,g*n,b*n],i*3)}
tg.setAttribute('color',new THREE.BufferAttribute(col,3));tg.computeVertexNormals();
scene.add(new THREE.Mesh(tg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,map:gtex})));

await PG(34,'Membentuk tanah');
// dermaga
const wtex=tex(128,64,(i,j)=>{const v=95+40*Math.sin(j*PI*2*9/64+Math.sin(i*F*2)*2)+25*rnd()-(j%16<1?45:0);return[v*1.1,v*.75,v*.55]},[1,18]);
const bt=wtex.clone();bt.needsUpdate=true;bt.repeat.set(1,1);
const wood=new THREE.MeshStandardMaterial({map:wtex,roughness:.85}),deck=new THREE.Mesh(new THREE.BoxGeometry(4,.22,36),wood);
deck.position.set(0,.8,R-4);scene.add(deck);
for(let z=R-20;z<=R+12;z+=4)for(const sx of[-1,1]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,3.4,8),wood);p.position.set(sx*2.1,-.4,z);scene.add(p)}

// fountain
const fx=new THREE.Group();fx.position.y=1.5;scene.add(fx);
const stone=new THREE.MeshStandardMaterial({color:0x8a8a94,roughness:.8}),wm=new THREE.MeshStandardMaterial({color:0x2f6f9f,roughness:.1,emissive:0x0a2a44});
const fa=(g,m,y)=>{const o=new THREE.Mesh(g,m);o.position.y=y;fx.add(o);return o};
fa(new THREE.CylinderGeometry(4.6,5,.9,36),stone,.45);
fa(new THREE.CylinderGeometry(4.1,4.1,.05,36),wm,.88);
fa(new THREE.TorusGeometry(4.3,.25,8,40),stone,.9).rotation.x=PI/2;
fa(new THREE.CylinderGeometry(.45,.6,2.4,16),stone,1.9);
fa(new THREE.CylinderGeometry(1.9,.7,.35,24),stone,2.9);
fa(new THREE.CylinderGeometry(1.6,1.6,.05,24),wm,3.08);
const fl=new THREE.PointLight(0x7fd0ff,.9,16,1.5);fl.position.y=3.5;fx.add(fl);
const J=300,jp=new Float32Array(J*3),jv=[];
for(let i=0;i<J;i++)jv.push({a:rnd()*6.283,h:.5+rnd()*1.9,v:4.5+rnd()*1.2,o:rnd()*1.4});
const jg=new THREE.BufferGeometry();jg.setAttribute('position',new THREE.BufferAttribute(jp,3));
const jets=new THREE.Points(jg,new THREE.PointsMaterial({color:0xbfe6ff,size:.13,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}));
jets.frustumCulled=false;fx.add(jets);
function fount(t){for(let i=0;i<J;i++){const s=jv[i],k=(t+s.o)%1.4;
 jp[i*3]=Math.cos(s.a)*s.h*k;jp[i*3+1]=3.1+s.v*k-5*k*k;jp[i*3+2]=Math.sin(s.a)*s.h*k}jg.attributes.position.needsUpdate=true}

await PG(46,'Air mancur');
// pohon (sakura + hijau), bunga, rumput
const rp=(d=2.8)=>{for(let k=0;k<40;k++){const a=rnd()*PI*2,r=Math.sqrt(rnd())*(R-16),x=Math.cos(a)*r,z=Math.sin(a)*r;if(H(x,z)>.7&&pd(x,z)>d)return[x,z]}return null};
const dm=new THREE.Object3D(),cc=new THREE.Color(),NT=640,blob=new THREE.IcosahedronGeometry(1,1);
const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.16,.3,1,7),new THREE.MeshStandardMaterial({color:0x4a3526,roughness:1}),NT),
 pink=new THREE.InstancedMesh(blob,new THREE.MeshStandardMaterial({roughness:.9,emissive:0x2e1020}),NT*2),
 leaf=new THREE.InstancedMesh(blob,new THREE.MeshStandardMaterial({roughness:.9}),NT*2);
let nt=0,np=0,nl=0;
for(let i=0;i<NT;i++){const p=rp(4.5);if(!p)continue;const x=p[0],z=p[1],y=H(x,z),sk=rnd()<.5,h=3+rnd()*2.5;
 trees.push([x,z]);if(sk)pinkT.push([x,z]);dm.position.set(x,y+h/2,z);dm.rotation.set(0,rnd()*6,0);dm.scale.set(1,h,1);dm.updateMatrix();trunk.setMatrixAt(nt++,dm.matrix);
 for(let b=0;b<2;b++){const s=1.7+rnd()*1.1,M=sk?pink:leaf,k=sk?np++:nl++;
  dm.position.set(x+(rnd()-.5)*1.4,y+h+.3+b*.9,z+(rnd()-.5)*1.4);dm.rotation.set(0,0,0);dm.scale.set(s*1.15,s*.85,s*1.15);dm.updateMatrix();
  M.setMatrixAt(k,dm.matrix);M.setColorAt(k,cc.setHSL(sk?(.94+rnd()*.04):(.27+rnd()*.07),sk?(.55+rnd()*.3):.42,sk?(.72+rnd()*.14):(.17+rnd()*.1)))}}
trunk.count=nt;pink.count=np;leaf.count=nl;
await PG(62,'Menanam pohon');
// bunga realistis: batang + daun + kelopak + putik, tumbuh berkelompok per jenis
function merge(gs){const P=[],Nn=[];for(const g0 of gs){const g=g0.index?g0.toNonIndexed():g0;P.push(...g.attributes.position.array);Nn.push(...g.attributes.normal.array)}
 const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.Float32BufferAttribute(P,3));m.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));return m}
function petalGeo(n,len,wid,lift,cup){const P=[];
 for(let i=0;i<n;i++){const a=i/n*PI*2,ux=Math.cos(a),uz=Math.sin(a),vx=-uz,vz=ux,pt=(r,w,y)=>[ux*r+vx*w,y,uz*r+vz*w];
  const b=pt(.012,0,0),m1=pt(len*.6,wid,lift*.6+cup*len*.4),m2=pt(len*.6,-wid,lift*.6+cup*len*.4),t=pt(len*(1-cup*.4),0,lift+cup*len*.85);
  P.push(...b,...m1,...t,...b,...t,...m2)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.computeVertexNormals();return g}
const stemG=(()=>{const gs=[new THREE.CylinderGeometry(.005,.009,1,4).translate(0,.5,0)];
 for(let i=0;i<3;i++){const a=i*2.1,ux=Math.cos(a),uz=Math.sin(a),vx=-uz,vz=ux,y0=.05+i*.07,l=new THREE.BufferGeometry();
  l.setAttribute('position',new THREE.Float32BufferAttribute([0,y0,0, ux*.09+vx*.03,y0+.04,uz*.09+vz*.03, ux*.18,y0+.09,uz*.18, 0,y0,0, ux*.18,y0+.09,uz*.18, ux*.09-vx*.03,y0+.04,uz*.09-vz*.03],3));l.computeVertexNormals();gs.push(l)}
 return merge(gs)})();
const SP=[[0,[0xffffff,0xfff1f5]],[0,[0xff8fb8,0xff6fa5]],[0,[0xffd84a,0xffc425]],[0,[0xb58cff,0x9a7bff]],[0,[0x8fb8ff,0x7aa5ff]],
 [1,[0xe0303a,0xff3b3b]],[1,[0xff8a2a,0xffa040]],[1,[0xff6fa5,0xff9ac0]],[1,[0xffcf3a,0xffe066]]];
const ctr=[];for(let i=0;i<110;i++){const p=rp();if(p)ctr.push({x:p[0],z:p[1],sp:SP[(rnd()*SP.length)|0]})}
const MF=new THREE.MeshLambertMaterial({side:THREE.DoubleSide,emissive:0x151515}),NF=3200,
 fS=new THREE.InstancedMesh(stemG,new THREE.MeshLambertMaterial({side:THREE.DoubleSide}),NF),
 fR=new THREE.InstancedMesh(petalGeo(7,.12,.045,.02,0),MF,NF),fC=new THREE.InstancedMesh(petalGeo(5,.1,.05,.02,1),MF,NF),
 fK=new THREE.InstancedMesh(new THREE.OctahedronGeometry(.022),new THREE.MeshLambertMaterial({color:0xf0b429}),NF),
 gr=new THREE.InstancedMesh(new THREE.ConeGeometry(.1,.7,3,1,true),new THREE.MeshLambertMaterial({side:THREE.DoubleSide}),5000);
const FL=[];let nf=0,nR=0,nC=0,ng=0;const tp=new THREE.Vector3();
for(let i=0;i<NF;i++){let x,z,sp;
 if(rnd()<.8&&ctr.length){const c=ctr[i%ctr.length],a=rnd()*6.28,r=Math.sqrt(rnd())*8;x=c.x+Math.cos(a)*r;z=c.z+Math.sin(a)*r;sp=rnd()<.85?c.sp:SP[(rnd()*SP.length)|0]}
 else{const q=rp();if(!q)continue;x=q[0];z=q[1];sp=SP[(rnd()*SP.length)|0]}
 if(H(x,z)<.7||pd(x,z)<2.8)continue;
 const hh=.28+rnd()*.3,sc=.8+rnd()*.7;
 dm.position.set(x,H(x,z)-.02,z);dm.rotation.set((rnd()-.5)*.3,rnd()*6,(rnd()-.5)*.3);dm.scale.set(sc*.9,hh,sc*.9);dm.updateMatrix();
 fS.setMatrixAt(nf,dm.matrix);fS.setColorAt(nf++,cc.setHSL(.27+rnd()*.06,.45,.4+rnd()*.15));
 tp.set(0,hh,0).applyQuaternion(dm.quaternion).add(dm.position);dm.position.copy(tp);dm.scale.setScalar(sc);dm.updateMatrix();
 cc.setHex(sp[1][(rnd()*2)|0]).offsetHSL(0,0,(rnd()-.5)*.08);
 FL.push({x,z,i:nf-1,k:sp[0]?nC:nR,t:sp[0],c:cc.getHex(),on:1});if(sp[0]){fC.setMatrixAt(nC,dm.matrix);fC.setColorAt(nC++,cc)}else{fR.setMatrixAt(nR,dm.matrix);fR.setColorAt(nR,cc);fK.setMatrixAt(nR++,dm.matrix)}}
for(let i=0;i<5000;i++){const q=rp();if(!q)continue;
 dm.position.set(q[0],H(q[0],q[1])+.3,q[1]);dm.rotation.set((rnd()-.5)*.4,rnd()*6,(rnd()-.5)*.4);dm.scale.setScalar(.7+rnd()*.9);dm.updateMatrix();
 gr.setMatrixAt(ng,dm.matrix);gr.setColorAt(ng++,cc.setHSL(.25+rnd()*.1,.5,.14+rnd()*.12))}
fS.count=nf;fR.count=nR;fC.count=nC;fK.count=nR;gr.count=ng;
[trunk,pink,leaf,fS,fR,fC,fK,gr].forEach(m=>{m.frustumCulled=false;scene.add(m)});

await PG(78,'Kelopak sakura');
// kelopak sakura bentuk asli (instanced, ringan): melayang di udara + hamparan di tanah
const ptG=(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.42,.5,.05,.2,.95,0, 0,0,0,.2,.95,0,0,.8,0, 0,0,0,0,.8,0,-.2,.95,0, 0,0,0,-.2,.95,0,-.42,.5,.05],3));g.translate(0,-.45,0);g.computeVertexNormals();return g})(),
 ptM=new THREE.MeshLambertMaterial({side:THREE.DoubleSide,emissive:0x3a1a28}),pcol=()=>cc.setHSL(.93+rnd()*.05,.45+rnd()*.45,.74+rnd()*.2);
const NP=220,pet=new THREE.InstancedMesh(ptG,ptM,NP),pp=new Float32Array(NP*3),pv=[];
for(let i=0;i<NP;i++){pp.set([(rnd()-.5)*60,rnd()*14,(rnd()-.5)*60],i*3);pv.push({s:.35+rnd()*.45,p:rnd()*6,f:.5+rnd(),z:.15+rnd()*.12,r:rnd()*6,w:[1+rnd()*2,1+rnd()*2.5]});pet.setColorAt(i,pcol())}
function petalUpd(t,dt){for(let i=0;i<NP;i++){const v=pv[i],j=i*3;let y=pp[j+1]-v.s*dt;if(y<0)y+=14;pp[j+1]=y;
 pp[j]+=(Math.sin(t*v.f+v.p)*.8+.5)*dt;pp[j+2]+=Math.cos(t*v.f*.8+v.p)*.6*dt;
 let d=pp[j]-cam.position.x;if(d>30)pp[j]-=60;else if(d<-30)pp[j]+=60;d=pp[j+2]-cam.position.z;if(d>30)pp[j+2]-=60;else if(d<-30)pp[j+2]+=60;
 dm.position.set(pp[j],y,pp[j+2]);dm.rotation.set(v.r+t*v.w[0],t*v.w[1],v.r);dm.scale.setScalar(v.z);dm.updateMatrix();pet.setMatrixAt(i,dm.matrix)}
 pet.instanceMatrix.needsUpdate=true}
pet.frustumCulled=false;scene.add(pet);
const NG=4200,car=new THREE.InstancedMesh(ptG,ptM,NG);let ncar=0;
for(let i=0;i<NG;i++){let x,z;
 if(rnd()<.8&&pinkT.length){const q=pinkT[(rnd()*pinkT.length)|0],a=rnd()*6.283,r=Math.sqrt(rnd())*3.8;x=q[0]+Math.cos(a)*r;z=q[1]+Math.sin(a)*r}else{const q=rp(1.2);if(!q)continue;x=q[0];z=q[1]}
 const h=H(x,z);if(h<.5)continue;
 dm.position.set(x,h+.025+rnd()*.03,z);dm.rotation.set(-PI/2+(rnd()-.5)*.3,(rnd()-.5)*.3,rnd()*6.283);dm.scale.setScalar(.11+rnd()*.1);dm.updateMatrix();
 car.setMatrixAt(ncar,dm.matrix);car.setColorAt(ncar++,pcol())}
car.count=ncar;car.frustumCulled=false;scene.add(car);
// kunang-kunang di beberapa area (animasi di GPU)
const FA=[[10,-7]];for(let i=0;i<8;i++)FA.push(rp(1.5)||[0,40+i*8]);
const FF=FA.length*40,ffP=new Float32Array(FF*3),ffA=new Float32Array(FF*4);
for(let i=0;i<FF;i++){const c=FA[(i/40)|0],a=rnd()*6.283,r=Math.sqrt(rnd())*7,x=c[0]+Math.cos(a)*r,z=c[1]+Math.sin(a)*r;
 ffP.set([x,Math.max(H(x,z),0)+.5+rnd()*2.2,z],i*3);ffA.set([rnd()*6.28,.5+rnd()*1.1,.5+rnd()*1.4,1+rnd()*2.2],i*4)}
const ffG=new THREE.BufferGeometry();ffG.setAttribute('position',new THREE.BufferAttribute(ffP,3));ffG.setAttribute('a',new THREE.BufferAttribute(ffA,4));
const ffU={t:{value:0},dpr:{value:ren.getPixelRatio()}},
 ffs=new THREE.Points(ffG,new THREE.ShaderMaterial({uniforms:ffU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
 vertexShader:'attribute vec4 a;uniform float t,dpr;varying float b;void main(){vec3 p=position+vec3(sin(t*a.y+a.x)*a.z,sin(t*a.y*.7+a.x*2.)*.5,cos(t*a.y*.8+a.x*3.)*a.z);b=pow(max(0.,sin(t*a.w+a.x*5.)),2.)*.9+.1;vec4 v=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(dpr*28./(-v.z)*(.5+b),2.,48.);gl_Position=projectionMatrix*v;}',
 fragmentShader:'varying float b;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float g=pow(1.-d,2.5);gl_FragColor=vec4(vec3(.75,1.,.3)*(g+.6*pow(1.-d,9.)),g*b);}'}));
ffs.frustumCulled=false;scene.add(ffs);
await PG(88,'Kunang-kunang');

// jejak kaki
const FN=70,fp=new THREE.InstancedMesh(new THREE.CircleGeometry(1,10).rotateX(-PI/2),new THREE.MeshBasicMaterial({color:0x0b0805,transparent:true,opacity:.42,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),FN),fpD=[];
let fpI=0,fpS=1;fp.frustumCulled=false;scene.add(fp);
dm.scale.setScalar(0);dm.position.set(0,-50,0);dm.rotation.set(0,0,0);dm.updateMatrix();for(let i=0;i<FN;i++)fp.setMatrixAt(i,dm.matrix);
function foot(x,z,dx,dz){const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;fpS=-fpS;
 const px=x-dz*.14*fpS,pz=z+dx*.14*fpS,d={x:px,y:H(px,pz)+.06,z:pz,r:Math.atan2(dx,dz),t:T};
 dm.position.set(d.x,d.y,d.z);dm.rotation.set(0,d.r,0);dm.scale.set(.1,1,.24);dm.updateMatrix();fp.setMatrixAt(fpI,dm.matrix);fpD[fpI]=d;fpI=(fpI+1)%FN;fp.instanceMatrix.needsUpdate=true}
function fpUpd(){let ch=0;for(let i=0;i<FN;i++){const d=fpD[i];if(!d)continue;const a=T-d.t;if(a>22){const f=Math.max(0,1-(a-22)/8);
 dm.position.set(d.x,d.y,d.z);dm.rotation.set(0,d.r,0);dm.scale.set(.1*f,1,.24*f);dm.updateMatrix();fp.setMatrixAt(i,dm.matrix);ch=1;if(f===0)fpD[i]=null}}
 if(ch)fp.instanceMatrix.needsUpdate=true}

// bangku: hanya tepat di samping jalan setapak atau di sekitar air mancur
const bw=new THREE.MeshStandardMaterial({map:bt,roughness:.85}),mt2=new THREE.MeshStandardMaterial({color:0x2a2a30,roughness:.5,metalness:.6});
const nearMain=(x,z)=>{for(let q=6;q<40;q+=1.5)if(Math.hypot(x-pc(q),z-q)<3.6)return true;return false};
function okBench(x,z,yaw,plaza){
 if(H(x,z)<.5)return false;
 const lx=Math.cos(yaw),lz=-Math.sin(yaw),fx=Math.sin(yaw),fz=Math.cos(yaw);
 for(const a of[-.95,0,.95])for(const b of[-.35,.35]){const px=x+lx*a+fx*b,pz=z+lz*a+fz*b,r=Math.hypot(px,pz);
  if(plaza){if(r>14.5||r<7.5||nearMain(px,pz))return false}else if(pd(px,pz)<2.6||r<20)return false}
 return true}
function bench(x,z,yaw){const g=new THREE.Group(),y=H(x,z);g.position.set(x,y,z);g.rotation.y=yaw;
 const bx=(w,h,d,m,a,b,c)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(a,b,c);g.add(o)};
 bx(1.8,.07,.5,bw,0,.5,0);bx(1.8,.4,.06,bw,0,.78,.26);bx(.07,.5,.5,mt2,-.8,.25,0);bx(.07,.5,.5,mt2,.8,.25,0);
 scene.add(g);benches.push({x,z,yaw,y})}
function put(cx,cz,nx,nz,side,off,plaza){ // sisi jalan, menghadap jalan
 for(const s of[side,-side]){const x=cx+s*nx*off,z=cz+s*nz*off,yaw=Math.atan2(s*nx,s*nz);if(okBench(x,z,yaw,plaza)){bench(x,z,yaw);return true}}return false}
for(let k=0;k<6;k++){const a=k*PI/3+.5;put(0,0,Math.cos(a),Math.sin(a),1,12,true)}
for(let z=28,sd=1;z<R-52;z+=24,sd=-sd){const d=(pc(z+1)-pc(z-1))/2,l=Math.hypot(d,1);put(pc(z),z,1/l,-d/l,sd,3.2,false)}
for(const r0 of[62,122])for(let k=0;k<7;k++){const a=k*PI*2/7+(r0>100?.4:.1);put(Math.cos(a)*r0,Math.sin(a)*r0,Math.cos(a),Math.sin(a),k%2?1:-1,3.2,false)}

await PG(93,'Bangku');
// lentera + tangan (orang pertama) dan karakter low-poly
const rest=new THREE.Vector3(.38,-.06,-.64),hand=new THREE.Group(),lan=new THREE.Group();cam.add(hand);hand.add(lan);hand.position.copy(rest);
const dark=new THREE.MeshStandardMaterial({color:0x17120e,roughness:.45,metalness:.75}),skin=new THREE.MeshStandardMaterial({color:0x4a3328,roughness:.8}),
 cloth=new THREE.MeshStandardMaterial({color:0x2a3042,roughness:.95}),
 glass=new THREE.MeshStandardMaterial({color:0xffe2a8,emissive:0xffa63d,emissiveIntensity:.9,transparent:true,opacity:.5,roughness:.1}),
 flameM=new THREE.MeshBasicMaterial({color:0xffe9b0}),flames=[];
const add=(p,g,m,x,y,z)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o};
function lantern(g){
 add(g,new THREE.TorusGeometry(.03,.006,6,14),dark,0,-.03,0);
 add(g,new THREE.CylinderGeometry(.003,.003,.1,5),dark,0,-.1,0);
 add(g,new THREE.ConeGeometry(.06,.05,8),dark,0,-.17,0);
 add(g,new THREE.CylinderGeometry(.045,.05,.13,10),glass,0,-.255,0);
 for(const[x,z]of[[1,1],[1,-1],[-1,1],[-1,-1]])add(g,new THREE.CylinderGeometry(.004,.004,.13,5),dark,x*.047,-.255,z*.047);
 add(g,new THREE.CylinderGeometry(.055,.06,.02,10),dark,0,-.325,0);
 const f=add(g,new THREE.SphereGeometry(1,8,6),flameM,0,-.28,0);f.scale.set(.012,.03,.012);flames.push(f)}
lantern(lan);
add(hand,new THREE.SphereGeometry(.045,10,8),skin,0,0,0).scale.set(1,.85,1.15);
add(hand,new THREE.SphereGeometry(.018,8,6),skin,-.03,-.02,-.035);
const dir=new THREE.Vector3(.4,-.5,.75).normalize(),arm=add(hand,new THREE.CylinderGeometry(.06,.04,.8,10),cloth,dir.x*.4,dir.y*.4,dir.z*.4);
arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
const lg=glow(0xffb060,.55,.55),lt=new THREE.PointLight(0xffb468,2.4,32,1.6);lg.position.y=lt.position.y=-.26;lan.add(lg);lan.add(lt);

// karakter low-poly (menghadap -z) dengan skin yang bisa diganti
function limb(par,x,y,z,r1,r2,len,m){const g=new THREE.Group();g.position.set(x,y,z);par.add(g);g.add(new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,len,5).translate(0,-len/2,0),m));return g}
const clan=new THREE.Group(),SK=[
 {n:'Pria',sk:0xdcab88,co:0x2f5560,pa:0x2b2d3a,ha:0x2e1c12,sc:0xb8434f,ty:0},
 {n:'Perempuan',sk:0xe8b999,co:0xd9648a,pa:0x8a3f66,ha:0x3a2218,sc:0xfff0f4,ty:1},
 {n:'Beruang',sk:0x8a5a3a,co:0x84532f,pa:0x6e4226,ha:0x8a5a3a,sc:0xd94a4a,ty:2},
 {n:'Kucing',sk:0xe8a050,co:0xd98a3a,pa:0xc27a30,ha:0xe8a050,sc:0x4a8fd9,ty:3},
 {n:'Kelinci',sk:0xf4eff2,co:0xe6e0f0,pa:0xd8d0e8,ha:0xf4eff2,sc:0xff9ac0,ty:4},
 {n:'Ninja',sk:0xe0ae88,co:0x283050,pa:0x1f2640,ha:0x1b2138,sc:0xd9372f,sh:0x10121c,ty:5},
 {n:'Astronot',sk:0xe6b894,co:0xeef1f5,pa:0xdde2ea,ha:0x4a3020,sc:0xf07a2a,sh:0x6d7683,hand:0x8f99a8,ty:6},
 {n:'Robot',sk:0xaebdc9,co:0x7f98ad,pa:0x56697c,ha:0x66798c,sc:0x3ff0dc,sh:0x2f3b48,hand:0x56697c,ty:7},
 {n:'Penyihir',sk:0xe2b592,co:0x56389a,pa:0x38235e,ha:0xeceaf4,sc:0xf2c14e,ty:8},
 {n:'Panda',sk:0xf4f3ee,co:0xf4f3ee,pa:0x25262d,ha:0x25262d,sc:0x55a84c,sh:0x25262d,arm:0x25262d,hand:0x25262d,ty:9},
 {n:'Petani',sk:0xbd855c,co:0x3f7391,pa:0x2f2a28,ha:0x17120e,sc:0xcc4633,sh:0x6b4a2b,ty:10}];
function mkAv(i){const S=SK[i]||SK[0],E=S.ty,M=c=>new THREE.MeshStandardMaterial({color:c,roughness:.85,flatShading:true}),MB=c=>new THREE.MeshBasicMaterial({color:c}),
 mSk=M(S.sk),mCo=M(S.co),mPa=M(S.pa),mSh=M(S.sh||0x17110c),mHa=M(S.ha),mSc=M(S.sc),mAr=M(S.arm||S.co),mHd=M(S.hand||S.sk),eyeM=MB(0x1a1218),
 g=new THREE.Group(),ad=(G,m,x,y,z)=>add(g,G,m,x,y,z),Ic=(r,d)=>new THREE.IcosahedronGeometry(r,d||0),Bx=(w,h,d)=>new THREE.BoxGeometry(w,h,d),Cy=(a,b,h,s,o)=>new THREE.CylinderGeometry(a,b,h,s||6,1,!!o),Co=(r,h,s)=>new THREE.ConeGeometry(r,h,s),To=(r,t,s)=>new THREE.TorusGeometry(r,t,4,s||10),
 tor=new THREE.Group(),ut=(G,m,x,y,z)=>add(tor,G,m,x,y-.9,z),eyes=(y,z,dx,r)=>{for(const s of[-1,1])ut(Ic(r||.019,1),eyeM,s*(dx||.046),y,z)};
 tor.position.y=.9;g.add(tor);
 if(E===7){ut(Bx(.4,.5,.28),mCo,0,1.19,0);ad(Bx(.3,.15,.22),mPa,0,.9,0)}
 else{ut(Cy(.2,.16,.56),mCo,0,1.2,0).scale.z=.7;ad(Cy(.17,.19,.16),mPa,0,.9,0).scale.z=.7}
 ut(Cy(.06,.07,.08,5),E===7?mPa:mSk,0,1.5,0);
 if(E<6||E===8||E===10)ut(To(.11,.035,6),mSc,0,1.49,0).rotation.x=PI/2;
 if(E<=4){ // kepala dasar: manusia & hewan lama
  ut(Ic(.13),mSk,0,1.62,0).scale.set(.95,1.08,1);
  ut(Ic(.145),mHa,0,1.66,.03).scale.set(1,.85,1.05);
  eyes(E<2?1.625:1.65,E<2?-.128:-.127)}
 if(E===1){ad(Cy(.19,.36,.55,8),mCo,0,.78,0).scale.z=.8;ut(Cy(.13,.09,.5,6),mHa,0,1.42,.12)}
 if(E>=2&&E<=4){for(const sd of[-1,1]){const e=ut(E===2?Ic(.055):E===3?Co(.05,.14,4):Cy(.03,.04,.32,5),mHa,sd*(E===4?.07:.1),E===2?1.77:E===3?1.8:1.92,0);if(E===4)e.rotation.z=-sd*.15}
  if(E===2)ut(Ic(.06),M(0xd9b48a),0,1.57,-.11);
  ut(Ic(.034),MB(E===2?0x111111:0xff8fa8),0,1.592,-.16);
  if(E===3)ad(Cy(.025,.02,.5,5),mHa,0,1.05,.3).rotation.x=.8;else ad(Ic(.06),mHa,0,.95,.2)}
 if(E===5){ // ninja: tudung, celah mata, ikat kepala, katana
  ut(Ic(.145,1),mHa,0,1.63,.004).scale.set(1,1.06,1);
  ut(Bx(.19,.052,.04),mSk,0,1.64,-.128);eyes(1.64,-.15,.045,.014);
  ut(To(.142,.017,14),mSc,0,1.7,0).rotation.x=PI/2;
  for(const s of[-1,1]){const t=ut(Bx(.04,.016,.24),mSc,s*.035,1.67,.22);t.rotation.set(.35,s*.28,0)}
  const k=new THREE.Group();k.position.set(0,.33,.17);k.rotation.z=.72;tor.add(k);add(k,Bx(.055,.72,.03),M(0x3a4254),0,0,0);add(k,Bx(.042,.2,.042),mSc,0,.47,0);add(k,Bx(.11,.022,.06),M(0xd9b45a),0,.365,0);
  ut(Cy(.178,.172,.07,8),mSc,0,.99,0).scale.z=.74}
 if(E===6){ // astronot: helm kaca, ransel, lencana
  ut(Ic(.115),mSk,0,1.65,0);ut(Ic(.12),mHa,0,1.69,.025).scale.set(1,.8,1);eyes(1.655,-.112);
  ut(Ic(.205,1),new THREE.MeshStandardMaterial({color:0xcfe4ff,roughness:.15,transparent:true,opacity:.28,flatShading:true,depthWrite:false}),0,1.67,0);
  ut(To(.145,.042,12),mCo,0,1.5,0).rotation.x=PI/2;ut(To(.15,.016,12),mSc,0,1.52,0).rotation.x=PI/2;
  ut(Bx(.3,.4,.17),mPa,0,1.23,.21);ut(Bx(.22,.07,.02),mSc,0,1.33,.3);
  ut(Cy(.008,.008,.24,4),M(0x8a94a0),.11,1.55,.24);ut(Ic(.028),MB(0xff5a4a),.11,1.68,.24);
  ut(Bx(.15,.11,.03),M(0x3a4758),0,1.25,-.14);ut(Bx(.04,.04,.01),MB(0x6af0c0),-.035,1.26,-.158);ut(Bx(.04,.04,.01),MB(0xffb347),.035,1.26,-.158);
  ut(Cy(.185,.185,.05,8),mSc,0,.99,0).scale.z=.74}
 if(E===7){ // robot: kepala kotak, mata menyala, antena, panel dada
  ut(Bx(.31,.25,.26),mSk,0,1.66,0);ut(Bx(.25,.11,.02),M(0x141f2b),0,1.675,-.132);
  for(const s of[-1,1]){ut(Bx(.052,.044,.012),MB(S.sc),s*.058,1.675,-.145);ut(Cy(.048,.048,.05,8),mPa,s*.178,1.66,0).rotation.z=PI/2;ut(Ic(.065),mPa,s*.24,1.4,0)}
  ut(Bx(.12,.012,.01),MB(0x8fa6b8),0,1.58,-.134);
  ut(Cy(.01,.01,.15,4),mPa,0,1.855,0);ut(Ic(.038,1),MB(0xff6b4a),0,1.95,0);
  ut(Bx(.24,.17,.02),M(0x263647),0,1.23,-.146);[0xff6b4a,0xffd24a,S.sc].forEach((c,j)=>ut(Ic(.024),MB(c),-.065+j*.065,1.23,-.163));
  ut(Bx(.41,.05,.29),mPa,0,1.02,0)}
 if(E===8){ // penyihir: topi runcing, janggut, jubah
  ut(Ic(.13),mSk,0,1.62,0).scale.set(.95,1.08,1);eyes(1.635,-.128);
  ut(Ic(.14),mHa,0,1.62,.045).scale.set(1.08,1,.95);
  ut(Co(.095,.27,6),mHa,0,1.455,-.115).rotation.x=PI;ut(Ic(.04),mHa,0,1.57,-.135).scale.set(1.7,.6,.8);
  ut(Cy(.27,.28,.026,14),mCo,0,1.725,0);ut(Co(.155,.46,10),mCo,0,1.96,.02).rotation.x=.14;ut(Cy(.146,.157,.055,10),mSc,0,1.765,0);
  ut(Ic(.035),MB(0xffe27a),0,1.86,-.115);
  ad(Cy(.19,.35,.76,9),mCo,0,.62,0).scale.z=.82;ad(Cy(.348,.362,.05,9),mSc,0,.25,0).scale.z=.82;
  ut(Cy(.176,.17,.05,8),mSc,0,.99,0).scale.z=.74}
 if(E===9){ // panda
  ut(Ic(.165,1),mSk,0,1.665,0).scale.set(1.1,1,1);
  for(const s of[-1,1]){ut(Ic(.062,1),mHa,s*.13,1.805,0);const p=ut(Ic(.048,1),mHa,s*.066,1.685,-.14);p.scale.set(.9,1.2,.55);p.rotation.z=s*.6;ut(Ic(.015,1),MB(0xffffff),s*.058,1.69,-.172);ut(Ic(.008),eyeM,s*.056,1.69,-.186)}
  ut(Ic(.062,1),mSk,0,1.615,-.14).scale.set(1.25,.85,.9);ut(Ic(.025),eyeM,0,1.635,-.195);
  ut(To(.125,.034,10),mSc,0,1.505,0).rotation.x=PI/2;ut(Bx(.07,.2,.025),mSc,.08,1.4,-.14).rotation.z=.2;
  ad(Ic(.065),mSk,0,.95,.19)}
 if(E===10){ // petani: caping, sarung, handuk
  ut(Ic(.13),mSk,0,1.62,0).scale.set(.95,1.08,1);ut(Ic(.14),mHa,0,1.645,.035).scale.set(1,.82,1);eyes(1.62,-.128);
  ut(Co(.37,.2,16),M(0xd9ab58),0,1.82,0);ut(To(.35,.012,16),M(0xa97a34),0,1.725,0).rotation.x=PI/2;ut(Ic(.03),M(0xa97a34),0,1.93,0);
  ad(Cy(.185,.225,.36,8),M(0x8a3f2c),0,.8,0).scale.z=.8;ad(Cy(.213,.22,.045,8),M(0xe8c06a),0,.72,0).scale.z=.8;
  ut(Bx(.065,.3,.022),M(0xf1ede2),.09,1.32,-.145)}
 const mSkin=E===10?mSk:mPa,
 legs=[-1,1].map(sx=>{const th=limb(g,sx*.09,.9,0,.085,.065,.45,mPa),sh=limb(th,0,-.45,0,.065,.05,.45,mSkin);add(sh,Bx(.1,.07,.22),mSh,0,-.45,-.04);return{th,sh}}),
 arms=[-1,1].map(sx=>{const up=limb(tor,sx*.25,.5,0,.055,.045,.3,mAr),fo=limb(up,0,-.3,0,.045,.035,.28,E===10?mSk:mAr);add(fo,Ic(.045),mHd,0,-.29,0);return{up,fo}});
 return{g,legs,arms,tor}}
function animAv(a,A,w,kn,wv,st){const L=a.legs,Ar=a.arms;
 L[0].th.rotation.x=st?1.5:kn?1.45:w*A;L[1].th.rotation.x=st?1.5:kn?0:-w*A;
 L[0].sh.rotation.x=st?-1.5:kn?-1.45:-Math.max(0,-w)*A*1.1;L[1].sh.rotation.x=st?-1.5:kn?-1.5:-Math.max(0,w)*A*1.1;
 Ar[0].up.rotation.x=wv?2.9:st?.35:-w*A*.9;Ar[0].fo.rotation.x=wv?.5+Math.sin(T*11)*.5:st?.4:.2+Math.max(0,w)*A*.3;
 Ar[1].up.rotation.x=kn?1.45:st?.6:.55-w*A*.12;Ar[1].fo.rotation.x=kn?.25:st?1:.9}
let ch,chA,legs,arms,emoBack=0,tmpF=0,skI=0,flw=null,cflw=null,myName='',held='l',hasL=true,hasF=0,lk=1,fk=0,dropL=null,drops=[],nearF=null,nearD=null,jh=0,jvv=0,kn=0,pose=0,poseT=0,emo='',emoT=0,emoN=0;
lantern(clan);

// mode kamera: 0 = POV, 1 = melihat diri sendiri, 2 = terbang bebas
let camMode=0;const fc=new THREE.Vector3(),fv=new THREE.Vector3();
function setCam(m){camMode=m;setIc($('cbtn'),['eye','user','plane'][m],['POV','Diri','Terbang'][m]);ch.visible=m!==0;hand.visible=m===0;
 relight();if(m===2){fc.copy(cam.position);fv.set(0,0,0)}if(m===1)chYaw=yaw}

await PG(97,'Karakter');
// ---- ambil / pegang / lepas bunga & lentera, lompat, emoji, skin ----
const fgm=new THREE.MeshLambertMaterial({color:0x4f8f3a,side:THREE.DoubleSide}),zm=new THREE.Matrix4().makeScale(0,0,0),
 EM=[['😊',4,'✨'],['😂',5,'😂'],['😭',6,'💧'],['🥰',7,'❤️'],['😡',8,'💢'],['💐',9,'🌸'],['💍',1,'✨'],['👋',3,'👋'],['👍',10,'👍'],['🎉',11,'🎊'],['🙏',12,'✨'],['💃',13,'🎵']],
 PD={1:1e9,3:3.5,4:5,5:4,6:4.5,7:5,8:4,9:5,10:3.5,11:5,12:4.5,13:7},FC=[0xff8fb8,0xe0303a,0xffd84a,0xb58cff,0xffffff];
const EMm=Object.fromEntries(EM.map(x=>[x[0],x[2]]));
function mkFlower(hex,k){const g=new THREE.Group(),st=new THREE.Mesh(stemG,fgm),hd=new THREE.Group();st.scale.set(1.2,.5,1.2);hd.position.y=.5;hd.scale.setScalar(1.5);
 hd.add(new THREE.Mesh(petalGeo(7,.12,.05,.025,.3),new THREE.MeshLambertMaterial({color:hex,side:THREE.DoubleSide,emissive:0x2a1a1a})),new THREE.Mesh(new THREE.OctahedronGeometry(.026),new THREE.MeshLambertMaterial({color:0xf0b429,emissive:0x553300})));
 g.add(st,hd);g.scale.setScalar(k);return g}
function rmFl(f){f.on=0;fS.setMatrixAt(f.i,zm);fS.instanceMatrix.needsUpdate=true;const m=f.t?fC:fR;m.setMatrixAt(f.k,zm);m.instanceMatrix.needsUpdate=true;if(!f.t){fK.setMatrixAt(f.k,zm);fK.instanceMatrix.needsUpdate=true}}
function clrFl(){tmpF=0;if(flw){flw.parent.remove(flw);cflw.parent.remove(cflw);flw=cflw=null}hasF=0}
function setFl(hex){clrFl();hasF=hex;flw=mkFlower(hex,1);flw.position.y=-.12;hand.add(flw);cflw=mkFlower(hex,1.1);cflw.position.y=-.3;arms[1].fo.add(cflw)}
function relight(){const h=dropL||(camMode===0?lan:clan);h.add(lt);h.add(lg)}
function doPick(){
 if(nearD){const d=nearD;scene.remove(d.g);drops.splice(drops.indexOf(d),1);if(d.ty==='l'){hasL=true;dropL=null;held='l';relight()}else{setFl(d.c);held='f'}}
 else if(nearF){const f=nearF;rmFl(f);setFl(f.c);held='f'}}
function doDrop(){const x=pos.x-Math.sin(yaw)*.9,z=pos.z-Math.cos(yaw)*.9,gy=pier(x,z)?.91:Math.max(H(x,z),.05);
 if(held==='l'){const g=new THREE.Group();lantern(g);g.scale.setScalar(2.2);g.position.set(x,gy+.75,z);scene.add(g);drops.push({g,ty:'l',x,z});dropL=g;hasL=false;held=hasF?'f':null;relight()}
 else if(held==='f'){const g=mkFlower(hasF,1.7);g.position.set(x,gy,z);scene.add(g);drops.push({g,ty:'f',x,z,c:hasF});clrFl();held=hasL?'l':null}}
function uiSet(b,s,t){s=!!s;if(b.hidden===s)b.hidden=!s;if(s&&b.textContent!==t)b.textContent=t}
function jump(){if(curMap==='parkour'){if(playing&&camMode!==2)PK.buf=.15;return}if(jh===0&&playing&&!sit&&camMode!==2)jvv=5.4}
function doEmo(i){const[e,p,ef]=EM[i];if(sit)sit=null;emo=e;emoT=T;emoN++;pose=p;poseT=T+PD[p];
 if(p===9&&!hasF){setFl(FC[(rnd()*FC.length)|0]);tmpF=1}
 if((p===1||p===9)&&hasF)held='f';
 if(camMode===0){setCam(1);emoBack=1} // POV tidak melihat badan sendiri, jadi pindah ke kamera "Diri" selama emosi
 fxBurst(pos.x,py+1.9,pos.z,ef,6)}
function mkTag(){const c=document.createElement('canvas');c.width=256;c.height=128;const t=new THREE.CanvasTexture(c),sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false}));sp.scale.set(1.6,.8,1);sp.position.y=2.25;return{s:sp,c,t,n:'',e:''}}
function tagDraw(g,n,e){if(g.n===n&&g.e===e)return;g.n=n;g.e=e;const x=g.c.getContext('2d');x.clearRect(0,0,256,128);x.textAlign='center';x.textBaseline='middle';
 if(e){x.font='60px sans-serif';x.fillText(e,128,36)}x.font='700 24px "National Park",Overpass,sans-serif';
 const w=Math.min(244,x.measureText(n).width+26);x.fillStyle='rgba(30,77,54,.9)';x.beginPath();(x.roundRect||x.rect).call(x,128-w/2,82,w,36,9);x.fill();
 x.fillStyle='#f3f6ef';x.fillText(n,128,101,232);g.t.needsUpdate=true}
const myFace=mkFace(),myTag=mkTag(),myBub=mkBub(),myVoi=mkVoi(),ep=$('epan'),kp=$('kpan'),pkB=$('pk'),swB=$('sw'),drB=$('dr'),bt2=(b,f)=>b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();f()});
EM.forEach(([e],i)=>{const b=document.createElement('button');b.textContent=e;bt2(b,()=>{doEmo(i);ep.hidden=true});ep.appendChild(b)});
kp.innerHTML='<label class="nmf">Nama<input id="nm" class="in" maxlength="12" placeholder="Nama kamu"></label><div id="kg"></div>';
SK.forEach((S,i)=>{const b=document.createElement('button');b.type='button';b.className='ks';b.innerHTML='<img alt=""><span></span>';b.lastChild.textContent=S.n;b.onclick=()=>setSkin(i);$('kg').appendChild(b)});
function setSkin(i){skI=i;if(ch)scene.remove(ch);const a=mkAv(i),S=SK[i];ch=a.g;chA=a;legs=a.legs;arms=a.arms;ch.visible=camMode!==0;scene.add(ch);
 arms[1].fo.add(clan);clan.position.y=-.3;if(cflw)arms[1].fo.add(cflw);ch.add(myTag.s,myBub.s,myVoi.s,myFace.s);skin.color.setHex(S.hand||S.sk);cloth.color.setHex(S.arm||S.co);
 kp.querySelectorAll('.ks').forEach((b,j)=>b.classList.toggle('on',j===i));try{localStorage.setItem('wsk',i)}catch(e){}}
let si=0;try{si=+localStorage.getItem('wsk')||0}catch(e){}setSkin(SK[si]?si:0);
// foto tiap skin untuk lemari skin, dirender sekali dari model aslinya
function snapSkins(){const W=360,V=450,rt=new THREE.WebGLRenderTarget(W,V),sc2=new THREE.Scene(),cm=new THREE.PerspectiveCamera(30,W/V,.1,20),old=ren.getClearColor(new THREE.Color()),al=ren.getClearAlpha(),
 buf=new Uint8Array(W*V*4),big=document.createElement('canvas'),bx=big.getContext('2d'),out=document.createElement('canvas'),ox=out.getContext('2d');big.width=W;big.height=V;out.width=180;out.height=225;
 sc2.add(new THREE.HemisphereLight(0xffffff,0x6b7280,.85));const sun=new THREE.DirectionalLight(0xfff1dd,.55);sun.position.set(-.6,.8,-1);sc2.add(sun);
 cm.position.set(-1.1,1.55,-3.6);cm.lookAt(0,1.06,0);
 try{ren.setClearColor(0x000000,0);ren.setRenderTarget(rt);
  document.querySelectorAll('#kg img').forEach((img,i)=>{const a=mkAv(i);a.arms[0].up.rotation.z=-.16;a.arms[1].up.rotation.z=.16;sc2.add(a.g);ren.render(sc2,cm);ren.readRenderTargetPixels(rt,0,0,W,V,buf);
   const im=bx.createImageData(W,V);for(let y=0;y<V;y++)im.data.set(buf.subarray((V-1-y)*W*4,(V-y)*W*4),y*W*4);bx.putImageData(im,0,0);ox.clearRect(0,0,180,225);ox.drawImage(big,0,0,180,225);img.src=out.toDataURL();
   sc2.remove(a.g);a.g.traverse(o=>{if(o.geometry){o.geometry.dispose();o.material.dispose()}})})
 }catch(e){console.warn(e)}
 ren.setRenderTarget(null);ren.setClearColor(old,al);rt.dispose()}
snapSkins();
bt2(pkB,doPick);bt2(swB,()=>{held=held==='l'?'f':'l'});bt2(drB,doDrop);bt2($('jmp'),jump);
const PN={m:$('mpan'),k:kp,s:$('spn'),e:ep,c:$('cin')};
function pnl(n){const open=n&&PN[n].hidden;for(const k in PN)PN[k].hidden=true;if(open){PN[n].hidden=false;if(n==='c')$('ci').focus();if(n==='m')covPump()}else $('ci').blur();$('hud').classList.toggle('ty',!!open&&n==='c')}
bt2($('ebtn'),()=>pnl('e'));bt2($('kbtn'),()=>pnl('k'));bt2($('sbtn'),()=>pnl('s'));$('mbtn').onclick=()=>pnl('m');

// ---- efek emoji: partikel melayang + animasi tubuh ----
let DT=.016;const fxs=[],efx={};
function etex(e){return efx[e]||(efx[e]=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.font='46px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(e,32,36);return new THREE.CanvasTexture(c)})())}
function fxBurst(x,y,z,e,n){for(let i=0;i<n&&fxs.length<28;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:etex(e),transparent:true,depthWrite:false,fog:false,opacity:0}));sp.scale.setScalar(.4);sp.position.set(x+(rnd()-.5)*.6,y,z+(rnd()-.5)*.6);scene.add(sp);fxs.push({s:sp,d:i*.12,t:0,vx:(rnd()-.5)*.8,vz:(rnd()-.5)*.8,vy:.9+rnd()*.6,L:1.8+rnd()*.8})}}
function fxUpd(dt){for(let i=fxs.length-1;i>=0;i--){const f=fxs[i];if(f.d>0){f.d-=dt;continue}f.t+=dt;const k=f.t/f.L;f.s.position.x+=f.vx*dt;f.s.position.y+=f.vy*dt;f.s.position.z+=f.vz*dt;f.s.material.opacity=Math.sin(Math.min(1,k)*PI);f.s.scale.setScalar(.3+.4*Math.min(1,k*3));if(k>=1){scene.remove(f.s);f.s.material.dispose();fxs.splice(i,1)}}}
// pose: 4 senang(goyang) 5 tawa 6 nangis 7 cinta 8 marah 9 tunduk+bunga 10 jempol 11 pesta 12 doa 13 joget
function emoAnim(a,po,tt,st){
 let e=a.ek||0;e+=((po>=4?1:0)-e)*Math.min(1,DT*8);a.ek=e;
 if(e<.005){a.ek=0;if(a.on){a.on=0;a.tor.rotation.set(0,0,0);a.g.rotation.z=0;for(const r of a.arms)r.up.rotation.z=0}return 0}
 a.on=1;if(po>=4)a.p0=po;
 const A=a.arms,L=a.legs,s1=Math.sin(tt*5),s2=Math.sin(tt*10),s3=Math.sin(tt*14);
 let tx=0,ty=0,tz=0,gz=0,by=0,a0=[0,0,0],a1=[0,0,0],l0=null,l1=null;
 switch(a.p0){
  case 4:tz=s1*.15;gz=-s1*.05;by=Math.abs(s1)*.07;a0=[2.7+s2*.3,-.5,.3];a1=[2.7-s2*.3,.5,.3];l0=[Math.max(0,s1)*.35,-Math.max(0,s1)*.5];l1=[Math.max(0,-s1)*.35,-Math.max(0,-s1)*.5];break;
  case 5:tx=.25+s3*.06;by=Math.abs(Math.sin(tt*11))*.05;a0=[.6,.25,1.7];a1=[.6,-.25,1.7];break;
  case 6:tx=-.38;tz=s3*.03;a0=[2.2+s3*.05,.2,2];a1=[2.2-s3*.05,-.2,2];break;
  case 7:tz=Math.sin(tt*2.2)*.1;gz=-tz*.5;a0=[.7,.55,2.1];a1=[.7,-.55,2.1];break;
  case 8:{const q=Math.sin(tt*9)>0;tx=-.15;ty=Math.sin(tt*16)*.06;by=Math.abs(Math.sin(tt*9))*.03;a0=[.3,-.1,1.8];a1=[.3,.1,1.8];l0=[q?.5:0,q?-.5:0];l1=[q?0:.5,q?0:-.5];break}
  case 9:tx=-1+Math.sin(tt*2)*.04;a0=[-.5,0,.2];a1=[1.55,0,.4];break;
  case 10:tx=-.06+Math.sin(tt*7)*.05;a1=[1,0,1.9];break;
  case 11:{const q=Math.sin(tt*12);tz=Math.sin(tt*7)*.1;by=Math.abs(Math.sin(tt*7))*.18;a0=[2.8+q*.3,-.4,.2];a1=[2.8-q*.3,.4,.2];l0=l1=[.3,-.5];break}
  case 12:tx=-.3+Math.sin(tt*1.5)*.04;a0=[1,.4,1.7];a1=[1,-.4,1.7];break;
  case 13:{const q=Math.sin(tt*6);tz=q*.2;ty=Math.sin(tt*3)*.5;gz=-q*.08;by=Math.abs(q)*.1;a0=[2.3+q*.6,-.5,.5];a1=[2.3-q*.6,.5,.5];l0=[q*.5,-Math.max(0,-q)*.7];l1=[-q*.5,-Math.max(0,q)*.7];break}
 }
 const bl=(o,k,v)=>{o[k]+=(v-o[k])*e},tr=a.tor.rotation;
 bl(tr,'x',tx);bl(tr,'y',ty);bl(tr,'z',tz);bl(a.g.rotation,'z',gz);
 for(const[i,v]of[[0,a0],[1,a1]]){bl(A[i].up.rotation,'x',v[0]);bl(A[i].up.rotation,'z',v[1]);bl(A[i].fo.rotation,'x',v[2])}
 if(!st)for(const[i,v]of[[0,l0],[1,l1]])if(v){bl(L[i].th.rotation,'x',v[0]);bl(L[i].sh.rotation,'x',v[1])}
 return by*e}

// ---- suara: tahan untuk bicara, hanya terdengar pemain di dekat (PCM u-law 12 kHz lewat Realtime Broadcast) ----
const VR=30,VSR=12000,MUL=new Float32Array(256);for(let i=0;i<256;i++){const y=(i-128)/127;MUL[i]=Math.sign(y)*(Math.pow(256,Math.abs(y))-1)/255}
const enMu=x=>{x=x>1?1:x<-1?-1:x;return Math.round(Math.sign(x)*Math.log(1+255*Math.abs(x))/Math.log(256)*127)+128};
let vst=null,vOn=0,vLast=0,vSeq=0,vIdle=0,vVol=1,vLv=0;const VS={};
function toast(t){const o=$('toast');o.textContent=t;o.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>o.classList.remove('on'),2600)}
function mkVoi(){const c=document.createElement('canvas');c.width=128;c.height=64;const t=new THREE.CanvasTexture(c),sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false}));sp.scale.set(.9,.45,1);sp.position.y=2.75;sp.visible=false;return{s:sp,c,t,lt:0}}
function voiDraw(v,lv,now){if(now-v.lt<90)return;v.lt=now;const x=v.c.getContext('2d');x.clearRect(0,0,128,64);x.fillStyle='rgba(22,58,41,.92)';x.beginPath();(x.roundRect||x.rect).call(x,14,10,100,44,22);x.fill();
 for(let i=0;i<5;i++){const hh=6+Math.min(1,lv)*26*(.45+.55*Math.abs(Math.sin(now*.012+i*1.7)));x.fillStyle='#ffc53d';x.fillRect(32+i*14,32-hh/2,8,hh)}v.t.needsUpdate=true}
async function vStart(){
 if(vOn||!playing)return;vOn=1;$('vbtn').classList.add('on');$('vtag').classList.add('on');
 try{
  if(!ac){vStop();return}
  if(ac.state!=='running')await ac.resume();
  if(!vst){const ms=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}}),
   src=ac.createMediaStreamSource(ms),pr=ac.createScriptProcessor(4096,1,1),mute=ac.createGain();mute.gain.value=0;src.connect(pr);pr.connect(mute);mute.connect(ac.destination);pr.onaudioprocess=vProc;vst={ms,src,pr}}
  clearTimeout(vIdle);vst.ms.getAudioTracks().forEach(t=>t.enabled=!!vOn)
 }catch(e){vStop();toast(e&&e.name==='NotAllowedError'?'Izin mikrofon ditolak':'Mikrofon tidak tersedia')}}
function vStop(){vOn=0;vLv=0;$('vbtn').classList.remove('on');$('vtag').classList.remove('on');$('vbtn').style.setProperty('--lv',0);
 if(vst){vst.ms.getAudioTracks().forEach(t=>t.enabled=false);clearTimeout(vIdle);vIdle=setTimeout(()=>{if(vst&&!vOn){vst.ms.getTracks().forEach(t=>t.stop());try{vst.pr.disconnect();vst.src.disconnect()}catch(e){}vst.pr.onaudioprocess=null;vst=null}},8000)}}
function vProc(ev){
 if(!vOn)return;const inp=ev.inputBuffer.getChannelData(0),r=ac.sampleRate/VSR,n=Math.floor(inp.length/r),out=new Uint8Array(n);let sum=0;
 for(let i=0;i<n;i++){const a=Math.floor(i*r),b=Math.max(a+1,Math.floor((i+1)*r));let s=0;for(let j=a;j<b;j++)s+=inp[j];s/=b-a;sum+=s*s;out[i]=enMu(s*1.6)}
 const rms=Math.sqrt(sum/n),now=performance.now();vLv=Math.min(1,rms*7);
 if(rms>.01)vLast=now;if(now-vLast>350||!rm)return; // hening tidak dikirim
 let near=false;for(const id in RP){const p=RP[id];if(Math.hypot(p.x-pos.x,p.z-pos.z)<VR+10){near=true;break}}if(!near)return; // tidak ada yang dekat = tidak dikirim
 rm.send({type:'broadcast',event:'vo',payload:{id:myId,a:btoa(String.fromCharCode.apply(null,out)),q:vSeq++,x:+pos.x.toFixed(1),z:+pos.z.toFixed(1)}})}
function onVo(d){
 if(!d||typeof d.id!=='string'||d.id===myId||d.id.length>12||typeof d.a!=='string'||d.a.length>6000||!ac||!playing||vVol<=0)return;
 const lx=camMode===2?fc.x:pos.x,lz=camMode===2?fc.z:pos.z,p=RP[d.id],sx=Number.isFinite(d.x)?d.x:p&&p.x,sz=Number.isFinite(d.z)?d.z:p&&p.z;
 if(!Number.isFinite(sx)||!Number.isFinite(sz))return;
 const dx=sx-lx,dz=sz-lz,dist=Math.hypot(dx,dz);if(dist>VR)return; // di luar jangkauan: abaikan
 let u;try{u=atob(d.a)}catch(e){return}
 const n=u.length;if(n<64||n>4000)return;
 let v=VS[d.id];if(!v){const g=ac.createGain(),f=ac.createBiquadFilter(),pn=ac.createStereoPanner?ac.createStereoPanner():null;f.type='lowpass';g.connect(f);if(pn){f.connect(pn);pn.connect(ac.destination)}else f.connect(ac.destination);v=VS[d.id]={g,f,pn,nx:0}}
 const t01=Math.max(0,(dist-3)/(VR-3)),now=ac.currentTime; // makin jauh makin pelan dan makin teredam
 v.g.gain.setTargetAtTime(Math.pow(1-t01,2)*vVol*1.4,now,.05);v.f.frequency.setTargetAtTime(Math.max(500,7000*Math.pow(1-t01,1.6)),now,.05);
 if(v.pn)v.pn.pan.setTargetAtTime(dist>.5?(dx*Math.cos(yaw)-dz*Math.sin(yaw))/dist*.8:0,now,.05);
 const buf=ac.createBuffer(1,n,VSR),c0=buf.getChannelData(0);let sum=0;for(let i=0;i<n;i++){const x=MUL[u.charCodeAt(i)];c0[i]=x;sum+=x*x}
 const s=ac.createBufferSource();s.buffer=buf;s.connect(v.g);
 let t=v.nx;if(t<now+.02||t>now+.7)t=now+.14;s.start(t);v.nx=t+buf.duration;
 if(p){p.vt=performance.now();p.vl=Math.min(1,Math.sqrt(sum/n)*5)}}
const vb=$('vbtn');vb.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();try{vb.setPointerCapture(e.pointerId)}catch(x){}vStart()});
for(const ev of['pointerup','pointercancel','lostpointercapture'])vb.addEventListener(ev,vStop);

// ---- online: Supabase Realtime (Broadcast) + chat ----
const SB_URL='https://auuxsaglrtiplmfnjxvx.supabase.co',SB_KEY='sb_publishable_Izx8pzbgmT8e2s1T_8cgeA_8Obcg5Lt',myId=Math.random().toString(36).slice(2,8),RP={};
let rm=null,sbc=null,onN=-1,lastS='',lastT=0,lastC=0;
try{myName=localStorage.getItem('wnm')||''}catch(e){}myName=myName||'Pemain'+((Math.random()*900+100)|0);$('nm').value=myName;
$('nm').oninput=e=>{myName=e.target.value.trim().slice(0,16)||'Pemain';try{localStorage.setItem('wnm'+(acct?acct.id:''),myName)}catch(x){}};
function sendMe(){if(!rm||!playing)return;
 const o={id:myId,x:+pos.x.toFixed(2),z:+pos.z.toFixed(2),y:+(curMap==='parkour'?PK.y:jh).toFixed(2),r:+(camMode===0?yaw:chYaw).toFixed(2),s:skI,n:(isAdm?'\u{1F451} ':'')+myName,h:held==='l'?1:held==='f'?2:0,c:hasF|0,e:emo,en:emoN,po:pose,v:+Math.hypot(vel.x,vel.z).toFixed(1)},k=JSON.stringify(o),now=performance.now();
 if(k===lastS&&now-lastT<1500)return;lastS=k;lastT=now;rm.send({type:'broadcast',event:'st',payload:o})}
function setHeld(p,h,c){if(p.hh===h&&p.hc===c)return;p.hh=h;p.hc=c;if(p.hm){p.hm.parent.remove(p.hm);p.hm=null}
 if(h===1){const g=new THREE.Group();lantern(g);const l=glow(0xffb060,.6,.6);l.position.y=-.26;g.add(l);p.hm=g}else if(h===2)p.hm=mkFlower(c||0xff8fb8,1.1);
 if(p.hm){p.a.arms[1].fo.add(p.hm);p.hm.position.y=-.3}}
function onSt(d){if(!d||typeof d.id!=='string'||d.id===myId||d.id.length>12||!Number.isFinite(d.x)||!Number.isFinite(d.z))return;const id=d.id;
 let p=RP[id];if(p&&p.s!==(d.s|0)){scene.remove(p.g);delete RP[id];p=null}
 if(!p){const a=mkAv(d.s|0),tg2=mkTag();a.g.add(tg2.s);a.g.position.set(d.x,0,d.z);scene.add(a.g);p=RP[id]={a,tg:tg2,g:a.g,s:d.s|0,ph:0,en:d.en|0,eA:0,n:'',hh:-1,hc:0,hm:null,bub:null,sn:0,cy:+d.y||0}}
 p.sn=performance.now();p.x=d.x;p.z=d.z;p.y=+d.y||0;p.yaw=+d.r||0;p.v=+d.v||0;p.po=d.po|0;
 const nm=String(d.n||'?').slice(0,19);if(p.n!==nm){p.n=nm;tagDraw(p.tg,nm,p.e||'')}
 setHeld(p,d.h|0,d.c|0);
 const em=String(d.e||'').slice(0,8);if(em!==p.e){p.e=em;tagDraw(p.tg,p.n,em)}
 if((d.en|0)!==p.en){p.en=d.en|0;const ef=EMm[d.e];if(ef)fxBurst(p.g.position.x,p.g.position.y+1.9,p.g.position.z,ef,5)}}
function onBye(d){if(d&&RP[d.id]){scene.remove(RP[d.id].g);delete RP[d.id]}if(d&&VS[d.id]){try{VS[d.id].g.disconnect()}catch(e){}delete VS[d.id]}}
// chat: gelembung di atas kepala + log kecil
function mkBub(){const c=document.createElement('canvas');c.width=512;c.height=176;const t=new THREE.CanvasTexture(c),sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false}));sp.scale.set(3.4,1.17,1);sp.position.y=3.3;sp.visible=false;return{s:sp,c,t,at:0}}
function bubSay(b,txt){const x=b.c.getContext('2d');x.clearRect(0,0,512,176);x.font='600 28px Overpass,sans-serif';
 const L=[];let cur='';for(const w of txt.split(' ')){const tt=cur?cur+' '+w:w;if(x.measureText(tt).width>440&&cur){L.push(cur);cur=w}else cur=tt}L.push(cur);
 const ln=L.slice(0,3),h=ln.length*34+22,y0=164-h;x.fillStyle='rgba(243,246,239,.96)';x.beginPath();(x.roundRect||x.rect).call(x,20,y0,472,h,18);x.fill();
 x.fillStyle='#12291d';x.textAlign='center';x.textBaseline='middle';ln.forEach((l,i)=>x.fillText(l,256,y0+22+i*34,440));b.t.needsUpdate=true;b.s.visible=true;b.at=performance.now()}
function logChat(n,t){const l=$('clog'),d=document.createElement('div'),b=document.createElement('b');b.textContent=n+': ';d.append(b,t);l.appendChild(d);while(l.children.length>5)l.firstChild.remove();setTimeout(()=>d.remove(),12000)}
function onChat(d){if(!d||typeof d.id!=='string'||d.id===myId)return;const t=String(d.t||'').slice(0,80);if(!t)return;logChat(String(d.n||'?').slice(0,16),t);
 const p=RP[d.id];if(p){if(!p.bub){p.bub=mkBub();p.g.add(p.bub.s)}bubSay(p.bub,t)}}
function sendChat(){const i=$('ci'),t=i.value.trim().slice(0,80);i.value='';pnl();if(!t||performance.now()-lastC<700)return;lastC=performance.now();
 logChat(myName,t);bubSay(myBub,t);if(rm)rm.send({type:'broadcast',event:'chat',payload:{id:myId,n:myName,t}});
 if(sbc)sbc.from('walk_chat').insert({name:myName,msg:t,map:curMap||'sakura'}).then(()=>{},()=>{})}
function openChat(){if(playing)pnl('c')}
bt2($('chb'),openChat);bt2($('cs'),sendChat);
$('ci').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();sendChat()}else if(e.key==='Escape'){pnl()}};
async function loadHist(){try{const r=await sbc.from('walk_chat').select('name,msg').eq('map',curMap||'sakura').gte('created_at',new Date(Date.now()-30000).toISOString()).order('created_at',{ascending:false}).limit(5);if(r.data)r.data.reverse().forEach(m=>logChat(String(m.name).slice(0,16),String(m.msg).slice(0,80)))}catch(e){}}
function connect(){if(!window.supabase)return;try{
 sbc=supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:40}}});
 }catch(e){}}
function rpUpd(dt){const k=1-Math.exp(-9*dt),now=performance.now();let n=0;if(myBub.s.visible&&now-myBub.at>6000)myBub.s.visible=false;
 for(const id in RP){const p=RP[id];n++;if(now-p.sn>12000){scene.remove(p.g);delete RP[id];n--;continue}if(p.bub&&p.bub.s.visible&&now-p.bub.at>6000)p.bub.s.visible=false;
  
  const g=p.g;g.position.x+=(p.x-g.position.x)*k;g.position.z+=(p.z-g.position.z)*k;
  let d=p.yaw-g.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));g.rotation.y+=d*k;
  if(curMap==='parkour'){p.cy+=(p.y-p.cy)*Math.min(1,dt*14);g.position.y=p.cy}else g.position.y=(pier(g.position.x,g.position.z)?.91:H(g.position.x,g.position.z))+p.y-(p.po===1?.45:0);
  p.ph+=p.v*.5*dt;animAv(p.a,Math.min(1,p.v/3)*.75,Math.sin(p.ph*PI),p.po===1,p.po===3,false);g.position.y+=emoAnim(p.a,p.po,T,false);
  if(now-(p.vt||0)<400){if(!p.voi){p.voi=mkVoi();g.add(p.voi.s)}p.voi.s.visible=true;voiDraw(p.voi,p.vl||0,now)}else if(p.voi)p.voi.s.visible=false;
  const a1=p.a.arms[1];if(p.hm)p.hm.rotation.x=-(a1.up.rotation.x+a1.fo.rotation.x);
  if(p.eA&&now-p.eA>4000){p.eA=0;tagDraw(p.tg,p.n,'')}}
 const kk=rm?n+1:-1;if(onN!==kk){onN=kk;onlDraw(rm?n+1:0)}}
function onlDraw(n){const m=MAPS[curMap],o=$('onl'),t=n?n+' pemain':'Main sendiri';
 o.innerHTML='<i></i><b></b><span></span>';o.children[0].style.background=m?m.c:'';o.children[1].textContent=m?m.n:'';o.children[2].textContent=t;$('pkn').textContent=t}

/* ---------- input ---------- */
let jx=0,jy=0,run=false,yaw=0,pitch=.2,playing=false,jid=null,lid=null,lx=0,ly=0;
const jb=$('jb'),jk=$('jk'),K={};
function jset(e){const r=jb.getBoundingClientRect(),q=r.width/2;let dx=e.clientX-(r.left+q),dy=e.clientY-(r.top+q);
 const d=Math.hypot(dx,dy),m=Math.min(d,q*.75);if(d>0){dx*=m/d;dy*=m/d}
 jk.style.transform=`translate(${dx}px,${dy}px)`;jx=dx/(q*.75);jy=-dy/(q*.75)}
jb.addEventListener('pointerdown',e=>{jid=e.pointerId;jb.setPointerCapture(jid);jset(e)});
jb.addEventListener('pointermove',e=>{if(e.pointerId===jid)jset(e)});
const jend=e=>{if(e.pointerId===jid){jid=null;jx=jy=0;jk.style.transform=''}};
jb.addEventListener('pointerup',jend);jb.addEventListener('pointercancel',jend);
cv.addEventListener('pointerdown',e=>{if(!playing||lid!==null)return;lid=e.pointerId;lx=e.clientX;ly=e.clientY;cv.setPointerCapture(lid)});
cv.addEventListener('pointermove',e=>{if(e.pointerId!==lid)return;yaw-=(e.clientX-lx)*.005;pitch=Math.max(-1.2,Math.min(1.2,pitch-(e.clientY-ly)*.005));lx=e.clientX;ly=e.clientY});
const lend=e=>{if(e.pointerId===lid)lid=null};cv.addEventListener('pointerup',lend);cv.addEventListener('pointercancel',lend);
$('run').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();run=!run;$('run').classList.toggle('on',run)});
onkeydown=e=>{if(e.target.tagName==='INPUT')return;if(e.code==='Enter'){openChat();return}K[e.code]=1;if(e.code==='Space')jump();if(e.code==='KeyV'&&!e.repeat)vStart()};onkeyup=e=>{K[e.code]=0;if(e.code==='KeyV')vStop()};
const chk=()=>document.body.classList.toggle('portrait',innerHeight>innerWidth);
function rs(){ren.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();chk()}
addEventListener('resize',rs);addEventListener('orientationchange',rs);rs();

// gyro HP sebagai sensor gerak kamera, pengaturan, tombol kamera
let gyroOn=true,pgy=null,pgp=0,gyroL=false;try{gyroOn=localStorage.getItem('wg')!=='0'}catch(e){}
const gE=new THREE.Euler(),gQ=new THREE.Quaternion(),gQ1=new THREE.Quaternion(-Math.sqrt(.5),0,0,Math.sqrt(.5)),gQ0=new THREE.Quaternion(),gZ=new THREE.Vector3(0,0,1);
function onGyro(e){
 if(!gyroOn||e.alpha==null||e.beta==null)return;
 const d=PI/180,o=((screen.orientation&&screen.orientation.angle)||window.orientation||0)*d;
 gE.set(e.beta*d,e.alpha*d,-e.gamma*d,'YXZ');gQ.setFromEuler(gE);gQ.multiply(gQ1);gQ.multiply(gQ0.setFromAxisAngle(gZ,-o));
 gE.setFromQuaternion(gQ,'YXZ');
 if(pgy!==null&&playing){let dy=gE.y-pgy;dy=Math.atan2(Math.sin(dy),Math.cos(dy));yaw+=dy;pitch=Math.max(-1.45,Math.min(1.45,pitch+gE.x-pgp))}
 pgy=gE.y;pgp=gE.x}
function reqGyro(){
 if(!gyroOn||gyroL)return;
 const D=typeof DeviceOrientationEvent!=='undefined'?DeviceOrientationEvent:null,on=()=>{gyroL=true;addEventListener('deviceorientation',onGyro)};
 if(D&&D.requestPermission)D.requestPermission().then(r=>{if(r==='granted')on()}).catch(()=>{});else on()}
$('gy').checked=gyroOn;
$('gy').onchange=e=>{gyroOn=e.target.checked;pgy=null;try{localStorage.setItem('wg',gyroOn?'1':'0')}catch(x){}if(gyroOn)reqGyro()};

$('cbtn').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();emoBack=0;setCam((camMode+1)%3)});
$('quit').addEventListener('click',()=>{if(rm)rm.send({type:'broadcast',event:'bye',payload:{id:myId}});lastS='';$('cin').hidden=true;ep.hidden=kp.hidden=true});
$('quit').onclick=()=>{ // keluar = kembali ke menu utama
 
 if(REC.st!=='idle')recStop();vStop();fcStop();playing=false;sit=null;run=false;$('run').classList.remove('on');setCam(0);$('spn').hidden=true;
 $('menu').classList.remove('off');$('hud').classList.remove('on');leaveMap();pos.x=0;pos.z=R+11;vel.x=vel.z=0;yaw=0;pitch=.2};

/* ---------- audio ---------- */
const bgm=$('bgm'),mbtn=$('mbtn'),mpan=$('mpan'),ml=$('ml'),AUD=/\.(mp3|m4a|ogg|wav|aac|flac)$/i;let ac,nb,lib=[],cur=null;
const LS=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:+v}catch(e){return d}},SS=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
bgm.volume=LS('wvm',60)/100;let ambVol=LS('wva',45)/100;vVol=LS('wvv',100)/100; // musik hanya diputar lokal di perangkat pemain ini, tidak pernah dikirim ke pemain lain
// lagu disimpan di browser, jadi cukup dipilih sekali
const db=new Promise(r=>{try{const q=indexedDB.open('walk',1);q.onupgradeneeded=()=>q.result.createObjectStore('s',{keyPath:'name'});q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}catch(e){r(null)}});
const dbPut=async f=>{const d=await db;try{d&&d.transaction('s','readwrite').objectStore('s').put({name:f.name,blob:f})}catch(e){}};
async function cover(rd){ // sampul bawaan mp3 (tag ID3v2, frame APIC)
 try{
  const h=await rd(0,9);
  if(h[0]!==73||h[1]!==68||h[2]!==51||h[3]<3)return null;
  const v=h[3],sz=((h[6]&127)<<21)|((h[7]&127)<<14)|((h[8]&127)<<7)|(h[9]&127);if(!sz)return null;const u=await rd(10,9+sz);
  let p=0;
  if(h[5]&64)p=v===4?((u[0]&127)<<21)|((u[1]&127)<<14)|((u[2]&127)<<7)|(u[3]&127):4+((u[0]<<24)|(u[1]<<16)|(u[2]<<8)|u[3]);
  while(p+10<u.length){
   const id=String.fromCharCode(u[p],u[p+1],u[p+2],u[p+3]);
   const n=v===4?((u[p+4]&127)<<21)|((u[p+5]&127)<<14)|((u[p+6]&127)<<7)|(u[p+7]&127):((u[p+4]<<24)|(u[p+5]<<16)|(u[p+6]<<8)|u[p+7]);
   if(!u[p]||n<=0)break;
   if(id==='APIC'){
    let q=p+10,e=u[q++],mt='';
    while(q<u.length&&u[q])mt+=String.fromCharCode(u[q++]);
    q+=2;
    if(e===1||e===2){while(q<u.length&&(u[q]||u[q+1]))q+=2;q+=2}else{while(q<u.length&&u[q])q++;q++}
    return new Blob([u.subarray(q,p+10+n)],{type:mt.includes('/')?mt:'image/jpeg'})}
   p+=10+n}
 }catch(e){}
 return null}
async function rng(u,a,b){const ct=new AbortController();try{const r=await fetch(u,{headers:{Range:`bytes=${a}-${b}`},signal:ct.signal});if(r.status!==206){ct.abort();return null}return new Uint8Array(await r.arrayBuffer())}catch(e){return null}} // server tanpa Range: batalkan, jangan unduh seluruh file
// sampul dibaca malas (hanya saat panel musik dibuka), satu per satu, dan dikecilkan -> tidak membuat lag
const covQ=[];let covBusy=0,covOn=0;
async function thumb(bl){try{const bm=await createImageBitmap(bl,{resizeWidth:72,resizeHeight:72,resizeQuality:'low'}),c=document.createElement('canvas');c.width=c.height=72;c.getContext('2d').drawImage(bm,0,0);if(bm.close)bm.close();return c.toDataURL('image/jpeg',.72)}catch(e){return null}}
async function covPump(){covOn=1;if(covBusy)return;covBusy=1;while(covQ.length){const s=covQ.shift();try{const bl=await cover(s.rd);if(bl){const t=await thumb(bl);if(t){s.img=t;if(s.el)s.el.firstChild.style.backgroundImage=`url(${t})`}}}catch(e){}await new Promise(r=>setTimeout(r,160))}covBusy=0}
// lagu otomatis: baca isi repo GitHub tempat game ini di-host
const GH=(()=>{const m=location.hostname.match(/^([^.]+)\.github\.io$/);return m?{o:m[1],r:location.pathname.split('/')[1]||location.hostname,same:1}:{o:'NaraToMajid',r:'Walk'}})();
async function repoSongs(){
 let L;
 try{
  const r=await fetch(`https://api.github.com/repos/${GH.o}/${GH.r}/contents/`);if(!r.ok)throw 0;
  L=(await r.json()).filter(x=>x.type==='file'&&AUD.test(x.name)).map(x=>({name:x.name,url:GH.same?new URL(encodeURIComponent(x.name),location.href).href:x.download_url}));
  try{localStorage.setItem('wl',JSON.stringify(L))}catch(e){}
 }catch(e){try{L=JSON.parse(localStorage.getItem('wl'))}catch(e2){}}
 for(const s of L||[]){
  if(lib.some(t=>t.name===s.name))continue;
  s.title=s.name.replace(/\.[^.]+$/,'');s.img=null;lib.push(s);
  s.rd=(a,b)=>rng(s.url,a,b);covQ.push(s)}
 lib.sort((a,b)=>a.title.localeCompare(b.title));draw();if(covOn)covPump()}
async function addFiles(fs,save=true){
 for(const f of fs){
  if(!(AUD.test(f.name)||f.type.startsWith('audio/'))||lib.some(s=>s.name===f.name))continue;
  const s={name:f.name,title:f.name.replace(/\.[^.]+$/,''),url:URL.createObjectURL(f),img:null,rd:async(a,b)=>new Uint8Array(await f.slice(a,b+1).arrayBuffer())};lib.push(s);covQ.push(s);
  if(save)dbPut(f)}
 lib.sort((a,b)=>a.title.localeCompare(b.title));draw();if(covOn)covPump()}
function draw(){
 ml.innerHTML=lib.length?'':'<p>Belum ada lagu. Lagu .mp3 di repo GitHub-mu muncul otomatis di sini; atau pilih folder/filenya sendiri.</p>';
 lib.forEach(s=>{const b=document.createElement('button');b.className='sg';b.innerHTML='<i></i><b></b>';b.lastChild.textContent=s.title;
  if(s.img)b.firstChild.style.backgroundImage=`url(${s.img})`;b.onclick=()=>play(s);s.el=b;ml.appendChild(b)});mark()}
function mark(){lib.forEach(s=>{if(!s.el)return;s.el.classList.toggle('on',s===cur);s.el.classList.toggle('pl',s===cur&&!bgm.paused)});mbtn.classList.toggle('pl',!bgm.paused);$('np').textContent=cur?cur.title:'Belum ada lagu';setIc($('mpp'),cur&&!bgm.paused?'pause':'play')}
function play(s){ // satu elemen <audio> saja, jadi lagu tidak mungkin bertimpa
 try{navigator.audioSession.type='playback'}catch(e){}
 if(s===cur){bgm.paused?bgm.play():bgm.pause();return}
 cur=s;bgm.src=s.url;bgm.loop=lib.length<2;bgm.play().catch(()=>{});mark()}
bgm.onplay=bgm.onpause=mark;
bgm.onended=()=>play(lib[(lib.indexOf(cur)+1)%lib.length]);
document.onvisibilitychange=()=>{if(document.hidden)vStop();if(document.hidden&&!bgm.paused){bgm.pause();bgm.dataset.r=1}else if(!document.hidden&&bgm.dataset.r){delete bgm.dataset.r;bgm.play().catch(()=>{})}};
cv.addEventListener('pointerdown',()=>pnl());
$('pfil').onclick=()=>$('pfl').click();
$('pdir').onclick=async()=>{
 if(!window.showDirectoryPicker)return $('pfo').click();
 try{const d=await showDirectoryPicker(),fs=[];for await(const[n,h]of d.entries())if(h.kind==='file'&&AUD.test(n))fs.push(await h.getFile());await addFiles(fs)}catch(e){}};
$('pfl').onchange=$('pfo').onchange=e=>{addFiles([...e.target.files]);e.target.value=''};
draw();
(async()=>{const d=await db;if(!d)return;const q=d.transaction('s').objectStore('s').getAll();q.onsuccess=()=>addFiles(q.result.map(r=>new File([r.blob],r.name,{type:'audio/mpeg'})),false)})();
repoSongs();
function skip(d){if(!lib.length)return;if(lib.length<2){bgm.currentTime=0;bgm.play().catch(()=>{});return}play(lib[(Math.max(0,lib.indexOf(cur))+d+lib.length)%lib.length])}
$('mnx').onclick=()=>skip(1);$('mpv').onclick=()=>skip(-1);
$('mpp').onclick=()=>{if(cur)bgm.paused?bgm.play().catch(()=>{}):bgm.pause();else if(lib[0])play(lib[0])};
const sl=(id,f)=>{const e=$(id);e.value=LS('w'+id,{vm:60,va:45,vv:100}[id]);e.oninput=()=>{f(+e.value/100);SS('w'+id,e.value)}};
sl('vm',v=>bgm.volume=v);sl('va',v=>{ambVol=v;if(amb)amb.master.gain.setTargetAtTime(v*2,ac.currentTime,.05)});sl('vv',v=>vVol=v);
const startGame=()=>{
 if(playing||innerHeight>innerWidth)return;
 try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();ac.resume();initAmb()}catch(e){}
 reqGyro();
 try{document.documentElement.requestFullscreen().then(()=>screen.orientation.lock('landscape')).catch(()=>{})}catch(e){}
 $('menu').classList.add('off');$('hud').classList.add('on');playing=true};
function step(kind,fast){
 if(!ac)return;
 if(!nb){nb=ac.createBuffer(1,ac.sampleRate*.25,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=rnd()*2-1}
 const P=[['bandpass',230,2,1.5],['lowpass',520,.6,.4],['lowpass',850,.5,.2],['highpass',1500,.5,.18],['bandpass',900,.9,.55]][kind],t=ac.currentTime,s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();
 s.buffer=nb;f.type=P[0];f.frequency.value=P[1]*(.85+rnd()*.3);f.Q.value=P[2];
 g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(P[3]*(fast?1.2:1),t+.012);g.gain.exponentialRampToValueAtTime(.001,t+[.11,.2,.16,.17,.19][kind]);
 s.connect(f);f.connect(g);g.connect(ac.destination);s.start(t);s.stop(t+.22)}

// suara latar: laut, angin, air mancur
let amb=null,ambT=0;
function initAmb(){
 if(amb||!ac)return;
 const sr=ac.sampleRate,buf=ac.createBuffer(1,sr*3,sr),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=rnd()*2-1;
 const src=o=>{const s=ac.createBufferSource();s.buffer=buf;s.loop=true;s.start(0,o);return s},
  fl=(t,f,q)=>{const x=ac.createBiquadFilter();x.type=t;x.frequency.value=f;x.Q.value=q;return x},
  gn=v=>{const x=ac.createGain();x.gain.value=v;return x},
  lfo=(hz,amp,tg)=>{const o=ac.createOscillator(),g=gn(amp);o.frequency.value=hz;o.connect(g);g.connect(tg);o.start()};
 const master=gn(ambVol*2);master.connect(ac.destination);
 const sea=gn(.1),w1=gn(1),w2=gn(.15);sea.connect(master);
 src(0).connect(fl('lowpass',480,.4)).connect(w1);w1.connect(sea);lfo(.11,.55,w1.gain);lfo(.07,.35,w1.gain);
 src(1).connect(fl('highpass',1800,.3)).connect(fl('lowpass',6000,.3)).connect(w2);w2.connect(sea);lfo(.11,.05,w2.gain);lfo(.09,.04,w2.gain);
 const wind=gn(.5),wf=fl('bandpass',520,.7);src(2).connect(wf).connect(wind);wind.connect(master);lfo(.06,.25,wind.gain);lfo(.043,.2,wind.gain);lfo(.05,260,wf.frequency);
 const rus=gn(.03);src(.5).connect(fl('highpass',3000,.2)).connect(rus);rus.connect(master);lfo(.13,.02,rus.gain);
 const fo=gn(0);fo.connect(master);src(1.5).connect(fl('bandpass',2400,.5)).connect(fo);src(2.2).connect(fl('bandpass',700,.8)).connect(fo);
 amb={sea,fo,master}}

/* ---------- loop ---------- */
let qa=0,qn=0,qr=ren.getPixelRatio(),T=0,last=performance.now(),phase=0,lastStep=0,py=.91,pyaw=0,ppit=0,fov=70,sit=null,sitK=0,eye=1.7,near=null,chYaw=0,syaw=0,spit=.2;
const pos={x:0,z:R+11},vel={x:0,z:0},sw={x:0,z:0,vx:0,vz:0},sitB=$('sit');
sitB.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(sit)sit=null;else if(near){sit=near;sitK=0}});
function loop(now){
 requestAnimationFrame(loop);
 const dt=Math.min(.05,(now-last)/1000)||.016;last=now;T+=dt;DT=dt;qa+=dt;qn++;if(qa>2.5){const q=qn/qa;qa=qn=0;if(playing&&q<32&&qr>1){qr=Math.max(1,qr-.25);ren.setPixelRatio(qr);su.dpr.value=ffU.dpr.value=qr;rs()}}

 const act=playing&&innerWidth>innerHeight,fly=camMode===2,park=curMap==='parkour';
 if(!playing){yaw=Math.sin(T*.08)*.25;pitch=.2+Math.sin(T*.11)*.04}
 mapTick(dt); // rakit & palang parkur, bebek, layang-layang, api unggun
 let ix=jx+((K.KeyD||K.ArrowRight)?1:0)-((K.KeyA||K.ArrowLeft)?1:0),iy=jy+((K.KeyW||K.ArrowUp)?1:0)-((K.KeyS||K.ArrowDown)?1:0);
 const m=Math.hypot(ix,iy);if(m>1){ix/=m;iy/=m}
 if(sit&&m>.35&&!fly)sit=null; // gerakkan joystick = berdiri
 const rn=run||K.ShiftLeft,spd=(rn?6.5:3.2)*spdK(pos.x,pos.z),c=Math.cos(yaw),s=Math.sin(yaw),go=act&&!sit&&!fly;
 const tx=go?(c*ix-s*iy)*spd:0,tz=go?(-s*ix-c*iy)*spd:0,k=1-Math.exp(-(onIce(pos.x,pos.z)?1.6:9)*dt),ovx=vel.x,ovz=vel.z;
 if(park)pkStep(dt,tx,tz); // parkur punya fisika sendiri (gravitasi & pijakan)
 else{vel.x+=(tx-vel.x)*k;vel.z+=(tz-vel.z)*k;
  if(sit){const q=1-Math.exp(-5*dt);pos.x+=(sit.x-pos.x)*q;pos.z+=(sit.z-pos.z)*q;
   if(sitK<1){sitK+=dt;let d=sit.yaw-yaw;d=Math.atan2(Math.sin(d),Math.cos(d));yaw+=d*q}}
  else{const nx=pos.x+vel.x*dt,nz=pos.z+vel.z*dt;
   if(ok(nx,nz)){pos.x=nx;pos.z=nz}else if(ok(nx,pos.z))pos.x=nx;else if(ok(pos.x,nz))pos.z=nz;else vel.x=vel.z=0}}
 const air=park&&!PK.ground;
 near=null;if(act&&!sit)for(const b of benches)if(Math.hypot(pos.x-b.x,pos.z-b.z)<2.6){near=b;break}
 const hid=!(sit||near),lab=sit?'Berdiri':'Duduk';if(sitB.hidden!==hid)sitB.hidden=hid;if(sitB.textContent!==lab)sitB.textContent=lab;
 if(jh>0||jvv>0){jvv-=15*dt;jh=Math.max(0,jh+jvv*dt);if(!jh)jvv=0}
 kn+=((pose===1&&!sit?1:0)-kn)*(1-Math.exp(-7*dt));if(pose&&(m>.35||jh>0||air))pose=0; // emosi tanpa batas waktu, berhenti saat bergerak/melompat
 if(emo&&!pose)emo='';tagDraw(myTag,myName,emo);
 nearF=nearD=null;if(act&&!sit){let bd=1.7;for(const d of drops){const q=(pos.x-d.x)**2+(pos.z-d.z)**2;if(q<bd){bd=q;nearD=d}}
  if(!nearD){bd=1.5;for(const f of FL)if(f.on){const q=(pos.x-f.x)**2+(pos.z-f.z)**2;if(q<bd){bd=q;nearF=f}}}}
 uiSet(pkB,nearD||nearF,nearD?(nearD.ty==='l'?'Ambil lentera':'Ambil bunga'):'Petik bunga');uiSet(swB,hasL&&hasF&&!sit,held==='l'?'Pegang bunga':'Pegang lentera');uiSet(drB,held&&!sit&&!park,held==='l'?'Lepas lentera':'Lepas bunga');
 const gs=Math.hypot(vel.x,vel.z),mv=Math.min(1,gs/3),bp=Math.abs(Math.sin(phase*PI));
 phase+=gs*.5*dt;
 if(act&&Math.floor(phase)!==lastStep){lastStep=Math.floor(phase);
  if(!air){const sf=surf(pos.x,pos.z),zn=zoneOf(pos.x);step(sf,rn);if(zn==='sakura'&&sf!==0&&sf!==4||zn==='salju'&&sf===3)foot(pos.x,pos.z,vel.x,vel.z)}}
 if(park){py=PK.y;PK.camY+=(PK.y-PK.camY)*(1-Math.exp(-(PK.ground?10:4)*dt))}
 else py+=((pier(pos.x,pos.z)?.91:H(pos.x,pos.z))-py)*(1-Math.exp(-12*dt));
 eye+=((sit?1.12:1.7)-eye)*(1-Math.exp(-6*dt));
 // kamera
 if(fly){const sp2=rn?14:6,cp=Math.cos(pitch),kf=1-Math.exp(-2.2*dt); // terbang: kecepatan halus, melambat bertahap
  fv.x+=((-s*cp*iy+c*ix)*sp2-fv.x)*kf;fv.y+=(Math.sin(pitch)*iy*sp2-fv.y)*kf;fv.z+=((-c*cp*iy-s*ix)*sp2-fv.z)*kf;
  fc.x+=fv.x*dt;fc.y+=fv.y*dt;fc.z+=fv.z*dt;
  fc.y=Math.max(Math.max(H(fc.x,fc.z),0)+1,Math.min(220,fc.y));cam.position.copy(fc)}
 else if(camMode===1){const cp=Math.cos(pitch),cx=pos.x+s*cp*4.6,cz=pos.z+c*cp*4.6;
  cam.position.set(cx,Math.max((park?PK.camY:py)+1.5+jh-kn*.6-(sit?.35:0)-Math.sin(pitch)*4.6,Math.max(H(cx,cz),0)+.5),cz)}
 else cam.position.set(pos.x,py+eye+jh-kn*.8+bp*.06*mv,pos.z);
 {const kr=fly?1-Math.exp(-5*dt):1;let dyw=yaw-syaw;dyw=Math.atan2(Math.sin(dyw),Math.cos(dyw));syaw+=dyw*kr;spit+=(pitch-spit)*kr;cam.rotation.set(spit,syaw,0)}
 fov+=((rn&&gs>1?77:70)-fov)*.08;cam.fov=fov;cam.updateProjectionMatrix();
 // karakter
 if(ch.visible){
  let ty=chYaw;if(sit)ty=sit.yaw;else if(gs>.4)ty=Math.atan2(-vel.x,-vel.z);
  let dy=ty-chYaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));chYaw+=dy*(1-Math.exp(-10*dt));
  const A=(sit?0:mv)*(rn?1.25:1)*.75,w=Math.sin(phase*PI);
  animAv(chA,A,w,pose===1&&!sit,pose===3,sit);const eb=emoAnim(chA,pose,T,sit);
  if(air){const L=chA.legs,Ar=chA.arms;L[0].th.rotation.x=.75;L[0].sh.rotation.x=-1.15;L[1].th.rotation.x=.2;L[1].sh.rotation.x=-.55;Ar[0].up.rotation.x=2.5;Ar[0].fo.rotation.x=.4}
  ch.position.set(pos.x,py+jh-kn*.45-(sit?.36:-bp*.03*mv)+eb,pos.z);ch.rotation.y=chYaw}
 // lentera: bandul + ayunan tangan
 const ar=((vel.x-ovx)*c-(vel.z-ovz)*s)/dt,af=(-(vel.x-ovx)*s-(vel.z-ovz)*c)/dt,
  yr=Math.max(-8,Math.min(8,(yaw-pyaw)/dt)),pr=Math.max(-8,Math.min(8,(pitch-ppit)/dt));pyaw=yaw;ppit=pitch;
 sw.vz+=(-26*sw.z-2.2*sw.vz-.25*ar+yr*.9+Math.sin(phase*PI*2)*mv*(rn?9:5)+Math.sin(T*1.1)*.5)*dt;
 sw.vx+=(-26*(sw.x+pitch*.85)-2.2*sw.vx-.25*af-bp*mv*(rn?14:9)+pr*.5+Math.sin(T*.9+1)*.35)*dt;
 sw.x=Math.max(-1.1,Math.min(.9,sw.x+sw.vx*dt));sw.z=Math.max(-.9,Math.min(.9,sw.z+sw.vz*dt));
 lan.rotation.set(sw.x,0,sw.z);
 if(ch.visible){const q=arms[1].up.rotation.x+arms[1].fo.rotation.x;clan.rotation.set(sw.x+pitch*.85-q,0,sw.z);clan.scale.setScalar(.001+.999*lk);clan.visible=hasL;if(cflw){cflw.rotation.set(-q,0,sw.z*.3);cflw.scale.setScalar(.001+1.1*fk)}}
 lk+=((held==='l'?1:0)-lk)*(1-Math.exp(-8*dt));fk+=((held==='f'?1:0)-fk)*(1-Math.exp(-8*dt));
 lan.position.y=-.7*(1-lk);lan.visible=hasL;if(flw){flw.rotation.set(.55+sw.x*.2,0,sw.z*.25);flw.position.y=-.12-.7*(1-fk);flw.visible=fk>.02}
 hand.position.set(rest.x+Math.sin(phase*PI)*.01*mv*(rn?2:1),rest.y+bp*.018*mv*(rn?1.8:1)+(rn?.03*mv:0)-(sit?.07:0)+kn*.12,rest.z-(rn?.03*mv:0)-kn*.3);
 lt.intensity=(2.4+.28*Math.sin(T*11)+.18*Math.sin(T*23+1)+.12*Math.sin(T*37+2))*lantK;lg.material.opacity=(.5+.08*Math.sin(T*11))*lantK;
 for(const f of flames)f.scale.y=.03+.006*Math.sin(T*17+1);
 // dunia
 wn.offset.set(T*.004,T*.0027);
 skyG.position.copy(cam.position);su.t.value=T;au.forEach(a=>a.uniforms.t.value=T);
 shots.forEach(o=>shoot(o,dt));fount(T);petalUpd(T,dt);fpUpd();rpUpd(dt);ffU.t.value=T;
 fxUpd(dt);fcUpd(now);if(emoBack&&!pose){emoBack=0;if(camMode===1)setCam(0)}if(tmpF&&pose!==9){clrFl();held=hasL?'l':null}
 myVoi.s.visible=!!vOn&&ch.visible;if(vOn){voiDraw(myVoi,vLv,now);$('vbtn').style.setProperty('--lv',vLv.toFixed(2))}
 if(amb&&T-ambT>.12){ambT=T;const r=Math.hypot(cam.position.x,cam.position.z),t0=ac.currentTime,zn=zoneOf(cam.position.x); // laut makin keras dekat pantai, air mancur dekat pusat
  amb.sea.gain.setTargetAtTime(zn==='sakura'?.07+.2*(1-sm(0,110,R-r)):zn==='parkour'?.04:zn==='castle'||zn==='city'?.054:.012,t0,.5);
  amb.fo.gain.setTargetAtTime(zn==='sakura'?.35*Math.pow(1-sm(2,48,r),1.6):zn==='sawah'?.05:0,t0,.35)}
 if(park)pkHud();
 ren.render(scene,cam);recFrame()}
await PG(98,'Menyiapkan shader');
setInterval(sendMe,200);connect();addEventListener('pagehide',()=>{if(rm)rm.send({type:'broadcast',event:'bye',payload:{id:myId}})});
ch.visible=true;for(let i=0;i<3;i++){ren.render(scene,cam);await tick()}ch.visible=camMode!==0;

/* ===== v1.4: ikon, editor tampilan, facecam, rekam ===== */
function icons(){if(window.lucide)lucide.createIcons()}
function setIc(b,n,t){b.innerHTML='<i data-lucide="'+n+'"></i>'+(t?'<span>'+t+'</span>':'');icons()}
const pad2=n=>String(n).padStart(2,'0');

// ---- editor tampilan (UI/UX): disimpan di perangkat + disinkronkan ke Supabase lewat RPC
const uiDef={us:1,js:1,ga:.58,ms:1,ac:'#ffc53d',lb:1,lay:{},v:2};let uiCfg={...uiDef,lay:{}},uiTimer;
const uiOld=o=>{if(o&&!(o.v>=2)&&o.ac==='#8fe6c0')delete o.ac;return o}; // warna bawaan versi lama ikut diganti
const devId=(()=>{try{let v=localStorage.getItem('wpid');if(!v){v=crypto.randomUUID?crypto.randomUUID():myId+Date.now().toString(36)+String(rnd()).slice(2,8);localStorage.setItem('wpid',v)}return v}catch(e){return myId+Date.now().toString(36)}})();
function uiApply(){const s=document.documentElement.style,n=(v,a,b,d)=>Math.min(b,Math.max(a,Number.isFinite(+v)?+v:d));
 s.setProperty('--us',n(uiCfg.us,.8,1.3,1));s.setProperty('--js',n(uiCfg.js,.8,1.5,1));s.setProperty('--ga',n(uiCfg.ga,.15,.9,.58));s.setProperty('--oa',Math.min(1,.52+n(uiCfg.ga,.15,.9,.58)*.76));s.setProperty('--ms',n(uiCfg.ms,.5,2.5,1));
 s.setProperty('--ac',/^#[0-9a-f]{6}$/i.test(uiCfg.ac)?uiCfg.ac:uiDef.ac);document.body.classList.toggle('nl',!uiCfg.lb);layApply()}
function uiSave(){uiApply();try{localStorage.setItem('wui',JSON.stringify(uiCfg))}catch(e){}clearTimeout(uiTimer);
 uiTimer=setTimeout(()=>{if(sbc)sbc.rpc('walk_save_settings',{p_pid:sid(),p_ui:uiCfg}).then(()=>{},()=>{})},1200)}
function uiLoad(){if(!sbc)return;sbc.rpc('walk_get_settings',{p_pid:sid()}).then(r=>{if(r&&r.data&&typeof r.data==='object'){Object.assign(uiCfg,uiOld(r.data));uiApply();uiSync();try{localStorage.setItem('wui',JSON.stringify(uiCfg))}catch(e){}}},()=>{})}
const uiBox=document.createElement('div');uiBox.className='sx';
uiBox.innerHTML='<b>Tampilan &amp; antarmuka</b>'+[['us','Ukuran tombol',.8,1.3,.05],['js','Ukuran joystick',.8,1.5,.05],['ga','Kepekatan panel',.15,.9,.05],['ms','Kelembutan animasi',.5,2.5,.1]].map(([k,t,a,b,s])=>'<label class="row"><span>'+t+'</span><input data-k="'+k+'" type="range" min="'+a+'" max="'+b+'" step="'+s+'"></label>').join('')
 +'<label class="row"><span>Label tombol</span><input data-k="lb" type="checkbox"></label><div class="row"><span>Warna aksen</span><span class="sw">'+['#ffc53d','#8fe6c0','#7fb8ff','#ffb8d2','#c9a8ff','#ff8f6b'].map(c=>'<button data-c="'+c+'" style="background:'+c+'" aria-label="'+c+'"></button>').join('')+'</span></div><button id="layEdit">Atur posisi tombol &amp; joystick</button><button id="uirs">Atur ulang tampilan</button>';
$('spn').insertBefore(uiBox,$('quit'));
function uiSync(){uiBox.querySelectorAll('[data-k]').forEach(i=>{const v=uiCfg[i.dataset.k];if(i.type==='checkbox')i.checked=!!v;else i.value=v});uiBox.querySelectorAll('[data-c]').forEach(b=>b.classList.toggle('on',b.dataset.c===uiCfg.ac))}
uiBox.addEventListener('input',e=>{const k=e.target.dataset.k;if(k){uiCfg[k]=e.target.type==='checkbox'?+e.target.checked:+e.target.value;uiSave()}});
uiBox.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.c)uiCfg.ac=b.dataset.c;else if(b.id==='layEdit'){layStart();return}else if(b.id==='uirs')uiCfg={...uiDef,lay:{}};else return;uiSave();uiSync()});
try{Object.assign(uiCfg,uiOld(JSON.parse(localStorage.getItem('wui')||'{}')))}catch(e){}uiApply();uiSync();

// ---- facecam: ketuk sekali = nyala/mati; tampil di atas karakter, dikirim kecil (80px, 2 fps) ke pemain lain
let fcStream=null,fcTimer=0,fcLast=0;const fvid=document.createElement('video'),fcv=document.createElement('canvas');
fvid.id='fvid';fvid.muted=true;fvid.playsInline=true;fcv.width=fcv.height=80;$('fbtn').appendChild(fvid);
function mkFace(){const c=document.createElement('canvas');c.width=c.height=128;const t=new THREE.CanvasTexture(c),s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false}));s.scale.set(.95,.95,1);s.position.y=3.9;s.visible=false;return{s,c,t}}
function drawFace(f,v,mir){const w=v.videoWidth||v.width,h=v.videoHeight||v.height,q=Math.min(w,h);if(!q)return;const x=f.c.getContext('2d');x.clearRect(0,0,128,128);x.save();x.beginPath();x.arc(64,64,58,0,7);x.clip();
 if(mir){x.translate(128,0);x.scale(-1,1)}x.drawImage(v,(w-q)/2,(h-q)/2,q,q,0,0,128,128);x.restore();x.beginPath();x.arc(64,64,58,0,7);x.lineWidth=6;x.strokeStyle='rgba(255,255,255,.92)';x.stroke();f.t.needsUpdate=true}
async function fcStart(){try{fcStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:320},height:{ideal:320}},audio:false});fvid.srcObject=fcStream;await fvid.play();
 $('fbtn').classList.add('on');myFace.s.visible=true;fcTimer=setInterval(fcSend,500);toast('Facecam aktif, terlihat oleh pemain lain')}catch(e){fcStop();toast('Kamera tidak bisa diakses')}}
function fcStop(){clearInterval(fcTimer);const was=fcStream;if(was)was.getTracks().forEach(t=>t.stop());fcStream=null;fvid.srcObject=null;myFace.s.visible=false;$('fbtn').classList.remove('on');
 if(was&&rm)rm.send({type:'broadcast',event:'fc',payload:{id:myId,d:''}})}
function fcSend(){const w=fvid.videoWidth,h=fvid.videoHeight;if(!rm||!fcStream||!w)return;const q=Math.min(w,h);fcv.getContext('2d').drawImage(fvid,(w-q)/2,(h-q)/2,q,q,0,0,80,80);
 rm.send({type:'broadcast',event:'fc',payload:{id:myId,d:fcv.toDataURL('image/jpeg',.5).slice(23)}})}
function onFc(d){const p=d&&RP[d.id];if(!p)return;p.fcT=performance.now();if(!d.d){if(p.fc)p.fc.s.visible=false;return}
 if(!p.fc){p.fc=mkFace();p.g.add(p.fc.s)}const im=new Image;im.onload=()=>{if(p.fc){drawFace(p.fc,im);p.fc.s.visible=true}};im.src='data:image/jpeg;base64,'+String(d.d).slice(0,12000)}
function fcUpd(now){if(fcStream&&now-fcLast>66){fcLast=now;drawFace(myFace,fvid,1)}for(const id in RP){const p=RP[id];if(p.fc&&p.fc.s.visible&&now-p.fcT>4000)p.fc.s.visible=false}}
bt2($('fbtn'),()=>fcStream?fcStop():fcStart());

// ---- rekam gameplay ----
// Penyebab video dulu hitam & muncul di bagian audio: HP Android sering tidak punya H.264 "prefer-software",
// jadi kode lama jatuh ke VP9 yang dibungkus .mp4. Sekarang: .mp4 HANYA berisi H.264, setiap metode diuji dulu
// (hasil ujinya benar-benar diputar dan dicek tidak hitam), dan berkas tanpa gambar tidak pernah disimpan.
let audTap=null;const _audConnect=AudioNode.prototype.connect;
AudioNode.prototype.connect=function(t,...a){ // semua suara game lewat satu node master supaya mudah direkam
 if(window.AudioDestinationNode&&t instanceof AudioDestinationNode){if(!audTap||audTap.context!==t.context){audTap=t.context.createGain();_audConnect.call(audTap,t)}t=audTap}
 return _audConnect.call(this,t,...a)};

/*MP4-BEGIN*/
// penulis MP4 kecil (H.264 + AAC), tabel indeks di depan supaya langsung bisa diputar dan digeser
function mp4File(o){ // o={w,h,avcC,color,v:[{d,t(mikrodetik),k}],a:[{d}],asc,sr}
 const be=(n,len=4)=>{const r=[];for(let i=len-1;i>=0;i--)r.push(Math.floor(n/2**(8*i))&255);return r},
  tx=s=>[...s].map(c=>c.charCodeAt(0)),
  box=(type,...p)=>{let n=8;for(const q of p)n+=q.length;const r=new Uint8Array(n);r.set(be(n));r.set(tx(type),4);let at=8;for(const q of p){r.set(q,at);at+=q.length}return r},
  full=(type,ver,flags,...p)=>box(type,[ver],be(flags,3),...p),
  u32=list=>{const r=new Uint8Array(list.length*4),d=new DataView(r.buffer);list.forEach((n,i)=>d.setUint32(i*4,n>>>0));return r},
  runs=list=>{const r=[];for(const n of list){const l=r[r.length-1];if(l&&l[1]===n)l[0]++;else r.push([1,n])}return r},
  MAT=u32([65536,0,0,0,65536,0,0,0,0x40000000]);
 // waktu tampil boleh tidak urut (B-frame): waktu decode = waktu tampil yang diurutkan, selisihnya disimpan di ctts
 const VT=90000,pts=o.v.map(s=>Math.round(s.t*VT/1e6)),dts=[...pts].sort((x,y)=>x-y);
 for(let i=1;i<dts.length;i++)if(dts[i]<=dts[i-1])dts[i]=dts[i-1]+1;
 const tracks=[{id:1,video:true,ts:VT,s:o.v,d:dts.map((t,i)=>i+1<dts.length?dts[i+1]-t:i?t-dts[i-1]:3000),cts:pts.map((p,i)=>p-dts[i])}];
 if(o.a&&o.a.length&&o.asc)tracks.push({id:2,video:false,ts:o.sr,s:o.a,d:o.a.map(()=>1024)});
 // selang-seling potongan ~0,5 detik antara gambar dan suara
 const chunks=[];
 for(const tr of tracks){let time=0,cur=null;tr.s.forEach((s,i)=>{if(!cur||time-cur.start>=tr.ts/2){cur={tr,start:time,first:i,n:0,off:0};chunks.push(cur)}cur.n++;time+=tr.d[i]});tr.dur=time}
 chunks.sort((x,y)=>x.start/x.tr.ts-y.start/y.tr.ts||x.tr.id-y.tr.id);
 let total=0;for(const c of chunks){c.off=total;for(let i=0;i<c.n;i++)total+=c.tr.s[c.first+i].d.length}
 const C={bt709:1,bt470bg:5,smpte170m:6},TR={bt709:1,smpte170m:6,'iec61966-2-1':13},MX={rgb:0,bt709:1,bt470bg:5,smpte170m:6},cs=o.color||{},
  colr=cs.primaries in C&&cs.transfer in TR&&cs.matrix in MX?[box('colr',tx('nclx'),be(C[cs.primaries],2),be(TR[cs.transfer],2),be(MX[cs.matrix],2),[cs.fullRange?128:0])]:[],
  avc1=()=>box('avc1',[0,0,0,0,0,0],be(1,2),new Uint8Array(16),be(o.w,2),be(o.h,2),be(0x480000),be(0x480000),be(0),be(1,2),new Uint8Array(32),be(24,2),[255,255],box('avcC',o.avcC),...colr),
  mp4a=()=>{const dsi=[5,o.asc.length,...o.asc],dcd=[4,13+dsi.length,0x40,0x15,0,0,0,...be(128000),...be(128000),...dsi],es=[3,3+dcd.length+3,0,2,0,...dcd,6,1,2];
   return box('mp4a',[0,0,0,0,0,0],be(1,2),new Uint8Array(8),be(2,2),be(16,2),new Uint8Array(4),be((o.sr<65536?o.sr:0)*65536),full('esds',0,0,es))},
  list=(name,ver,rows,flat)=>full(name,ver,0,be(rows),u32(flat)),
  stbl=(tr,base)=>{const mine=chunks.filter(c=>c.tr===tr),sc=[];mine.forEach((c,j)=>{const l=sc[sc.length-1];if(!l||l[1]!==c.n)sc.push([j+1,c.n,1])});
   const dr=runs(tr.d),p=[full('stsd',0,0,be(1),tr.video?avc1():mp4a()),list('stts',0,dr.length,dr.flat())];
   if(tr.video){const keys=[];tr.s.forEach((s,i)=>{if(s.k)keys.push(i+1)});p.push(list('stss',0,keys.length,keys));
    if(tr.cts.some(n=>n)){const cr=runs(tr.cts);p.push(list('ctts',1,cr.length,cr.flat()))}}
   p.push(list('stsc',0,sc.length,sc.flat()),full('stsz',0,0,be(0),be(tr.s.length),u32(tr.s.map(s=>s.d.length))),list('stco',0,mine.length,mine.map(c=>base+c.off)));
   return box('stbl',...p)},
  ms=tr=>Math.round(tr.dur*1000/tr.ts),
  trak=(tr,base)=>box('trak',
   full('tkhd',0,3,be(0),be(0),be(tr.id),be(0),be(ms(tr)),new Uint8Array(8),be(0,2),be(0,2),be(tr.video?0:256,2),be(0,2),MAT,be(tr.video?o.w*65536:0),be(tr.video?o.h*65536:0)),
   box('mdia',full('mdhd',0,0,be(0),be(0),be(tr.ts),be(tr.dur),be(0x55c4,2),be(0,2)),
    full('hdlr',0,0,be(0),tx(tr.video?'vide':'soun'),new Uint8Array(12),tx(tr.video?'VideoHandler':'SoundHandler'),[0]),
    box('minf',tr.video?full('vmhd',0,1,new Uint8Array(8)):full('smhd',0,0,new Uint8Array(4)),box('dinf',full('dref',0,0,be(1),full('url ',0,1))),stbl(tr,base)))),
  moov=base=>box('moov',full('mvhd',0,0,be(0),be(0),be(1000),be(Math.max(...tracks.map(ms))),be(65536),be(256,2),new Uint8Array(10),MAT,new Uint8Array(24),be(tracks.length+1)),...tracks.map(t=>trak(t,base))),
  ftyp=box('ftyp',tx('isom'),be(512),tx('isomiso2avc1mp41')),
  base=ftyp.length+moov(0).length+8,
  out=[ftyp,moov(base),new Uint8Array([...be(total+8),...tx('mdat')])];
 for(const c of chunks)for(let i=0;i<c.n;i++)out.push(c.tr.s[c.first+i].d);
 return new Blob(out,{type:'video/mp4'})}
const aacConfig=sr=>{const f=[96000,88200,64000,48000,44100,32000,24000,22050,16000,12000,11025,8000].indexOf(sr),n=(2<<11)|((f<0?3:f)<<7)|(2<<3);return new Uint8Array([n>>8,n&255])};
/*MP4-END*/

const recC=document.createElement('canvas'),recX=recC.getContext('2d',{willReadFrequently:true,alpha:false}), // kanvas di memori CPU: bingkai dari GPU di sebagian HP jadi hitam
 REC={st:'idle',job:null,ti:0,run:0},recBad=new Set(),
 H264=[['avc1.42E028','no-preference'],['avc1.42001F','no-preference'],['avc1.42E028','prefer-hardware'],['avc1.4D0028','no-preference'],['avc1.640028','no-preference'],['avc1.42E028','prefer-software']], // Baseline dulu: paling aman di galeri HP
 MR_MP4=['video/mp4;codecs=avc1.42E01F,mp4a.40.2','video/mp4;codecs=avc1,mp4a.40.2','video/mp4;codecs=avc1.42E01F,opus','video/mp4;codecs=avc1'], // codec wajib disebut: "video/mp4" polos bisa berisi VP9
 MR_WEBM=['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm'];
let recPicked=null;
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),
 within=(p,ms)=>Promise.race([p,new Promise((_,no)=>setTimeout(()=>no(new Error('timeout')),ms))]),
 bytes=b=>new Uint8Array(ArrayBuffer.isView(b)?b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength):b.slice(0)),
 recRate=(w,h)=>Math.min(6e6,Math.round(w*h*4.2)),
 recVC=(codec,hw,w,h)=>({codec,width:w,height:h,bitrate:recRate(w,h),framerate:30,hardwareAcceleration:hw,latencyMode:'realtime',avc:{format:'avc'}}),
 recPattern=(x,w,h,i)=>{x.fillStyle='#e8a040';x.fillRect(0,0,w,h);x.fillStyle='#2aa7e1';x.fillRect(w*.1+i*w*.04,h*.2,w*.35,h*.5);x.fillStyle='#fff';x.fillRect(w*.55,h*.6,w*.3,h*.25)};
function recPlayable(blob,minLum){return new Promise(res=>{ // benar-benar diputar: harus ada gambar, dan tidak hitam bila minLum>0
 const v=document.createElement('video'),u=URL.createObjectURL(blob);let done=0,to=0;v.muted=true;v.playsInline=true;v.preload='auto';
 const end=r=>{if(done)return;done=1;clearTimeout(to);v.onloadeddata=v.ontimeupdate=v.onerror=null;v.pause();v.removeAttribute('src');v.load();URL.revokeObjectURL(u);res(r)};
 const look=()=>{if(v.readyState<2)return;if(!v.videoWidth)return end(false);const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(v,0,0,16,16);const p=x.getImageData(0,0,16,16).data;let s=0;for(let i=0;i<p.length;i+=4)s+=p[i]+p[i+1]+p[i+2];end(s/768>=minLum)};
 to=setTimeout(()=>end(false),5000);v.onloadeddata=v.ontimeupdate=look;v.onerror=()=>end(false);v.src=u;const pl=v.play();if(pl)pl.catch(()=>{})})}
async function recProbeVideo(w,h){
 if(!window.VideoEncoder||!window.VideoFrame)return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true,alpha:false});
 for(const[codec,hw]of H264){const cfg=recVC(codec,hw,w,h);let en;
  try{if(!(await VideoEncoder.isConfigSupported(cfg)).supported)continue;
   const out=[];let desc=null,color=null,bad=0;
   en=new VideoEncoder({output:(k,m)=>{const d=new Uint8Array(k.byteLength);k.copyTo(d);out.push({d,t:k.timestamp,k:k.type==='key'});const dc=m&&m.decoderConfig;if(dc&&dc.description){desc=bytes(dc.description);color=dc.colorSpace}},error:()=>{bad=1}});
   en.configure(cfg);
   for(let i=0;i<5;i++){recPattern(x,w,h,i);const f=new VideoFrame(c,{timestamp:i*33333,duration:33333});en.encode(f,{keyFrame:i===0});f.close()}
   await within(en.flush(),3000);
   if(!bad&&out.length>1&&desc&&out[0].k&&await recPlayable(mp4File({w,h,avcC:desc,color,v:out}),40))return cfg
  }catch(e){}finally{try{if(en&&en.state!=='closed')en.close()}catch(e){}}}
 return null}
async function recProbeAudio(sr){
 if(!window.AudioEncoder||!window.AudioData)return null;
 const cfg={codec:'mp4a.40.2',sampleRate:sr,numberOfChannels:2,bitrate:128000};let en;
 try{if(!(await AudioEncoder.isConfigSupported(cfg)).supported)return null;
  let n=0,bad=0;en=new AudioEncoder({output:()=>n++,error:()=>{bad=1}});en.configure(cfg);
  const ad=new AudioData({format:'f32-planar',sampleRate:sr,numberOfFrames:4096,numberOfChannels:2,timestamp:0,data:new Float32Array(8192)});en.encode(ad);ad.close();
  await within(en.flush(),3000);return!bad&&n?cfg:null
 }catch(e){return null}finally{try{if(en&&en.state!=='closed')en.close()}catch(e){}}}
async function recProbeMR(types){
 if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)return null;
 const c=document.createElement('canvas');c.width=320;c.height=180;c.className='recsrc';document.body.appendChild(c);const x=c.getContext('2d',{alpha:false});
 try{for(const t of types){if(!MediaRecorder.isTypeSupported(t))continue;
   try{const s=c.captureStream(30),mr=new MediaRecorder(s,{mimeType:t}),part=[],end=new Promise(r=>mr.onstop=r);mr.ondataavailable=e=>{if(e.data&&e.data.size)part.push(e.data)};
    mr.start();for(let i=0;i<10;i++){recPattern(x,320,180,i%8);await sleep(40)}mr.stop();await within(end,3000);s.getTracks().forEach(k=>k.stop());
    if(part.length&&await recPlayable(new Blob(part,{type:t.split(';')[0]}),40))return t}catch(e){}}
 }finally{c.remove()}
 return null}
async function recPick(w,h){ // pilih metode pertama yang lolos uji di perangkat ini
 const sr=ac?ac.sampleRate:48000,key=w+'x'+h;
 if(recPicked&&recPicked.key===key&&!recBad.has(recPicked.id))return recPicked;
 const v=recBad.has('wc')?null:await recProbeVideo(w,h),a=v?await recProbeAudio(sr):null;
 if(v&&a)return recPicked={id:'wc',key,v,a};
 for(const[id,types]of[['mp4',MR_MP4],['webm',MR_WEBM]])if(!recBad.has(id)){const t=await recProbeMR(types);if(t)return recPicked={id,key,t}}
 return v?(recPicked={id:'wc',key,v,a:null}):null}
function recUI(){const b=$('rbtn'),s=REC.st;b.classList.toggle('prep',s==='prep'||s==='save');b.classList.toggle('rec',s==='rec');b.setAttribute('aria-label',s==='rec'?'Berhenti merekam':'Rekam gameplay')}
function recAudio(J,target){ // suara game + musik (bila bisa ditangkap)
 if(audTap){audTap.connect(target);J.nodes.push([audTap,target])}
 try{const s=bgm.captureStream&&bgm.captureStream();if(s&&s.getAudioTracks().length){const src=ac.createMediaStreamSource(s);src.connect(target);J.nodes.push([src,target])}}catch(e){}}
function recStartWC(J){
 J.ve=new VideoEncoder({output:(k,m)=>{const d=new Uint8Array(k.byteLength);k.copyTo(d);J.v.push({d,t:k.timestamp,k:k.type==='key'});const dc=m&&m.decoderConfig;if(dc&&dc.description){J.desc=bytes(dc.description);J.color=dc.colorSpace}},error:e=>recFail(J,e)});
 J.ve.configure(J.m.v);
 if(!J.m.a||!ac)return;
 J.sr=ac.sampleRate;
 J.ae=new AudioEncoder({output:(k,m)=>{const d=new Uint8Array(k.byteLength);k.copyTo(d);J.a.push({d});const dc=m&&m.decoderConfig;if(dc&&dc.description)J.asc=bytes(dc.description)},error:e=>console.warn('audio',e)});
 J.ae.configure(J.m.a);
 const sp=J.sp=ac.createScriptProcessor(4096,2,2),mute=J.mute=ac.createGain();mute.gain.value=0;let n=0;
 sp.onaudioprocess=e=>{if(!J.t0||J.stop||J.ae.state!=='configured')return;const b=e.inputBuffer,len=b.length,d=new Float32Array(len*2);d.set(b.getChannelData(0));d.set(b.getChannelData(1),len);
  const ad=new AudioData({format:'f32-planar',sampleRate:J.sr,numberOfFrames:len,numberOfChannels:2,timestamp:Math.round(n/J.sr*1e6),data:d});J.ae.encode(ad);ad.close();n+=len};
 recAudio(J,sp);sp.connect(mute);_audConnect.call(mute,ac.destination)}
function recStartMR(J){recC.className='recsrc';document.body.appendChild(recC)} // perekamnya baru dinyalakan setelah ada gambar pertama, supaya awal video tidak hitam
function recBeginMR(J){
 const s=J.stream=recC.captureStream(30);
 if(ac&&audTap&&ac.state==='running'){const ds=ac.createMediaStreamDestination();recAudio(J,ds);ds.stream.getAudioTracks().forEach(t=>s.addTrack(t))}
 J.mr=new MediaRecorder(s,{mimeType:J.m.t,videoBitsPerSecond:recRate(J.w,J.h),audioBitsPerSecond:128000});
 J.mr.ondataavailable=e=>{if(e.data&&e.data.size)J.part.push(e.data)};
 J.mr.onerror=e=>recFail(J,e.error||e);
 J.mr.start(1000)}
async function recStart(){
 if(REC.st!=='idle')return;
 const my=++REC.run;REC.st='prep';recUI();toast('Menyiapkan perekam…');
 try{
  const k=Math.min(1,1280/Math.max(cv.width,cv.height),720/Math.min(cv.width,cv.height)),w=Math.max(32,Math.round(cv.width*k/16)*16),h=Math.max(32,Math.round(cv.height*k/16)*16),m=await recPick(w,h);
  if(my!==REC.run)return;
  if(!m){recClean();return toast('Browser ini belum bisa merekam video. Pakai Chrome versi terbaru.')}
  recC.width=w;recC.height=h;recX.fillStyle='#000';recX.fillRect(0,0,w,h);
  if(ac&&ac.state!=='running')await within(ac.resume(),800).catch(()=>{});
  if(my!==REC.run)return;
  const J=REC.job={m,w,h,t0:0,last:0,n:0,v:[],a:[],desc:null,color:null,asc:null,sr:0,part:[],nodes:[],start:performance.now()};
  if(m.id==='wc')recStartWC(J);else recStartMR(J);
  REC.st='rec';J.start=performance.now();recUI();REC.ti=setInterval(recTick,500);recTick();
  toast(m.id==='wc'&&!m.a?'Merekam tanpa suara. Ketuk lagi untuk berhenti.':'Merekam… ketuk lagi untuk berhenti')
 }catch(e){console.error(e);if(my!==REC.run)return;recBad.add(REC.job?REC.job.m.id:'wc');recClean();toast('Perekaman gagal dimulai. Tekan rekam sekali lagi.')}}
function recFrame(){const J=REC.job;if(REC.st!=='rec'||!J||J.stop)return;const now=performance.now();
 if(now-J.last<31)return;J.last=now;
 try{recX.drawImage(cv,0,0,J.w,J.h); // harus tepat setelah render, kalau tidak kanvas WebGL kosong
  if(!J.t0)J.t0=now;
  if(J.m.id!=='wc'&&!J.mr)recBeginMR(J);
  if(J.ve&&J.ve.encodeQueueSize<=8){const f=new VideoFrame(recC,{timestamp:Math.round((now-J.t0)*1000),duration:33333});J.ve.encode(f,{keyFrame:J.n++%60===0});f.close()}
 }catch(e){recFail(J,e)}}
function recTick(){const J=REC.job;if(REC.st!=='rec'||!J)return;const el=performance.now()-J.start,s=el/1000|0;$('rt').textContent=pad2(s/60|0)+':'+pad2(s%60);
 if(!document.hidden&&(J.ve?el>6000&&J.n>8&&!J.v.length:el>20000&&!J.part.length))return recFail(J,new Error('encoder tidak menghasilkan gambar'));
 if(s>=300)recStop()}
function recClean(){const J=REC.job;clearInterval(REC.ti);REC.run++;REC.st='idle';REC.job=null;recUI();$('rt').textContent='00:00';
 if(!J)return;J.stop=1;if(J.sp)J.sp.onaudioprocess=null;
 for(const[a,b]of J.nodes){try{a.disconnect(b)}catch(e){}}
 try{J.sp&&J.sp.disconnect();J.mute&&J.mute.disconnect()}catch(e){}
 for(const en of[J.ve,J.ae])try{if(en&&en.state!=='closed')en.close()}catch(e){}
 try{if(J.mr&&J.mr.state!=='inactive')J.mr.stop()}catch(e){}
 if(J.stream)J.stream.getTracks().forEach(t=>t.stop());
 recC.remove()}
const recBuild=J=>mp4File({w:J.w,h:J.h,avcC:J.desc,color:J.color,v:J.v,a:J.a,asc:J.asc||(J.sr?aacConfig(J.sr):null),sr:J.sr});
function recSave(blob,ext){const d=new Date(),a=document.createElement('a');a.href=URL.createObjectURL(blob);
 a.download='walk-'+d.getFullYear()+pad2(d.getMonth()+1)+pad2(d.getDate())+'-'+pad2(d.getHours())+pad2(d.getMinutes())+pad2(d.getSeconds())+'.'+ext;
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),6e4)}
function recFail(J,e){if(REC.job!==J||J.stop)return;console.error(e);recBad.add(J.m.id);const old=performance.now()-J.start>15000;
 if(old&&J.desc&&J.v.length>30){try{recSave(recBuild(J),'mp4')}catch(x){}recClean();return toast('Perekaman terhenti. Bagian yang sudah terekam disimpan.')}
 recClean();if(playing){toast('Mengganti metode rekam…');setTimeout(recStart,300)}}
async function recStop(){
 if(REC.st==='prep'){recClean();return toast('Rekaman dibatalkan')}
 if(REC.st!=='rec')return;const J=REC.job;REC.st='save';J.stop=1;clearInterval(REC.ti);recUI();toast('Menyimpan video…');
 try{
  let blob,ext='mp4';
  if(!J.mr&&!J.ve){recClean();return toast('Rekaman terlalu singkat')}
  if(J.mr){const end=new Promise(r=>J.mr.onstop=r);J.mr.stop();await within(end,8000);ext=J.m.id==='webm'?'webm':'mp4';blob=new Blob(J.part,{type:'video/'+ext});
   if(!J.part.length||!(await recPlayable(blob,0)))throw new Error('hasil tanpa gambar')}
  else{if(J.sp)J.sp.onaudioprocess=null;await within(J.ve.flush(),8000);if(J.ae&&J.ae.state==='configured')await within(J.ae.flush(),8000).catch(()=>{});
   if(J.v.length<2){recClean();return toast('Rekaman terlalu singkat')}
   if(!J.desc)throw new Error('data video tidak lengkap');
   blob=recBuild(J)}
  if(REC.job!==J)return;
  recSave(blob,ext);recClean();toast('Video tersimpan di folder Download')
 }catch(e){console.error(e);recBad.add(J.m.id);recClean();toast('Video gagal disimpan. Tekan rekam lagi untuk memakai metode lain.')}}
bt2($('rbtn'),()=>REC.st==='idle'?recStart():recStop());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&REC.st==='rec')recStop()});

/* ===== v1.5: pilih peta (server) + peta Kastil & Kota ===== */
const GRY=.3,mapCnt={},mapBench={sakura:benches.slice()},colC=[],colY=[],colS=[],colW=[],PADDY=[];
let mapObs=[],gameCh=null;
const MAPS={sakura:{n:'Pulau Sakura',ic:'flower-2',c:'#f27ba0',d:'Pulau malam dengan pohon sakura, danau, dan dermaga.',x:0,z:R+11,f:[0x0f1f3d,.0034]},
 castle:{n:'Kastil',ic:'castle',c:'#8e7cd6',d:'Benteng batu berobor dengan menara, keep, dan halaman luas.',x:CAS_X,z:92,f:[0x151a30,.0055]},
 city:{n:'Kota',ic:'building-2',c:'#f29538',d:'Kota malam dengan gedung berjendela terang dan jalan raya.',x:CTY_X,z:26,f:[0x1a1830,.0075]},
 parkour:{n:'Parkur Awan',ic:'footprints',c:'#2aa7e1',d:'Lompati pulau melayang sampai garis finis.',x:PKR_X,z:1.5,f:[0xcfeafa,.0022]},
 sawah:{n:'Desa Sawah',ic:'sprout',c:'#6db33f',d:'Pagi di sawah berundak, saung, dan layang-layang.',x:SWH_X,z:36,f:[0xd9e6dc,.0048]},
 salju:{n:'Desa Salju',ic:'snowflake',c:'#7ec8e3',d:'Api unggun, danau beku, dan salju turun.',x:SLJ_X,z:20,f:[0x6b70a2,.0072]}},
 mRnd=s=>()=>(s=(s*1664525+1013904223)>>>0)/4294967296, // acak deterministik: semua pemain melihat peta yang sama
 mHash=(i,j)=>{const s=Math.sin(i*127.1+j*311.7)*43758.5453;return s-Math.floor(s)},
 mTint=(g,c)=>{const k=new THREE.Color(c),n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a.set([k.r,k.g,k.b],i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));return g},
 mBox=(w,h,d,x,y,z,c)=>mTint(new THREE.BoxGeometry(w,h,d).translate(x,y,z),c),
 mCyl=(r1,r2,h,x,y,z,c,sg,a)=>{const g=new THREE.CylinderGeometry(r1,r2,h,sg||12);if(a)g.rotateY(a);return mTint(g.translate(x,y,z),c)},
 mMerge=gs=>{const o={},m=new THREE.BufferGeometry();for(const g0 of gs){const g=g0.index?g0.toNonIndexed():g0;for(const k in g.attributes)(o[k]=o[k]||[]).push(...g.attributes[k].array)}for(const k in o)m.setAttribute(k,new THREE.Float32BufferAttribute(o[k],k==='uv'?2:3));return m},
 mMesh=(G,gs,mat)=>G.add(new THREE.Mesh(mMerge(gs),mat)),
 mGlow=(G,p,col,sz)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));G.add(new THREE.Points(g,new THREE.PointsMaterial({map:glowTex,size:sz,color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})))},
 mPlane=(G,w,d,x,z,t,o)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d).rotateX(-PI/2),new THREE.MeshStandardMaterial({map:t,roughness:1,polygonOffset:true,polygonOffsetFactor:-o,polygonOffsetUnits:-o*4}));m.position.set(x,GRY+o*.02,z);G.add(m)},
 mLit=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}),mEmi=new THREE.MeshBasicMaterial({vertexColors:true}),
 mHit=(c,x,z)=>c.some(b=>x>b[0]-.45&&x<b[2]+.45&&z>b[1]-.45&&z<b[3]+.45),
 mBn=(x,z)=>benches.every(b=>{const d=Math.hypot(x-b.x,z-b.z);return d>.8||d>=Math.hypot(pos.x-b.x,pos.z-b.z)});
function okC(x,z){return Math.hypot(x-CAS_X,z)<170&&!mHit(colC,x,z)&&mBn(x,z)}
function okY(x,z){return Math.abs(x-CTY_X)<136&&Math.abs(z)<136&&!mHit(colY,x,z)&&mBn(x,z)}
function mBenches(G,list,key){const s0=scene.children.length,b0=benches.length;list.forEach(a=>bench(...a));scene.children.slice(s0).forEach(o=>G.add(o));mapBench[key]=benches.splice(b0);G.visible=false;scene.add(G);return G}

function buildCastle(){const G=new THREE.Group(),S=[],E=[],ls=[],rr=mRnd(5),X=CAS_X,
 wall=(w,h,d,x,z)=>{S.push(mBox(w,h,d,X+x,GRY+h/2,z,'#a9a6ad'));colC.push([X+x-w/2,z-d/2,X+x+w/2,z+d/2])},
 tower=(x,z,r,h)=>{S.push(mCyl(r,r+.6,h,X+x,GRY+h/2,z,'#b4b1b9',14),mCyl(0,r+1.8,r*1.9,X+x,GRY+h+r*.95,z,'#7a3446',14));colC.push([X+x-r,z-r,X+x+r,z+r])},
 torch=(x,z)=>{S.push(mCyl(.12,.14,2.6,X+x,GRY+1.3,z,'#4a3524',5));E.push(mBox(.35,.6,.35,X+x,GRY+2.9,z,'#ffb347'));ls.push(X+x,GRY+3.2,z)};
 wall(124,14,4,0,-60);wall(4,14,116,-60,0);wall(4,14,116,60,0);wall(53,14,4,-33.5,60);wall(53,14,4,33.5,60);S.push(mBox(14,5,4,X,GRY+11.5,60,'#a9a6ad'));
 for(const sx of[-60,60])for(const sz of[-60,60])tower(sx,sz,6.5,28);tower(-11,60,4.5,22);tower(11,60,4.5,22);
 for(let t=-58;t<=58;t+=4){const c='#bab7bf';S.push(mBox(2.2,2,4.4,X+t,GRY+15,-60,c),mBox(4.4,2,2.2,X-60,GRY+15,t,c),mBox(4.4,2,2.2,X+60,GRY+15,t,c));if(Math.abs(t)>10)S.push(mBox(2.2,2,4.4,X+t,GRY+15,60,c))}
 S.push(mBox(34,30,34,X,GRY+15,0,'#aeabb3'),mBox(24,14,24,X,GRY+37,0,'#b6b3bb'),mCyl(0,19,17,X,GRY+52.5,0,'#6a3348',4,PI/4),mBox(8,11,.8,X,GRY+5.5,17.2,'#4a321f'),mBox(3,9,.3,X-9,GRY+26,17.4,'#a6243b'),mBox(3,9,.3,X+9,GRY+26,17.4,'#a6243b'),mCyl(2.4,2.6,1.6,X-26,GRY+.8,22,'#9a989f',12));
 colC.push([X-17,-17,X+17,17],[X-28.8,19.2,X-23.2,24.8]);
 for(const sx of[-17,17])for(const sz of[-17,17])S.push(mCyl(4.6,5,40,X+sx,GRY+20,sz,'#b8b5bd',12),mCyl(0,6.6,9,X+sx,GRY+44.5,sz,'#6a3348',12));
 for(const y of[12,21])for(let k=-12;k<=12;k+=6)if(y>12||Math.abs(k)>5)E.push(mBox(2.2,4,.4,X+k,GRY+y,17.3,'#ffc766'),mBox(2.2,4,.4,X+k,GRY+y,-17.3,'#ffc766'),mBox(.4,4,2.2,X+17.3,GRY+y,k,'#ffc766'),mBox(.4,4,2.2,X-17.3,GRY+y,k,'#ffc766'));
 for(const k of[-6,0,6])E.push(mBox(2,3.5,.4,X+k,GRY+37,12.2,'#ffc766'),mBox(2,3.5,.4,X+k,GRY+37,-12.2,'#ffc766'));
 for(let t=-48;t<=48;t+=16){torch(t,-56);torch(-56,t);torch(56,t);if(Math.abs(t)>10)torch(t,56)}
 for(const z of[28,42]){torch(-7,z);torch(7,z)}torch(-9,64);torch(9,64);
 for(let n=0;n<46;n++){const a=rr()*6.283,d=75+rr()*85,x=Math.cos(a)*d,z=Math.sin(a)*d,s=.8+rr()*.8;if((Math.abs(x)<72&&Math.abs(z)<72)||(Math.abs(x)<10&&z>0))continue;
  S.push(mCyl(.4*s,.5*s,3*s,X+x,GRY+1.5*s,z,'#5a402b',6),mCyl(0,3.4*s,7*s,X+x,GRY+6*s,z,'#2c6b45',7),mCyl(0,2.5*s,5*s,X+x,GRY+9.5*s,z,'#37805a',7));colC.push([X+x-.8,z-.8,X+x+.8,z+.8])}
 mMesh(G,S,mLit);mMesh(G,E,mEmi);mGlow(G,ls,0xffa94d,8);
 mPlane(G,900,900,X,0,tex(128,128,(i,j)=>{const n=mHash(i,j)*14;return[24+n,52+n*1.4,30+n]},[150,150]),0);
 mPlane(G,124,124,X,0,tex(128,128,(i,j)=>{const e=(i&15)<1||(j&15)<1,v=(e?.5:.8+mHash(i>>4,j>>4)*.35)*125;return[v,v*.97,v*.93]},[25,25]),1);
 mPlane(G,12,112,X,116,tex(64,64,(i,j)=>{const v=mHash(i,j)*14;return[96+v,76+v,54+v]},[2,22]),2);
 return mBenches(G,[[X-12,34,0],[X+12,34,0],[X-12,46,PI],[X+12,46,PI]],'castle')}

function buildCity(){const G=new THREE.Group(),rr=mRnd(11),X=CTY_X,P=52,A=[],B=[],C=[],lp=[],rf=[],
 bld=(w,h,d,x,z)=>{const g=new THREE.BoxGeometry(w,h,d),u=g.attributes.uv,c=new Float32Array(72),sh=[.85,.55,.45,.45,1,.7];
  for(let i=0;i<24;i++){const f=i>>2;if(f===2||f===3)u.setXY(i,.02,.02);else u.setXY(i,u.getX(i)*(f<2?d:w)/10,u.getY(i)*h/10);c.fill(sh[f],i*3,i*3+3)}
  g.setAttribute('color',new THREE.BufferAttribute(c,3));return g.translate(x,GRY+h/2,z)},
 lamp=(x,z)=>{C.push(mCyl(.12,.16,6,x,GRY+3,z,'#2d2d36',6));lp.push(x,GRY+6.3,z)},
 wt=(K,warm)=>tex(128,128,(i,j)=>{const x=i&31,y=j&31;if(x>5&&x<26&&y>7&&y<27)return mHash((i>>5)+K,(j>>5)*7+K)>.52?(warm?[255,208,130]:[170,225,255]):[16,22,38];return[24,28,42]},[1,1]);
 for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){if(!i&&!j)continue;const bx=X+i*P,bz=j*P,big=rr()<.45;
  for(const[ox,oz,w,d]of big?[[0,0,30,30]]:[[-9.5,-9.5,16,16],[9.5,-9.5,16,16],[-9.5,9.5,16,16],[9.5,9.5,16,16]]){const h=big?28+rr()*70:14+rr()*44;(rr()<.5?A:B).push(bld(w,h,d,bx+ox,bz+oz));colY.push([bx+ox-w/2,bz+oz-d/2,bx+ox+w/2,bz+oz+d/2]);if(h>60)rf.push(bx+ox,GRY+h+1,bz+oz)}
  for(const sx of[-18.2,18.2])for(const sz of[-18.2,18.2])lamp(bx+sx,bz+sz)}
 const pal=['#c0392b','#2c6fbb','#d4d4d8','#1f2a44','#e1b12c','#2f9e6a'];
 for(let n=0;n<60;n++){const v=rr()<.5,k=(rr()*6|0)-3,s=(rr()-.5)*260,q=((s-26)%52+52)%52;if(q<9||q>43)continue;
  const ln=(rr()<.5?-1:1)*3.4,x=v?X+k*P+26+ln:X+s,z=v?s:k*P+26+ln,w=v?1.9:4.2,d=v?4.2:1.9;
  C.push(mBox(w,1.1,d,x,GRY+.9,z,pal[rr()*6|0]),mBox(v?1.7:2.3,.9,v?2.3:1.7,x,GRY+1.85,z,'#222a38'));colY.push([x-w/2,z-d/2,x+w/2,z+d/2])}
 C.push(mBox(34,.1,34,X,GRY+.05,0,'#2f5a3a'),mCyl(.9,1.7,34,X,GRY+17,0,'#a7abb8',4,PI/4));colY.push([X-2,-2,X+2,2]);rf.push(X,GRY+35,0);
 for(let a=0;a<10;a++){const x=X+Math.cos(a*.6283)*13,z=Math.sin(a*.6283)*13;C.push(mCyl(.35,.45,3,x,GRY+1.5,z,'#5a402b',6),mCyl(0,3.2,7,x,GRY+6,z,'#2f7a4b',7),mCyl(0,2.4,5,x,GRY+9.4,z,'#3b9060',7));colY.push([x-.6,z-.6,x+.6,z+.6])}
 mMesh(G,A,new THREE.MeshBasicMaterial({map:wt(1,1),vertexColors:true}));mMesh(G,B,new THREE.MeshBasicMaterial({map:wt(5,0),vertexColors:true}));mMesh(G,C,mLit);mGlow(G,lp,0xffd9a0,9);mGlow(G,rf,0xff4a4a,7);
 mPlane(G,364,364,X,0,tex(260,260,(i,j)=>{const x=i/5,z=j/5,vs=x<7||x>45,hs=z<7||z>45;
  if(!vs&&!hs)return x<7.5||x>44.5||z<7.5||z>44.5?[112,116,128]:[72,75,86];
  if(vs&&!hs&&((x<.3||x>51.7)&&j%30<15||(z<10.5||z>41.5)&&Math.floor(x*1.5)%2===0))return(x<.3||x>51.7)?[205,176,70]:[205,205,210];
  if(hs&&!vs&&((z<.3||z>51.7)&&i%30<15||(x<10.5||x>41.5)&&Math.floor(z*1.5)%2===0))return(z<.3||z>51.7)?[205,176,70]:[205,205,210];
  const v=30+mHash(i,j)*9;return[v,v+2,v+9]},[7,7]),0);
 return mBenches(G,[[X-9,0,-PI/2],[X+9,0,PI/2],[X,-9,PI],[X,9,0]],'city')}

/* ===== v1.7: suasana tiap peta, Parkur Awan, Desa Sawah, Desa Salju ===== */
const mG=(g,c,x,y,z,rx,ry,rz)=>{if(rx)g.rotateX(rx);if(rz)g.rotateZ(rz);if(ry)g.rotateY(ry);return mTint(g.translate(x,y,z),c)},
 mFlat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,flatShading:true}),
 mTerr=(x0,zc,w,d,seg,hf,colorAt,mat)=>{const g=new THREE.PlaneGeometry(w,d,seg,seg).rotateX(-PI/2),P=g.attributes.position,C=new Float32Array(P.count*3);
  for(let i=0;i<P.count;i++){const x=P.getX(i)+x0,z=P.getZ(i)+zc,h=hf(x,z);P.setXYZ(i,x,h,z);C.set(colorAt(x-x0,z,h),i*3)}
  g.setAttribute('color',new THREE.BufferAttribute(C,3));g.computeVertexNormals();return new THREE.Mesh(g,mat)},
 mHaze=(g,base,top,y0,y1)=>{const P=g.attributes.position,C=new Float32Array(P.count*3),a=new THREE.Color(base),b=new THREE.Color(top),c=new THREE.Color();
  for(let i=0;i<P.count;i++){const t=sm(y0,y1,P.getY(i));c.copy(a).lerp(b,t);C.set([c.r,c.g,c.b],i*3)}g.setAttribute('color',new THREE.BufferAttribute(C,3));return g},
 mFar=new THREE.MeshBasicMaterial({vertexColors:true,fog:false});

// ---- langit & cahaya per peta ----
const NIGHT={stars:1,moon:1,aur:1,hemi:[0x34508f,0x0a1020,.6],dir:[0x8aa4ff,.55,[-190,200,-370]],lant:1},
 ENV={parkour:{sky:[0x2c6fd0,0x76bbef,0xdcf1fb],sun:[0xfff1cf,[.5,.42,-.75]],cloud:0xffffff,hemi:[0xeaf6ff,0x8b93a8,.82],dir:[0xfff0d0,.55,[.45,.8,.35]],lant:.1},
  sawah:{sky:[0x4a8ecb,0x9ccbe5,0xffe1bb],sun:[0xffd592,[-.32,.2,-.92]],cloud:0xfff1e2,hemi:[0xfdf1dc,0x5c6c3c,.74],dir:[0xffd9a4,.66,[-.5,.55,.35]],lant:.16},
  salju:{sky:[0x131a42,0x3b4783,0xc78fb2],sun:[0xffb9c9,[.55,.05,-.83]],disc:0,stars:1,moon:1,aur:1,hemi:[0xaab8ee,0x494766,.7],dir:[0xc2ccff,.46,[-.4,.7,.5]],lant:.85}};
const daySky=new THREE.Mesh(new THREE.SphereGeometry(490,32,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
 uniforms:{top:{value:new THREE.Color()},mid:{value:new THREE.Color()},hor:{value:new THREE.Color()},sc:{value:new THREE.Color()},sd:{value:new THREE.Vector3(0,1,0)},disc:{value:1}},
 vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'varying vec3 p;uniform vec3 top,mid,hor,sc,sd;uniform float disc;void main(){vec3 d=normalize(p);float y=max(d.y,0.);vec3 c=mix(hor,mid,smoothstep(0.,.2,y));c=mix(c,top,smoothstep(.2,.7,y));float s=max(dot(d,sd),0.);c+=sc*(smoothstep(.9988,.9993,s)*disc+pow(s,10.)*.26);gl_FragColor=vec4(c,1.);}'}));
daySky.visible=false;skyG.add(daySky);
const cloudTex=(()=>{const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');
 for(let i=0;i<24;i++){const cx=50+rnd()*156,cy=78-(1-Math.abs(cx-128)/90)*28*rnd(),r=16+rnd()*26,g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,256,128)}
 return new THREE.CanvasTexture(c)})();
const mPuff=(col,w,op)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTex,color:col,transparent:true,depthWrite:false,opacity:op}));s.scale.set(w,w*.5,1);return s};
const clouds=new THREE.Group();
for(let i=0;i<13;i++){const s=mPuff(0xffffff,110+rnd()*90,.85),a=i/13*PI*2+rnd()*.3,el=.1+rnd()*.3;s.material.fog=false;s.position.set(Math.cos(a)*400*Math.cos(el),400*Math.sin(el),Math.sin(a)*400*Math.cos(el));clouds.add(s)}
clouds.visible=false;skyG.add(clouds);
function applyEnv(id){const e=ENV[id]||NIGHT,f=MAPS[id].f,u=daySky.material.uniforms;
 nightSky.visible=!e.sky;daySky.visible=!!e.sky;
 if(e.sky){u.top.value.setHex(e.sky[0]);u.mid.value.setHex(e.sky[1]);u.hor.value.setHex(e.sky[2]);u.sc.value.setHex(e.sun[0]);u.sd.value.set(...e.sun[1]).normalize();u.disc.value=e.disc===0?0:1}
 starsPts.visible=!!e.stars;moon.visible=mh.visible=!!e.moon;au.forEach(m=>m.visible=!!e.aur);shots.forEach(s=>s.m.visible=!!e.stars);
 clouds.visible=!!e.cloud;if(e.cloud)clouds.children.forEach(s=>s.material.color.setHex(e.cloud));
 hemiL.color.setHex(e.hemi[0]);hemiL.groundColor.setHex(e.hemi[1]);hemiL.intensity=e.hemi[2];dl.color.setHex(e.dir[0]);dl.intensity=e.dir[1];dl.position.set(...e.dir[2]).normalize();
 lantK=e.lant;scene.fog.color.setHex(f[0]);scene.fog.density=f[1];ren.setClearColor(f[0])}

// ---- efek suara kecil (ikut terekam) ----
let sfxNoise=null;
function sfx(k,v){if(!ac)return;const t=ac.currentTime;
 const tone=(f,at,du,vol,type,f2)=>{const o=ac.createOscillator(),g=ac.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t+at);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+at+du);
  g.gain.setValueAtTime(.0001,t+at);g.gain.linearRampToValueAtTime(vol,t+at+.012);g.gain.exponentialRampToValueAtTime(.001,t+at+du);o.connect(g);g.connect(ac.destination);o.start(t+at);o.stop(t+at+du+.03)};
 if(k==='cp'){tone(660,0,.16,.14);tone(990,.11,.26,.14)}
 else if(k==='boing')tone(170,0,.3,.22,'triangle',640);
 else if(k==='fall')tone(430,0,.5,.13,'sine',90);
 else if(k==='hit')tone(170,0,.2,.2,'square',70);
 else if(k==='fin')[523,659,784,1047].forEach((f,i)=>tone(f,i*.12,.34,.14,'triangle'));
 else if(k==='bird'){const f=2100+rnd()*1500;for(let i=0;i<2+(rnd()*3|0);i++)tone(f,i*.1,.075,.03*(v||1),'sine',f*(1.12+rnd()*.35))}
 else if(k==='crack'){if(!sfxNoise){sfxNoise=ac.createBuffer(1,ac.sampleRate*.05,ac.sampleRate);const d=sfxNoise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(rnd()*2-1)*Math.pow(1-i/d.length,5)}
  const s=ac.createBufferSource(),g=ac.createGain(),h=ac.createBiquadFilter();s.buffer=sfxNoise;s.playbackRate.value=.7+rnd();h.type='highpass';h.frequency.value=900;g.gain.value=.35*(v||1);s.connect(h);h.connect(g);g.connect(ac.destination);s.start(t)}}

// ---- permukaan: suara langkah, kecepatan, es ----
const inPaddy=(x,z)=>{const lx=x-SWH_X;return PADDY.some(p=>lx>p[0]&&lx<p[2]&&z>p[1]&&z<p[3])},
 onIce=(x,z)=>zoneOf(x)==='salju'&&Math.hypot(x-SLJ_X-SLAKE.x,z-SLAKE.z)<SLAKE.r,
 spdK=(x,z)=>{const k=zoneOf(x);return k==='sakura'?(H(x,z)<.12&&!pier(x,z)?.6:1):k==='sawah'&&inPaddy(x,z)?.62:1},
 surf=(x,z)=>{const k=zoneOf(x);return k==='sakura'?(pier(x,z)?0:H(x,z)<.12?4:pd(x,z)<2.3?2:1):k==='sawah'?(inPaddy(x,z)?4:Math.abs(x-SWH_X)<3.1?2:1):k==='salju'?(onIce(x,z)?2:3):k==='parkour'?0:2};
function okS(x,z){return Math.abs(x-SWH_X)<56&&z>-77&&z<46&&!mHit(colS,x,z)&&mBn(x,z)}
function okW(x,z){return Math.hypot(x-SLJ_X,z)<68&&!mHit(colW,x,z)&&mBn(x,z)}

/* ======== PARKUR AWAN ======== */
const PKY=20,PK={P:[],dyn:[],spin:[],cps:[],fin:null,y:PKY,vy:0,ground:true,coyote:0,buf:0,on:null,cp:0,t0:0,time:0,run:false,done:false,kx:0,kz:0,camY:PKY,hit:0,key:'',best:+LS('wpkb',0),balloons:[]};
function pkGeo(w,h,d,top,side){const g=new THREE.BoxGeometry(w,h,d),n=g.attributes.position.count,a=new Float32Array(n*3),T=new THREE.Color(top),S=new THREE.Color(side),B=new THREE.Color(side).multiplyScalar(.62);
 for(let i=0;i<n;i++){const f=i>>2,c=f===2?T:f===3?B:S;a.set([c.r,c.g,c.b],i*3)}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g}
function pkSign(text){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='#1e4d36';x.fillRect(0,0,512,128);x.strokeStyle='#f3f6ef';x.lineWidth=7;x.strokeRect(13,13,486,102);
 x.fillStyle='#f3f6ef';x.font='800 72px "National Park",Overpass,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,68);const t=new THREE.CanvasTexture(c);return t}
function buildParkour(){
 const G=new THREE.Group(),S=[],C=[],X=PKR_X,rr=mRnd(33),
  T={start:['#f6f1dc','#2e6a8c'],step:['#8fd9f7','#2b78a8'],beam:['#dca866','#7a502b'],move:['#ffb64e','#b65f18'],bounce:['#ff7898','#a52f59'],disc:['#c6b4f0','#554198'],crumb:['#ecd6a0','#9b7943'],ice:['#e6fbff','#68aed4'],pil:['#a8e46f','#41802d'],cp:['#ffd45a','#a8721a'],fin:['#ffe070','#bd6b1a']},
  dyn=(g,m)=>{const o=new THREE.Mesh(g,m||mLit);G.add(o);return o},
  plat=(x,z,w,d,y,kind,o={})=>{const[a,b]=T[kind],h=o.h||.6,p={x:X+x,y,z,w,d,h,cx:X+x,cy:y,cz:z,px:X+x,py:y,pz:z,k:kind,mv:o.mv||null,st:0,tt:0,off:false,mesh:null};PK.P.push(p);
   const geo=[pkGeo(w,h,d,a,b),pkGeo(w+.12,.08,d+.12,'#ffffff','#ffffff').translate(0,h/2-.1,0)];
   if(kind==='bounce')geo.push(mG(new THREE.TorusGeometry(Math.min(w,d)*.3,.075,6,22),'#fff4f7',0,h/2+.02,0,PI/2));
   if(p.mv||kind==='crumb'){p.mesh=dyn(mMerge(geo));p.mesh.position.set(p.x,y-h/2,z);PK.dyn.push(p)}else for(const q of geo)S.push(q.translate(p.x,y-h/2,z));
   return p},
  isle=(p,r)=>{S.push(mG(new THREE.ConeGeometry(r,r*1.5,7),'#8d6a52',p.x,p.y-p.h-r*.75,p.z,PI),mG(new THREE.IcosahedronGeometry(r*.46),'#75533f',p.x+r*.34,p.y-p.h-r*.42,p.z-r*.22),mG(new THREE.IcosahedronGeometry(r*.3),'#9a7860',p.x-r*.46,p.y-p.h-r*.36,p.z+r*.3))},
  flag=(x,z,y)=>{S.push(mCyl(.06,.07,2.6,X+x,y+1.3,z,'#eef0f4',6),mCyl(.11,.11,.09,X+x,y+2.65,z,'#ffc53d',6));
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,.28,0,0,-.28,0,.9,0,0],3));
   const f=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xe4532f,side:THREE.DoubleSide}));f.position.set(X+x,y+2.28,z);G.add(f);return f},
  board=(x,y,z,text)=>{const t=pkSign(text);for(const r of[0,PI]){const m=new THREE.Mesh(new THREE.PlaneGeometry(4.2,1.05),new THREE.MeshBasicMaterial({map:t}));m.position.set(X+x,y,z+(r?-.02:.02));m.rotation.y=r;G.add(m)}
   for(const s of[-2.2,2.2])S.push(mCyl(.1,.1,3.9,X+x+s,y-1.45,z,'#6b4a2b',8))};
 // 0. awal
 const start=plat(0,0,7,7,PKY,'start');isle(start,3.4);board(0,PKY+3.4,-3.3,'MULAI');
 // 1. batu loncatan
 plat(0,-5.8,2.2,2.2,PKY,'step');plat(.9,-9.2,2.2,2.2,PKY+.35,'step');plat(-.2,-12.6,2.2,2.2,PKY+.7,'step');
 const c1=plat(0,-17,4,4,PKY+1,'cp');isle(c1,1.9);
 // 2. balok titian
 plat(0,-24.5,.75,11,PKY+1,'beam',{h:.35});plat(0,-32.6,3,3,PKY+1,'step');
 // 3. rakit melayang (belok ke timur)
 plat(5.6,-32.6,2.4,2.4,PKY+1,'move',{mv:{x:2,T:5.6}});plat(11.4,-32.6,2.4,2.4,PKY+1,'move',{mv:{z:2.4,T:4.7,ph:.3}});
 const c2=plat(15.9,-32.6,4,4,PKY+1,'cp');isle(c2,1.9);
 // 4. pelontar
 plat(20.4,-32.6,2,2,PKY+.6,'bounce');S.push(mCyl(.5,.8,1.6,X+20.4,PKY-.8,-32.6,'#7d2748',10));
 const d2=plat(25.1,-32.6,5.8,4,PKY+3.4,'step');isle(d2,1.8);
 // 5. cakram dengan palang berputar (belok ke utara)
 const disc=plat(25,-40,8,8,PKY+3.4,'disc');isle(disc,3.6);
 {const sp={x:X+25,z:-40,y:PKY+3.4+.45,L:3.6,w:1.45,a:0,mesh:null},bar=[];for(let i=0;i<8;i++)bar.push(mG(new THREE.BoxGeometry(.9,.3,.3),i%2?'#ffffff':'#e4532f',-3.15+i*.9,0,0));
  sp.mesh=dyn(mMerge(bar));sp.mesh.position.set(sp.x,sp.y,sp.z);PK.spin.push(sp);S.push(mCyl(.34,.46,1,sp.x,PKY+3.9,sp.z,'#4b3a86',10));
  PK.P.push({x:sp.x,y:PKY+4.4,z:-40,w:.7,d:.7,h:1,cx:sp.x,cy:PKY+4.4,cz:-40,k:'post',off:false})}
 const c3=plat(25,-47.6,4,4,PKY+3.4,'cp');isle(c3,1.9);
 // 6. lantai rapuh
 for(const[x,z]of[[25,-51.5],[25.6,-53.8],[24.6,-56.1],[25.4,-58.4],[25,-60.7]])plat(x,z,1.7,1.7,PKY+3.4,'crumb',{h:.3});
 plat(25,-64,3,3,PKY+3.4,'step');
 // 7. es licin (belok ke barat)
 plat(19.75,-64,7.5,2.3,PKY+3.4,'ice',{h:.35});plat(10.5,-64,7,2.3,PKY+3.4,'ice',{h:.35});
 const c4=plat(4,-64,4,4,PKY+3.4,'cp');isle(c4,1.9);
 // 8. tangga pilar menuju finis
 [[0,-64],[-2.2,-61.6],[-5,-61],[-7.4,-62.6],[-8,-65.4],[-6.6,-67.8]].forEach(([x,z],i)=>{const p=plat(x,z,1.4,1.4,PKY+3.9+i*.55,'pil');S.push(mCyl(.34,.5,5,p.x,p.y-p.h-2.5,z,'#3d6b31',7))});
 const fin=plat(-2.8,-69.5,5,5,PKY+7.2,'fin');isle(fin,2.6);board(-2.8,PKY+10.6,-71.4,'FINIS');PK.fin=fin;
 PK.cps=[{p:start,yaw:0},{p:c1,yaw:0,f:flag(1.6,-18.4,c1.y)},{p:c2,yaw:-PI/2,f:flag(17.3,-34.2,c2.y)},{p:c3,yaw:0,f:flag(26.5,-49,c3.y)},{p:c4,yaw:PI/2,f:flag(5.4,-65.4,c4.y)}];
 // pemandangan: lautan awan, pulau melayang, balon udara, pelangi
 for(let n=0;n<60;n++){const x=-90+rr()*200,z=-170+rr()*230,y=1+rr()*8,s=2.2+rr()*3.8;for(let j=0;j<4;j++){const q=new THREE.IcosahedronGeometry(s*(.55+rr()*.6),1);q.scale(1.3,.55,1);C.push(mG(q,'#f4f9ff',X+x+(j-1.5)*s*.9,y+rr()*s*.3,z+(rr()-.5)*s*1.4))}}
 for(const[x,y,z,s]of[[-34,15,-34,5],[48,27,-82,7],[-30,25,-98,6],[52,13,6,4],[-46,31,22,5],[24,36,-128,8]]){
  S.push(mG(new THREE.ConeGeometry(s,s*1.5,8),'#8d6a52',X+x,y-s*.75,z,PI),mCyl(s,s,.9,X+x,y+.35,z,'#7cc558',8));
  for(let k=0;k<3;k++){const a=k*2.2+x,qx=X+x+Math.cos(a)*s*.5,qz=z+Math.sin(a)*s*.5,hh=1.4+rr()*1.4;S.push(mCyl(.18,.26,hh,qx,y+.8+hh/2,qz,'#6b4a2b',6),mG(new THREE.IcosahedronGeometry(.9+rr()*.7,0),k%2?'#4ea34a':'#69bb52',qx,y+.8+hh+.5,qz))}}
 for(const[x,y,z,a,b]of[[-17,27,-52,'#e4532f','#ffd45a'],[42,31,-30,'#2c78c8','#ffffff'],[13,38,-96,'#8a55c8','#ffb0c4']]){
  const bl=new THREE.Group(),e=new THREE.SphereGeometry(3,16,12).scale(1,1.16,1),P=e.attributes.position,col=new Float32Array(P.count*3),A=new THREE.Color(a),B=new THREE.Color(b);
  for(let i=0;i<P.count;i++){const k=(Math.floor((Math.atan2(P.getX(i),P.getZ(i))+PI)/(PI/4)+.01))%2?A:B;col.set([k.r,k.g,k.b],i*3)}e.setAttribute('color',new THREE.BufferAttribute(col,3));
  const q=[e,mG(new THREE.BoxGeometry(1.2,.9,1.2),'#7a502b',0,-5,0)];for(const[u,v]of[[1,1],[1,-1],[-1,1],[-1,-1]])q.push(mG(new THREE.CylinderGeometry(.03,.03,2,4),'#4a3524',u*.55,-3.7,v*.55));
  bl.add(new THREE.Mesh(mMerge(q),mFlat));bl.position.set(X+x,y,z);G.add(bl);PK.balloons.push({g:bl,y,ph:x})}
 ['#ff6b6b','#ffa94d','#ffe066','#69db7c','#4dabf7','#9775fa'].forEach((c,i)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(62-i*1.7,.9,5,60,PI),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.5,fog:false,depthWrite:false}));m.position.set(X+6,6,-170);G.add(m)});
 mMesh(G,S,mFlat);mMesh(G,C,new THREE.MeshLambertMaterial({vertexColors:true,emissive:0x2a3c55}));
 return mBenches(G,[],'parkour')}
const pkHit=(p,x,z,r)=>Math.abs(x-p.cx)<p.w/2+r&&Math.abs(z-p.cz)<p.d/2+r,
 pkWall=(x,z)=>PK.P.some(p=>!p.off&&p.cy>PK.y+.34&&p.cy-p.h<PK.y+1.7&&pkHit(p,x,z,.26)&&!pkHit(p,pos.x,pos.z,.26)),
 pkFmt=t=>{const d=Math.floor(t*10),m=d/600|0,s=(d-m*600)/10;return(m<10?'0':'')+m+':'+(s<10?'0':'')+s.toFixed(1)};
function pkWorld(dt){const t=Date.now()/1000; // jam dinding: posisi rakit & palang sama untuk semua pemain
 for(const p of PK.dyn){p.px=p.cx;p.py=p.cy;p.pz=p.cz;let shake=0;
  if(p.mv){const a=Math.sin((t/p.mv.T+(p.mv.ph||0))*PI*2);p.cx=p.x+(p.mv.x||0)*a;p.cz=p.z+(p.mv.z||0)*a}
  if(p.st){p.tt+=dt;if(p.st===1){shake=Math.sin(p.tt*70)*.045;if(p.tt>.6){p.st=2;p.off=true}}else{p.cy-=(p.tt-.6)*10*dt;if(p.tt>3.6){p.st=0;p.off=false;p.cy=p.y}}}
  p.mesh.position.set(p.cx+shake,p.cy-p.h/2,p.cz);p.mesh.visible=!(p.st===2&&p.tt>1.7)}
 for(const s of PK.spin){s.a=(t*s.w)%(PI*2);s.mesh.rotation.y=s.a}
 for(const b of PK.balloons){b.g.position.y=b.y+Math.sin(T*.5+b.ph)*.8;b.g.rotation.y=T*.08}}
function pkPlace(x,y,z,a){pos.x=x;pos.z=z;vel.x=vel.z=0;PK.y=PK.camY=py=y;PK.vy=0;PK.ground=true;PK.on=null;PK.kx=PK.kz=PK.buf=0;yaw=syaw=chYaw=a;pitch=spit=-.38}
function pkReset(){const s=PK.cps[0].p;PK.cp=0;PK.run=PK.done=false;PK.time=0;PK.key='';PK.cps.forEach(c=>c.f&&c.f.material.color.setHex(0xe4532f));
 for(const p of PK.dyn){p.st=0;p.off=false;p.cy=p.y}pkPlace(s.x,s.y,s.z+1.5,0)}
function pkRespawn(){const c=PK.cps[PK.cp],p=c.p;sfx('fall');pkPlace(p.x,p.y,PK.cp?p.z:p.z+1.5,c.yaw);toast('Jatuh. Kembali ke titik simpan.')}
function pkStep(dt,tx,tz){
 const on=PK.ground&&PK.on;
 if(on&&on.mv){pos.x+=on.cx-on.px;pos.z+=on.cz-on.pz}
 const k=1-Math.exp(-(on&&on.k==='ice'?1.3:PK.ground?10:6)*dt);vel.x+=(tx-vel.x)*k;vel.z+=(tz-vel.z)*k;
 const mx=(vel.x+PK.kx)*dt,mz=(vel.z+PK.kz)*dt,f=Math.exp(-3.5*dt);PK.kx*=f;PK.kz*=f;
 if(!pkWall(pos.x+mx,pos.z))pos.x+=mx;else vel.x=0;
 if(!pkWall(pos.x,pos.z+mz))pos.z+=mz;else vel.z=0;
 if(PK.ground)for(const p of PK.P)if(!p.off&&p.cy>PK.y&&p.cy<=PK.y+.34&&pkHit(p,pos.x,pos.z,.2)){PK.y=p.cy;PK.on=p}
 PK.coyote=PK.ground?.13:PK.coyote-dt;PK.buf-=dt;PK.hit-=dt;
 if(PK.buf>0&&PK.coyote>0){PK.vy=5.4;PK.ground=false;PK.on=null;PK.buf=PK.coyote=0}
 PK.vy=Math.max(-18,PK.vy-15*dt);let ny=PK.y+PK.vy*dt,land=null;
 for(const p of PK.P){if(p.off||!pkHit(p,pos.x,pos.z,.22))continue;
  if(PK.vy<=0){if(p.cy<=PK.y+.06&&p.cy>=ny-.002&&(!land||p.cy>land.cy))land=p}
  else{const under=p.cy-p.h;if(under>=PK.y+1.65&&under<ny+1.7){ny=under-1.7;PK.vy=0}}}
 if(land){PK.y=land.cy;PK.vy=0;PK.ground=true;PK.on=land;
  if(land.k==='bounce'){PK.vy=10;PK.ground=false;PK.on=null;sfx('boing')}else if(land.k==='crumb'&&!land.st){land.st=1;land.tt=0}}
 else{PK.y=ny;PK.ground=false;PK.on=null}
 for(const s of PK.spin){const ux=Math.cos(s.a),uz=-Math.sin(s.a),dx=pos.x-s.x,dz=pos.z-s.z,along=dx*ux+dz*uz,across=dx*-uz+dz*ux;
  if(PK.hit<=0&&Math.abs(along)<s.L&&Math.abs(across)<.38&&PK.y<s.y+.15&&PK.y+1.7>s.y-.15){const d=Math.sign(along)||1;PK.kx=-Math.sin(s.a)*d*8;PK.kz=-Math.cos(s.a)*d*8;PK.vy=3.2;PK.ground=false;PK.on=null;PK.hit=.5;sfx('hit')}}
 for(let i=PK.cp+1;i<PK.cps.length;i++){const c=PK.cps[i];if(PK.ground&&PK.on===c.p){PK.cp=i;c.f.material.color.setHex(0x43c66b);sfx('cp');toast('Titik simpan '+i+' dari '+(PK.cps.length-1))}}
 const s0=PK.cps[0].p;
 if(!PK.run&&!PK.done&&Math.max(Math.abs(pos.x-s0.x),Math.abs(pos.z-s0.z))>3.7){PK.run=true;PK.t0=performance.now()}
 if(PK.run){PK.time=(performance.now()-PK.t0)/1000;
  if(PK.ground&&PK.on===PK.fin){PK.run=false;PK.done=true;const rec=!PK.best||PK.time<PK.best;if(rec){PK.best=PK.time;SS('wpkb',PK.time.toFixed(2))}sfx('fin');fxBurst(pos.x,PK.y+1.6,pos.z,'🎉',12);toast((rec?'Rekor baru: ':'Finis: ')+pkFmt(PK.time))}}
 if(PK.y<PKY-9)pkRespawn()}
function pkHud(){const t=pkFmt(PK.time),key=t+'|'+PK.cp+'|'+PK.done+'|'+PK.best;if(key===PK.key)return;PK.key=key;
 $('pkt').textContent=t;const n=PK.cps.length;let h='';for(let i=1;i<=n;i++)h+='<li class="'+((i<n?i<=PK.cp:PK.done)?'on':'')+(i===n?' end':'')+'"></li>';$('pkc').innerHTML=h;
 $('pkc').setAttribute('aria-label',PK.done?'Sudah finis':'Titik simpan '+PK.cp+' dari '+(n-1));$('pkb').textContent=PK.best?'Rekor '+pkFmt(PK.best):'Belum ada rekor'}

/* ======== DESA SAWAH ======== */
const SW={ducks:[],kites:[],birds:null,smoke:[],mist:[],chirp:2};
const duckPath=[[-11,32.6],[-11,-3],[-25,-3],[-25,9],[-39,9],[-39,32.6]];
function pathAt(P,d){let L=0;const seg=P.map((a,i)=>{const b=P[(i+1)%P.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);L+=l;return[a,b,l]});d=((d%L)+L)%L;for(const[a,b,l]of seg){if(d<=l)return[a[0]+(b[0]-a[0])*d/l,a[1]+(b[1]-a[1])*d/l,b[0]-a[0],b[1]-a[1]];d-=l}return[P[0][0],P[0][1],1,0]}
function buildSawah(){
 const G=new THREE.Group(),S=[],E=[],W=[],X=SWH_X,rr=mRnd(21),y0=(x,z)=>hSawah(X+x,z);
 const cols=[[-52,-40],[-38,-26],[-24,-12],[-10,-3.6],[3.6,10],[12,24],[26,38],[40,52]],
  rows=[[34,44],[22,32],[10,20],[-2,8],[-14,-4],[-27.6,-19],[-39.6,-31],[-51.6,-43],[-63.4,-54.8],[-75,-65.6]],
  saungs=[[-32,27],[18,-9],[-6.8,-70]];
 cols.forEach((c,i)=>rows.forEach((r,j)=>{
  if(c[0]>=3&&c[0]<40&&r[0]>=-2&&r[0]<=22&&!(j===3&&i===4))return; // kampung
  if(c[0]>=-10&&c[1]<=10&&r[0]>=22)return;                         // halaman depan
  if(saungs.some(([x,z])=>x>c[0]&&x<c[1]&&z>r[0]&&z<r[1]))return;
  const q=mHash(i*3+1,j*7+2);PADDY.push([c[0],r[0],c[1],r[1],q<.28?0:q<.68?1:2])}));
 const inPlot=(x,z)=>PADDY.some(p=>x>p[0]&&x<p[2]&&z>p[1]&&z<p[3]),village=(x,z)=>x>3&&x<40&&z>6&&z<33;
 G.add(mTerr(X,-18,200,176,160,(x,z)=>hSawah(x,z),(x,z,h)=>{const n=mHash(Math.round(x*3),Math.round(z*3))*.07-.035,steep=Math.abs(hSawah(0,z+.8)-hSawah(0,z-.8))>.28;
   if(Math.abs(x)<3.1)return[.74+n,.58+n,.37+n];
   if(inPlot(x,z))return[.36+n,.33+n,.2+n];
   if(village(x,z))return[.7+n,.57+n,.36+n];
   return steep?[.56+n,.47+n,.26+n]:[.5+n,.7+n*1.6,.27+n]},new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,map:gtex})));
 // petak sawah: air, pematang, padi
 const water=['#8cc3cf','#6f9d80','#a89a52'],rice=[],dm2=new THREE.Object3D();
 for(const[x0,z0,x1,z1,k]of PADDY){const cx=(x0+x1)/2,cz=(z0+z1)/2,y=y0(cx,cz),w=x1-x0,d=z1-z0;
  W.push(mG(new THREE.PlaneGeometry(w,d).rotateX(-PI/2),water[k],X+cx,y+.05,cz));
  for(const[a,b,c,e]of[[cx,z0,w+.5,.45],[cx,z1,w+.5,.45],[x0,cz,.45,d],[x1,cz,.45,d]])S.push(mBox(c,.2,e,X+a,y+.06,b,'#9c8a46'));
  const gap=k===0?1.15:.82;for(let x=x0+.55;x<x1-.3;x+=gap)for(let z=z0+.55;z<z1-.3;z+=gap)rice.push([X+x+(rr()-.5)*.2,y+.03,z+(rr()-.5)*.2,k])}
 const blade=(()=>{const P=[];for(let i=0;i<5;i++){const a=i*1.2566,dx=Math.cos(a),dz=Math.sin(a),hh=.46+(i%3)*.07;P.push(-dz*.026,0,dx*.026,dz*.026,0,-dx*.026,dx*.15,hh,dz*.15)}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.computeVertexNormals();return g})(),
  RI=new THREE.InstancedMesh(blade,new THREE.MeshLambertMaterial({side:THREE.DoubleSide,emissive:0x1b1e08}),rice.length),col=new THREE.Color();
 rice.forEach(([x,y,z,k],i)=>{const s=(k===0?.55:1)*(.85+rr()*.35);dm2.position.set(x,y,z);dm2.rotation.set(0,rr()*6.28,0);dm2.scale.set(s,s,s);dm2.updateMatrix();RI.setMatrixAt(i,dm2.matrix);
  RI.setColorAt(i,col.setHSL(k===2?.13+rr()*.02:k===1?.27+rr()*.03:.23+rr()*.04,k===2?.7:.58,k===2?.54:k===1?.4:.52))});
 RI.frustumCulled=false;G.add(RI);
 // parit di kanan-kiri jalan
 for(let z=44;z>-76;z-=2)for(const s of[-3.35,3.35])W.push(mG(new THREE.PlaneGeometry(.45,2.05).rotateX(-PI/2),'#7fb6c4',X+s,y0(s,z-1)+.06,z-1));
 const solid=(x,z,r)=>colS.push([X+x-r,z-r,X+x+r,z+r]);
 // saung
 for(const[x,z]of saungs){const y=y0(x,z);for(const[a,b]of[[-1.6,-1.3],[1.6,-1.3],[-1.6,1.3],[1.6,1.3]]){S.push(mCyl(.1,.12,2.7,X+x+a,y+1.35,z+b,'#c9a35a',7));solid(x+a,z+b,.12)}
  for(const b of[-1.45,1.45])S.push(mBox(3.7,.12,.18,X+x,y+2.55,z+b,'#a97f3c'));
  S.push(mG(new THREE.ConeGeometry(1,1,4).rotateY(PI/4).scale(3.3,1.45,2.9),'#b98c3f',X+x,y+3.3,z),mG(new THREE.ConeGeometry(1,1,4).rotateY(PI/4).scale(1.5,.8,1.35),'#8f6a2e',X+x,y+4.05,z))}
 // rumah kampung (atap bersusun)
 for(const[x,z,w,d]of[[17,15,6,5],[31,13,5.5,5],[25,27,7,5]]){const y=y0(x,z);
  S.push(mBox(w+.5,.35,d+.5,X+x,y+.17,z,'#8f8a80'),mBox(w,2.5,d,X+x,y+1.6,z,'#b77a47'),mBox(1.2,1.9,.12,X+x,y+1.3,z+d/2+.02,'#5a3522'),mBox(.12,1.9,1.2,X+x-w/2-.02,y+1.3,z,'#5a3522'));
  for(let k=-w/2+.6;k<w/2;k+=1.2)S.push(mBox(.1,2.5,.06,X+x+k,y+1.6,z-d/2-.03,'#8a5630'));
  for(const s of[-w*.3,w*.3]){E.push(mBox(1,.8,.1,X+x+s,y+1.85,z+d/2+.03,'#ffd98a'));S.push(mBox(1.2,.1,.18,X+x+s,y+2.32,z+d/2+.05,'#5a3522'))}
  S.push(mG(new THREE.CylinderGeometry(.62,1,1,4,1).rotateY(PI/4).scale((w+2)/1.414,1,(d+2)/1.414),'#a2462f',X+x,y+3.35,z),
   mG(new THREE.ConeGeometry(1,1,4).rotateY(PI/4).scale(w*.62/1.414*1.1,1.7,d*.62/1.414*1.1),'#7e3324',X+x,y+4.7,z),mBox(.2,.45,.2,X+x,y+5.6,z,'#5a2418'));
  colS.push([X+x-w/2,z-d/2,X+x+w/2,z+d/2])}
 // sumur
 {const x=11,z=27,y=y0(x,z);S.push(mCyl(.9,.95,.85,X+x,y+.42,z,'#9a948a',12),mCyl(.7,.7,.08,X+x,y+.83,z,'#2c4a5c',12));for(const s of[-.9,.9])S.push(mCyl(.07,.07,2.1,X+x+s,y+1.05,z,'#6b4a2b',6));S.push(mG(new THREE.ConeGeometry(1,1,4).rotateY(PI/4).scale(1.6,.7,1.1),'#a2462f',X+x,y+2.45,z));solid(x,z,.95)}
 // pohon kelapa
 const palm=(x,z,s,a)=>{const y=y0(x,z),lx=Math.cos(a),lz=Math.sin(a);let px=X+x,pz=z,py2=y;
  for(let k=0;k<6;k++){const dx=lx*k*.07*s,dz=lz*k*.07*s,h=1.05*s;S.push(mG(new THREE.CylinderGeometry((.15-k*.012)*s,(.18-k*.012)*s,h*1.08,6),k%2?'#8d6c46':'#9d7b52',px+dx/2,py2+h/2,pz+dz/2,dz/h,0,-dx/h));px+=dx;pz+=dz;py2+=h}
  for(let i=0;i<8;i++)S.push(mTint(new THREE.ConeGeometry(.42*s,2.9*s,4).rotateZ(-PI/2).scale(1,.12,1).translate(1.4*s,0,0).rotateZ(i%2?-.45:-.18).rotateY(i/8*PI*2+a).translate(px,py2+.05,pz),i%2?'#4c9a3c':'#66b447'));
  for(let i=0;i<3;i++)S.push(mG(new THREE.IcosahedronGeometry(.17*s,0),'#7a8f2f',px+Math.cos(i*2.1)*.2,py2-.18,pz+Math.sin(i*2.1)*.2));solid(x,z,.14)};
 for(const[x,z]of[[4.9,33],[-4.9,21],[4.9,45],[11,33.5],[39.4,21],[39.4,33],[-25,21],[-53.5,33],[-25,45],[25,45],[-53.5,10],[53.5,-9],[-11,-16.5],[25,-16.5],[-39,-29],[11,-41],[-25,-53],[39,-53],[53.5,34],[-53.5,-65]])palm(x,z,.85+rr()*.35,rr()*6.28);
 // pisang
 for(const[x,z]of[[9,8.6],[35,23],[14,30.5],[38,8],[-5,43],[-45,45]]){const y=y0(x,z);S.push(mCyl(.12,.17,1.6,X+x,y+.8,z,'#8aa14a',6));
  for(let i=0;i<6;i++)S.push(mTint(new THREE.BoxGeometry(1.5,.03,.55).translate(.75,0,0).rotateZ(.55-(i%2)*.5).rotateY(i*1.05).translate(X+x,y+1.6,z),i%2?'#5aa63f':'#72bd4c'));solid(x,z,.2)}
 // orang-orangan sawah
 for(const[x,z]of[[-18,-9],[46,3],[-45,-48]]){const y=y0(x,z);S.push(mCyl(.05,.06,1.9,X+x,y+.95,z,'#6b4a2b',5),mBox(1.5,.08,.08,X+x,y+1.45,z,'#6b4a2b'),mBox(.55,.7,.26,X+x,y+1.2,z,'#c0462f'),mBox(1.3,.2,.14,X+x,y+1.42,z,'#c0462f'),
   mG(new THREE.IcosahedronGeometry(.22,0),'#e0c070',X+x,y+1.8,z),mG(new THREE.ConeGeometry(.45,.24,10),'#d9a950',X+x,y+2.06,z))}
 // rumpun bambu & pepohonan tepi (menutup batas peta)
 for(let n=0;n<150;n++){const side=n%3,x=side===0?-58-rr()*16:side===1?58+rr()*16:-70+rr()*140,z=side===2?(n%2?50+rr()*14:-80-rr()*12):-82+rr()*134;
  if(side===2&&Math.abs(x)<6)continue;const y=y0(x,z),h=2+rr()*2.6;
  if(rr()<.3)for(let k=0;k<5;k++)S.push(mG(new THREE.CylinderGeometry(.07,.09,h*1.9,5),k%2?'#8fae45':'#a7bf55',X+x+(rr()-.5)*1.4,y+h*.95,z+(rr()-.5)*1.4,(rr()-.5)*.2,0,(rr()-.5)*.24),mG(new THREE.IcosahedronGeometry(.6,0),'#7fae3e',X+x+(rr()-.5)*1.8,y+h*1.9,z+(rr()-.5)*1.8));
  else S.push(mCyl(.2,.32,h,X+x,y+h/2,z,'#6b4a2b',6),mG(new THREE.IcosahedronGeometry(1.5+rr()*1.2,0),['#3f8a3a','#54a045','#6ab04a'][n%3],X+x,y+h+.8,z))}
 // gunung & perbukitan di kejauhan (warna sudah dibuat berkabut)
 const far=[mHaze(new THREE.CylinderGeometry(11,112,72,30,8,true).translate(X-46,34,-238),'#cfe0d6','#6f93ae',0,50),
  mHaze(new THREE.CylinderGeometry(7,11,7,30,1,true).translate(X-46,73,-238),'#6a8ca8','#58738c',70,76)];
 for(const[x,z,r,h]of[[-150,-170,80,32],[70,-200,95,38],[160,-110,70,26],[-185,-40,72,24],[180,40,80,22],[-150,110,90,26],[40,170,110,24]])far.push(mHaze(new THREE.ConeGeometry(r,h,18,6,true).translate(X+x,h/2-3,z),'#d8e3d0','#7fa68c',0,h*.8));
 mMesh(G,far,mFar);
 for(let i=0;i<8;i++){const s=mPuff(0xf2eee8,14,.6);s.material.fog=false;G.add(s);SW.smoke.push({s,k:i/8})}
 for(let i=0;i<10;i++){const s=mPuff(0xf4fbff,22+rr()*18,.3);s.position.set(X-50+rr()*100,2.6+rr()*2,-90+rr()*70);G.add(s);SW.mist.push({s,x:s.position.x,ph:rr()*6})}
 mMesh(G,S,mFlat);mMesh(G,E,mEmi);mMesh(G,W,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.16,metalness:.25,emissive:0x14262c}));
 // bebek berbaris
 for(let i=0;i<6;i++){const d=new THREE.Group(),c=i?'#fbf7ee':'#b98a58',body=new THREE.IcosahedronGeometry(.22,1).scale(.9,.8,1.35),q=[mG(body,c,0,.24,0),mG(new THREE.IcosahedronGeometry(.12,1),c,0,.49,.22),mG(new THREE.ConeGeometry(.055,.13,6),'#f08a2a',0,.47,.36,PI/2),mG(new THREE.ConeGeometry(.09,.18,5),c,0,.31,-.32,-1.9),mBox(.04,.12,.04,-.08,.06,0,'#f08a2a'),mBox(.04,.12,.04,.08,.06,0,'#f08a2a'),mBox(.02,.03,.02,-.085,.52,.29,'#15100c'),mBox(.02,.03,.02,.085,.52,.29,'#15100c')];
  const m=new THREE.Mesh(mMerge(q),mFlat);m.scale.setScalar(i?.9:1.1);d.add(m);G.add(d);SW.ducks.push({g:d,off:-i*.95})}
 // layang-layang
 [[-17,17,-34,'#e4532f','#ffd45a'],[21,22,-58,'#2c78c8','#ffffff'],[9,14,-10,'#8a55c8','#7ee08a']].forEach(([x,y,z,a,b],i)=>{
  const g=new THREE.BufferGeometry(),A=new THREE.Color(a),B=new THREE.Color(b);g.setAttribute('position',new THREE.Float32BufferAttribute([0,1.1,0,-.8,.2,0,0,.2,0, 0,1.1,0,0,.2,0,.8,.2,0, 0,.2,0,-.8,.2,0,0,-.9,0, 0,.2,0,0,-.9,0,.8,.2,0],3));
  const cc2=[];for(let t=0;t<4;t++){const c=t===0||t===3?A:B;for(let v=0;v<3;v++)cc2.push(c.r,c.g,c.b)}g.setAttribute('color',new THREE.Float32BufferAttribute(cc2,3));
  const k=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));G.add(k);
  const line=n=>{const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({length:n},()=>new THREE.Vector3())),new THREE.LineBasicMaterial({color:0xf6f1e4,transparent:true,opacity:.6}));l.frustumCulled=false;G.add(l);return l};
  SW.kites.push({k,s:line(2),t:line(8),x:X+x,y,z,gx:X+x*.45,gz:z+15,gy:y0(x*.45,z+15)+1,ph:i*2.1})});
 // burung
 {const b=new THREE.Group();for(let i=0;i<9;i++){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,.12,-.6,.18,-.08,0,0,-.08, 0,0,.12,0,0,-.08,.6,.18,-.08],3));
   const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x30343c,side:THREE.DoubleSide}));const r=Math.ceil(i/2),s=i%2?1:-1;m.position.set(i?s*r*1.3:0,rr()*.4,-r*1.1);b.add(m)}G.add(b);SW.birds=b}
 return mBenches(G,[[X-32,27,-PI/2],[X+18,-9,0],[X-6.8,-70,PI],[X+8,24,PI/2],[X-6,38,-PI/2]],'sawah')}
function sawahTick(dt){const X=SWH_X;
 for(const d of SW.ducks){const[x,z,dx,dz]=pathAt(duckPath,T*.75+d.off);d.g.position.set(X+x,hSawah(X+x,z)+.04,z);d.g.rotation.set(0,Math.atan2(dx,dz),Math.sin(T*9+d.off*5)*.09)}
 for(const k of SW.kites){const x=k.x+Math.sin(T*.5+k.ph)*2.6+Math.sin(T*1.3+k.ph)*.5,y=k.y+Math.sin(T*.8+k.ph*2)*1.2,z=k.z+Math.cos(T*.4+k.ph)*1.4;
  k.k.position.set(x,y,z);k.k.rotation.set(-.35,Math.sin(T*.6+k.ph)*.4,Math.sin(T*1.1+k.ph)*.22);
  const s=k.s.geometry.attributes.position;s.setXYZ(0,k.gx,k.gy,k.gz);s.setXYZ(1,x,y,z);s.needsUpdate=true;
  const t=k.t.geometry.attributes.position;for(let i=0;i<8;i++)t.setXYZ(i,x+Math.sin(T*4-i*.9+k.ph)*i*.07,y-.9-i*.42,z+i*.1);t.needsUpdate=true}
 if(SW.birds){const a=T*.12,b=SW.birds;b.position.set(X+Math.cos(a)*36,24+Math.sin(T*.3)*2,-34+Math.sin(a)*28);b.rotation.y=Math.atan2(-Math.sin(a)*36,Math.cos(a)*28);b.children.forEach((m,i)=>m.scale.y=Math.sin(T*7+i)*1.4)}
 for(const p of SW.smoke){const k=(p.k+T*.035)%1;p.s.position.set(X-46+k*26,74+k*34,-238);p.s.scale.set(14+k*40,8+k*20,1);p.s.material.opacity=.65*Math.sin(Math.min(1,k*1.15)*PI)}
 for(const m of SW.mist)m.s.position.x=m.x+Math.sin(T*.07+m.ph)*5;
 if(playing&&(SW.chirp-=dt)<0){SW.chirp=1.4+rnd()*4;sfx('bird',.5+rnd()*.8)}}

/* ======== DESA SALJU ======== */
const WN={flames:[],light:null,smoke:[],snow:null,crack:0};
const FIRE={x:0,z:3};
function buildSalju(){
 const G=new THREE.Group(),S=[],E=[],ice=[],X=SLJ_X,rr=mRnd(44),y0=(x,z)=>hSalju(X+x,z),
  lake=(x,z)=>Math.hypot(x-SLAKE.x,z-SLAKE.z),solid=(x,z,r)=>colW.push([X+x-r,z-r,X+x+r,z+r]);
 G.add(mTerr(X,0,250,250,170,(x,z)=>hSalju(x,z),(x,z)=>{const n=mHash(Math.round(x*2),Math.round(z*2))*.045-.02,dl=lake(x,z),
   walk=Math.max(0,1-Math.abs(Math.hypot(x-FIRE.x,z-FIRE.z)-4.6)/4)*.07+(Math.abs(x)<1.7&&z>8&&z<30?.07:0);
   if(dl<SLAKE.r+.4)return[.55,.72,.86];
   return[.86+n-walk,.9+n-walk,.99-walk*.7]},new THREE.MeshStandardMaterial({vertexColors:true,roughness:1})));
 // danau beku
 {const m=new THREE.Mesh(new THREE.CircleGeometry(SLAKE.r+.25,56).rotateX(-PI/2),new THREE.MeshStandardMaterial({color:0x9fd0ee,roughness:.08,metalness:.45,emissive:0x14344f}));m.position.set(X+SLAKE.x,.212,SLAKE.z);G.add(m);
  for(let i=0;i<34;i++){const a=rr()*6.28,r=Math.sqrt(rr())*(SLAKE.r-1.6),l=.7+rr()*2.4;ice.push(mG(new THREE.BoxGeometry(l,.006,.035),'#eaf8ff',X+SLAKE.x+Math.cos(a)*r,.217,SLAKE.z+Math.sin(a)*r,0,rr()*3.14))}
  for(let i=0;i<46;i++){const a=i/46*6.283;ice.push(mG(new THREE.IcosahedronGeometry(.5+rr()*.5,0),'#eef3ff',X+SLAKE.x+Math.cos(a)*(SLAKE.r+.7),.18,SLAKE.z+Math.sin(a)*(SLAKE.r+.7)))}}
 // pondok kayu
 const cabin=(x,z,ry)=>{const y=y0(x,z),w=5.2,d=4.2,put=(g,c)=>mTint(g.rotateY(ry).translate(X+x,y,z),c),Hr=1.9;
  for(let k=0;k<8;k++)S.push(put(new THREE.BoxGeometry(w+(k%2?.2:0),.33,d+(k%2?0:.2)).translate(0,.17+k*.33,0),k%2?'#7d4c2c':'#8e5a34'));
  const roof=(len,wid,hh,lift,c)=>put(new THREE.CylinderGeometry(1,1,len,3,1).rotateZ(PI/2).rotateX(-PI/2).scale(1,hh/1.5,wid/1.732).translate(0,2.64+hh/3+lift,0),c);
  S.push(roof(w+.8,d+1.3,Hr,.02,'#f4f7ff'),roof(w+.86,d+.55,Hr*.8,-.04,'#6b3f25'));
  S.push(put(new THREE.BoxGeometry(1.05,1.8,.12).translate(-.9,.9,d/2+.13),'#4a2a18'),put(new THREE.BoxGeometry(.7,1.5,.7).translate(1.5,3.9,-.6),'#8f8a92'),put(new THREE.BoxGeometry(.84,.16,.84).translate(1.5,4.72,-.6),'#f4f7ff'));
  for(const[px,pz,sx,sz]of[[1.15,d/2+.12,1.1,.1],[w/2+.12,0,.1,1.1],[-w/2-.12,0,.1,1.1]]){E.push(put(new THREE.BoxGeometry(sx,.85,sz).translate(px,1.45,pz),'#ffc867'));
   S.push(put(new THREE.BoxGeometry(Math.max(sx,.12),.07,Math.max(sz,.12)).translate(px,1.45,pz),'#4a2a18'),put(new THREE.BoxGeometry(sx+.2,.14,sz+.2).translate(px,.96,pz),'#f4f7ff'))}
  const c=Math.abs(Math.cos(ry)),s=Math.abs(Math.sin(ry)),hx=(w*c+d*s)/2,hz=(w*s+d*c)/2;colW.push([X+x-hx,z-hz,X+x+hx,z+hz]);
  const v=new THREE.Vector3(1.5,5,-.6).applyAxisAngle(new THREE.Vector3(0,1,0),ry);for(let i=0;i<4;i++){const p=mPuff(0xc9cbe4,1.6,.4);G.add(p);WN.smoke.push({s:p,x:X+x+v.x,y:y+v.y,z:z+v.z,k:i/4+x*.1})}};
 cabin(-15,-5,PI/2);cabin(-8,-19,.0);cabin(6,-26,0);cabin(-19,14,PI/2);cabin(15,17,-PI/2);
 // pinus bersalju
 const pine=(x,z,s)=>{const y=y0(x,z);S.push(mCyl(.16*s,.24*s,1.3*s,X+x,y+.65*s,z,'#5a3b28',6));
  for(let k=0;k<3;k++){const r=(1.55-k*.34)*s,cy=y+(1.55+k*.86)*s;S.push(mCyl(0,r,1.55*s,X+x,cy,z,k%2?'#2f6a57':'#285c4d',8),mCyl(0,r*.52,.72*s,X+x,cy+.46*s,z,'#eef3ff',8))}solid(x,z,.2*s)};
 for(let n=0,made=0;n<900&&made<130;n++){const a=rr()*6.283,r=28+Math.sqrt(rr())*58,x=Math.cos(a)*r,z=Math.sin(a)*r;if(lake(x,z)<SLAKE.r+3||(Math.abs(x)<5&&z>0&&z<44))continue;pine(x,z,.9+rr()*.8);made++}
 for(const[x,z]of[[-22,3],[-3,-31],[18,-30],[24,10],[-12,25],[11,28]])pine(x,z,1+rr()*.4);
 // manusia salju
 for(const[x,z]of[[7,12],[-11,5],[6,-10]]){const y=y0(x,z),f=Math.atan2(FIRE.x-x,FIRE.z-z),put=(g,c)=>mTint(g.rotateY(f).translate(X+x,y,z),c),I=(r)=>new THREE.IcosahedronGeometry(r,1);
  S.push(put(I(.55).translate(0,.45,0),'#f6f8ff'),put(I(.4).translate(0,1.17,0),'#f6f8ff'),put(I(.28).translate(0,1.73,0),'#f6f8ff'),put(new THREE.ConeGeometry(.06,.34,6).rotateX(PI/2).translate(0,1.72,.4),'#f08a2a'),
   put(new THREE.CylinderGeometry(.22,.22,.34,10).translate(0,2.12,0),'#2a2d38'),put(new THREE.CylinderGeometry(.34,.34,.05,12).translate(0,1.96,0),'#2a2d38'),put(new THREE.TorusGeometry(.27,.07,6,14).rotateX(PI/2).translate(0,1.48,0),'#e4532f'),
   put(I(.04).translate(-.1,1.82,.24),'#22242c'),put(I(.04).translate(.1,1.82,.24),'#22242c'),put(I(.045).translate(0,1.3,.38),'#22242c'),put(I(.045).translate(0,1.08,.4),'#22242c'),
   put(new THREE.CylinderGeometry(.025,.035,.8,5).rotateZ(1.1).translate(-.66,1.35,0),'#5a3b28'),put(new THREE.CylinderGeometry(.025,.035,.8,5).rotateZ(-1.1).translate(.66,1.35,0),'#5a3b28'));solid(x,z,.5)}
 // api unggun
 {const x=FIRE.x,z=FIRE.z,y=y0(x,z);for(let i=0;i<10;i++){const a=i/10*6.283;S.push(mG(new THREE.IcosahedronGeometry(.2,0),'#7d7a86',X+x+Math.cos(a)*.8,y+.1,z+Math.sin(a)*.8))}
  for(let i=0;i<4;i++)S.push(mTint(new THREE.CylinderGeometry(.09,.11,1.15,6).rotateZ(1.18).translate(.3,.3,0).rotateY(i*PI/2+.4).translate(X+x,y,z),'#4a2f1f'));
  [[0xff6a1a,1.5,.55],[0xffa532,1.05,.75],[0xffe08a,.55,.95]].forEach(([c,s,o],i)=>{const f=glow(c,s,o);f.position.set(X+x,y+.45+i*.07,z);G.add(f);WN.flames.push({s:f,sc:s,y:y+.45+i*.07,ph:i*2})});
  const l=new THREE.PointLight(0xff8a3a,2,17,1.4);l.position.set(X+x,y+1.3,z);G.add(l);WN.light=l;solid(x,z,.72)}
 // tiang lampu hias mengelilingi api
 {const P=[];for(let i=0;i<8;i++){const a=i/8*6.283+.39,x=FIRE.x+Math.cos(a)*8.4,z=FIRE.z+Math.sin(a)*8.4;P.push([x,z]);S.push(mCyl(.07,.09,3.2,X+x,y0(x,z)+1.6,z,'#4a3524',6));solid(x,z,.09)}
  const bulbs=[[],[],[],[]];P.forEach((a,i)=>{const b=P[(i+1)%8];if(i===1)return;for(let k=1;k<10;k++){const t=k/10,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;bulbs[(i+k)%4].push(X+x,y0(x,z)+3.15-Math.sin(PI*t)*.55,z)}});
  [0xffd27a,0xff8a72,0x8fd8ff,0xbaff9a].forEach((c,i)=>mGlow(G,bulbs[i],c,.75))}
 // pagar kayu
 for(let i=0;i<64;i++){const a=i/64*6.283,x=Math.cos(a)*46,z=Math.sin(a)*46;if(lake(x,z)<SLAKE.r+2||Math.abs(x)<4&&z>0||i%9>6)continue;const y=y0(x,z);S.push(mCyl(.09,.1,1.1,X+x,y+.55,z,'#6b4a2b',6),mG(new THREE.BoxGeometry(.1,.1,4.4),'#7d5834',X+x,y+.8,z,0,-a),mG(new THREE.BoxGeometry(.2,.06,.2),'#f4f7ff',X+x,y+1.13,z))}
 // pegunungan jauh
 const far=[];for(let i=0;i<13;i++){const a=i/13*6.283+.2,r=170+rr()*60,h=44+rr()*40,b=48+rr()*30;far.push(mHaze(new THREE.ConeGeometry(b,h,7,8,true).rotateY(rr()*3).translate(X+Math.cos(a)*r,h/2-4,Math.sin(a)*r),'#8d86b4','#f2eefc',h*.25,h*.72))}
 mMesh(G,far,mFar);
 mMesh(G,S,mFlat);mMesh(G,E,mEmi);mMesh(G,ice,new THREE.MeshLambertMaterial({vertexColors:true,emissive:0x333b55}));
 // salju turun (digerakkan di GPU, selalu mengelilingi kamera)
 {const N=2000,p=new Float32Array(N*3),a=new Float32Array(N*3);for(let i=0;i<N;i++){p.set([rnd()*44,rnd()*20,rnd()*44],i*3);a.set([rnd()*6.28,.45+rnd()*.9,1+rnd()*2.4],i*3)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('a',new THREE.BufferAttribute(a,3));
  const m=new THREE.ShaderMaterial({uniforms:{t:{value:0},dpr:su.dpr},transparent:true,depthWrite:false,
   vertexShader:'attribute vec3 a;uniform float t,dpr;varying float o;void main(){vec3 q;q.x=mod(position.x+sin(t*.8+a.x)*.8-cameraPosition.x,44.)-22.+cameraPosition.x;q.z=mod(position.z+cos(t*.6+a.x*1.7)*.6-cameraPosition.z,44.)-22.+cameraPosition.z;q.y=mod(position.y-t*a.y,20.)+cameraPosition.y-8.;vec4 v=viewMatrix*vec4(q,1.);gl_PointSize=clamp(a.z*dpr*16./max(1.,-v.z),1.,13.);o=smoothstep(.8,3.,-v.z);gl_Position=projectionMatrix*v;}',
   fragmentShader:'varying float o;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(.97,.98,1.,(1.-d*d)*.85*o);}'});
  const s=new THREE.Points(g,m);s.frustumCulled=false;G.add(s);WN.snow=m}
 const bn=[0,1,2,3].map(i=>{const a=PI/4+i*PI/2,x=FIRE.x+Math.cos(a)*3.5,z=FIRE.z+Math.sin(a)*3.5;return[X+x,z,Math.atan2(x-FIRE.x,z-FIRE.z)]});
 return mBenches(G,[...bn,[X+8,-3,-PI/2]],'salju')}
function saljuTick(dt){
 for(const f of WN.flames){const w=.86+.14*Math.sin(T*13+f.ph)+.1*Math.sin(T*23+f.ph*3);f.s.scale.set(f.sc*w,f.sc*(1.1+.25*Math.sin(T*9+f.ph)),1);f.s.position.y=f.y+Math.sin(T*7+f.ph)*.05}
 if(WN.light)WN.light.intensity=2+.3*Math.sin(T*12)+.2*Math.sin(T*27+1);
 for(const p of WN.smoke){const k=((p.k+T*.14)%1+1)%1;p.s.position.set(p.x+k*1.4+Math.sin(T+p.k*9)*.15,p.y+k*3,p.z);p.s.scale.set(.8+k*2.2,.6+k*1.5,1);p.s.material.opacity=.45*Math.sin(Math.min(1,k*1.2)*PI)}
 if(WN.snow)WN.snow.uniforms.t.value=T;
 if(playing&&(WN.crack-=dt)<0){WN.crack=.06+rnd()*.4;const d=Math.hypot(pos.x-SLJ_X-FIRE.x,pos.z-FIRE.z);if(d<14)sfx('crack',Math.pow(1-d/14,1.5))}}

function mapTick(dt){if(curMap==='parkour')pkWorld(dt);else if(curMap==='sawah')sawahTick(dt);else if(curMap==='salju')saljuTick(dt)}
bt2($('pkr'),()=>{pkReset();toast('Mulai dari awal')});


await PG(99,'Membuka peta baru');
const SKO=scene.children.filter(o=>o!==cam&&o!==skyG&&o!==ch&&o!==fp&&!o.isLight),SKV=new Map(SKO.map(o=>[o,o.visible])),
 GRP={castle:buildCastle(),city:buildCity(),parkour:buildParkour(),sawah:buildSawah(),salju:buildSalju()};
function setVis(id){SKO.forEach(o=>o.visible=id==='sakura'&&SKV.get(o));for(const k in GRP)GRP[k].visible=k===id;
 fp.visible=id==='sakura'||id==='salju';fp.material.color.setHex(id==='salju'?0x4b5a8c:0x0b0805);fp.material.opacity=id==='salju'?.35:.42;applyEnv(id)}
function fpClear(){dm.position.set(0,-50,0);dm.rotation.set(0,0,0);dm.scale.setScalar(0);dm.updateMatrix();for(let i=0;i<FN;i++){fp.setMatrixAt(i,dm.matrix);fpD[i]=null}fp.instanceMatrix.needsUpdate=true}
function showWorld(id){const m=MAPS[id];setVis(id);benches.length=0;benches.push(...mapBench[id]);pos.x=m.x;pos.z=m.z;vel.x=vel.z=0;yaw=0;pitch=.2;py=H(m.x,m.z);sit=null;fpClear();if(id==='parkour')pkReset()}

// ---- v1.6: layar penuh, gambar peta, akun, teman, notifikasi, chat, tata letak tombol
// layar penuh konsisten: tiap ketukan mencoba kembali ke layar penuh bila terlepas
function fsTry(){const d=document.documentElement;if(document.fullscreenElement||!d.requestFullscreen)return;d.requestFullscreen({navigationUI:'hide'}).then(()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(_){}}).catch(()=>{})}
addEventListener('pointerup',fsTry,true);

// tata letak: geser tombol & joystick, lalu simpan (perangkat + akun)
function sid(){try{return acct?acct.id:devId}catch(_){return devId}}
function layIds(){return['jb','mbtn','cbtn','kbtn','sbtn','chb','ebtn','vbtn','run','jmp','rbtn','fbtn']}
function layApply(L){L=L||uiCfg.lay||{};for(const id of layIds()){const e=$(id),v=L[id];if(e)e.style.translate=v?v[0]*innerWidth+'px '+v[1]*innerHeight+'px':''}}
addEventListener('resize',()=>layApply());
let layOn=false,layTmp=null,layDrag=null;
function layStart(){if(!playing)return;pnl();layTmp=JSON.parse(JSON.stringify(uiCfg.lay||{}));layOn=true;document.body.classList.add('lay');$('layBar').hidden=false}
function layEnd(s){layOn=false;document.body.classList.remove('lay');$('layBar').hidden=true;if(s){uiCfg.lay=layTmp;uiSave()}layApply();layTmp=null;layDrag=null}
$('layS').onclick=()=>layEnd(true);$('layC').onclick=()=>layEnd(false);$('layR').onclick=()=>{layTmp={};layApply(layTmp)};
addEventListener('pointerdown',e=>{if(!layOn||e.target.closest('#layBar'))return;e.preventDefault();e.stopImmediatePropagation();
 const t=e.target.closest(layIds().map(i=>'#'+i).join(','));if(!t)return;const L=layTmp[t.id]||[0,0],x=L[0]*innerWidth,y=L[1]*innerHeight;
 layDrag={t,id:t.id,x0:e.clientX,y0:e.clientY,fx:x,fy:y,cx:x,cy:y,p:e.pointerId};try{t.setPointerCapture(e.pointerId)}catch(_){}},true);
addEventListener('pointermove',e=>{const d=layDrag;if(!d||e.pointerId!==d.p)return;const r=d.t.getBoundingClientRect(),bl=r.left-d.cx,bt=r.top-d.cy;
 d.cx=Math.min(innerWidth-r.width-4-bl,Math.max(4-bl,d.fx+e.clientX-d.x0));d.cy=Math.min(innerHeight-r.height-4-bt,Math.max(4-bt,d.fy+e.clientY-d.y0));
 d.t.style.translate=d.cx+'px '+d.cy+'px';layTmp[d.id]=[d.cx/innerWidth,d.cy/innerHeight];e.preventDefault()},true);
addEventListener('pointerup',e=>{if(layDrag&&e.pointerId===layDrag.p)layDrag=null},true);
addEventListener('pointercancel',()=>{layDrag=null},true);

// gambar kartu peta = hasil render 3D asli tiap peta
function snapMaps(){const o={},c2=document.createElement('canvas'),x=c2.getContext('2d'),cp=cam.position.clone(),cr=cam.rotation.clone(),hv=hand.visible,cv0=ch.visible,
 V={sakura:[0,2.7,R+11,.2],castle:[CAS_X,6,112,.3],city:[CTY_X+8,58,190,-.1],parkour:[PKR_X+38,34,-2,-.235,.64],sawah:[SWH_X+14,8.5,40,-.12,.25],salju:[SLJ_X-8,6,24,-.2,-.35]};
 c2.width=480;c2.height=270;hand.visible=false;ch.visible=false;ren.setSize(640,360,false);cam.aspect=16/9;cam.updateProjectionMatrix();
 try{for(const id in V){const v=V[id];setVis(id);if(id==='parkour')pkWorld(0);else if(id==='sawah')sawahTick(0);else if(id==='salju')saljuTick(0);cam.position.set(v[0],v[1],v[2]);cam.rotation.set(v[3],v[4]||0,0);skyG.position.copy(cam.position);ren.render(scene,cam);x.drawImage(cv,0,0,480,270);o[id]=c2.toDataURL('image/jpeg',.82)}}catch(_){}
 setVis('sakura');cam.position.copy(cp);cam.rotation.copy(cr);hand.visible=hv;ch.visible=cv0;rs();return o}
const THUMB=snapMaps();

// akun (username + 2 password), teman, notifikasi, chat: semua lewat fungsi SQL (lihat supabase.sql)
const ERR={net:'Tidak terhubung ke server',taken:'Username sudah dipakai',invalid:'Username atau password salah',locked:'Terlalu banyak percobaan, coba lagi 5 menit',fmt:'Format tidak valid',auth:'Sesi habis, silakan masuk lagi',nofriend:'Kalian belum berteman'},
 RELT={none:'Belum berteman',out:'Menunggu konfirmasi',in:'Ingin berteman denganmu',friend:'Teman'};
let isAdm=false,acct=null,wTok='',ntf={n:0,d:0},pkTab='s',frList=[],lastQ='',chatT=0,chatUid='',chatLast=0,authReg=false;try{wTok=localStorage.getItem('wtok')||''}catch(_){}
const menuEl=$('menu'),mapsEl=$('maps'),setMenu=s=>{menuEl.dataset.s=s;closeProfile()},
 wRpc=(fn,a)=>sbc?sbc.rpc('walk_'+fn,a).then(r=>r.error?{err:'net'}:(r.data==null?{}:r.data),()=>({err:'net'})):Promise.resolve({err:'net'}),
 wApi=(fn,a)=>wRpc(fn,{p_token:wTok||null,...a}),
 escH=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),
 agoT=t=>{const m=(Date.now()-new Date(t))/6e4|0;return m<1?'baru saja':m<60?m+' mnt lalu':m<1440?(m/60|0)+' jam lalu':(m/1440|0)+' hari lalu'},
 mapUids={},locOf=u=>{for(const k in mapUids)if(mapUids[k].has(u))return k;return''};
const pwF=id=>'<div class="pw"><input class="in" id="'+id+'" type="password" maxlength="64" autocapitalize="none" autocorrect="off" spellcheck="false"><button type="button" class="eye" aria-label="Lihat sandi" aria-pressed="false"><i data-lucide="eye"></i></button></div>';
$('post').insertAdjacentHTML('beforeend','<div id="auth"><div id="ab"><button id="abin" class="sign">Masuk</button><button id="abup" class="sign alt">Daftar</button></div><form id="af"><h2 id="aht"></h2><div id="afr"><input class="in" id="au" maxlength="16" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="username">'+pwF('ap1')+pwF('ap2')+'</div><small id="aer" role="alert"></small><div id="afb"><button type="submit" id="asub" class="btn pri"></button><button type="button" id="aback" class="btn">Kembali</button></div></form></div>');
menuEl.insertAdjacentHTML('beforeend','<div id="usr"><span class="av" id="uav"></span><b id="unm"></b><button id="uout" class="mini">Keluar</button></div><div id="pm"><div id="pmc"></div></div>');
// ikon mata: lihat / sembunyikan sandi
const eyes=[...menuEl.querySelectorAll('.eye')],
 eyeSet=(b,show)=>{b.previousElementSibling.type=show?'text':'password';b.setAttribute('aria-pressed',String(show));b.setAttribute('aria-label',show?'Sembunyikan sandi':'Lihat sandi');setIc(b,show?'eye-off':'eye')},
 eyeReset=()=>eyes.forEach(b=>eyeSet(b,false));
eyes.forEach(b=>{b.addEventListener('pointerdown',e=>e.preventDefault());b.onclick=()=>eyeSet(b,b.previousElementSibling.type==='password')}); // pointerdown ditahan supaya keyboard HP tidak tertutup
function authOpen(r){authReg=r;$('aht').textContent=r?'Buat akun':'Masuk';$('au').placeholder=r?'Buat username':'Username';$('ap1').placeholder=r?'Buat password 1':'Password 1';$('ap2').placeholder=r?'Buat password 2':'Password 2';$('ap1').autocomplete=$('ap2').autocomplete=r?'new-password':'current-password';$('asub').textContent=r?'Daftar':'Masuk';eyeReset();$('aer').textContent='';setMenu('form')}
$('abin').onclick=()=>authOpen(false);$('abup').onclick=()=>authOpen(true);$('aback').onclick=()=>setMenu('auth');
$('af').onsubmit=async e=>{e.preventDefault();const u=$('au').value.trim(),p1=$('ap1').value,p2=$('ap2').value,er=$('aer');
 if(!/^[A-Za-z0-9_]{3,16}$/.test(u)){er.textContent='Username 3-16 karakter: huruf, angka, atau underscore';return}
 if(p1.length<6||p2.length<6){er.textContent='Password 1 dan 2 minimal 6 karakter';return}
 er.textContent='';$('asub').disabled=true;const r=await wRpc(authReg?'register':'login',{p_user:u,p_p1:p1,p_p2:p2});$('asub').disabled=false;
 if(r.token)login(r);else er.textContent=ERR[r.err]||'Gagal, coba lagi'};
function login(r){wTok=r.token;try{localStorage.setItem('wtok',wTok)}catch(_){}acct={id:r.uid,name:r.name};isAdm=!!r.admin;try{myName=(localStorage.getItem('wnm'+acct.id)||'').trim().slice(0,16)||acct.name}catch(_){myName=acct.name}$('nm').value=myName;$('nm').readOnly=false;
 $('unm').textContent=(isAdm?'\u{1F451} ':'')+acct.name;$('uav').textContent=acct.name[0].toUpperCase();$('usr').classList.toggle('adm',isAdm);$('ap1').value=$('ap2').value='';eyeReset();setMenu('home');uiLoad();pollN()}
$('uout').onclick=()=>{wApi('logout');wTok='';try{localStorage.removeItem('wtok')}catch(_){}acct=null;isAdm=false;sba&&sba.auth.signOut();ntf={n:0,d:0};$('nm').readOnly=false;setMenu('auth')};
async function pollN(){if(!acct)return;const r=await wApi('counts');if(r.n==null)return;if(r.n>ntf.n)toast('Notifikasi baru');else if(r.d>ntf.d&&!(chatUid&&pkTab==='f'))toast('Pesan baru dari teman');ntf=r;
 const nb=$('nb'),fb=$('fb');if(nb){nb.textContent=r.n;nb.hidden=!r.n}if(fb){fb.textContent=r.d;fb.hidden=!r.d}}
setInterval(pollN,10000);

// menu pilih peta: Server / Teman / Notifikasi
mapsEl.innerHTML='<div id="tabs"><button data-t="s"><i data-lucide="map"></i>Server</button><button data-t="f"><i data-lucide="users"></i>Teman<i class="bd" id="fb" hidden></i></button><button data-t="n"><i data-lucide="bell"></i>Notifikasi<i class="bd" id="nb" hidden></i></button><span class="sp"></span><button id="mback"><i data-lucide="arrow-left"></i>Kembali</button></div><div id="pb"></div>';
icons();
function showTab(t){pkTab=t;clearInterval(chatT);chatUid='';mapsEl.querySelectorAll('#tabs [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===t));({s:rServers,f:rFriends,n:rNotifs})[t]()}
function rServers(){$('pb').innerHTML='<div id="mcs">'+Object.entries(MAPS).map(([k,m])=>'<button class="mc" data-m="'+k+'" style="--r:'+m.c+'"><span class="art a-'+k+'"></span><span class="plate"><b>'+m.n+'</b><em class="cnt" id="cn-'+k+'"><i></i><span>…</span></em></span><small>'+m.d+'</small></button>').join('')+'</div><div id="tot"></div>';
 for(const k in THUMB){const a=$('pb').querySelector('.a-'+k);if(a)a.style.backgroundImage='url('+THUMB[k]+')'}paintCounts()}
async function rFriends(){$('pb').innerHTML='<div id="sb"><input class="in" id="sq" placeholder="Cari username…" maxlength="16" autocapitalize="none"><button class="mini pri" id="sg"><i data-lucide="search"></i>Cari</button></div><div id="sr"></div><h4>Teman</h4><div id="fl"><small class="em">Memuat…</small></div>';icons();$('sq').value=lastQ;if(lastQ)doSearch();
 const r=await wApi('friends');if(pkTab!=='f'||chatUid)return;frList=Array.isArray(r)?r:[];drawFl()}
function drawFl(){const el=$('fl');if(!el)return;el.innerHTML=frList.length?frList.map(f=>{const l=locOf(f.id);return'<div class="rw" data-u="'+f.id+'" data-n="'+escH(f.name)+'"><span class="av">'+escH(f.name[0].toUpperCase())+'</span><div class="tx"><b>'+escH(f.name)+'</b><small>'+(l?'<i class="on"></i>Online di '+MAPS[l].n:'Offline')+'</small></div>'+(l?'<button class="mini pri" data-a="join" data-m="'+l+'">Gabung</button>':'')+'<button class="mini" data-a="chat">Chat'+(f.unread?'<i class="bd">'+f.unread+'</i>':'')+'</button></div>'}).join(''):'<small class="em">Belum ada teman. Cari username lalu tambahkan.</small>'}
async function doSearch(){const q=$('sq').value.trim(),el=$('sr');lastQ=q;if(q.length<2){el.innerHTML='';return}el.innerHTML='<small class="em">Mencari…</small>';const r=await wApi('search',{p_q:q});if(pkTab!=='f'||!$('sr'))return;
 $('sr').innerHTML=Array.isArray(r)?(r.length?r.map(u=>'<div class="rw" data-u="'+u.id+'" data-n="'+escH(u.name)+'"><span class="av">'+escH(u.name[0].toUpperCase())+'</span><div class="tx"><b>'+escH(u.name)+'</b><small>'+RELT[u.rel]+'</small></div>'+(u.rel==='none'?'<button class="mini pri" data-a="add"><i data-lucide="user-plus"></i>Tambah</button>':'')+'</div>').join(''):'<small class="em">Tidak ditemukan</small>'):'<small class="em">'+(ERR[r.err]||'Gagal mencari')+'</small>';icons()}
async function rNotifs(){const b=$('pb');b.innerHTML='<small class="em">Memuat…</small>';const r=await wApi('notifs');if(pkTab!=='n')return;
 b.innerHTML=Array.isArray(r)&&r.length?r.map(n=>'<div class="rw" data-u="'+n.from_id+'" data-n="'+escH(n.from_name)+'"><span class="av">'+escH(n.from_name[0].toUpperCase())+'</span><div class="tx"><b>'+escH(n.from_name)+'</b><small>'+(n.kind==='request'?'ingin berteman denganmu':'menerima pertemananmu')+', '+agoT(n.t)+'</small></div>'+(n.pending?'<button class="mini pri" data-a="acc">Terima</button><button class="mini" data-a="dec">Tolak</button>':'')+'</div>').join(''):'<small class="em">Belum ada notifikasi.</small>';
 wApi('notifs_seen').then(pollN)}
function closeProfile(){const p=$('pm');if(p)p.classList.remove('on')}
async function openProfile(id){const pm=$('pm'),c=$('pmc');pm.classList.add('on');c.innerHTML='<small class="em">Memuat…</small>';const p=await wApi('profile',{p_id:id});
 if(!p.id){c.innerHTML='<small class="em">'+(ERR[p.err]||'Gagal memuat profil')+'</small><button class="mini" data-p="x">Tutup</button>';return}
 const l=locOf(p.id),B=p.rel==='friend'?'<button class="mini pri" data-a="chat"><i data-lucide="message-circle"></i>Chat</button>'+(l?'<button class="mini pri" data-a="join" data-m="'+l+'">Gabung</button>':'')+'<button class="mini" data-a="rm">Hapus teman</button>'
  :p.rel==='none'?'<button class="mini pri" data-a="add"><i data-lucide="user-plus"></i>Tambah teman</button>':p.rel==='out'?'<button class="mini" disabled>Menunggu konfirmasi</button><button class="mini" data-a="rm">Batalkan</button>':'<button class="mini pri" data-a="acc">Terima</button><button class="mini" data-a="dec">Tolak</button>';
 const bo=await wApi('bio_get',{p_id:String(p.id)});c.dataset.u=p.id;c.dataset.n=p.name;c.classList.toggle('adm',!!bo.admin);c.innerHTML='<span class="av big">'+escH(p.name[0].toUpperCase())+'</span>'+(bo.admin?'<span class="crown">\u{1F451}</span>':'')+'<b class="pnm">'+escH(p.name)+'</b>'+(bo.admin?'<span class="admtag">ADMIN</span>':'')+(bo.bio?'<small class="bio">'+escH(bo.bio)+'</small>':'')+'<small>Bergabung '+new Date(p.since).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})+'</small><small>'+(l?'<i class="on"></i>Online di '+MAPS[l].n:'Offline')+'</small><div class="pbt">'+B+'</div><button class="mini" data-p="x">Tutup</button>';icons()}
async function relAct(k,id){const r=await wApi(k==='add'?'friend_add':k==='rm'?'friend_remove':'friend_respond',k==='acc'||k==='dec'?{p_id:id,p_accept:k==='acc'}:{p_id:id});if(r.err)toast(ERR[r.err]||'Gagal');closeProfile();showTab(pkTab);pollN()}
async function openDm(id,nm){closeProfile();clearInterval(chatT);pkTab='f';chatUid=id;chatLast=0;mapsEl.querySelectorAll('#tabs [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t==='f'));
 $('pb').innerHTML='<div id="dmh"><button class="mini" id="dmb"><i data-lucide="arrow-left"></i></button><span class="av">'+escH(nm[0].toUpperCase())+'</span><b>'+escH(nm)+'</b></div><div id="dmm"></div><div id="dmi"><input class="in" id="dmx" maxlength="300" placeholder="Tulis pesan…" autocomplete="off"><button class="mini pri" id="dms"><i data-lucide="send"></i></button></div>';icons();
 await dmLoad();chatT=setInterval(dmLoad,2500)}
async function dmLoad(){if(!chatUid||menuEl.dataset.s!=='pick'){clearInterval(chatT);return}const u=chatUid,r=await wApi('dm_list',{p_with:u,p_after:chatLast});if(u!==chatUid||!Array.isArray(r)||!r.length||!$('dmm'))return;
 const m=$('dmm'),bot=!chatLast||m.scrollTop+m.clientHeight>=m.scrollHeight-30;r.forEach(x=>{const d=document.createElement('div');d.className='m '+(x.mine?'me':'th');d.textContent=x.body;m.appendChild(d);chatLast=Math.max(chatLast,x.id)});if(bot)m.scrollTop=m.scrollHeight;pollN()}
async function dmSend(){const i=$('dmx'),t=i?i.value.trim():'';if(!t)return;i.value='';const r=await wApi('dm_send',{p_to:chatUid,p_body:t});if(r.err)toast(ERR[r.err]||'Gagal mengirim');else dmLoad()}
menuEl.addEventListener('click',async e=>{const t=e.target;
 if(t.id==='pm'||t.closest('[data-p]')){closeProfile();return}
 if(t.closest('#mback')){clearInterval(chatT);chatUid='';setMenu('home');return}
 const tb=t.closest('#tabs [data-t]');if(tb){showTab(tb.dataset.t);return}
 const mc=t.closest('.mc');if(mc){pickMap(mc.dataset.m);return}
 if(t.closest('#sg')){doSearch();return}
 if(t.closest('#dmb')){showTab('f');return}
 if(t.closest('#dms')){dmSend();return}
 const a=t.closest('[data-a]');
 if(a){const k=a.dataset.a,box=a.closest('[data-u]'),id=box&&box.dataset.u,nm=box&&box.dataset.n;
  if(k==='join'){closeProfile();pickMap(a.dataset.m)}else if(k==='chat')openDm(id,nm);else{a.disabled=true;await relAct(k,id)}return}
 const row=t.closest('.rw');if(row&&row.dataset.u)openProfile(row.dataset.u)});
menuEl.addEventListener('keydown',e=>{if(e.key!=='Enter')return;if(e.target.id==='sq')doSearch();else if(e.target.id==='dmx'){e.preventDefault();dmSend()}});
menuEl.addEventListener('focusin',e=>{if(e.target.matches('input'))setTimeout(()=>e.target.scrollIntoView({block:'center'}),300)});

// jumlah pemain online per peta lewat Realtime Presence (tanpa tabel); presence juga dipakai untuk status teman
const mapTopic=id=>id==='sakura'?'walk-lobby':'walk-'+id;
function paintCounts(){let t=0;for(const k in MAPS){const n=mapCnt[k],e=$('cn-'+k);if(!e)continue;if(n==null){e.lastChild.textContent=sbc?'…':'—';continue}t+=n;e.classList.toggle('on',n>0);e.lastChild.textContent=n?n+' online':'Kosong'}const tt=$('tot');if(tt)tt.textContent=sbc?t+' pemain online':'Offline'}
function watchMaps(){if(!sbc||curMap||mapObs.length)return;for(const id in MAPS){const o=sbc.channel(mapTopic(id),{config:{presence:{key:'w'+myId}}});
 o.on('presence',{event:'sync'},()=>{const st=o.presenceState();mapCnt[id]=Object.keys(st).length;mapUids[id]=new Set(Object.values(st).flat().map(m=>m.uid).filter(Boolean));paintCounts();if(pkTab==='f'&&!chatUid&&$('fl'))drawFl()}).subscribe();mapObs.push(o)}}
async function unwatch(){const a=mapObs;mapObs=[];await Promise.all(a.map(o=>sbc.removeChannel(o).catch(()=>{})))}
async function joinChan(id){if(!sbc)return;await unwatch();if(curMap!==id)return;
 const c=gameCh=sbc.channel(mapTopic(id),{config:{broadcast:{self:false},presence:{key:myId}}});
 c.on('broadcast',{event:'st'},m=>onSt(m.payload)).on('broadcast',{event:'chat'},m=>onChat(m.payload)).on('broadcast',{event:'bye'},m=>onBye(m.payload)).on('broadcast',{event:'vo'},m=>onVo(m.payload)).on('broadcast',{event:'fc'},m=>onFc(m.payload))
  .subscribe(st=>{if(c!==gameCh)return;if(st==='SUBSCRIBED'){rm=c;onN=-1;c.track({id:myId,n:myName,uid:acct?acct.id:''});loadHist()}else if(st==='CLOSED'||st==='CHANNEL_ERROR'||st==='TIMED_OUT')rm=null})}
function pickMap(id){if(playing||innerHeight>innerWidth||!MAPS[id])return;curMap=id;onN=-2;showWorld(id);setMenu('home');startGame();
 const pk=id==='parkour';$('pkh').hidden=!pk;$('hud').classList.toggle('parkour',pk);if(pk){setCam(1);toast('Lompat sampai finis. Pakai Lari untuk celah lebar.')}
 joinChan(id)}
function leaveMap(){const c=gameCh;gameCh=null;rm=null;for(const id in RP)onBye({id});curMap='';$('pkh').hidden=true;$('hud').classList.remove('parkour');showWorld('sakura');setMenu(acct?'home':'auth');
 setTimeout(()=>{if(c&&sbc)sbc.removeChannel(c).catch(()=>{});watchMaps()},400)}
$('go').onclick=()=>{if(playing||innerHeight>innerWidth)return;if(!acct){setMenu('auth');return}setMenu('pick');showTab('s')};
// login Google (Supabase Auth) -> akun Walk lewat walk_google_login; profil sendiri: username asli, bio, teman, mahkota admin
const sba=window.supabase?supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'walk-google'}}):null;
$('abin').textContent='Walk Login';$('abup').textContent='Daftar Walk';
$('ab').insertAdjacentHTML('beforeend','<button id="abg" class="sign alt">Google Login</button>');
$('uout').insertAdjacentHTML('beforebegin','<button id="umy" class="mini">Profil</button>');
async function googleLogin(){if(!sba||acct)return false;const s=await sba.auth.getSession();if(!s.data.session)return false;const r=await sba.rpc('walk_google_login');if(r.error||!r.data||!r.data.token){toast(ERR[r.data&&r.data.err]||'Login Google gagal');return false}login(r.data);return true}
$('abg').onclick=async()=>{if(!sba)return toast(ERR.net);if(await googleLogin())return;sba.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}})};
async function openMine(){if(!acct)return;const pm=$('pm'),c=$('pmc');pm.classList.add('on');c.dataset.u='';c.classList.toggle('adm',isAdm);c.innerHTML='<small class="em">Memuat…</small>';
 const [b,f]=await Promise.all([wApi('bio_get',{p_id:String(acct.id)}),wApi('friends')]),fl=Array.isArray(f)?f:[];
 c.innerHTML='<span class="av big">'+escH(acct.name[0].toUpperCase())+'</span>'+(isAdm?'<span class="crown">\u{1F451}</span>':'')+'<b class="pnm">'+escH(acct.name)+'</b>'+(isAdm?'<span class="admtag">ADMIN</span>':'')+'<small>Username akun · nama di game: '+escH(myName)+'</small><textarea id="bio" class="in" maxlength="120" rows="3" placeholder="Tulis biodata…">'+escH(b.bio||'')+'</textarea><button class="mini pri" id="bios">Simpan bio</button><h4>Teman ('+fl.length+')</h4><div class="fls">'+(fl.map(x=>'<span>'+escH(x.name)+'</span>').join('')||'<small class="em">Belum ada teman</small>')+'</div><button class="mini" data-p="x">Tutup</button>';
 $('bios').onclick=async()=>{const r=await wApi('bio_set',{p_bio:$('bio').value.slice(0,120)});toast(r.err?ERR[r.err]||'Gagal':'Bio tersimpan')}}
$('umy').onclick=openMine;
paintCounts();watchMaps();setMenu(wTok?'wait':'auth');if(!wTok)googleLogin();
if(wTok)wApi('me').then(r=>{if(r.uid)login({token:wTok,uid:r.uid,name:r.name});else{if(r.err!=='net'){wTok='';try{localStorage.removeItem('wtok')}catch(_){}}setMenu('auth')}});
await PG(100,'Siap');$('ld').classList.add('off');$('go').disabled=false;$('go').textContent='Main';
requestAnimationFrame(loop);
})();
