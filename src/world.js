import * as THREE from 'three';
import { createNoise2D } from 'https://cdn.skypack.dev/simplex-noise';

const noise2D = createNoise2D();

export class World extends THREE.Group {
    constructor() {
        super();
        this.generate();
    }

    generate() {
        const loader = new THREE.TextureLoader();
        // This is the grass texture used in that version
        const texture = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ map: texture });

        for (let x = -16; x < 16; x++) {
            for (let z = -16; z < 16; z++) {
                // The noise logic for hills
                const y = Math.floor(noise2D(x * 0.1, z * 0.1) * 4);
                const block = new THREE.Mesh(geometry, material);
                block.position.set(x, y, z);
                this.add(block);
            }
        }
    }
}