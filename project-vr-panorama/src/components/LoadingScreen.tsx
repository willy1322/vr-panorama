import { useProgress } from '@react-three/drei';
import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const { progress, active } = useProgress();
  const [opacity, setOpacity] = useState(1);
  
  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => {
        setOpacity(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  if (!active && opacity === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-500"
      style={{ opacity }}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="text-2xl font-bold text-white mb-4">
          Loading Experience...
        </div>
        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-white text-sm font-medium">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}