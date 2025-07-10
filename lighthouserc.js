module.exports = {
  ci: {
    collect: {
      // Command to start your Next.js production server
      startServerCommand: 'npm run start',
      // URLs to test - including key pages for comprehensive testing
      url: [
        'http://localhost:3000',
      ],
      // Pattern to match in server output to know when it's ready
      startServerReadyPattern: 'Ready',
      // Number of runs for more reliable results
      numberOfRuns: 3,
      // Additional settings for consistent testing
      settings: {
        // Disable device emulation for consistent results
        emulatedFormFactor: 'desktop',
        // Use consistent throttling
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      // Strict assertions for 100% performance score
      assertions: {
        // Core Web Vitals and Performance Metrics
        'categories:performance': ['error', { minScore: 1.0 }], // 100% performance score required
        'categories:accessibility': ['error', { minScore: 0.95 }], // High accessibility standard
        'categories:best-practices': ['error', { minScore: 0.95 }], // Best practices compliance
        'categories:seo': ['error', { minScore: 0.95 }], // SEO optimization
        
        // Specific Core Web Vitals thresholds based on optimizations
        // 'metrics:largest-contentful-paint': ['error', { maxNumericValue: 1200 }], // LCP < 1.2s
        // 'metrics:first-contentful-paint': ['error', { maxNumericValue: 800 }], // FCP < 0.8s
        // 'metrics:speed-index': ['error', { maxNumericValue: 1000 }], // Speed Index < 1.0s
        // 'metrics:total-blocking-time': ['error', { maxNumericValue: 200 }], // TBT < 200ms
        // 'metrics:cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // CLS < 0.1
        
        // Server response time optimization
        // 'metrics:server-response-time': ['error', { maxNumericValue: 300 }], // TTFB < 300ms
        
        // Resource optimization assertions
        // 'metrics:interactive': ['error', { maxNumericValue: 2000 }], // TTI < 2.0s
        // 'metrics:first-meaningful-paint': ['error', { maxNumericValue: 1000 }], // FMP < 1.0s
      },
      // Performance budgets based on our optimizations
      budgets: [
        {
          // JavaScript bundle size limits
          resourceType: 'script',
          budget: 500, // 500KB total JS budget
        },
        {
          // Image optimization budget
          resourceType: 'image',
          budget: 1000, // 1MB total image budget
        },
        {
          // CSS budget
          resourceType: 'stylesheet',
          budget: 100, // 100KB CSS budget
        },
        {
          // Font budget
          resourceType: 'font',
          budget: 200, // 200KB font budget
        },
        {
          // Total resource budget
          resourceType: 'total',
          budget: 2000, // 2MB total resource budget
        },
        {
          // Network request limits
          resourceType: 'third-party',
          budget: 50, // Limit third-party requests
        },
      ],
    },
    upload: {
      // Enhanced reporting configuration
      target: 'temporary-public-storage',
      // Store reports for trend analysis
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
      // Include additional metadata
      extraHeaders: {
        'X-Build-Number': process.env.GITHUB_RUN_NUMBER || 'local',
        'X-Branch': process.env.GITHUB_REF_NAME || 'local',
      },
    },
    // Enhanced server configuration for reliability
    server: {
      // Increase timeout for build processes
      port: 9001,
      storage: {
        // Store build data for comparison
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci-data.db',
      },
    },
  },
};