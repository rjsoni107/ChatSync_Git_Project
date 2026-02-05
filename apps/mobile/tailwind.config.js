/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: "#2563eb",
                secondary: "#3b82f6",
                background: "#0f172a",
                surface: "#1e293b",
                accent: {
                    light: "#60a5fa",
                    dark: "#1d4ed8"
                }
            }
        },
    },
    plugins: [],
}
