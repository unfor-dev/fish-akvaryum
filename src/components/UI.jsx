import { useFont, useGLTF } from "@react-three/drei";
import { atom, useAtom } from "jotai";

// Theme configuration
export const themeAtom = atom("underwater");

export const THEMES = {
  underwater: {
    key: "underwater",
    skyColor: "#0073df",
    sunColor: "#FE9E40",
    groundColor: "#affdff",
    title: "Underwater",
    subtitle: "World of Fish",
    models: ["Koi_04", "Koi_05", "Koi_06", "Koi_07"],
    dof: true,
  },
  space: {
    key: "space",
    skyColor: "#000000",
    sunColor: "#e1ae4e",
    groundColor: "#333333",
    title: "Space",
    subtitle: "World of FIsh",
    models: ["Koi_08"],
    dof: false,
  },
};

// Preload assets
Object.values(THEMES).forEach((theme) => {
  theme.models.forEach((model) => useGLTF.preload(`/models/${model}.glb`));
});
useFont.preload("/fonts/Poppins Black_Regular.json");

export const UI = () => {
  const [theme, setTheme] = useAtom(themeAtom);

  return (
    <div className="pointer-events-none select-none z-10 fixed inset-0 flex justify-center items-center flex-col">
      {/* Logo */}
      <a className="pointer-events-auto absolute top-10 left-10" href="#">
        <img className="w-20" src="/images/logo.jpg" alt="Logo" />
      </a>

      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(0,0,0,0.0)_70%,rgba(0,0,0,1)_170%)]" />

      {/* Theme selector */}
      <div className="absolute z-10 pointer-events-auto flex flex-col items-center justify-center bottom-0 w-screen p-10 gap-2">
        <p className="text-black/80">Boids of Fish</p>
        <div className="flex gap-2 items-center justify-center">
          {Object.values(THEMES).map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              className={`p-4 rounded-full border-2 border-white transition-all duration-500 bg-white min-w-36 hover:bg-opacity-100
                ${theme === t.key
                  ? "bg-opacity-70 text-black"
                  : "bg-opacity-20 border-opacity-70 text-black/80"
                }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};