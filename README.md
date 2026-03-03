## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# Headless WordPress with Next.js & GraphQL

## 🚀 The Challenge
Standard WordPress themes often struggle with Core Web Vitals and rigid UI structures. This project required a highly dynamic frontend with sub-second page loads while maintaining the ease of content management for the end-user.

## 🛠️ The Solution (Architectural Overview)
I decoupled the backend from the frontend to create a secure, scalable architecture:
- **Backend:** WordPress served as a Headless CMS.
- **API Layer:** Used **WPGraphQL** to fetch only the specific data needed, reducing payload size.
- **Frontend:** **Next.js** for Static Site Generation (SSG) and Incremental Static Regeneration (ISR) to ensure lightning-fast performance.
- **Styling:** **Tailwind CSS** for a utility-first, responsive design.

## 💡 Key Features & Problem Solving
- **Custom Preview Mode:** Implemented a bridge between Next.js and WordPress so editors can preview drafts.
- **On-Page SEO:** Integrated Yoast SEO data into the GraphQL schema to automate Meta tags and Schema Markup.
- **Performance:** Achieved 95+ Mobile PageSpeed scores via image optimization and code splitting.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
