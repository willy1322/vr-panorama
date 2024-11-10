import * as THREE from 'three';
import { VIDEO_CONFIG } from '../config.js';

export class VideoManager {
    constructor(scene, manager) {
        this.scene = scene;
        this.manager = manager;
        this.videoPlanes = [];
    }

    createVideoPlane(videoConfig) {
        const {
            src,
            position = { x: 0, y: 0, z: -20 },
            scale = VIDEO_CONFIG.DEFAULT_SCALE,
            width = VIDEO_CONFIG.DEFAULT_WIDTH,
            height = VIDEO_CONFIG.DEFAULT_HEIGHT,
            opacity = VIDEO_CONFIG.DEFAULT_OPACITY,
            featherSize = VIDEO_CONFIG.DEFAULT_FEATHER_SIZE,
            blendMode = VIDEO_CONFIG.DEFAULT_BLEND_MODE,
            rotation = 0
        } = videoConfig;

        this.manager.itemStart(src);
        const video = this.createVideoElement(src);
        const videoTexture = this.createVideoTexture(video);
        const material = this.createVideoMaterial(videoTexture, opacity, featherSize, blendMode);
        const videoPlane = this.createPlane(width, height, material);

        this.setupVideoPlane(videoPlane, video, videoTexture, position, scale, rotation, videoConfig);
        return videoPlane;
    }

    createVideoElement(src) {
        const video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        video.preload = 'auto';

        this.setupVideoEventListeners(video, src);
        video.src = src;

        return video;
    }

    setupVideoEventListeners(video, src) {
        video.addEventListener('loadeddata', () => {
            console.log(`Video loaded successfully: ${src}`);
            video.play().catch(error => {
                console.warn("Auto-play failed, will try on user interaction:", error);
            });
            this.manager.itemEnd(src);
        });

        video.addEventListener('error', (e) => {
            console.error(`Error loading video ${src}:`, e);
            this.manager.itemError(src);
        });
    }

    createVideoTexture(video) {
        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.format = THREE.RGBAFormat;
        videoTexture.generateMipmaps = false;
        return videoTexture;
    }

    createVideoMaterial(videoTexture, opacity, featherSize, blendMode) {
        const blendingMode = this.getBlendingMode(blendMode);

        return new THREE.ShaderMaterial({
            uniforms: {
                videoTexture: { value: videoTexture },
                featherSize: { value: featherSize },
                opacity: { value: opacity }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D videoTexture;
                uniform float featherSize;
                uniform float opacity;
                varying vec2 vUv;
                
                void main() {
                    vec4 texColor = texture2D(videoTexture, vUv);
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(vUv, center);
                    float alpha = 1.0 - smoothstep(0.5 - featherSize, 0.5, dist);
                    gl_FragColor = vec4(texColor.rgb, texColor.a * alpha * opacity);
                }
            `,
            transparent: true,
            blending: blendingMode,
            side: THREE.DoubleSide,
            depthWrite: false
        });
    }

    getBlendingMode(blendMode) {
        switch(blendMode.toLowerCase()) {
            case 'additive': return THREE.AdditiveBlending;
            case 'multiply': return THREE.MultiplyBlending;
            case 'normal': return THREE.NormalBlending;
            case 'subtract': return THREE.SubtractiveBlending;
            default: return THREE.AdditiveBlending;
        }
    }

    createPlane(width, height, material) {
        const planeGeometry = new THREE.PlaneGeometry(width, height);
        return new THREE.Mesh(planeGeometry, material);
    }

    setupVideoPlane(videoPlane, video, videoTexture, position, scale, rotation, videoConfig) {
        const videoId = 'video_' + Math.random().toString(36).substr(2, 9);
        videoPlane.name = videoId;

        const savedPosition = localStorage.getItem(videoId + '_position');
        if (savedPosition) {
            try {
                const positionData = JSON.parse(savedPosition);
                videoPlane.position.set(positionData.x, positionData.y, positionData.z);
                videoPlane.rotation.y = positionData.rotationY;
            } catch (error) {
                console.error('Error loading saved position:', error);
                videoPlane.position.set(position.x, position.y, position.z);
                videoPlane.rotation.y = THREE.MathUtils.degToRad(rotation);
            }
        } else {
            videoPlane.position.set(position.x, position.y, position.z);
            videoPlane.rotation.y = THREE.MathUtils.degToRad(rotation);
        }

        videoPlane.userData = {
            src: videoConfig.src,
            video: video,
            initialRotation: videoPlane.rotation.y,
            isVR: false,
            videoId: videoId,
            config: videoConfig,
            texture: videoTexture,
            initialPosition: { ...position }
        };

        videoPlane.scale.setScalar(scale);
        this.scene.add(videoPlane);
        this.videoPlanes.push(videoPlane);
    }

    saveVideoPositionsToFile() {
        const positions = {};
        this.videoPlanes.forEach(videoPlane => {
            positions[videoPlane.userData.src] = {
                x: videoPlane.position.x,
                y: videoPlane.position.y,
                z: videoPlane.position.z,
                rotationY: videoPlane.rotation.y
            };
        });
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(positions, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "video_positions.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
}