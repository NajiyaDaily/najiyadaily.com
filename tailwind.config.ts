import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy:   "#052962",
        navy2:  "#041f4a",
        gold:   "#d4af37",
        cream:  "#faf9f5",
        paper:  "#f5f4f0",
        teal:   "#008080",
        nd: {
          ink:    "#121212",
          ink2:   "#333333",
          muted:  "#707070",
          light:  "#999999",
          border: "#dcdcdc",
          border2:"#ededed",
        }
      },
      fontFamily: {
        serif:    ["'Playfair Display'", "Georgia", "serif"],
        body:     ["'Source Serif 4'", "Georgia", "serif"],
        sans:     ["'Inter'", "system-ui", "sans-serif"],
      },
      maxWidth: { content: "1300px" },
    },
  },
  plugins: [],
};
export default config;
// Already defined above - adding animation keyframes via CSS
