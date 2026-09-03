# ReadyCommerce CMS

ReadyCommerce CMS is a premium, self-hosted commerce platform tailored for lifestyle businesses (Perfume, Cosmetics, Boutiques).

## Architecture

This project uses a Monorepo architecture managed via npm workspaces. 

- **Frontend (Storefront & Dashboard):** Next.js with App Router, Tailwind CSS, and TypeScript.
- **Backend (API Engine):** Node.js, Express, and MongoDB.

## Setup Instructions

1. Clone the repository.
2. Run `npm install` in the root directory to install all dependencies across the workspaces.
3. Add a `.env` file in the root based on `.env.example` (if applicable).
4. Run the frontend or backend servers using the workspace scripts (e.g., `npm run dev -w storefront`).
