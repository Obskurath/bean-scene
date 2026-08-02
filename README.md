# Bean Scene

A modern, high-performance e-commerce web application for a specialty coffee shop, built with Astro SSR, Tailwind CSS, Supabase, and Stripe. 

Bean Scene delivers a seamless shopping experience with real-time cart state management, secure payment processing via Stripe Checkout, and robust backend event-driven order persistence through Stripe Webhooks.

---

## Key Features

* **Server-Side Rendering (SSR):** Powered by Astro for optimized speed and performance.
* **Reactive Shopping Cart:** Built using Nanostores for seamless, framework-agnostic state management.
* **Secure Stripe Checkout:** Integrated payment processing with custom session metadata passing.
* **Fault-Tolerant Webhooks:** A robust backend API endpoint (`/api/stripe-webhook`) featuring cryptographic signature validation and duplicate prevention to guarantee order persistence in Supabase.
* **Database Management:** Relational tables (`orders` and `order_items`) secured via Supabase Service Role.
* **Modern UI & Alerts:** Styled with Tailwind CSS and enhanced with SweetAlert2 interactive notifications.

---

## Tech Stack

* **Framework:** [Astro](https://astro.build/) (SSR Mode with Vercel Adapter)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Backend & Database:** [Supabase](https://supabase.com/)
* **Payments & Webhooks:** [Stripe API & Webhooks](https://stripe.com/)
* **State Management:** [Nanostores](https://github.com/nanostores/nanostores)
* **Notifications:** [SweetAlert2](https://sweetalert2.github.io/)
* **Runtime / Package Manager:** [Bun](https://bun.sh/)
* **Deployment:** [Vercel](https://vercel.com/)

---

## Project Structure

```text
bean-scene/
├── public/              # Static assets, icons, and images
├── src/
│   ├── components/      # Reusable UI components (Header, Footer, CartDrawer)
│   ├── layouts/         # Page layouts with conditional navigation
│   ├── pages/           # File-based routing & API endpoints
│   │   ├── api/         # Backend services (stripe-webhook.ts)
│   │   └── success.astro# Order success confirmation page
│   ├── store/           # Global cart state management (cartStore)
│   └── styles/          # Global styles and Tailwind configuration
├── astro.config.mjs     # Astro configuration & Vercel SSR adapter
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
