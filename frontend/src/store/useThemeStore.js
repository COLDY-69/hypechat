import { create } from 'zustand'

export const useThemeStore = create((set) => ({
    theme: localStorage.getItem('Hypechat-theme') || 'cupcake',
    setTheme: (theme) => {
        localStorage.setItem('Hypechat-theme', theme)
        set({ theme })
    },
}));