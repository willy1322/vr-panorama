import { useState, useEffect } from 'react';
import { Box, Users, AlertCircle, Mic, MicOff, Copy } from 'lucide-react';
import { usePeerStore } from '../store/peerStore';

export function UI() {
  const [showConnect, setShowConnect] = useState(false);
  const [peerIdInput, setPeerIdInput] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const { peer, connections, error, initializePeer, initializeAudio } = usePeerStore();

  useEffect(() => {
    initializePeer();
  }, []);

  const connectToPeer = async () => {
    if (!peer || !peerIdInput.trim()) return;
    
    try {
      const conn = peer.connect(peerIdInput.trim());
      usePeerStore.getState().addConnection(conn);
      setPeerIdInput('');
      setShowConnect(false);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const toggleAudio = async () => {
    if (!audioEnabled) {
      await initializeAudio();
    }
    setAudioEnabled(!audioEnabled);
  };

  return (
    <div className="fixed top-4 right-4 w-80 space-y-2 z-50">
      <div className="bg-black/80 backdrop-blur-xl rounded-lg p-4 shadow-xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-semibold flex items-center gap-2">
            <Box className="w-5 h-5" />
            WebXR Multiplayer
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
              {connections.size} connected
            </span>
          </h2>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-200 rounded p-3 text-sm mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {peer ? (
          <div className="space-y-4">
            <div className="bg-white/5 rounded p-3">
              <div className="text-sm text-white/80">Your Peer ID:</div>
              <div className="flex items-center gap-2 bg-black/30 p-2 rounded mt-1">
                <code className="font-mono text-sm flex-1 overflow-x-auto text-white">
                  {peer.id}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(peer.id)}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-xs transition flex items-center gap-1 text-white"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
            </div>

            {showConnect ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={peerIdInput}
                  onChange={(e) => setPeerIdInput(e.target.value)}
                  placeholder="Enter peer ID to connect"
                  className="w-full px-3 py-2 bg-black/30 rounded border border-white/10 text-white text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={connectToPeer}
                    className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm transition text-white"
                  >
                    Connect
                  </button>
                  <button
                    onClick={() => setShowConnect(false)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-sm transition text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConnect(true)}
                className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm transition text-white flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                Connect to Peer
              </button>
            )}

            <button
              onClick={toggleAudio}
              className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-sm transition text-white flex items-center justify-center gap-2"
            >
              {audioEnabled ? (
                <>
                  <Mic className="w-4 h-4" />
                  Mute Audio
                </>
              ) : (
                <>
                  <MicOff className="w-4 h-4" />
                  Enable Audio
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-yellow-500/20 text-yellow-200 rounded p-3 text-sm">
            Connecting to peer network...
          </div>
        )}
      </div>
    </div>
  );
}