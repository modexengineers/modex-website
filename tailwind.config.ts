import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        modex: {
          purple: "#5E3DC0",
          lilac: "#7F88F7",
          ink: "#14003F",
          paper: "#F6F4EF",
        },
      },
    },
  },
  plugins: [],
};

export default config;
