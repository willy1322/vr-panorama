import { initControllerSync } from './components/controller-sync.js';
import { initNetworking } from './components/network-setup.js';

// Wait for A-Frame to load
window.addEventListener('load', () => {
  // Initialize components
  initControllerSync();
  
  // Initialize networking when scene is ready
  const scene = document.querySelector('a-scene');
  if (scene.hasLoaded) {
    initNetworking();
  } else {
    scene.addEventListener('loaded', initNetworking);
  }
});