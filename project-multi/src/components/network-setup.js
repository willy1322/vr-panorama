export function initNetworking() {
  // Configure networked scene
  NAF.schemas.add({
    template: '#avatar-template',
    components: [
      'position',
      'rotation',
      {
        selector: '.leftController',
        component: 'position'
      },
      {
        selector: '.leftController',
        component: 'rotation'
      },
      {
        selector: '.rightController',
        component: 'position'
      },
      {
        selector: '.rightController',
        component: 'rotation'
      }
    ]
  });
}