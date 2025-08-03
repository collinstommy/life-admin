import daisyui from "daisyui";
import { addDynamicIconSelectors } from "@iconify/tailwind";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui, addDynamicIconSelectors()],
  daisyui: {
    themes: ["light", "dark"],
  },
};
