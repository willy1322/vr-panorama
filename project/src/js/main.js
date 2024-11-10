import { SceneSetup } from './scene/SceneSetup.js';
import { Lighting } from './scene/Lighting.js';
import { VRController } from './controllers/VRController.js';
import { GyroController } from './controllers/GyroController.js';
import { ModelLoader } from './loaders/ModelLoader.js';
import { UIControls } from './ui/UIControls.js';
import { EventHandlers } from './utils/EventHandlers.js';
import { VideoManager } from './video/VideoManager.js';
import { VIDEOS_LIST } from './config.js';

class App {
    constructor() {
        this.sceneSetup = new SceneSetup();
        this.container = document.getElementById('container');
        this.initialize();
    }

    async initialize() {
        this.sceneSetup.initialize(this.container);
        
        this.lighting = new Lighting(this.sceneSetup.scene);
        this.vrController = new VRController(this.sceneSetup.renderer, this.sceneSetup.scene);
        this.gyroController = new GyroController(this.sceneSetup.camera, this.sceneSetup.controls);
        this.modelLoader = new ModelLoader(this.sceneSetup.scene, this.sceneSetup.objects, this.sceneSetup.sceneObjects);
        this.uiControls = new UIControls(this.sceneSetup, this.modelLoader);
        this.eventHandlers = new EventHandlers(this.sceneSetup.scene, this.sceneSetup.camera);
        this.videoManager = new VideoManager(this.sceneSetup.scene, this.sceneSetup.manager);

        await this.setupVideos();
        this.sceneSetup.animate();
    }

    async setupVideos() {
        for (const videoConfig of VIDEOS_LIST) {
            await this.videoManager.createVideoPlane(videoConfig);
        }
    }
}

// Start the application
new App();