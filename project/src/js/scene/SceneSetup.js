import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { INITIAL_FOV } from '../config.js';

export class SceneSetup {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.objects = [];
        this.objectsGroup = new THREE.Group();
        this.backgroundAudio = null;
    }

    initialize(container) {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer(container);
        this.setupControls();
        this.setupVR();
        this.setupLighting();
        this.setupEventListeners();
        this.scene.add(this.objectsGroup);
    }

    setupScene() {
        this.scene.background = new THREE.Color(0x101010);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(INITIAL_FOV, window.innerWidth / window.innerHeight, 1, 2000);
        this.camera.position.set(0, 0, 0.1);
        this.camera.lookAt(0, 0, 1);
        this.scene.add(this.camera);
    }

    setupRenderer(container) {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        this.renderer.xr.setReferenceSpaceType('local');
        container.appendChild(this.renderer.domElement);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.enableZoom = false;
        this.controls.enabled = !this.renderer.xr.isPresenting;
    }

    setupVR() {
        document.body.appendChild(VRButton.createButton(this.renderer));
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setupBackgroundAudio() {
        this.backgroundAudio = new Audio('./bg-music1.mp3');
        this.backgroundAudio.loop = true;
        this.backgroundAudio.volume = 0.5;
    }

    animate() {
        this.renderer.setAnimationLoop((timestamp, frame) => {
            if (frame) {
                const inputSources = frame.session.inputSources;
                for (const inputSource of inputSources) {
                    if (inputSource.gamepad) {
                        // Handle controller input
                    }
                }
            }
            this.render();
        });
    }

    render() {
        if (!this.renderer.xr.isPresenting && !this.isGyroActive) {
            this.updateSphereRotation();
            this.objectsGroup.children.forEach(object => {
                if (!object.userData.isVR) {
                    if (!object.userData.lastVRRotation) {
                        object.rotation.y = object.userData.initialRotation || 0;
                    }
                }
                object.updateMatrix();
            });
        } else {
            if (this.backgroundAudio) {
                this.backgroundAudio.volume = 0.3;
            }
            this.updateVRInteractions();
            this.objectsGroup.children.forEach(object => {
                object.userData.isVR = true;
                if (!this.selectedObject || this.selectedObject !== object) {
                    object.userData.lastVRRotation = object.quaternion.clone();
                }
            });
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}