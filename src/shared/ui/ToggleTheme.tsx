"use client";
import { Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

const STORAGE_KEY = 'theme';
const DEFAULT_THEME = 'light';

const applyTheme = (theme: string) => {
    document.documentElement.dataset.theme = theme;
}

export const ToggleTheme = () => {
    const [theme, setTheme] = useState<string>(DEFAULT_THEME);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
        setTheme(saved);
        applyTheme(saved);
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, theme);
        applyTheme(theme)
    }, [theme]);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                setTheme(e.newValue);
                applyTheme(e.newValue);
            }
        }
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

    return (
        <button
            type='button'
            onClick={toggle}
            aria-label="Toggle theme"
            title={`Theme: ${theme}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-fg transition hover:bg-muted"
        >
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
    );
}
