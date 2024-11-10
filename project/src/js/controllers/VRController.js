import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

export class VRController {
    constructor(renderer, scene) {
        this.renderer = renderer;
        this.scene = scene;
        this.controller1 = null;
        this.controller2 = null;
        this.selectedObject = null;
        this.selectedController = null;
        this.bothTriggersPressed = false;
        this.rotationStartX = 0;
        this.initControllers();
    }

    initControllers() {
        this.controller1 = this.renderer.xr.getController(0);
        this.controller2 = this.renderer.xr.getController(1);
        
        this.controller1.addEventListener('selectstart', this.onTriggerStart.bind(this));
        this.controller1.addEventListener('selectend', this.onTriggerEnd.bind(this));
        this.controller2.addEventListener('selectstart', this.onTriggerStart.bind(this));
        this.controller2.addEventListener('selectend', this.onTriggerEnd.bind(this));
        
        this.controller1.userData.handedness = 'right';
        this.controller2.userData.handedness = 'left';
        
        this.scene.add(this.controller1);
        this.scene.add(this.controller2);

        this.setupControllerModels();
        this.addVisualRays();
    }

    setupControllerModels() {
        const controllerModelFactory = new XRControllerModelFactory();
        
        const controllerGrip1 = this.renderer.xr.getControllerGrip(0);
        const model1 = controllerModelFactory.createControllerModel(controllerGrip1);
        controllerGrip1.add(model1);
        this.scene.add(controllerGrip1);

        const controllerGrip2 = this.renderer.xr.getControllerGrip(1);
        const model2 = controllerModelFactory.createControllerModel(controllerGrip2);
        controllerGrip2.add(model2);
        this.scene.add(controllerGrip2);
    }

    addVisualRays() {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1)
        ]);

        const line1 = new THREE.Line(geometry);
        const line2 = new THREE.Line(geometry);
        line1.scale.z = 5;
        line2.scale.z = 5;
        this.controller1.add(line1);
        this.controller2.add(line2);
    }

    onTriggerStart(event) {
        const controller = event.target;
        
        if (!this.selectedObject) {
            const intersections = this.getIntersections(controller);
            if (intersections.length > 0) {
                const intersection = intersections[0];
                let object = intersection.object;

                while (object.parent && !this.scene.objects.includes(object) && !this.scene.objectsGroup.children.includes(object)) {
                    object = object.parent;
                }

                if (this.scene.objects.includes(object) || this.scene.objectsGroup.children.includes(object)) {
                    this.selectedObject = object;
                    this.selectedController = controller;
                    controller.userData.initialPosition = controller.position.clone();
                    this.selectedObject.userData.initialPosition = this.selectedObject.position.clone();
                }
            }
        } else if (controller !== this.selectedController) {
            this.bothTriggersPressed = true;
            this.rotationStartX = this.controller1.position.x - this.controller2.position.x;
        }
    }

    onTriggerEnd(event) {
        const controller = event.target;
        if (controller === this.selectedController) {
            if (this.selectedObject) {
                this.selectedObject.userData.lastVRRotation = this.selectedObject.quaternion.clone();
                
                if (this.selectedObject.userData.videoId) {
                    const positionData = {
                        x: this.selectedObject.position.x,
                        y: this.selectedObject.position.y,
                        z: this.selectedObject.position.z,
                        rotationY: this.selectedObject.rotation.y
                    };
                    localStorage.setItem(this.selectedObject.userData.videoId + '_position', JSON.stringify(positionData));
                }
            }

            this.selectedObject = null;
            this.selectedController = null;
            this.bothTriggersPressed = false;

            if (controller.userData) {
                controller.userData.initialPosition = null;
            }
        } else {
            this.bothTriggersPressed = false;
        }
    }

    getIntersections(controller) {
        const tempMatrix = new THREE.Matrix4();
        tempMatrix.identity().extractRotation(controller.matrixWorld);

        const raycaster = new THREE.Raycaster();
        raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

        const testObjects = [];
        this.scene.objects.concat(this.scene.objectsGroup.children).forEach(object => {
            if (object.type === 'Group') {
                object.traverse(child => {
                    if (child.isMesh) {
                        testObjects.push(child);
                    }
                });
            } else {
                testObjects.push(object);
            }
        });

        return raycaster.intersectObjects(testObjects, true);
    }

    updateVRInteractions() {
        if (!this.selectedObject || !this.selectedController) return;

        if (!this.bothTriggersPressed) {
            const initialControllerPosition = this.selectedController.userData.initialPosition;
            const initialObjectPosition = this.selectedObject.userData.initialPosition;
            const currentControllerPosition = this.selectedController.position.clone();
            const movement = currentControllerPosition.sub(initialControllerPosition);
            const movementMultiplier = 12;
            movement.multiplyScalar(movementMultiplier);
            this.selectedObject.position.copy(initialObjectPosition.clone().add(movement));
        } else {
            const currentDistanceX = this.controller1.position.x - this.controller2.position.x;
            const rotationAngle = (currentDistanceX - this.rotationStartX) * 4;
            this.selectedObject.rotateY(rotationAngle);
            this.rotationStartX = currentDistanceX;
        }
    }
}