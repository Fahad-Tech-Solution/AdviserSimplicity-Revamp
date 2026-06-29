# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Key Highlights of Your Configuration Strategy

- Automated Subdirectory Support: Setting base: `/AdviserSimplicity-Revamp/` for GitHub Pages is crucial because GitHub serves your built files out of that project directory instead of the domain root.

- Nginx Routing: By hitting `/dev_api`, your frontend automatically forces Nginx on your server to transparently strip that prefix and send clean `/api` calls down into your development database runner.

- Router Adjustments: Moving between `HashRouter` and `BrowserRouter` prevents the dreaded 404 page-refresh issues inherent to standard client-side routing on shared static hosting providers like GitHub Pages.
