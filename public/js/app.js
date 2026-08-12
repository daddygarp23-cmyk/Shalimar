import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('bg');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

const knot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1.7, 0.45, 128, 24),
  new THREE.MeshBasicMaterial({ color: 0xf0b429, wireframe: true, transparent: true, opacity: 0.28 })
);
scene.add(knot);

const starGeo = new THREE.BufferGeometry();
const pos = new Float32Array(900 * 3);
for (let i = 0; i < pos.length; i++) pos[i] = (Math.random() - 0.5) * 32;
starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
  color: 0xffffff, size: 0.04, transparent: true, opacity: 0.7
}));
scene.add(stars);

const animate = () => {
  requestAnimationFrame(animate);
  knot.rotation.x += 0.002;
  knot.rotation.y += 0.004;
  stars.rotation.y += 0.0004;
  renderer.render(scene, camera);
};
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

document.querySelectorAll('[data-tilt]').forEach(el => {
  if (window.VanillaTilt) new VanillaTilt(el, { max: 14, speed: 500, glare: true, 'max-glare': 0.25 });
});
