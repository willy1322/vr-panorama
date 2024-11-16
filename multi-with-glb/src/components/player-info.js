AFRAME.registerComponent('player-info', {
  init: function() {
    this.head = this.el.querySelector('.head');
    this.leftController = this.el.querySelector('.leftController');
    this.rightController = this.el.querySelector('.rightController');

    // Ensure controllers are visible
    if (this.leftController) this.leftController.setAttribute('visible', true);
    if (this.rightController) this.rightController.setAttribute('visible', true);
  },

  tick: function() {
    // Update only if this is a remote player
    if (!this.el.components.networked.data.owner) {
      return;
    }

    // Get camera and controller elements
    const camera = document.querySelector('[camera]');
    const leftController = document.querySelector('[oculus-touch-controls="hand: left"]');
    const rightController = document.querySelector('[oculus-touch-controls="hand: right"]');

    if (camera && this.head) {
      // Update head position and rotation
      const cameraPosition = camera.object3D.position;
      const cameraRotation = camera.object3D.rotation;
      this.head.object3D.position.copy(cameraPosition);
      this.head.object3D.rotation.copy(cameraRotation);
    }

    // Update controller positions and rotations
    if (leftController && this.leftController) {
      this.leftController.object3D.position.copy(leftController.object3D.position);
      this.leftController.object3D.rotation.copy(leftController.object3D.rotation);
    }

    if (rightController && this.rightController) {
      this.rightController.object3D.position.copy(rightController.object3D.position);
      this.rightController.object3D.rotation.copy(rightController.object3D.rotation);
    }
  }
});