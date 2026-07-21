/* Run to the Movies — shared pixel art library (cinema theme).
   Classic script; exposes window.CursedSprites + <sprite-view>/<scene-view>. */
(function(){
"use strict";
const PAL = {
  // "neon" = bright marquee; "dusk" = dim noir. keys kept so game.html palette toggle still works.
  neon: {K:"#140510",W:"#ffffff",E:"#2a0f1a",
         C:"#ff5470",c:"#a12f45",M:"#ffd23f",m:"#b8912e",
         Y:"#ffe6a8",y:"#c9a15e",D:"#3a2233",d:"#241521",G:"#5cf285",
         BG:"#1a0a16",BG2:"#120610",F1:"#2a1424",F2:"#3a1c30",ST:"#5a3a50",
         S:"#f2c69c",H:"#4a2e1c",R:"#e5484d",P:"#2a2a4a"},
  dusk: {K:"#140510",W:"#d8d0d4",E:"#2a0f1a",
         C:"#c2445a",c:"#7c2536",M:"#c9a534",m:"#8f7326",
         Y:"#d8c290",y:"#9e7f4c",D:"#301c2a",d:"#1e121b",G:"#4bbb6e",
         BG:"#150912",BG2:"#0e050c",F1:"#231020",F2:"#2f1626",ST:"#3f2838",
         S:"#c99f7e",H:"#3a2417",R:"#b23a3f",P:"#22223c"}
};
const SPRITES = {
  runner: {label:"MOVIEGOER", frames:{
    run1:[
"..HHHH..",
".HHHHHH.",
".HSSSSH.",
".HSSSES.",
"..SSSS..",
".KRRRRK.",
"RRRRRRRR",
".RRRRRR.",
"..PPPP..",
"..P..P..",
".KK..P..",
".....KK."],
    run2:[
"..HHHH..",
".HHHHHH.",
".HSSSSH.",
".HSSSES.",
"..SSSS..",
".KRRRRK.",
".RRRRRR.",
"RRRRRRRR",
"..PPPP..",
"..P..P..",
"..P..KK.",
".KK....."],
    jump:[
"..HHHH..",
".HHHHHH.",
".HSSSSH.",
".HSSSES.",
"..SSSS..",
"RRKRRKRR",
".RRRRRR.",
".KRRRRK.",
"..PPPP..",
".KPP.PP.",
".K....K.",
"........"],
    duck:[
"........",
"..HHHH..",
".HHHHHH.",
".HSSSES.",
".KRRRRK.",
"RRRRRRRR",
".RRRRRR.",
".PPPPPP.",
"KKP..PKK",
"........",
"........",
"........"],
    dead:[
"........",
"........",
"..HHHH..",
".HHKWKH.",
".HSWSWH.",
".KRRRRK.",
"RRRRRRRR",
"PP.PP.PP",
"........",
"........",
"........",
"........"]}}
};
const DIGITS = {"0":["111","101","101","101","111"],"1":["010","110","010","010","111"],
"2":["111","001","111","100","111"],"3":["111","001","111","001","111"],"4":["101","101","111","001","001"],
"5":["111","100","111","001","111"],"6":["111","100","111","101","111"],"7":["111","001","001","010","010"],
"8":["111","101","111","101","111"],"9":["111","101","111","001","111"]};

const frameCache = {};
function frameCanvas(charKey, frameKey, palKey){
  const key = charKey+"|"+frameKey+"|"+palKey;
  if(frameCache[key]) return frameCache[key];
  const rows = SPRITES[charKey].frames[frameKey], pal = PAL[palKey];
  const w = Math.max(...rows.map(r=>r.length)), h = rows.length;
  const cv = document.createElement("canvas"); cv.width=w; cv.height=h;
  const c = cv.getContext("2d");
  for(let y=0;y<h;y++) for(let x=0;x<rows[y].length;x++){
    const ch = rows[y][x]; if(ch===".") continue;
    c.fillStyle = pal[ch]||pal.W; c.fillRect(x,y,1,1);
  }
  return frameCache[key]=cv;
}
function drawSprite(ctx, charKey, frameKey, palKey, cx, cy, sx, sy){
  sx=sx||1; sy=sy||1;
  const cv = frameCanvas(charKey, frameKey, palKey);
  ctx.imageSmoothingEnabled=false;
  const w=cv.width*sx, h=cv.height*sy;
  ctx.drawImage(cv, Math.round(cx-w/2), Math.round(cy-h/2), Math.round(w), Math.round(h));
}
function drawDigits(ctx, str, cx, y, scale, color, shadow){
  const w = str.length*4*scale - scale;
  let x = Math.round(cx - w/2);
  for(const ch of str){
    const g = DIGITS[ch]; if(!g){ x+=4*scale; continue; }
    for(let r=0;r<5;r++) for(let c=0;c<3;c++) if(g[r][c]==="1"){
      if(shadow){ ctx.fillStyle=shadow; ctx.fillRect(x+c*scale+1, y+r*scale+1, scale, scale); }
      ctx.fillStyle=color; ctx.fillRect(x+c*scale, y+r*scale, scale, scale);
    }
    x += 4*scale;
  }
}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function makeLayer(seed, minH, maxH){
  const rnd = mulberry32(seed), b=[]; let x=0;
  while(x<600){ const w=10+Math.floor(rnd()*18), h=minH+Math.floor(rnd()*(maxH-minH)); b.push({x,w,h,r:rnd()}); x+=w+1+Math.floor(rnd()*4); }
  return {b, span:x};
}
const FAR = makeLayer(7, 22, 52), NEAR = makeLayer(23, 34, 74);
function drawLayer(ctx, pal, layer, scroll, floorY, color, windows){
  const off = ((scroll % layer.span)+layer.span)%layer.span;
  for(let rep=-1; rep<=1; rep++){
    for(const bd of layer.b){
      const bx = Math.round(bd.x - off + rep*layer.span);
      if(bx+bd.w<0 || bx>192) continue;
      ctx.fillStyle=color; ctx.fillRect(bx, floorY-bd.h, bd.w, bd.h);
      if(windows){
        const rnd = mulberry32(Math.floor(bd.r*1e6));
        for(let wy=floorY-bd.h+3; wy<floorY-4; wy+=5)
          for(let wx=bx+2; wx<bx+bd.w-2; wx+=4){
            const v = rnd();
            if(v<0.18){ ctx.fillStyle = v<0.1?pal.m:pal.c; ctx.fillRect(wx,wy,1,1); }
          }
      }
    }
  }
}
function drawBackground(ctx, pal, scroll, W, H){
  const floorY = H-16;
  ctx.fillStyle=pal.BG; ctx.fillRect(0,0,W,H);
  const srnd = mulberry32(99); ctx.fillStyle=pal.ST;
  for(let i=0;i<26;i++){ ctx.fillRect(Math.floor(srnd()*W), Math.floor(srnd()*(H*0.55)), 1, 1); }
  drawLayer(ctx, pal, FAR, scroll*0.2, floorY, pal.F1, false);
  drawLayer(ctx, pal, NEAR, scroll*0.5, floorY, pal.F2, true);
  // sidewalk
  ctx.fillStyle=pal.BG2; ctx.fillRect(0,floorY,W,16);
  ctx.fillStyle=pal.d;
  const so = Math.round(scroll)%12;
  for(let x=-so; x<W; x+=12) ctx.fillRect(x, floorY+3, 1, 10);
  ctx.fillStyle=pal.K; ctx.fillRect(0,floorY,W,1);
}
// a wall (obstacle) rising from top & bottom with a lit marquee-trimmed gap
function drawPillar(ctx, pal, x, gapY, gap, pw, H, idx){
  const floorY = H-16, hero = idx%2 ? pal.C : pal.M;
  x = Math.round(x);
  const seg=(y0,y1)=>{
    if(y1<=y0) return;
    ctx.fillStyle=pal.D; ctx.fillRect(x,y0,pw,y1-y0);
    ctx.fillStyle=pal.d;                        // brick coursing
    for(let by=y0+4; by<y1; by+=5) ctx.fillRect(x,by,pw,1);
    for(let row=0, by=y0; by<y1; by+=5, row++){
      const jog = row%2 ? 6 : 0;
      for(let bx=x+jog; bx<x+pw; bx+=12) ctx.fillRect(bx,by,1,5);
    }
    ctx.fillStyle=hero;                          // marquee trim on edges
    ctx.fillRect(x,y0,1,y1-y0); ctx.fillRect(x+pw-1,y0,1,y1-y0);
    if(y0>0) ctx.fillRect(x,y0,pw,2);
    if(y1<floorY) ctx.fillRect(x,y1-2,pw,2);
    ctx.fillStyle=pal.Y;                         // bulbs along the gap-facing cap
    for(let bx=x+2; bx<x+pw-1; bx+=4){
      if(y0>0) ctx.fillRect(bx,y0+3,1,1);
      if(y1<floorY) ctx.fillRect(bx,y1-4,1,1);
    }
  };
  seg(0, Math.round(gapY));
  seg(Math.round(gapY+gap), floorY);
}
function drawMeter(ctx, pal, upFrac, downFrac, win, W, H){
  const y=H-11, h=6, x0=22, x1=W-22, tw=x1-x0;
  ctx.fillStyle=pal.K; ctx.fillRect(x0-1,y-1,tw+2,h+2);
  ctx.fillStyle=pal.d; ctx.fillRect(x0,y,tw,h);
  const half=Math.floor(tw/2);
  const uw=Math.round(half*Math.min(1,upFrac)), dw=Math.round(half*Math.min(1,downFrac));
  ctx.fillStyle = win==="up" ? pal.Y : pal.M;   if(uw) ctx.fillRect(x0, y, uw, h);
  ctx.fillStyle = win==="down" ? pal.Y : pal.C; if(dw) ctx.fillRect(x1-dw, y, dw, h);
  ctx.fillStyle=pal.W; ctx.fillRect(x0+half, y-2, 1, h+4);
  ctx.fillStyle=pal.M; ctx.fillRect(x0-11,y+4,5,1); ctx.fillRect(x0-10,y+3,3,1); ctx.fillRect(x0-9,y+2,1,1); // JUMP chevron up
  ctx.fillStyle=pal.C; ctx.fillRect(x1+6,y+1,5,1); ctx.fillRect(x1+7,y+2,3,1); ctx.fillRect(x1+8,y+3,1,1); // DUCK chevron down
}
// static reference scene
function drawScene(ctx, palKey, charKey){
  const pal = PAL[palKey], W=192, H=240;
  drawBackground(ctx, pal, 40, W, H);
  drawPillar(ctx, pal, 118, 30, 78, 28, H, 0);
  drawPillar(ctx, pal, 210, 90, 78, 28, H, 1);
  drawPillar(ctx, pal, 10, 108, 78, 28, H, 3);
  drawSprite(ctx, charKey, "run1", palKey, 52, 168);
  // dust puffs behind heels
  ctx.fillStyle=pal.ST; ctx.fillRect(42,178,2,2); ctx.fillRect(38,176,1,1); ctx.fillRect(45,180,2,1);
  drawDigits(ctx, "12", W/2, 6, 2, pal.Y, pal.K);
  drawMeter(ctx, pal, 0.7, 0.3, "up", W, H);
  // "THIS WAY" arrow hint on the right edge
  ctx.fillStyle=pal.M;
  const ax=W-9, ay=118;
  for(let i=0;i<5;i++){ ctx.fillRect(ax-i, ay-i, 1, 1+i*2); }
}
class SpriteView extends HTMLElement{
  connectedCallback(){
    const char=this.getAttribute("char")||"runner", frame=this.getAttribute("frame")||"run1";
    const palKey=this.getAttribute("palette")||"neon", scale=+(this.getAttribute("scale")||6);
    const cv = frameCanvas(char, frame, palKey);
    const out=document.createElement("canvas"); out.width=cv.width; out.height=cv.height;
    const c=out.getContext("2d");
    if(this.getAttribute("bg")!=="none"){ c.fillStyle=PAL[palKey].BG; c.fillRect(0,0,out.width,out.height); }
    c.drawImage(cv,0,0);
    out.style.cssText="display:block;image-rendering:pixelated;width:"+(cv.width*scale)+"px;height:"+(cv.height*scale)+"px";
    this.appendChild(out);
  }
}
class SceneView extends HTMLElement{
  connectedCallback(){
    const char=this.getAttribute("char")||"runner", palKey=this.getAttribute("palette")||"neon";
    const scale=+(this.getAttribute("scale")||1.5);
    const out=document.createElement("canvas"); out.width=192; out.height=240;
    drawScene(out.getContext("2d"), palKey, char);
    out.style.cssText="display:block;image-rendering:pixelated;width:"+(192*scale)+"px;height:"+(240*scale)+"px";
    this.appendChild(out);
  }
}
if(!customElements.get("sprite-view")) customElements.define("sprite-view", SpriteView);
if(!customElements.get("scene-view")) customElements.define("scene-view", SceneView);
window.CursedSprites = {PAL, SPRITES, frameCanvas, drawSprite, drawDigits, drawBackground, drawPillar, drawMeter, drawScene};
})();
