import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky Blue

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));

// --- 16x16 Solid Grid ---
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Forest Green

for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
        const block = new THREE.Mesh(geometry, material);
        block.position.set(x, 0, z);
        scene.add(block);
    }
}

camera.position.set(8, 5, 20);
camera.lookAt(8, 0, 8);

// --- Simple Movement ---
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

function animate() {
    requestAnimationFrame(animate);
    if (keys['KeyW']) camera.position.z -= 0.1;
    if (keys['KeyS']) camera.position.z += 0.1;
    if (keys['KeyA']) camera.position.x -= 0.1;
    if (keys['KeyD']) camera.position.x += 0.1;
    renderer.render(scene, camera);
}
animate();