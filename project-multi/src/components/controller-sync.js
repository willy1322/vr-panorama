export function initControllerSync() {
  AFRAME.registerComponent('controller-sync', {
    schema: {
      hand: { type: 'string', default: 'right' }
    },

    init() {
      this.controllerEl = document.querySelector(`#${this.data.hand}Hand`);
      if (!this.controllerEl) return;

      this.tick = AFRAME.utils.throttleTick(this.tick.bind(this), 15);
    },

    tick() {
      if (!this.controllerEl) return;
      
      const controllerPos = this.controllerEl.object3D.position;
      const controllerRot = this.controllerEl.object3D.rotation;
      
      this.el.object3D.position.copy(controllerPos);
      this.el.object3D.rotation.copy(controllerRot);
    }
  });
}