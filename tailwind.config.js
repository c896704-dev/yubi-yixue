/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 古籍五色（对齐 design-showcase）
        'xuan-zhi': '#fbfaf5',
        'xuan-zhi-dark': '#f4f1e8',
        'dai-qing': '#004d4d',
        'dai-qing-light': '#006666',
        'dai-qing-dark': '#003333',
        'hu-po-jin': '#d4af37',
        'hu-po-jin-light': '#e8c84a',
        'hu-po-jin-dark': '#b8960f',
        'zhu-sha': '#9c3d54',
        'cang-cui': '#2d6a4f',
        // 旧令牌保留（兼容渐进清理；新组件一律使用命名色）
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        border: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        system: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Songti SC"', '"SimSun"', 'serif'],
        mono: ['ui-monospace', '"SF Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 51, 51, 0.06)',
        'card-hover': '0 12px 32px rgba(0, 51, 51, 0.12), 0 2px 8px rgba(0, 51, 51, 0.06)',
      },
    },
  },
  plugins: [],
}
