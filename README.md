# rello

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

### Required site configuration

Every environment must set both values:

```text
RELLO_SITE_ENVIRONMENT=local|staging|production
NEXT_PUBLIC_SITE_URL=https://the-public-origin.example
```

- Local development uses `local` and `http://localhost:3000`.
- Staging uses `staging` and its public HTTPS origin. Staging responses include `X-Robots-Tag: noindex, nofollow`, its robots file blocks all crawlers, and its sitemap is empty.
- Production uses `production` and exactly `https://www.rello.online`. The build fails when another production origin is configured.
- Keep the hosting-level permanent redirect from `https://rello.online` to `https://www.rello.online`.

### Search release checklist

- Confirm `https://www.rello.online/robots.txt` and `/sitemap.xml` return successful responses.
- Confirm staging source and response headers contain no-index directives.
- Verify the `rello.online` domain property in Google Search Console and Bing Webmaster Tools.
- Submit `https://www.rello.online/sitemap.xml` after production deployment.
- Inspect the homepage, Browse, one city, one property, and one public host URL before requesting indexing.
- Validate the deployed structured data with Google Rich Results Test and Schema.org Validator.
