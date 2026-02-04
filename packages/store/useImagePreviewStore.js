import { create } from 'zustand';

export const useImagePreviewStore = create((set) => ({
    isVisible: false,
    imageUrl: '',

    showImage: (imageUrl) => set({
        isVisible: true,
        imageUrl
    }),

    hideImage: () => set({
        isVisible: false,
        imageUrl: ''
    })
}));
