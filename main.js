import * as THREE from 'three';
import { World } from './src/world.js';
import { Player } from './src/player.js';

const scene = new THREE.Scene();
const skyColor = 0x87CEEB;
scene.background = new THREE.Color(skyColor);
scene.fog = new THREE.Fog(skyColor, 30, 60);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const sun = new THREE.DirectionalLight(0xffffff, 0.5);
sun.position.set(5, 15, 5);
scene.add(sun);

const world = new World();
scene.add(world);
const player = new Player(camera);

const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);
let selectedBlock = 'grass';

// Prevent right-click menu for block placement
window.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('mousedown', (e) => {
    // Lock mouse on first click
    if (document.pointerLockElement !== document.body) {
        document.body.requestPointerLock();
        return;
    }
    
    raycaster.setFromCamera(center, camera);
    const hits = raycaster.intersectObjects([world.grassInst, world.dirtInst]);

    if (hits.length > 0) {
        if (e.button === 0) world.breakBlock(hits[0]); // Left Click: Break
        if (e.button === 2) world.placeBlock(hits[0], selectedBlock); // Right Click: Place
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === '1') selectedBlock = 'grass';
    if (e.key === '2') selectedBlock = 'dirt';
});

function animate() {
    requestAnimationFrame(animate);
    player.update(world);
    
    // Beefy Floating Origin Logic to prevent jitter
    const lx = player.worldX - Math.floor(player.worldX);
    const lz = player.worldZ - Math.floor(player.worldZ);
    world.position.set(-lx, 0, -lz);
    
    renderer.render(scene, camera);
}
animate();