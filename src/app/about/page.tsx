import React from 'react'

const GET_ABOUT_DATA = `
  query GetAboutPageData {
    mainAuthors {
      nodes {
        title
        content
      }
    }
    sidebarAuthors(where: { orderby: { field: DATE, order: ASC } }) {
      nodes {
        title
        content
      }
    }
  }
`;

async function getAboutData() {
  try {
    const res = await fetch('https://vanturalog.najubudeen.info/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: GET_ABOUT_DATA }),
      next: { revalidate: 10 } // Reduced revalidate for easier testing
    });

    const json = await res.json();
    
    // Check for GraphQL errors
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
  
  // Debugging: This will show up in your VS Code terminal (not browser console)
  console.log('Fetched Data:', data);

  const mainAuthors = data?.mainAuthors?.nodes || [];
  const sidebarAuthors = data?.sidebarAuthors?.nodes || [];

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-20 py-8 lg:py-12">
      <div className="flex flex-col sm:grid sm:grid-cols-12 gap-10 lg:gap-16">
        
        {/* Main Content Area */}
        <div className="sm:col-span-8 flex flex-col order-1">
          {mainAuthors.length > 0 ? (
            mainAuthors.map((author, index) => (
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
            sidebarAuthors.map((sidebar, index) => (
              <div key={index} className="bg-secondary overflow-hidden rounded-xl border-[1px] border-primary/10">
                <div 
                  className="text-sm sm:text-base leading-relaxed"
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