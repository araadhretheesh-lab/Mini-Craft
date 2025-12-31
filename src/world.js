import * as THREE from 'three';
import { createNoise2D } from 'https://cdn.skypack.dev/simplex-noise';;

export const noise2D = createNoise2D(() => 0.5);

export class World extends THREE.Group {
    constructor() {
        super();
        this.viewDistance = 64; 
        this.chunkSize = this.viewDistance * 2;
        this.modifiedBlocks = new Map(); // Key: "x,y,z" | Value: 'grass', 'dirt', or 'empty'
        
        this.lastSnapX = null;
        this.lastSnapZ = null;
        this.isLoaded = false;
        this.generate();
    }

    applyCrossUVs(geometry) {
        const uvs = geometry.attributes.uv.array;
        const col = 1/4; const row = 1/3;
        for (let i = 0; i < uvs.length; i += 8) {
            const face = i / 8;
            let u = col, v = row; 
            if (face === 2) { u = col; v = row * 2; } // Top
            if (face === 3) { u = col; v = 0; }       // Bottom
            uvs[i] = u; uvs[i+1] = v + row;
            uvs[i+2] = u + col; uvs[i+3] = v + row;
            uvs[i+4] = u; uvs[i+5] = v;
            uvs[i+6] = u + col; uvs[i+7] = v;
        }
        geometry.attributes.uv.needsUpdate = true;
    }

    async generate() {
        const loader = new THREE.TextureLoader();
        const loadTex = (path) => new Promise(res => loader.load(path, res, undefined, () => res(null)));
        
        const [grassTex, dirtTex] = await Promise.all([
            loadTex('assets/grass_atlas.png'),
            loadTex('assets/dirt_atlas.png')
        ]);

        const geo = new THREE.BoxGeometry(1, 1, 1);
        this.applyCrossUVs(geo);

        const grassMat = new THREE.MeshLambertMaterial({ map: grassTex, color: grassTex ? 0xffffff : 0x44aa44 });
        const dirtMat = new THREE.MeshLambertMaterial({ map: dirtTex, color: dirtTex ? 0xffffff : 0x8b4513 });

        const count = this.chunkSize * this.chunkSize * 2; // Extra buffer for placed blocks
        this.grassInst = new THREE.InstancedMesh(geo, grassMat, count);
        this.dirtInst = new THREE.InstancedMesh(geo, dirtMat, count);
        
        this.add(this.grassInst, this.dirtInst);
        this.matrix = new THREE.Matrix4();
        this.isLoaded = true;
    }

    // Convert screen hit to global coordinate and remove
    breakBlock(intersect) {
        const matrix = new THREE.Matrix4();
        intersect.object.getMatrixAt(intersect.instanceId, matrix);
        const pos = new THREE.Vector3().setFromMatrixPosition(matrix);
        
        const gx = Math.round(pos.x + this.lastSnapX);
        const gy = Math.round(pos.y);
        const gz = Math.round(pos.z + this.lastSnapZ);

        this.modifiedBlocks.set(`${gx},${gy},${gz}`, 'empty');
        this.lastSnapX = null; // Force refresh
    }

    // Use the face normal to find the empty air block next to the one hit
    placeBlock(intersect, type) {
        const matrix = new THREE.Matrix4();
        intersect.object.getMatrixAt(intersect.instanceId, matrix);
        const pos = new THREE.Vector3().setFromMatrixPosition(matrix);
        
        // Add the normal vector (direction the face is pointing) to the position
        pos.add(intersect.face.normal);

        const gx = Math.round(pos.x + this.lastSnapX);
        const gy = Math.round(pos.y);
        const gz = Math.round(pos.z + this.lastSnapZ);

        this.modifiedBlocks.set(`${gx},${gy},${gz}`, type);
        this.lastSnapX = null; // Force refresh
    }

    update(worldX, worldZ) {
        if (!this.isLoaded) return;
        const snapX = Math.floor(worldX);
        const snapZ = Math.floor(worldZ);
        if (snapX === this.lastSnapX && snapZ === this.lastSnapZ) return;

        this.lastSnapX = snapX; this.lastSnapZ = snapZ;
        let gIdx = 0; let dIdx = 0;

        for (let x = -this.viewDistance; x < this.viewDistance; x++) {
            for (let z = -this.viewDistance; z < this.viewDistance; z++) {
                const gx = x + snapX;
                const gz = z + snapZ;
                
                // Base Terrain Height
                const n = noise2D(gx * 0.02, gz * 0.02);
                const h = Math.floor(n * 10) + 2;

                // Render vertical stack (grass top, dirt bottom)
                for (let y = h - 1; y <= h; y++) {
                    const state = this.modifiedBlocks.get(`${gx},${y},${gz}`);
                    if (state === 'empty') continue;

                    const type = state || (y === h ? 'grass' : 'dirt');
                    const target = type === 'grass' ? this.grassInst : this.dirtInst;
                    const idx = type === 'grass' ? gIdx++ : dIdx++;

                    this.matrix.setPosition(x, y, z);
                    target.setMatrixAt(idx, this.matrix);
                }
            }
        }
        // Handle custom blocks placed in the sky or deep underground (outside loop)
        this.modifiedBlocks.forEach((type, key) => {
            if (type === 'empty') return;
            const [x, y, z] = key.split(',').map(Number);
            const lx = x - snapX;
            const lz = z - snapZ;
            if (Math.abs(lx) < this.viewDistance && Math.abs(lz) < this.viewDistance) {
                 // Logic for blocks outside the standard height range goes here
            }
        });

        this.grassInst.instanceMatrix.needsUpdate = true;
        this.dirtInst.instanceMatrix.needsUpdate = true;
        this.grassInst.count = gIdx;
        this.dirtInst.count = dIdx;
    }
}