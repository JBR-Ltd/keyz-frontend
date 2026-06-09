# keyz

A small Next.js (App Router) marketing/landing site scaffolded with `create-next-app` and using a component-based layout in `src/components`.

## Tech stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS (postcss)
- Framer Motion, Radix UI, lucide-react
- Zod, react-hook-form

Dependencies are defined in [package.json](package.json).

## Quick start

Install and run the development server (this repo uses pnpm but npm/yarn also work):

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 in your browser.

Available scripts (in `package.json`):

- `dev`: Run the Next.js development server (`next dev`)
- `build`: Build for production (`next build`)
- `start`: Start the production server (`next start`)
- `lint`: Run ESLint (`eslint`)

You can run lint autofixes with:

```bash
pnpm run lint -- --fix
```

## Project layout

- `src/app` — application routes and root layout
- `src/components` — React UI components (Hero, Navbar, Footer, etc.)
- `src/components/ui` — shared UI primitives
- `src/lib/utils.ts` — utility functions
- `public/images` — static images
- `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`

Look at the main entry at [src/app/page.tsx](src/app/page.tsx) and the component library in [src/components](src/components).

## Development notes

- Edit pages under `src/app` and components under `src/components`. Hot reload updates the browser automatically.
- This project expects modern Node.js and a package manager that supports the lockfile (pnpm recommended).

## Deployment

Deploy to Vercel or any platform that supports Next.js. See Next.js docs for deployment options: https://nextjs.org/docs/app/building-your-application/deploying

---

If you'd like, I can also:

- add a short CONTRIBUTING section
- add a `README` badge for CI or Vercel
- include basic environment variable examples
  Tell me which you'd like next.
