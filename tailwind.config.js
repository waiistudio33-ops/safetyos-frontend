/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Prompt', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('daisyui'), // 👈 เพิ่มบรรทัดนี้ครับ
  ],
  // (Optional) ตั้งค่า Theme ของ daisyUI ได้ตรงนี้
  daisyui: {
    themes: ["light", "dark", "cupcake", "corporate"], // เลือกธีมที่ชอบได้เลย
  },
}