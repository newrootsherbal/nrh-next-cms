module.exports = {
  ci: {
    collect: {
      // Command to start your Next.js production server
      startServerCommand: 'npm run start',
      // URL to test
      url: ['http://localhost:3000'],
      // Pattern to match in server output to know when it's ready
      startServerReadyPattern: 'ready on http://localhost:3000',
      // Optional: Number of runs for Lighthouse to perform on each URL
      // numberOfRuns: 3,
    },
    assert: {
      // Assertions for Lighthouse scores
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }], // Example: Performance score should be at least 0.9 (warning if not)
        'categories:accessibility': ['error', { minScore: 0.9 }], // Example: Accessibility score should be at least 0.9 (error if not)
        // You can add more assertions for 'best-practices', 'seo', 'pwa'
        // 'categories:best-practices': ['warn', { minScore: 0.9 }],
        // 'categories:seo': ['warn', { minScore: 0.9 }],
        // 'categories:pwa': ['warn', { minScore: 0.9 }], // If your app is a PWA
      },
    },
    upload: {
      // Configuration for uploading reports
      target: 'temporary-public-storage', // Default, uploads to a temporary public storage
      // If you have LHCI server setup, you can configure it here:
      // target: 'lhci',
      // serverBaseUrl: 'YOUR_LHCI_SERVER_URL',
      // token: 'YOUR_LHCI_SERVER_BUILD_TOKEN', // Stored as a secret
    },
  },
};