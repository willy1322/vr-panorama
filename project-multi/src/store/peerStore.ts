import { create } from 'zustand';
import Peer, { DataConnection, MediaConnection } from 'peerjs';

interface PeerState {
  peer: Peer | null;
  connections: Set<DataConnection>;
  audioConnections: Map<string, MediaConnection>;
  localStream: MediaStream | null;
  error: string | null;
  initializePeer: () => void;
  initializeAudio: () => Promise<void>;
  addConnection: (connection: DataConnection) => void;
  removeConnection: (connection: DataConnection) => void;
  setError: (error: string | null) => void;
}

const PEER_CONFIG = {
  debug: 2,
  config: {
    iceServers: [
      { 
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302',
          'stun:stun4.l.google.com:19302'
        ]
      },
      {
        urls: 'turn:numb.viagenie.ca',
        username: 'webrtc@live.com',
        credential: 'muazkh'
      }
    ],
    iceCandidatePoolSize: 10
  }
};

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;

export const usePeerStore = create<PeerState>((set, get) => ({
  peer: null,
  connections: new Set(),
  audioConnections: new Map(),
  localStream: null,
  error: null,
  
  initializeAudio: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      set({ localStream: stream });

      const { peer, connections } = get();
      if (peer && stream) {
        connections.forEach(conn => {
          const call = peer.call(conn.peer, stream);
          setupAudioConnection(call);
          get().audioConnections.set(conn.peer, call);
        });
      }
    } catch (error) {
      console.error('Failed to get microphone access:', error);
      set({ error: 'Failed to access microphone' });
    }
  },

  initializePeer: () => {
    try {
      const currentPeer = get().peer;
      if (currentPeer) {
        currentPeer.destroy();
      }

      const peer = new Peer(PEER_CONFIG);

      peer.on('open', (id) => {
        console.log('Connected with ID:', id);
        set({ error: null });
        reconnectAttempts = 0;
      });

      peer.on('error', (error) => {
        console.error('PeerJS error:', error);
        
        if (error.type === 'disconnected') {
          peer.reconnect();
        } else if (error.type === 'network' || error.type === 'server-error') {
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            setTimeout(() => {
              console.log(`Reconnection attempt ${reconnectAttempts}...`);
              get().initializePeer();
            }, RECONNECT_DELAY * reconnectAttempts);
          } else {
            set({ error: 'Failed to connect after multiple attempts. Please try again later.' });
          }
        }
      });

      peer.on('connection', (connection) => {
        setupConnection(connection);
        get().addConnection(connection);
      });

      peer.on('call', (call) => {
        const { localStream } = get();
        if (localStream) {
          call.answer(localStream);
          setupAudioConnection(call);
          get().audioConnections.set(call.peer, call);
        }
      });

      peer.on('disconnected', () => {
        console.log('Disconnected, attempting to reconnect...');
        peer.reconnect();
      });

      set({ peer });
    } catch (error) {
      console.error('Failed to initialize peer:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to initialize peer' });
    }
  },

  addConnection: (connection: DataConnection) => {
    setupConnection(connection);
    set((state) => ({
      connections: new Set([...state.connections, connection])
    }));

    const { peer, localStream } = get();
    if (peer && localStream) {
      const call = peer.call(connection.peer, localStream);
      setupAudioConnection(call);
      get().audioConnections.set(connection.peer, call);
    }
  },

  removeConnection: (connection: DataConnection) => {
    const audioConnection = get().audioConnections.get(connection.peer);
    if (audioConnection) {
      audioConnection.close();
      get().audioConnections.delete(connection.peer);
    }
    
    set((state) => ({
      connections: new Set([...state.connections].filter(conn => conn !== connection))
    }));
  },

  setError: (error: string | null) => set({ error })
}));

function setupAudioConnection(call: MediaConnection) {
  call.on('stream', (remoteStream) => {
    const audio = new Audio();
    audio.srcObject = remoteStream;
    audio.play().catch(console.error);
  });

  call.on('error', (error) => {
    console.error('Audio connection error:', error);
  });
}

function setupConnection(connection: DataConnection) {
  connection.on('open', () => {
    console.log('Connection established with:', connection.peer);
    
    connection.on('data', (data) => {
      if (data.type === 'position') {
        // Position updates handled by RemoteUser component
      }
    });

    connection.on('error', (error) => {
      console.error('Connection error:', error);
      usePeerStore.getState().removeConnection(connection);
    });

    connection.on('close', () => {
      console.log('Connection closed with:', connection.peer);
      usePeerStore.getState().removeConnection(connection);
    });
  });
}