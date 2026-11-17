// Pixel Zone — Level 001: O Começo, roteiro revisto (2.5D Pixel Art, vertical 1080×1920)
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { DUR, SHOTS, SET_OF, shotAt, T, BUILD, VO } from './story.js';
import { buildHome } from './home.js';
import { buildPizza } from './pizza.js';
import { buildRoom } from './room.js';
import { buildBarber } from './barber.js';
import { drawOverlay, overlayReady, texts, cues, voDur } from './ui.js';
import { EVENTS } from './events.js';

const W = 1080, H = 1920, Q = new URLSearchParams(location.search);
const SS = +(Q.get('ss') ?? 1.5);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
const camera = new THREE.PerspectiveCamera(34, W / H, .1, 2000);
const ONLY = Q.get('only');
const sets = {};
if (!ONLY || ONLY === 'home') sets.home = await buildHome();
if (!ONLY || ONLY === 'pizza') sets.pizza = await buildPizza();
if (!ONLY || ONLY === 'barber') sets.barber = await buildBarber();
if (!ONLY || ONLY === 'room') sets.room = await buildRoom();
const post = makePost(renderer, Object.values(sets)[0].scene, camera, W, H, { ssaa: SS });
const V = post.vig.uniforms;
if (Q.has('nobloom')) post.bloom.enabled = false;
await overlayReady();

// tilt-shift band: follows the founder's screen height; close-ups and phone shots use none
const TILT = !Q.has('notilt'), NO_TILT = ['clip', 'phone', 'face', 'save', 'talk', 'nod', 'mirror'];
const _v = new THREE.Vector3();
function tiltCenter(S, shot) {
  let w = null; S.scene.traverse(o => { if ((o.userData.char === 'founder' || o.userData.char === 'founderW') && o.visible) w = o; });
  if (!w) return .5;
  camera.updateMatrixWorld(); S.scene.updateMatrixWorld(); w.getWorldPosition(_v); _v.y += .8; _v.project(camera);
  return Math.min(.8, Math.max(.2, _v.y * .5 + .5));
}
window.DUR = DUR;
window.EV = EVENTS;
window.TEXTS = t => texts(t);
window.CUES = cues;
window.render = t => {
  const shot = shotAt(t), sid = SET_OF[shot.id];
  let info = {};
  if (sid && sets[sid] && !Q.has('textonly')) {
    const S = sets[sid]; post.dof.scene = S.scene; if (post.dof.ao) post.dof.ao.scene = S.scene;
    post.vig.uniforms.fade.value = 1; post.bloom.strength = .55; post.bloom.radius = .75; post.bloom.threshold = .85; renderer.toneMappingExposure = 1.15;
    V.amt.value = .6; V.warm.value = .05; V.sat.value = 1.08; V.contrast.value = .22;
    post.dof.tiltAmt = 0;
    info = S.update(t, shot, camera, post, renderer) || {};
    if (TILT && !NO_TILT.includes(shot.id)) { post.dof.tiltAmt = info.tilt ?? 10; post.dof.tiltC = tiltCenter(S, shot); post.dof.tiltW = .085; post.dof.tiltF = .3; post.dof.maxCoc = Math.max(post.dof.maxCoc, 22); V.sat.value *= 1.12; V.contrast.value = .28; }
    if (Q.has('nodof')) post.dof.maxCoc = 0;
    post.composer.render();
  } else { renderer.setRenderTarget(null); renderer.setClearColor('#000'); renderer.clear(); }
  drawOverlay(t, shot, info);
};
window.READY = true;
