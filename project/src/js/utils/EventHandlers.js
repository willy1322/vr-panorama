import * as THREE from 'three';
import { MOUSE_SPEED, TOUCH_HORIZONTAL_SPEED, TOUCH_VERTICAL_SPEED, PINCH_ZOOM_SPEED } from '../config.js';

export class EventHandlers {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.isUserInteracting = false;
        this.onMouseDownMouseX = 0;
        this.onMouseDownMouseY = 0;
        this.lon = 0;
        this.onMouseDownLon = 0;
        this.lat = 0;
        this.onMouseDownLat = 0;
        this.initialPinchDistance = 0;
        this.initialFov = camera.fov;

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('wheel', this.onDocumentMouseWheel.bind(this), false);
        window.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false);
        window.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
        window.addEventListener('mouseup', this.onDocumentMouseUp.bind(this), false);
        window.addEventListener('touchstart', this.onDocumentTouchStart.bind(this), false);
        window.addEventListener('touchmove', this.onDocumentTouchMove.bind(this), false);
        window.addEventListener('touchend', this.onDocumentTouchEnd.bind(this), false);
        window.addEventListener('touchcancel', this.onDocumentTouchEnd.bind(this), false);
    }

    onDocumentMouseDown(event) {
        event.preventDefault();
        this.isUserInteracting = true;
        this.onMouseDownMouseX = event.clientX;
        this.onMouseDownMouseY = event.clientY;
        this.onMouseDownLon = this.lon;
        this.onMouseDownLat = this.lat;
    }

    onDocumentMouseMove(event) {
        if (this.isUserInteracting) {
            this.lon = (this.onMouseDownMouseX - event.clientX) * MOUSE_SPEED + this.onMouseDownLon;
            this.lat = (event.clientY - this.onMouseDownMouseY) * MOUSE_SPEED + this.onMouseDownLat;
        }
    }

    onDocumentMouseUp() {
        this.isUserInteracting = false;
    }

    onDocumentTouchStart(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            this.isUserInteracting = true;
            this.onMouseDownMouseX = event.touches[0].pageX;
            this.onMouseDownMouseY = event.touches[0].pageY;
            this.onMouseDownLon = this.lon;
            this.onMouseDownLat = this.lat;
        } else if (event.touches.length === 2) {
            event.preventDefault();
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            
            this.initialPinchDistance = Math.hypot(
                touch2.pageX - touch1.pageX,
                touch2.pageY - touch1.pageY
            );
            this.initialFov = this.camera.fov;
            
            const centerX = (touch1.pageX + touch2.pageX) / 2;
            const centerY = (touch1.pageY + touch2.pageY) / 2;
            
            this.onMouseDownMouseX = centerX;
            this.onMouseDownMouseY = centerY;
            this.onMouseDownLon = this.lon;
            this.onMouseDownLat = this.lat;
        }
    }

    onDocumentTouchMove(event) {
        if (event.touches.length === 1 && this.isUserInteracting) {
            event.preventDefault();
            this.lon = (this.onMouseDownMouseX - event.touches[0].pageX) * TOUCH_HORIZONTAL_SPEED + this.onMouseDownLon;
            this.lat = (event.touches[0].pageY - this.onMouseDownMouseY) * TOUCH_VERTICAL_SPEED + this.onMouseDownLat;
        } else if (event.touches.length === 2) {
            event.preventDefault();
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            
            const currentPinchDistance = Math.hypot(
                touch2.pageX - touch1.pageX,
                touch2.pageY - touch1.pageY
            );
            
            const pinchDelta = this.initialPinchDistance - currentPinchDistance;
            
            this.camera.fov = this.initialFov + (pinchDelta * PINCH_ZOOM_SPEED);
            this.camera.fov = Math.max(40, Math.min(100, this.camera.fov));
            this.camera.updateProjectionMatrix();
            
            const centerX = (touch1.pageX + touch2.pageX) / 2;
            const centerY = (touch1.pageY + touch2.pageY) / 2;
            
            const centerDeltaX = centerX - this.onMouseDownMouseX;
            const centerDeltaY = centerY - this.onMouseDownMouseY;
            
            if (Math.abs(centerDeltaX) > 5 || Math.abs(centerDeltaY) > 5) {
                this.lon = (this.onMouseDownMouseX - centerX) * TOUCH_HORIZONTAL_SPEED + this.onMouseDownLon;
                this.lat = (centerY - this.onMouseDownMouseY) * TOUCH_VERTICAL_SPEED + this.onMouseDownLat;
            }
        }
    }

    onDocumentTouchEnd(event) {
        if (event.touches.length === 0) {
            this.isUserInteracting = false;
            this.initialPinchDistance = 0;
            this.onMouseDownLon = this.lon;
            this.onMouseDownLat = this.lat;
        } else if (event.touches.length === 1) {
            this.isUserInteracting = true;
            this.onMouseDownMouseX = event.touches[0].pageX;
            this.onMouseDownMouseY = event.touches[0].pageY;
            this.onMouseDownLon = this.lon;
            this.onMouseDownLat = this.lat;
        }
    }

    onDocumentMouseWheel(event) {
        event.preventDefault();
        this.camera.fov += event.deltaY * 0.05;
        this.camera.fov = Math.max(40, Math.min(100, this.camera.fov));
        this.camera.updateProjectionMatrix();
    }

    updateSphereRotation() {
        this.lat = Math.max(-85, Math.min(85, this.lat));
        const phi = THREE.MathUtils.degToRad(90 - this.lat);
        const theta = THREE.MathUtils.degToRad(this.lon);

        const x = Math.sin(phi) * Math.cos(theta);
        const y = Math.cos(phi);
        const z = Math.sin(phi) * Math.sin(theta);

        this.camera.lookAt(new THREE.Vector3(x, y, z));
    }
}