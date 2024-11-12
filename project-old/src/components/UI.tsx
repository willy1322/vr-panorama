import { useState, useEffect } from 'react';
import { useStore, ObjectType } from '../store';

export function UI() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0, z: -3 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [objectType, setObjectType] = useState<ObjectType>('cube');
  const [modelUrl, setModelUrl] = useState('');
  
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

  const handleAddObject = () => {
    if ((objectType === 'glb' || objectType === 'fbx' || objectType === 'panorama') && !modelUrl) {
      alert('Please enter a URL');
      return;
    }

    if (objectType === 'panorama') {
      setPanoramaUrl(modelUrl);
      setModelUrl('');
      return;
    }

    addObject({
      id: crypto.randomUUID(),
      type: objectType,
      position: [position.x, position.y, position.z],
      rotation,
      scale,
      ...(objectType === 'glb' || objectType === 'fbx' ? { url: modelUrl } : {})
    });
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

  const handleScaleChange = (value: number) => {
    setScale(value);
    if (selectedObjectId) {
      updateObject(selectedObjectId, { scale: value });
    }
  };

  const handleRotationChange = (value: number) => {
    setRotation(value);
    if (selectedObjectId) {
      updateObject(selectedObjectId, { rotation: value });
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setModelUrl(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const showUrlInput = objectType === 'glb' || objectType === 'fbx' || objectType === 'panorama';
  const showTransformControls = objectType !== 'panorama';

  return (
    <div className="fixed top-16 right-5 z-50">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -top-12 right-0 bg-blue-500 text-white px-5 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all hover:bg-blue-600"
      >
        <span>{isCollapsed ? '◀ Controls' : '▼ Controls'}</span>
      </button>

      <div 
        className={`
          transition-all duration-300 origin-top-right
          ${isCollapsed 
            ? 'opacity-0 pointer-events-none scale-95 bg-transparent backdrop-blur-none' 
            : 'opacity-100 scale-100 bg-black/90 backdrop-blur-md shadow-xl border border-white/10 rounded-2xl p-5'
          }
          w-[280px]
        `}
      >
        <h3 className="text-xl font-bold text-white mb-4">Add 3D Object</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Object Type</label>
            <select
              value={objectType}
              onChange={(e) => setObjectType(e.target.value as ObjectType)}
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
                  onChange={(e) => setModelUrl(e.target.value)}
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
                        onChange={(e) => handlePositionChange(axis, parseFloat(e.target.value) || 0)}
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
                  max="5"
                  step="0.1"
                  value={scale}
                  onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
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
                  onChange={(e) => handleRotationChange(parseInt(e.target.value))}
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
            {!showUrlInput && (
              <button
                onClick={clearObjects}
                className="w-full bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg px-4 py-2 hover:from-red-600 hover:to-red-800 transition-all"
              >
                Clear All Objects
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}