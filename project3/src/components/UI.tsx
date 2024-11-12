import { useState, useEffect } from 'react';
import { useStore, ObjectType } from '../store';
import { Compass } from 'lucide-react';

export function UI() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0, z: -5 });
  const [scale, setScale] = useState(2);
  const [rotation, setRotation] = useState(0);
  const [objectType, setObjectType] = useState<ObjectType>('cube');
  const [modelUrl, setModelUrl] = useState('');
  const [gyroscopeEnabled, setGyroscopeEnabled] = useState(false);
  
  const { objects, selectedObjectId, addObject, clearObjects, updateObject, setPanoramaUrl } = useStore();

  useEffect(() => {
    const selectedObject = objects.find(obj => obj.id === selectedObjectId);
    if (selectedObject) {
      const [x, y, z] = selectedObject.position;
      setPosition({ x, y, z });
      setScale(selectedObject.scale);
      setRotation(selectedObject.rotation);
    }
  }, [selectedObjectId, objects]);

  const handleAddObject = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if ((objectType === 'glb' || objectType === 'fbx' || objectType === 'panorama') && !modelUrl) {
      alert('Please enter a URL');
      return;
    }

    if (objectType === 'panorama') {
      setPanoramaUrl(modelUrl);
      setModelUrl('');
      return;
    }

    const newObject = {
      id: crypto.randomUUID(),
      type: objectType,
      position: [position.x, position.y, position.z] as [number, number, number],
      rotation,
      scale,
      ...(objectType === 'glb' || objectType === 'fbx' ? { url: modelUrl } : {})
    };

    addObject(newObject);
    
    if (objectType === 'glb' || objectType === 'fbx') {
      setModelUrl('');
    }
  };

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newPosition = { ...position, [axis]: value };
    setPosition(newPosition);
    
    if (selectedObjectId) {
      updateObject(selectedObjectId, {
        position: [newPosition.x, newPosition.y, newPosition.z]
      });
    }
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const value = parseFloat(e.target.value);
    setScale(value);
    if (selectedObjectId) {
      updateObject(selectedObjectId, { scale: value });
    }
  };

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const value = parseInt(e.target.value);
    setRotation(value);
    if (selectedObjectId) {
      updateObject(selectedObjectId, { rotation: value });
    }
  };

  const handlePaste = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const text = await navigator.clipboard.readText();
      setModelUrl(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handleClearObjects = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearObjects();
    setPosition({ x: 0, y: 0, z: -5 });
    setScale(2);
    setRotation(0);
  };

  const handleLoadSamplePanorama = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPanoramaUrl('https://raw.githubusercontent.com/willy1322/vr-panorama/main/spaceport5.jpg');
  };

  const toggleGyroscope = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!gyroscopeEnabled) {
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission !== 'granted') {
            throw new Error('Permission not granted');
          }
        }
      }
      setGyroscopeEnabled(!gyroscopeEnabled);
      useStore.setState({ gyroscopeEnabled: !gyroscopeEnabled });
    } catch (error) {
      console.error('Error accessing gyroscope:', error);
      alert('Gyroscope access denied or not available on this device');
    }
  };

  const showUrlInput = objectType === 'glb' || objectType === 'fbx' || objectType === 'panorama';
  const showTransformControls = objectType !== 'panorama';

  return (
    <>
      <div 
        className={`fixed top-16 right-5 z-50 ${isCollapsed ? 'pointer-events-none' : ''}`}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
          className="absolute -top-12 right-0 bg-blue-500 text-white px-5 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all hover:bg-blue-600 pointer-events-auto"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <span>{isCollapsed ? '◀ Controls' : '▼ Controls'}</span>
        </button>

        <div 
          className={`
            transition-all duration-300 origin-top-right
            ${isCollapsed 
              ? 'opacity-0 scale-95 bg-transparent backdrop-blur-none' 
              : 'opacity-100 scale-100 bg-black/90 backdrop-blur-md shadow-xl border border-white/10 rounded-2xl p-5 pointer-events-auto'
            }
            w-[280px]
          `}
          onTouchStart={(e) => !isCollapsed && e.stopPropagation()}
          onTouchMove={(e) => !isCollapsed && e.stopPropagation()}
          onTouchEnd={(e) => !isCollapsed && e.stopPropagation()}
          onMouseDown={(e) => !isCollapsed && e.stopPropagation()}
          onMouseMove={(e) => !isCollapsed && e.stopPropagation()}
          onMouseUp={(e) => !isCollapsed && e.stopPropagation()}
          onClick={(e) => !isCollapsed && e.stopPropagation()}
        >
          <button
            onClick={handleLoadSamplePanorama}
            className="w-full mb-4 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-lg px-4 py-2 hover:from-purple-600 hover:to-purple-800 transition-all"
          >
            Panorama Sample
          </button>

          <h3 className="text-xl font-bold text-white mb-4">Add 3D Object</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Object Type</label>
              <select
                value={objectType}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setObjectType(e.target.value as ObjectType);
                }}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700"
              >
                <option value="cube">Cube</option>
                <option value="sphere">Sphere</option>
                <option value="glb">GLB Model</option>
                <option value="fbx">FBX Model</option>
                <option value="panorama">360° Image</option>
              </select>
            </div>

            {showUrlInput && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  {objectType === 'panorama' ? '360° Image URL' : 'Model URL'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={modelUrl}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setModelUrl(e.target.value);
                    }}
                    placeholder={objectType === 'panorama' ? 'Enter image URL' : 'Enter model URL'}
                    className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 text-sm"
                  />
                  <button
                    onClick={handlePaste}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap"
                  >
                    Paste
                  </button>
                </div>
              </div>
            )}

            {showTransformControls && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Position</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <div key={axis}>
                        <label className="block text-xs text-gray-400 mb-1">{axis.toUpperCase()}</label>
                        <input
                          type="number"
                          value={position[axis]}
                          onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handlePositionChange(axis, parseFloat(e.target.value) || 0);
                          }}
                          className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700"
                          step="0.1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Scale</label>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={scale}
                    onChange={handleScaleChange}
                    className="w-full accent-blue-500"
                  />
                  <div className="text-center text-gray-300 text-sm mt-1">{scale.toFixed(1)}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Rotation (Y)</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={rotation}
                    onChange={handleRotationChange}
                    className="w-full accent-blue-500"
                  />
                  <div className="text-center text-gray-300 text-sm mt-1">{rotation}°</div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <button
                onClick={handleAddObject}
                className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg px-4 py-2 hover:from-green-600 hover:to-green-800 transition-all"
              >
                {objectType === 'panorama' ? 'Load 360° Image' : 'Add Object'}
              </button>
              {objectType !== 'panorama' && (
                <button
                  onClick={handleClearObjects}
                  className="w-full bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg px-4 py-2 hover:from-red-600 hover:to-red-800 transition-all"
                >
                  Clear All Objects
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div 
        className="fixed bottom-6 left-6 z-50 pointer-events-auto"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={toggleGyroscope}
          className={`p-4 rounded-full shadow-lg transition-all ${
            gyroscopeEnabled 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={gyroscopeEnabled ? 'Disable Gyroscope' : 'Enable Gyroscope'}
        >
          <Compass className={`w-6 h-6 text-white ${gyroscopeEnabled ? 'animate-pulse' : ''}`} />
        </button>
      </div>
    </>
  );
}