import * as THREE from 'three';

export class GyroController {
    constructor(camera, controls) {
        this.camera = camera;
        this.controls = controls;
        this.isGyroActive = false;
        this.deviceOrientationPermission = false;
        this.lastGyroAlpha = 0;
        this.lastGyroBeta = 0;
        this.lastGyroGamma = 0;
        this.initialAlpha = null;
        this.currentAlpha = 0;
        this.previousAlpha = 0;
        this.rotationOffset = 0;
        
        this.init();
    }

    init() {
        if (window.DeviceOrientationEvent) {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                this.createIOSPermissionButton();
            } else {
                this.deviceOrientationPermission = true;
                this.enableGyroscope();
            }
        }
    }

    createIOSPermissionButton() {
        const button = document.createElement('button');
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background-color: #2196F3;
            color: white;
            border: none;
            border-radius: 8px;
            z-index: 9999;
        `;
        button.textContent = 'Enable Gyroscope';
        
        button.addEventListener('click', async () => {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    this.deviceOrientationPermission = true;
                    this.enableGyroscope();
                    button.style.display = 'none';
                }
            } catch (error) {
                console.error('Error requesting gyroscope permission:', error);
            }
        });
        
        document.body.appendChild(button);
    }

    enableGyroscope() {
        if (!this.deviceOrientationPermission) return;

        const gyroToggle = document.getElementById('toggle-gyroscope');
        const resetButton = this.createResetButton();
        
        gyroToggle.parentNode.insertBefore(resetButton, gyroToggle.nextSibling);

        gyroToggle.addEventListener('click', () => {
            this.isGyroActive = !this.isGyroActive;
            gyroToggle.textContent = this.isGyroActive ? 'Disable Gyroscope' : 'Enable Gyroscope';
            resetButton.style.display = this.isGyroActive ? 'block' : 'none';
            
            if (this.isGyroActive) {
                this.resetGyroscope();
                window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
            } else {
                window.removeEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
            }
        });

        resetButton.addEventListener('click', () => {
            this.resetGyroscope();
        });
    }

    createResetButton() {
        const resetButton = document.createElement('button');
        resetButton.style.cssText = `
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #009688, #00695C);
            color: white;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            display: none;
        `;
        resetButton.textContent = 'Reset Gyroscope View';
        return resetButton;
    }

    handleDeviceOrientation(event) {
        if (!this.isGyroActive) return;

        if (this.initialAlpha === null) {
            this.initialAlpha = event.alpha;
            this.previousAlpha = event.alpha;
            return;
        }

        let alpha = event.alpha;

        if (Math.abs(alpha - this.previousAlpha) > 180) {
            if (alpha < this.previousAlpha) {
                this.rotationOffset += 360;
            } else {
                this.rotationOffset -= 360;
            }
        }

        this.currentAlpha = alpha + this.rotationOffset;
        this.previousAlpha = alpha;

        const alphaRad = THREE.MathUtils.degToRad(-this.currentAlpha);
        const betaRad = THREE.MathUtils.degToRad(event.beta - 90);
        const gammaRad = THREE.MathUtils.degToRad(event.gamma);

        const smoothingFactor = 0.1;
        this.lastGyroAlpha = this.lastGyroAlpha * (1 - smoothingFactor) + alphaRad * smoothingFactor;
        this.lastGyroBeta = this.lastGyroBeta * (1 - smoothingFactor) + betaRad * smoothingFactor;
        this.lastGyroGamma = this.lastGyroGamma * (1 - smoothingFactor) + gammaRad * smoothingFactor;

        if (!this.renderer?.xr.isPresenting) {
            const phi = Math.PI/2 - this.lastGyroBeta;
            const theta = this.lastGyroAlpha;

            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.cos(phi);
            const z = Math.sin(phi) * Math.sin(theta);

            this.camera.lookAt(
                this.camera.position.x + x,
                this.camera.position.y + y,
                this.camera.position.z + z
            );

            this.controls.enabled = false;
            this.isUserInteracting = false;
        }
    }

    resetGyroscope() {
        this.initialAlpha = null;
        this.currentAlpha = 0;
        this.previousAlpha = 0;
        this.rotationOffset = 0;
        this.lastGyroAlpha = 0;
        this.lastGyroBeta = 0;
        this.lastGyroGamma = 0;
    }
}