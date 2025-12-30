import * as THREE from 'three';

export class Player {
    constructor(camera) {
        this.camera = camera;
        this.camera.position.set(0, 5, 10);
        this.keys = {};

        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }

    update() {
        const speed = 0.15;
        if (this.keys['KeyW']) this.camera.position.z -= speed;
        if (this.keys['KeyS']) this.camera.position.z += speed;
        if (this.keys['KeyA']) this.camera.position.x -= speed;
        if (this.keys['KeyD']) this.camera.position.x += speed;
    }
}