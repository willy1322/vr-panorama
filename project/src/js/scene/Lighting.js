import * as THREE from 'three';

export class Lighting {
    constructor(scene) {
        this.scene = scene;
        this.setupLighting();
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }

    addModelLighting(model) {
        const lightGroup = new THREE.Group();

        // Directional light for model
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
        directionalLight.position.set(1, 1, 1);
        lightGroup.add(directionalLight);

        // Point light for model
        const pointLight = new THREE.PointLight(0xffffff, 0.2, 5);
        pointLight.position.set(0, 1, 0);
        lightGroup.add(pointLight);

        model.add(lightGroup);
    }
}