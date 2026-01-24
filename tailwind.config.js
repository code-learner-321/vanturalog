/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        secondary: "#F5F5F5",
        "accent-100": "#ffa500",
      },
      // --- FIX STARTS HERE ---
      typography: ({ theme }) => ({ // Ensure 'theme' is inside the parenthesis here
        DEFAULT: {
          css: {
            // Using a hex code directly is safer if theme() keeps failing
            '--tw-prose-hr': '#0000001a',
            hr: {
              borderTopWidth: '1px',
              marginTop: '2rem',
              marginBottom: '2rem',
            },
            '.wp-block-separator': {
              opacity: 1,
              border: 'none',
              borderTop: '1px solid currentColor',
              width: '100px',
              margin: '2rem auto',
            },
            '.wp-block-separator.is-style-wide': {
              width: '100%',
            },
            '.wp-block-separator.is-style-dots': {
              border: 'none',
              height: 'auto',
              lineHeight: '1',
              '&::before': {
                content: '"···"',
                fontSize: '2rem',
                letterSpacing: '0.5em',
              },
            },
            '[class*="has-"]:not(.has-background)': {
              color: 'inherit',
            },
            '[class*="has-background"]': {
              backgroundColor: 'inherit', // Let the CSS class handle it
            },
            // This ensures text inside a background-colored block 
            // is readable if Gutenberg sets it to a specific color
            '[class*="has-background"] p': {
              color: 'inherit',
            },
            '[class*="font-weight"]': {
              fontWeight: 'inherit !important',
            },
            'p[class*="font-weight"], h1[class*="font-weight"], h2[class*="font-weight"], h3[class*="font-weight"], span[class*="font-weight"]': {
              fontWeight: 'inherit !important',
            },
          },
        },
      }),
      // --- FIX ENDS HERE ---
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
  ],
  // safelist: [
  //   { pattern: /has-(.*)-color/ },
  //   { pattern: /has-(.*)-background-color/ },
  // ],
}