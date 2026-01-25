import {GET_ABOUT_DATA} from '../../graphql/mutations';

// 1. Define the Types for TypeScript
interface AuthorNode {
  title: string;
  content: string;
}

interface AboutData {
  mainAuthors: {
    nodes: AuthorNode[];
  };
  sidebarAuthors: {
    nodes: AuthorNode[];
  };
}



async function getAboutData(): Promise<AboutData | null> {
  const wpUrl = process.env.NEXT_PUBLIC_WP_GRAPHQL_URL;
  try {
    const res = await fetch(wpUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: GET_ABOUT_DATA }),
      next: { revalidate: 10 }
    });

    const json = await res.json();

    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return null;
    }

    return json.data;
  } catch (error) {
    console.error('Fetch Error:', error);
    return null;
  }
}

export default async function about() {
  const data = await getAboutData();

  // Extract nodes with type safety
  const mainAuthors: AuthorNode[] = data?.mainAuthors?.nodes || [];
  const sidebarAuthors: AuthorNode[] = data?.sidebarAuthors?.nodes || [];

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-20 py-8 lg:py-12">
      <div className="flex flex-col sm:grid sm:grid-cols-12 gap-10 lg:gap-16">

        {/* Main Content Area */}
        <div className="sm:col-span-8 flex flex-col order-1">
          {mainAuthors.length > 0 ? (
            mainAuthors.map((author: AuthorNode, index: number) => (
              <article key={index} className="prose prose-lg dark:prose-invert max-w-none mb-10">
                <div
                  className="entry-content"
                  dangerouslySetInnerHTML={{ __html: author.content }}
                />
              </article>
            ))
          ) : (
            <p>No main author content found.</p>
          )}
        </div>

        {/* Sidebar Area */}
        <aside className="sm:col-span-4 space-y-8 sm:space-y-10 order-2">
          {sidebarAuthors.length > 0 ? (
            sidebarAuthors.map((sidebar: AuthorNode, index: number) => (
              <div key={index} className="bg-secondary overflow-hidden rounded-xl border-[1px] border-primary/10">
                <div
                  className=""
                  dangerouslySetInnerHTML={{ __html: sidebar.content }}
                />
              </div>
            ))
          ) : (
            <p>No sidebar content found.</p>
          )}
        </aside>

      </div>
    </main>
  )
}