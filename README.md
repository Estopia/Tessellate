# Tessellate

A private, responsive, fully client-side image grid arranger for the browser.

Tessellate helps you upload a batch of images and arrange them into dynamic grids for preview and export. Everything runs in your browser: there is no backend, and images never leave your device. Files are read with the HTML5 File API and represented as in-browser blob object URLs.

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Layout Modes](#layout-modes)
- [Project Structure](#project-structure)
- [Docker & Deployment](#docker--deployment)
- [Privacy](#privacy)
- [Contributing](#contributing)
- [License](#license)

## Features

- Drag-and-drop multi-image upload powered by the HTML5 File API.
- Dynamic Fit layout with justified rows and a preserve-aspect-ratio or crop-to-fill toggle.
- Fixed Scale uniform grids with 1:1, 4:3, 3:2, 16:9, 3:4, and 2:3 aspect ratios.
- Masonry layout with balanced columns.
- Gap slider for spacing control.
- Zoom/density control via slider, Ctrl/Cmd + mouse wheel, and pinch gestures.
- Drag-to-reorder, remove individual images, and clear all images.
- Lightbox preview.
- Export the composed grid as a single PNG/JPG.
- Download individual cropped images.
- Settings persist in localStorage; uploaded images are not persisted across reloads.

## Screenshots

Screenshots are not committed yet. When adding them, capture the upload flow, each layout mode, lightbox preview, and export controls, then reference the images from this section.

## Tech Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS v4
- lucide-react
- @dnd-kit
- Vitest for pure layout algorithm unit tests
- pnpm 10

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+

### Install

```bash
pnpm install
```

### Run the development server

```bash
pnpm dev
```

The Vite dev server binds to `0.0.0.0` on port `5173`, so devices on the same local network can open the app for real-device testing, for example:

```text
http://192.168.0.<your-host>:5173
```

## Available Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the Vite development server on port 5173 with LAN access. |
| `pnpm build` | Create a production build. |
| `pnpm preview` | Preview the production build on port 4173 with LAN access. |
| `pnpm lint` | Run ESLint checks. |
| `pnpm lint:fix` | Run ESLint and apply safe fixes. |
| `pnpm typecheck` | Run TypeScript type checking. |
| `pnpm test` | Run Vitest unit tests. |
| `pnpm test:watch` | Run Vitest in watch mode. |
| `pnpm format` | Format files with Prettier. |
| `pnpm format:check` | Check formatting with Prettier. |

## Layout Modes

- **Dynamic Fit**: builds justified rows that adapt to available width. Preserve mode keeps each image's aspect ratio; crop-to-fill mode crops images so rows sit flush.
- **Fixed Scale**: creates a uniform grid using the selected aspect ratio: 1:1, 4:3, 3:2, 16:9, 3:4, or 2:3.
- **Masonry**: distributes images into balanced columns for a staggered gallery.
- **Gap**: adjusts spacing between images.
- **Zoom/density**: makes the grid show more smaller images or fewer larger images via slider, Ctrl/Cmd + mouse wheel, or pinch.

## Project Structure

```text
.
├── src
│   ├── components
│   │   └── ui              # Shared UI primitives and app components
│   ├── hooks               # Reusable React hooks
│   ├── lib
│   │   ├── image           # Canvas crop, compose, and download utilities
│   │   └── layout          # Pure, unit-tested grid algorithms
│   │       ├── justified   # Dynamic Fit layout logic
│   │       ├── fixedScale  # Fixed Scale layout logic
│   │       ├── masonry     # Masonry layout logic
│   │       └── tests       # Vitest coverage for layout algorithms
│   └── state               # Settings context and localStorage persistence
├── Dockerfile              # Multi-stage static build served by nginx
├── docker-compose.yml      # Docker Compose deployment entry point
└── nginx.conf              # Static file server configuration
```

## Docker & Deployment

Tessellate ships as static files served by nginx. Build and run the Docker deployment with:

```bash
docker compose up -d --build
```

The published port is configurable with `TESSELLATE_PORT` and defaults to `8080`.

The container is designed to sit behind an external NGINX or Traefik reverse proxy. The maintainer runs Docker on a remote host, so deployment assumes a static frontend container rather than an application backend.

## Privacy

- Tessellate is 100% client-side.
- There is no backend upload endpoint; images never leave the browser.
- The production server is nginx serving static files only.
- Nothing is stored server-side.
- Settings are stored in localStorage.
- Uploaded images are represented as blob object URLs and are not persisted across reloads.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, checks, and project conventions.

## License

Tessellate is released under the [MIT License](LICENSE).