
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1D4ED8",
          dark: "#1E40AF",
          light: "#60A5FA",
        },
        teal: {
          DEFAULT: "#60A5FA",
          dark: "#3B82F6",
          light: "#93C5FD",
        },
        emergency: {
          DEFAULT: "#D94841",
          dark: "#B83933",
          light: "#E36A64",
        },
        relief: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          amber: "#F2A93B",
          green: "#25845B",
        },
      },
    },
  },
  plugins: [],
};

export default config;
