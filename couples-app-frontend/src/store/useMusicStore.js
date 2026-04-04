import { create } from 'zustand';
import { createAudioPlayer } from 'expo-audio';

const useMusicStore = create((set, get) => ({
    player: null,
    isPlaying: false,
    currentTrack: null,
    position: 0,
    duration: 0,
    isBuffering: false,
    isLoaded: false,
    isLoading: false,

    setPlayer: (player) => set({ player }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setCurrentTrack: (track) => set({ currentTrack: track }),
    setPosition: (pos) => set({ position: pos }),
    setDuration: (dur) => set({ duration: dur }),

    playTrack: async (track) => {
        const { player, isLoading } = get();

        if (isLoading) return;
        set({ isLoading: true });

        try {
            if (player) {
                player.release();
            }

            set({
                position: 0,
                duration: 0,
                isPlaying: false,
                isLoaded: false,
                isBuffering: false
            });

            // 🔥 createAudioPlayer in SDK 54
            const newPlayer = createAudioPlayer(track.url);
            
            // 🔥 Setup Listeners
            newPlayer.addListener('playbackStatusUpdate', (status) => {
                set({
                    position: (newPlayer.currentTime || 0) * 1000,
                    duration: (newPlayer.duration || 0) * 1000,
                    isPlaying: newPlayer.isPlaying,
                    isBuffering: newPlayer.isBuffering,
                    isLoaded: newPlayer.isLoaded
                });

                // 🔥 Track finished
                if (newPlayer.currentTime >= newPlayer.duration && newPlayer.duration > 0) {
                    set({
                        isPlaying: false,
                        position: 0
                    });
                }
            });

            newPlayer.play();

            set({
                player: newPlayer,
                currentTrack: track,
                isPlaying: true,
                isLoaded: true
            });

        } catch (error) {
            console.log('Error playing track:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    play: async () => {
        const { player } = get();
        if (!player) return;

        try {
            player.play();
            set({ isPlaying: true });
        } catch (e) {
            console.log("Play error:", e);
        }
    },

    pause: async () => {
        const { player } = get();
        if (!player) return;

        try {
            player.pause();
            set({ isPlaying: false });
        } catch (e) {
            console.log("Pause error:", e);
        }
    },

    togglePlayPause: async () => {
        const { isPlaying } = get();
        if (isPlaying) {
            await get().pause();
        } else {
            await get().play();
        }
    },

    seekTo: async (millis) => {
        const { player } = get();
        if (!player) return;

        try {
            player.seekTo(millis / 1000);
            set({ position: millis });
        } catch (e) {
            console.log("Seek error:", e);
        }
    },

    stop: async () => {
        const { player } = get();
        if (player) {
            player.pause();
            player.release();
        }

        set({
            player: null,
            isPlaying: false,
            currentTrack: null,
            isLoaded: false,
            position: 0,
            duration: 0,
            isBuffering: false
        });
    },

    cleanup: async () => {
        get().stop();
    }
}));

export default useMusicStore;