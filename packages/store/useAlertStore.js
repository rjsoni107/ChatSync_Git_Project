import { create } from 'zustand';

export const useAlertStore = create((set) => ({
    isVisible: false,
    title: '',
    message: '',
    buttons: [],

    showAlert: (title, message, buttons = []) => set({
        isVisible: true,
        title,
        message,
        buttons
    }),

    hideAlert: () => set({
        isVisible: false,
        title: '',
        message: '',
        buttons: []
    })
}));
