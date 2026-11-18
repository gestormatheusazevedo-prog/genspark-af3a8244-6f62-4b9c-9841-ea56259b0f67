// Pixel Zone · Side Quest 01 — "Player 2 Entrou" (2.5D pixel art, vertical 1080×1920, 120 BPM, one take per bar)
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { DUR, shotAt } from './story.js';
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
const room = await buildRoom();
const post = makePost(renderer, room.scene, camera, W, H, { ssaa: SS });
const V = post.vig.uniforms;
if (Q.has('nobloom')) post.bloom.enabled = false;
await overlayReady();

window.DUR = DUR;
window.EV = EVENTS;
window.TEXTS = t => texts(t);
window.CUES = cues;
window.render = t => {
  const shot = shotAt(t);
  let info = {};
  if (!Q.has('textonly')) {
    post.dof.scene = room.scene; if (post.dof.ao) post.dof.ao.scene = room.scene;
    V.fade.value = 1; post.bloom.strength = .6; post.bloom.radius = .75; post.bloom.threshold = .82; renderer.toneMappingExposure = 1.15;
    V.amt.value = .55; V.warm.value = .03; V.sat.value = 1.12; V.contrast.value = .24;
    post.dof.tiltAmt = 0;
    info = room.update(t, shot, camera, post, renderer) || {};
    if (info.tilt) { post.dof.tiltAmt = info.tilt; post.dof.tiltC = .45; post.dof.tiltW = .1; post.dof.tiltF = .3; post.dof.maxCoc = Math.max(post.dof.maxCoc, 20); V.sat.value *= 1.08; }
    if (Q.has('nodof')) post.dof.maxCoc = 0;
    post.composer.render();
  } else { renderer.setRenderTarget(null); renderer.setClearColor('#000'); renderer.clear(); }
  drawOverlay(t, shot, info);
};
window.READY = true;
