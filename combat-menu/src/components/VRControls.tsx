import { Controllers, Hands } from '@react-three/xr';
import { memo } from 'react';

function VRControls() {
  return (
    <>
      <Controllers />
      <Hands />
    </>
  );
}

export default memo(VRControls);