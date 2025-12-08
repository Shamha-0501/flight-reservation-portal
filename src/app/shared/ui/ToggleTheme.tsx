import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ToggleTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Load system preference
  useEffect(() => {
    setMounted(true);

    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      // system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setTheme(prefersDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  // Avoid rendering until we've mounted and theme is synced
  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`hidden md:block p-2 rounded-lg transition-colors duration-200 ${
        theme === "dark"
          ? "text-grayscale-600 hover:bg-grayscale-100"
          : "text-yellow-400 hover:bg-grayscale-800"
      }`}
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Sun /> : <Moon />}
    </button>
  );
}
