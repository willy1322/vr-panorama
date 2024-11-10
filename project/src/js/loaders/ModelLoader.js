import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export class ModelLoader {
    constructor(scene, objects, sceneObjects) {
        this.scene = scene;
        this.objects = objects;
        this.sceneObjects = sceneObjects;
        this.gltfLoader = new GLTFLoader();
        this.fbxLoader = new FBXLoader();
    }

    createLoadingUI(message) {
        const loadingText = document.createElement('div');
        loadingText.style.cssText = `
            color: white;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.7);
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
        `;
        loadingText.textContent = message;
        document.body.appendChild(loadingText);
        return loadingText;
    }

    createHelperBox(x, y, z) {
        const helperBox = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({
                color: 0xff0000,
                wireframe: true,
                transparent: true,
                opacity: 0.5
            })
        );
        helperBox.position.set(x, y, z);
        this.scene.add(helperBox);
        return helperBox;
    }

    loadGLTFModel(modelUrl, position, scale, rotation) {
        const loadingText = this.createLoadingUI('Starting to load model...');
        const helperBox = this.createHelperBox(position.x, position.y, position.z);

        if (!modelUrl) {
            loadingText.textContent = 'Please enter a model URL';
            setTimeout(() => document.body.removeChild(loadingText), 2000);
            return;
        }

        this.gltfLoader.load(
            modelUrl,
            (gltf) => this.onGLTFLoaded(gltf, position, scale, rotation, loadingText, helperBox),
            (xhr) => {
                if (xhr.lengthComputable) {
                    const percent = xhr.loaded / xhr.total * 100;
                    loadingText.textContent = `Loading: ${Math.round(percent)}%`;
                }
            },
            (error) => {
                console.error('Error loading model:', error);
                loadingText.textContent = 'Error loading model: ' + error.message;
                this.scene.remove(helperBox);
                setTimeout(() => document.body.removeChild(loadingText), 2000);
            }
        );
    }

    loadFBXModel(modelUrl, position, scale, rotation) {
        const loadingText = this.createLoadingUI('Starting to load FBX model...');
        const helperBox = this.createHelperBox(position.x, position.y, position.z);

        if (!modelUrl) {
            loadingText.textContent = 'Please enter a model URL';
            setTimeout(() => document.body.removeChild(loadingText), 2000);
            return;
        }

        this.fbxLoader.load(
            modelUrl,
            (fbx) => this.onFBXLoaded(fbx, position, scale, rotation, loadingText, helperBox),
            (xhr) => {
                if (xhr.lengthComputable) {
                    const percent = xhr.loaded / xhr.total * 100;
                    loadingText.textContent = `Loading FBX: ${Math.round(percent)}%`;
                }
            },
            (error) => {
                console.error('Error loading FBX model:', error);
                loadingText.textContent = 'Error loading FBX model: ' + error.message;
                this.scene.remove(helperBox);
                setTimeout(() => document.body.removeChild(loadingText), 2000);
            }
        );
    }

    onGLTFLoaded(gltf, position, scale, rotation, loadingText, helperBox) {
        loadingText.textContent = 'Model loaded, processing...';
        const model = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        const initialScaleFactor = 1 / maxDim;
        model.userData.initialScaleFactor = initialScaleFactor;
        model.scale.setScalar(initialScaleFactor * scale);
        
        model.position.set(position.x, position.y, position.z);
        model.rotation.y = rotation;
        model.userData.initialRotation = rotation;
        model.userData.isVR = false;
        
        this.setupModelMaterials(model);
        this.addModelToScene(model, loadingText, helperBox);
    }

    onFBXLoaded(fbx, position, scale, rotation, loadingText, helperBox) {
        loadingText.textContent = 'FBX model loaded, processing...';
        
        const bbox = new THREE.Box3().setFromObject(fbx);
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        const initialScaleFactor = 1 / maxDim;
        fbx.userData.initialScaleFactor = initialScaleFactor;
        fbx.scale.setScalar(initialScaleFactor * scale);
        
        fbx.position.set(position.x, position.y, position.z);
        fbx.rotation.y = rotation;
        
        this.setupModelMaterials(fbx, true);
        this.addModelToScene(fbx, loadingText, helperBox);
    }

    setupModelMaterials(model, isFBX = false) {
        model.traverse((node) => {
            if (node.isMesh) {
                node.material.side = THREE.DoubleSide;
                node.material.needsUpdate = true;
                node.renderOrder = 999;
                node.frustumCulled = false;
                
                if (isFBX && node.material.map) {
                    node.material.map.anisotropy = 16;
                }
                
                if (!isFBX) {
                    node.raycast = THREE.Mesh.prototype.raycast;
                }
            }
        });
    }

    addModelToScene(model, loadingText, helperBox) {
        this.scene.add(model);
        this.objects.push(model);
        this.sceneObjects.push(model);

        const lightGroup = new THREE.Group();
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
        directionalLight.position.set(1, 1, 1);
        lightGroup.add(directionalLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.2, 5);
        pointLight.position.set(0, 1, 0);
        lightGroup.add(pointLight);

        model.add(lightGroup);

        loadingText.textContent = 'Model loaded successfully!';
        setTimeout(() => {
            document.body.removeChild(loadingText);
            this.scene.remove(helperBox);
        }, 2000);
    }

    createBasicObject(type, position, scale, rotation) {
        let geometry, material;
        
        if (type === 'cube') {
            geometry = new THREE.BoxGeometry(1, 1, 1);
        } else if (type === 'sphere') {
            geometry = new THREE.SphereGeometry(0.5, 32, 32);
        }
        
        material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            metalness: 0.3,
            roughness: 0.7,
            emissive: 0x002200
        });
        
        const object = new THREE.Mesh(geometry, material);
        object.position.set(position.x, position.y, position.z);
        object.scale.setScalar(scale);
        object.rotation.y = rotation;
        object.userData.initialRotation = rotation;
        object.userData.isVR = false;

        return object;
    }
}