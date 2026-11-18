// Pixel Zone — Level 002 "A Porta Que Ninguém Conhecia", re-cut as a Reel (2.5D pixel art, 1080×1920).
// The sets play the original timeline; edit.js maps output time to source time and picks a new camera every 2 s.
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { SET_OF, shotAt } from './story.js';
import { DUR, slotAt, srcTime } from './edit.js';
import { buildCity } from './city.js';
import { buildRoom } from './room.js';
import { buildBarber } from './barber.js';
import { drawOverlay, overlayReady, texts, cues } from './ui_reel.js';
import { EVENTS } from './events_reel.js';

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
if (!ONLY || ONLY === 'city') sets.city = buildCity();
if (!ONLY || ONLY === 'barber') sets.barber = await buildBarber();
if (!ONLY || ONLY === 'room') sets.room = await buildRoom();
const post = makePost(renderer, Object.values(sets)[0].scene, camera, W, H, { ssaa: SS });
const V = post.vig.uniforms;
await overlayReady();

// —— the re-cut cameras: built around the subject of the shot (the hero, or Lagzilla), keeping the set's own camera as the "orig" angle ——
const SUBJ_LAG = ['guardian', 'secret'];
const _p = new THREE.Vector3(), _d = new THREE.Vector3(), _s = new THREE.Vector3();
function subject(S, shot) {
  const want = SUBJ_LAG.includes(shot.id) ? 'lagzilla' : 'hero'; let w = null;
  S.scene.traverse(o => { if (o.userData.char === want && o.visible) w = o; });
  if (!w) S.scene.traverse(o => { if (o.userData.char && o.visible && !w) w = o; });
  return w;
}
const LIMIT = { barber: { x: [-2.3, 2.3], z: [-8.6, 3.8] }, room: { x: [-2.9, 2.9], z: [-3.3, 6] }, city: { x: [-30, 30], z: [-2.2, 30] } };
function reframe(kind, S, sid, shot, lt) {
  if (kind === 'orig') return null;
  const w = subject(S, shot); if (!w) return null;
  w.getWorldPosition(_s); const lag = w.userData.char === 'lagzilla', head = lag ? 1.0 : 1.55;
  _d.copy(camera.position).sub(_s); _d.y = 0; if (_d.lengthSq() < 1e-4) _d.set(0, 0, 1); _d.normalize();
  const rot = (a) => _d.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a * Math.PI / 180);
  const corridor = sid === 'barber' && _s.z < -4.2;
  const drift = lt * .08;
  let p, l, fov;
  if (kind === 'close') { const d = (corridor ? 3.0 : 3.5) - drift; p = _s.clone().addScaledVector(rot(corridor ? 0 : 12), d).setY(_s.y + head - .1); l = _s.clone().setY(_s.y + head - .25); fov = 34; }
  else if (kind === 'low') { const d = corridor ? 3.2 : 3.7; p = _s.clone().addScaledVector(rot(corridor ? 0 : -28), d - drift).setY(_s.y + .45); l = _s.clone().setY(_s.y + head + .1); fov = 42; }
  else if (kind === 'high') { const d = 3.0; p = _s.clone().addScaledVector(rot(18), d).setY(_s.y + 3.3 - drift); l = _s.clone().setY(_s.y + .7); fov = 44; }
  else if (kind === 'side') { const d = 3.4; p = _s.clone().addScaledVector(rot(65 + lt * 6), d).setY(_s.y + 1.5); l = _s.clone().setY(_s.y + head - .3); fov = 40; }
  else if (kind === 'ots') { p = _s.clone().addScaledVector(_d, 2.3 - drift).setY(_s.y + 2.0); l = _s.clone().addScaledVector(_d, -4).setY(_s.y + 1.1); fov = 46; }
  const L = LIMIT[sid]; if (L) { p.x = Math.min(L.x[1], Math.max(L.x[0], p.x)); p.z = Math.min(L.z[1], Math.max(L.z[0], p.z)); }
  if (corridor) p.x = Math.min(.5, Math.max(-.5, p.x));
  camera.position.copy(p); camera.lookAt(l); camera.fov = fov; camera.updateProjectionMatrix();
  // billboards turn to the new camera
  S.scene.traverse(o => { if (o.userData.char && o.visible) { o.getWorldPosition(_p); o.rotation.y = Math.atan2(camera.position.x - _p.x, camera.position.z - _p.z); } });
  post.dof.focus = camera.position.distanceTo(_s.clone().setY(_s.y + head - .3)); post.dof.aper = Math.max(post.dof.aper, 180); post.dof.maxCoc = 18;
  return true;
}

window.DUR = DUR;
window.EV = EVENTS;
window.TEXTS = t => texts(t);
window.CUES = cues;
window.render = t => {
  const slot = slotAt(t), ts = srcTime(t), shot = shotAt(ts), sid = SET_OF[shot.id];
  let info = {};
  if (sid && sets[sid] && !Q.has('textonly')) {
    const S = sets[sid]; post.dof.scene = S.scene; if (post.dof.ao) post.dof.ao.scene = S.scene;
    V.fade.value = 1; post.bloom.strength = .55; post.bloom.radius = .75; post.bloom.threshold = .85; renderer.toneMappingExposure = 1.15;
    V.amt.value = .6; V.warm.value = .05; V.sat.value = 1.12; V.contrast.value = .26;
    post.dof.tiltAmt = 0;
    info = S.update(ts, shot, camera, post, renderer) || {};
    const re = reframe(slot.cam, S, sid, shot, t - slot.a);
    if (!re && ['cityWide', 'reveal', 'duo'].includes(shot.id)) { post.dof.tiltAmt = 10; post.dof.tiltC = .45; post.dof.tiltW = .09; post.dof.tiltF = .3; post.dof.maxCoc = Math.max(post.dof.maxCoc, 20); }
    post.composer.render();
  } else { renderer.setRenderTarget(null); renderer.setClearColor('#000'); renderer.clear(); }
  drawOverlay(t, slot, info);
};
window.READY = true;
