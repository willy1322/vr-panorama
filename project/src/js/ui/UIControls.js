export class UIControls {
    constructor(scene, modelLoader) {
        this.scene = scene;
        this.modelLoader = modelLoader;
        this.initializeControls();
    }

    initializeControls() {
        this.setupAudioControls();
        this.setupUIToggle();
        this.setupModelControls();
        this.setupPositionInputs();
        this.setupScaleControl();
        this.setupRotationControl();
        this.setupObjectButtons();
        this.preventPanoramaInteraction();
    }

    setupAudioControls() {
        const audioButton = document.getElementById('toggle-audio');
        audioButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.scene.backgroundAudio) {
                if (this.scene.backgroundAudio.paused) {
                    this.scene.backgroundAudio.play();
                    audioButton.textContent = 'Mute Audio';
                } else {
                    this.scene.backgroundAudio.pause();
                    audioButton.textContent = 'Play Audio';
                }
            }
        });
    }

    setupUIToggle() {
        const toggleUIButton = document.getElementById('toggle-ui');
        const uiPanel = document.getElementById('ui-panel');

        toggleUIButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCollapsed = uiPanel.classList.toggle('collapsed');
            toggleUIButton.textContent = isCollapsed ? '◀ Controls' : '▼ Controls';
            localStorage.setItem('uiPanelCollapsed', isCollapsed);
        });

        const wasCollapsed = localStorage.getItem('uiPanelCollapsed') === 'true';
        if (wasCollapsed) {
            uiPanel.classList.add('collapsed');
            toggleUIButton.textContent = '◀ Controls';
        }
    }

    setupModelControls() {
        const objectType = document.getElementById('object-type');
        const modelFile = document.getElementById('model-file');
        const fileName = document.getElementById('file-name');
        const modelUrlInput = document.getElementById('model-url');
        const pasteButton = document.getElementById('paste-url');

        objectType.addEventListener('change', (e) => {
            e.stopPropagation();
            const isCustomModel = e.target.value === 'custom' || e.target.value === 'fbx';
            modelFile.style.display = isCustomModel ? 'block' : 'none';
            fileName.style.display = isCustomModel ? 'block' : 'none';
            const urlInput = modelUrlInput.parentElement.parentElement;
            urlInput.style.display = isCustomModel ? 'block' : 'none';
        });

        modelFile.addEventListener('change', (e) => {
            e.stopPropagation();
            if (e.target.files.length > 0) {
                fileName.textContent = `Selected: ${e.target.files[0].name}`;
            }
        });

        pasteButton.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                modelUrlInput.value = text;
            } catch (err) {
                console.error('Failed to read clipboard:', err);
            }
        });

        modelUrlInput.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                e.preventDefault();
                navigator.clipboard.readText().then(text => {
                    modelUrlInput.value = text;
                }).catch(err => {
                    console.error('Failed to read clipboard:', err);
                });
            }
        });
    }

    setupPositionInputs() {
        const posX = document.getElementById('pos-x');
        const posY = document.getElementById('pos-y');
        const posZ = document.getElementById('pos-z');

        [posX, posY, posZ].forEach(input => {
            input.addEventListener('input', (e) => {
                e.stopPropagation();
                let value = e.target.value.replace(/[^\d.-]/g, '');
                
                const parts = value.split('.');
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                }
                if (value.indexOf('-') > 0) {
                    value = value.replace('-', '');
                }
                
                e.target.value = value;

                const x = parseFloat(posX.value) || 0;
                const y = parseFloat(posY.value) || 0;
                const z = parseFloat(posZ.value) || -3;

                this.scene.sceneObjects.forEach(object => {
                    if (object !== this.scene.videoPlane) {
                        object.position.set(x, y, z);
                    }
                });
            });
        });
    }

    setupScaleControl() {
        const scaleSlider = document.getElementById('scale');
        const scaleValue = document.getElementById('scale-value');

        scaleSlider.addEventListener('input', (e) => {
            e.stopPropagation();
            const newScale = parseFloat(e.target.value);
            scaleValue.textContent = newScale.toFixed(1);

            this.scene.sceneObjects.forEach(object => {
                const baseScale = object.userData.initialScaleFactor || 1;
                object.scale.setScalar(baseScale * newScale);
            });
        });
    }

    setupRotationControl() {
        const rotationSlider = document.getElementById('rotation');
        const rotationValue = document.getElementById('rotation-value');

        rotationSlider.addEventListener('input', (e) => {
            e.stopPropagation();
            const degrees = parseFloat(e.target.value);
            rotationValue.textContent = `${degrees}°`;
            const radians = THREE.MathUtils.degToRad(degrees);

            this.scene.sceneObjects.forEach(object => {
                if (object !== this.scene.videoPlane) {
                    object.rotation.y = radians;
                    object.userData.initialRotation = radians;
                }
            });
        });
    }

    setupObjectButtons() {
        const addObjectButton = document.getElementById('add-object');
        const clearObjectsButton = document.getElementById('clear-objects');
        const toggleSphereButton = document.getElementById('toggle-sphere');
        const savePositionsButton = document.getElementById('save-positions');

        addObjectButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleAddObject();
        });

        clearObjectsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleClearObjects();
        });

        toggleSphereButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.scene.sphere) {
                this.scene.sphere.visible = !this.scene.sphere.visible;
                toggleSphereButton.textContent = this.scene.sphere.visible ? 'Hide Sphere' : 'Show Sphere';
            }
        });

        savePositionsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.scene.saveVideoPositionsToFile();
        });
    }

    handleAddObject() {
        const type = document.getElementById('object-type').value;
        const position = {
            x: parseFloat(document.getElementById('pos-x').value) || 0,
            y: parseFloat(document.getElementById('pos-y').value) || 0,
            z: parseFloat(document.getElementById('pos-z').value) || -3
        };
        const scale = parseFloat(document.getElementById('scale').value);
        const rotation = THREE.MathUtils.degToRad(parseFloat(document.getElementById('rotation').value));

        if (type === 'custom') {
            const modelUrl = document.getElementById('model-url').value;
            this.modelLoader.loadGLTFModel(modelUrl, position, scale, rotation);
        } else if (type === 'fbx') {
            const modelUrl = document.getElementById('model-url').value;
            this.modelLoader.loadFBXModel(modelUrl, position, scale, rotation);
        } else {
            const object = this.modelLoader.createBasicObject(type, position, scale, rotation);
            this.scene.objectsGroup.add(object);
            this.scene.sceneObjects.push(object);
        }
    }

    handleClearObjects() {
        this.scene.sceneObjects.forEach(object => {
            if (object.isGroup) {
                object.traverse((node) => {
                    if (node.isMesh) {
                        if (node.geometry) node.geometry.dispose();
                        if (node.material) node.material.dispose();
                    }
                });
            }
            this.scene.remove(object);
        });

        while (this.scene.objectsGroup.children.length > 0) {
            const object = this.scene.objectsGroup.children[0];
            if (object.isGroup) {
                object.traverse((node) => {
                    if (node.isMesh) {
                        if (node.geometry) node.geometry.dispose();
                        if (node.material) node.material.dispose();
                    }
                });
            } else {
                if (object.geometry) object.geometry.dispose();
                if (object.material) object.material.dispose();
            }
            this.scene.objectsGroup.remove(object);
        }

        this.scene.objects = [];
        this.scene.objectsGroup.clear();

        if (this.scene.renderer) {
            this.scene.renderer.renderLists.dispose();
        }
    }

    preventPanoramaInteraction() {
        const uiElements = document.querySelectorAll('.ui-controls, select, input, button');
        const stopEvent = (e) => <boltAction type="file" filePath="src/js/ui/UIControls.js">
        const stopEvent = (e) => {
            e.stopPropagation();
            this.scene.isUserInteracting = false;
        };

        uiElements.forEach(element => {
            element.addEventListener('mousedown', stopEvent);
            element.addEventListener('mousemove', stopEvent);
            element.addEventListener('mouseup', stopEvent);
            element.addEventListener('touchstart', stopEvent);
            element.addEventListener('touchmove', stopEvent);
            element.addEventListener('touchend', stopEvent);
            element.addEventListener('wheel', stopEvent);
            element.addEventListener('click', stopEvent);
        });
    }
}