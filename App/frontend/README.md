# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## UI/UX Design System

This frontend has been polished for a more professional, consistent look:

- Typography: Inter font via Google Fonts (see `index.html`).
- Layout: A fixed, clean navbar and a unified page container (`Layout.jsx`).
- Colors: Neutral slate base with indigo accents; custom utility styles in `src/index.css`.
- Components: Simplified buttons and cards (`btn-primary`, `card`, `card-product`).

### Tweaking the Theme
- Change accent colors in `src/index.css` under CSS variables (e.g., `--primary`).
- Extend Tailwind in `tailwind.config.js` for project-specific scales.
- Page container sizing and spacing are managed in `components/Layout.jsx`.

### Running Locally
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```
