// Pixel Zone · Safe Zone 01 — "O Dia Dele" (2.5D pixel art, vertical 1080×1920, 120 BPM)
// The day is cold and grey (it takes HP); the Pixel Zone is warm neon (it gives it back).
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { DUR, SET_OF, shotAt } from './story.js';
import { buildHome, buildCar, buildOffice } from './sets_day.js';
import { buildCity } from './city.js';
import { buildBarber } from './barber.js';
import { buildRoom } from './room.js';
import { drawOverlay, overlayReady, texts, cues } from './ui.js';
import { EVENTS } from './events.js';

const W = 1080, H = 1920, Q = new URLSearchParams(location.search);
const SS = +(Q.get('ss') ?? 1.5);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
const camera = new THREE.PerspectiveCamera(34, W / H, .05, 2000);
const ONLY = Q.get('only');
const sets = {};
const want = k => !ONLY || ONLY === k;
if (want('home')) sets.home = await buildHome();
if (want('car')) sets.car = await buildCar();
if (want('office')) sets.office = await buildOffice();
if (want('city')) sets.city = buildCity();
if (want('barber')) sets.barber = await buildBarber();
if (want('room')) sets.room = await buildRoom();
const post = makePost(renderer, Object.values(sets)[0].scene, camera, W, H, { ssaa: SS });
const V = post.vig.uniforms;
if (Q.has('nobloom')) post.bloom.enabled = false;
await overlayReady();

window.DUR = DUR;
window.EV = EVENTS;
window.TEXTS = t => texts(t);
window.CUES = cues;
window.render = t => {
  const shot = shotAt(t), sid = SET_OF[shot.id] || 'room';
  let info = {};
  if (sets[sid] && !Q.has('textonly')) {
    const S = sets[sid]; post.dof.scene = S.scene; if (post.dof.ao) post.dof.ao.scene = S.scene;
    V.fade.value = 1; post.bloom.strength = .6; post.bloom.radius = .75; post.bloom.threshold = .82; renderer.toneMappingExposure = 1.15;
    V.amt.value = .55; V.warm.value = .03; V.sat.value = 1.12; V.contrast.value = .24;
    post.dof.tiltAmt = 0;
    info = S.update(t, shot, camera, post, renderer) || {};
    const c = info.cold || 0;   // the grey day: desaturated, cool, flatter
    V.sat.value = THREE.MathUtils.lerp(V.sat.value, .45, c); V.warm.value = THREE.MathUtils.lerp(V.warm.value, -.12, c); V.contrast.value = THREE.MathUtils.lerp(V.contrast.value, .14, c);
    if (info.tilt) { post.dof.tiltAmt = info.tilt; post.dof.tiltC = .45; post.dof.tiltW = .1; post.dof.tiltF = .3; post.dof.maxCoc = Math.max(post.dof.maxCoc, 20); }
    if (Q.has('nodof')) post.dof.maxCoc = 0;
    post.composer.render();
  } else { renderer.setRenderTarget(null); renderer.setClearColor('#000'); renderer.clear(); }
  drawOverlay(t, shot, info);
};
window.READY = true;
