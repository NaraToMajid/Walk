/* recorder.js · Walk v1.6 · rekam gameplay → MP4 (H.264 + AAC) lewat WebCodecs.
   Perbaikan video hitam / terbaca sebagai audio: tidak lagi memakai VP9 di dalam MP4, tidak ada "cek hitam" yang
   mengganti encoder di tengah jalan, dan frame selalu diambil dari kanvas 2D (recC) tepat setelah render. */
const REC_H264=['avc1.42001f','avc1.4d001f','avc1.64001f'], // baseline → main → high, level 3.1: diterima galeri HP
 REC_MR=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
function recSave(b,ext){const d=new Date(),a=document.createElement('a');a.href=URL.createObjectURL(b);
 a.download='walk-'+d.getFullYear()+pad2(d.getMonth()+1)+pad2(d.getDate())+'-'+pad2(d.getHours())+pad2(d.getMinutes())+pad2(d.getSeconds())+'.'+(ext||'mp4');
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),6e4)}
function recBgm(dst){try{const s=bgm.captureStream&&bgm.captureStream();if(s&&s.getAudioTracks().length){const n=ac.createMediaStreamSource(s);n.connect(dst);return n}}catch(_){}return null}
function recEnd(){const R=rec;if(R){clearInterval(R.ti);R.stop=1;for(const e of[R.ve,R.ae])try{if(e&&e.state!=='closed')e.close()}catch(_){}
 for(const n of[R.sp,R.ds])if(n)try{audTap.disconnect(n)}catch(_){}
 if(R.sp){R.sp.onaudioprocess=null;for(const n of[R.sp,R.mu])try{n.disconnect()}catch(_){}}
 try{if(R.bn)R.bn.disconnect()}catch(_){}
 if(R.ms)R.ms.getTracks().forEach(t=>t.stop())}
 rec=null;$('rbtn').classList.remove('rec')}
function recFail(e){console.error(e);toast('Perekaman gagal'+(e&&e.message?': '+e.message:''));recEnd()}
function recTick(){const R=rec;if(!R||R.stop)return;const s=((performance.now()-R.s)/1000)|0;$('rt').textContent=pad2(s/60|0)+':'+pad2(s%60);if(s>=300)recStop()}
function recFrame(){const R=rec;if(!R||R.stop||!R.ready)return;const now=performance.now();
 if(now-R.last<30||(R.ve&&R.ve.encodeQueueSize>3))return; // antrean penuh: lewati frame, jangan menumpuk
 try{R.last=now;recX.drawImage(cv,0,0,recC.width,recC.height); // harus tepat setelah render, kalau tidak kanvas WebGL kosong
  if(R.ve){const f=new VideoFrame(recC,{timestamp:Math.round((now-R.s)*1000)});R.ve.encode(f,{keyFrame:R.fr++%60===0});f.close();R.nv++}}catch(e){recFail(e)}}
async function recStop(){const R=rec;if(!R||R.stop)return;R.stop=1;clearInterval(R.ti);$('rbtn').classList.remove('rec');toast('Menyimpan video…');
 try{if(R.mr){R.mr.stop();return}
  if(R.sp)R.sp.onaudioprocess=null;
  await R.ve.flush();if(R.ae)await R.ae.flush();
  if(!R.nv)throw new Error('tidak ada frame video terekam');
  R.mux.finalize();recSave(new Blob([R.mux.target.buffer],{type:'video/mp4'}),'mp4');toast('Video MP4 tersimpan di perangkat')}
 catch(e){recFail(e);return}
 recEnd()}
async function recStart(){
 if(rec)return;const R=rec={s:performance.now(),last:0,fr:0,nv:0};
 try{
  const w=cv.width,h=cv.height,k=Math.min(1,960/Math.max(w,h),540/Math.min(w,h)),RW=Math.max(16,Math.round(w*k/16)*16),RH=Math.max(16,Math.round(h*k/16)*16);recC.width=RW;recC.height=RH;
  const sr=ac?ac.sampleRate:48000;let vc=null,au=null;
  if(window.VideoEncoder&&window.VideoFrame&&window.Mp4Muxer)for(const c of REC_H264){const q={codec:c,width:RW,height:RH,bitrate:2.5e6,framerate:30,latencyMode:'realtime',avc:{format:'avc'}};try{if((await VideoEncoder.isConfigSupported(q)).supported){vc=q;break}}catch(_){}}
  if(vc&&ac&&audTap&&window.AudioEncoder&&window.AudioData)for(const q of[{codec:'mp4a.40.2',sampleRate:sr,numberOfChannels:2,bitrate:128000},{codec:'opus',sampleRate:sr,numberOfChannels:2,bitrate:96000}]){try{if((await AudioEncoder.isConfigSupported(q)).supported){au=q;break}}catch(_){}}
  if(rec!==R)return;
  if(vc){ // jalur utama: encode H.264 sendiri lalu bungkus jadi MP4 standar (bisa di-skip, durasi benar)
   R.mux=new Mp4Muxer.Muxer({target:new Mp4Muxer.ArrayBufferTarget(),video:{codec:'avc',width:RW,height:RH,frameRate:30},...(au?{audio:{codec:au.codec==='opus'?'opus':'aac',numberOfChannels:2,sampleRate:sr}}:{}),fastStart:'in-memory',firstTimestampBehavior:'offset'});
   R.ve=new VideoEncoder({output:(c,m)=>R.mux.addVideoChunk(c,m),error:recFail});R.ve.configure(vc);
   if(au){R.ae=new AudioEncoder({output:(c,m)=>R.mux.addAudioChunk(c,m),error:recFail});R.ae.configure(au);
    const sp=R.sp=ac.createScriptProcessor(4096,2,2),mu=R.mu=ac.createGain();mu.gain.value=0;let fs=0,a0=-1;
    sp.onaudioprocess=e=>{if(R.stop||!R.ready)return;const b=e.inputBuffer,n=b.length,d=new Float32Array(n*2);d.set(b.getChannelData(0));d.set(b.getChannelData(1),n);
     if(a0<0)a0=Math.max(0,(performance.now()-R.s)*1e3-n/sr*1e6); // selaraskan awal audio dengan video
     const ad=new AudioData({format:'f32-planar',sampleRate:sr,numberOfFrames:n,numberOfChannels:2,timestamp:Math.round(a0+fs/sr*1e6),data:d});R.ae.encode(ad);ad.close();fs+=n};
    audTap.connect(sp);R.bn=recBgm(sp);sp.connect(mu);_audConnect.call(mu,ac.destination)} // _audConnect: lewati pengalih master agar tidak berputar balik
  }else{ // cadangan: MediaRecorder dari kanvas 2D (recC) → MP4, atau WebM bila MP4 tidak didukung
   const mt=window.MediaRecorder&&REC_MR.find(t=>MediaRecorder.isTypeSupported(t));
   if(!mt){rec=null;return toast('Browser ini belum bisa merekam video. Gunakan Chrome terbaru.')}
   const ms=R.ms=recC.captureStream(30),chunks=[],ext=mt.includes('webm')?'webm':'mp4';
   if(ac&&audTap){const ds=R.ds=ac.createMediaStreamDestination();audTap.connect(ds);R.bn=recBgm(ds);ds.stream.getAudioTracks().forEach(t=>ms.addTrack(t))}
   R.mr=new MediaRecorder(ms,{mimeType:mt,videoBitsPerSecond:3e6,audioBitsPerSecond:128000});R.mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
   R.mr.onstop=()=>{recSave(new Blob(chunks,{type:mt.split(';')[0]}),ext);toast('Video '+ext.toUpperCase()+' tersimpan di perangkat');recEnd()};R.mr.start(1000)}
  R.s=performance.now();R.ti=setInterval(recTick,500);R.ready=1;$('rbtn').classList.add('rec');recTick();
  toast(R.ve&&ac&&!au?'Merekam tanpa suara (browser belum mendukung audio MP4)…':'Merekam… ketuk lagi untuk berhenti')
 }catch(e){recFail(e)}}
bt2($('rbtn'),()=>rec?rec.ready&&recStop():recStart());
