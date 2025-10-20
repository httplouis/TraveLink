/** @type {import('tailwindcss').Config} */
module.exports = {

  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        tl: {
          maroon: "#6A0E17",
          maroonSoft: "#7F1720",
          bg: "#F7F7F8",
          card: "#FFFFFF",
          line: "#E5E7EB",
          gray1: "#111827",
        },
      },
      boxShadow: { soft: "0 6px 18px rgba(17,24,39,.06)" },
    },
  },
  plugins: [],
};
