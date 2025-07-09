# Lighthouse CI Configuration - Performance Monitoring

## Overview

This document describes the enhanced Lighthouse CI configuration that enforces strict performance requirements and ensures a **100% performance score**. The configuration has been optimized based on implemented performance optimizations including hero image optimization, TipTap bundle optimization, and server response time improvements.

## Configuration Files

### 1. [`lighthouserc.js`](../lighthouserc.js) - Main Configuration

The main Lighthouse CI configuration file with the following key features:

#### Performance Requirements
- **Performance Score**: 100% (1.0) - **STRICT REQUIREMENT**
- **Accessibility Score**: 95% minimum
- **Best Practices Score**: 95% minimum
- **SEO Score**: 95% minimum

#### Core Web Vitals Thresholds
Based on our performance optimizations:

| Metric | Threshold | Previous | Improvement |
|--------|-----------|----------|-------------|
| **LCP** (Largest Contentful Paint) | < 1,200ms | ~3,050ms | ~1,850ms faster |
| **TTFB** (Time to First Byte) | < 300ms | ~602ms | ~302ms faster |
| **Speed Index** | < 1,000ms | N/A | New target |
| **Total Blocking Time** | < 200ms | N/A | New target |
| **Cumulative Layout Shift** | < 0.1 | N/A | New target |
| **Time to Interactive** | < 2,000ms | N/A | New target |
| **First Meaningful Paint** | < 1,000ms | N/A | New target |

#### Performance Budgets
Resource limits to maintain optimal performance:

| Resource Type | Budget | Purpose |
|---------------|--------|---------|
| **JavaScript** | 500KB | TipTap bundle optimization |
| **Images** | 1MB | Hero image optimization |
| **CSS** | 100KB | Stylesheet optimization |
| **Fonts** | 200KB | Font loading optimization |
| **Total Resources** | 2MB | Overall resource limit |
| **Third-party** | 50 requests | External dependency limit |

### 2. [`.github/workflows/lighthouse-ci.yml`](../.github/workflows/lighthouse-ci.yml) - CI/CD Integration

Enhanced GitHub Actions workflow with:

#### Key Features
- **Fixed environment variables** (corrected secret references)
- **Performance monitoring** with detailed reporting
- **Build caching** for faster CI runs
- **Artifact storage** for performance reports
- **Regression detection** for pull requests
- **Manual workflow dispatch** for ad-hoc testing

#### Workflow Triggers
- Push to `master` or `main` branches
- Pull requests targeting `master` or `main`
- Manual dispatch with custom URL testing

## Performance Targets

### Expected Results
Based on implemented optimizations, the configuration enforces these targets:

1. **Hero Image Optimization**: 1,500-2,200ms LCP reduction
2. **TipTap Bundle Optimization**: 200-500KB bundle size reduction
3. **Server Response Optimization**: 300-400ms TTFB reduction

### Cumulative Impact
- **Total LCP Improvement**: ~60% faster (3,050ms → 1,200ms)
- **TTFB Improvement**: ~50% faster (602ms → 300ms)
- **Bundle Size Reduction**: Up to 500KB smaller
- **Overall Performance**: 100% Lighthouse score

## Configuration Details

### Collection Settings
```javascript
collect: {
  startServerCommand: 'npm run start',
  url: [
    'http://localhost:3000',      // Homepage
    'http://localhost:3000/blog', // Blog page
  ],
  numberOfRuns: 3, // Multiple runs for reliability
  settings: {
    emulatedFormFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
    },
  },
}
```

### Assertion Configuration
```javascript
assertions: {
  // 100% performance score requirement
  'categories:performance': ['error', { minScore: 1.0 }],
  
  // Core Web Vitals
  'metrics:largest-contentful-paint': ['error', { maxNumericValue: 1200 }],
  'metrics:server-response-time': ['error', { maxNumericValue: 300 }],
  'metrics:speed-index': ['error', { maxNumericValue: 1000 }],
  'metrics:total-blocking-time': ['error', { maxNumericValue: 200 }],
}
```

### Budget Configuration
```javascript
budgets: [
  {
    resourceType: 'script',
    budget: 500, // 500KB JavaScript budget
  },
  {
    resourceType: 'image',
    budget: 1000, // 1MB image budget
  },
  // ... additional budgets
]
```

## Usage

### Local Testing
```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run health check
npx @lhci/cli healthcheck --config=lighthouserc.js

# Build and test locally
npm run build
npm run start &
npx @lhci/cli autorun --config=lighthouserc.js
```

### CI/CD Integration
The workflow automatically runs on:
- Every push to master/main
- Every pull request
- Manual dispatch

### Manual Testing
```bash
# Trigger manual workflow with custom URLs
gh workflow run "Lighthouse CI - Performance Monitoring" \
  --field test_urls="http://localhost:3000/custom-page"
```

## Monitoring and Reporting

### Performance Reports
- **Automatic artifact storage** for 30 days
- **Trend analysis** with build comparison
- **Detailed metrics** for all Core Web Vitals
- **Budget compliance** reporting

### Failure Handling
- **Strict error handling** - any metric failure stops the build
- **Detailed error messages** with optimization suggestions
- **Performance regression detection** in pull requests

### Report Access
- Reports stored in `.lighthouseci/` directory
- Uploaded as GitHub Actions artifacts
- Accessible via GitHub Checks API

## Troubleshooting

### Common Issues

#### Performance Score < 100%
1. Check Core Web Vitals metrics
2. Review resource budgets
3. Analyze Lighthouse suggestions
4. Verify optimizations are applied

#### Build Failures
1. Ensure all environment variables are set
2. Check Node.js version compatibility
3. Verify build artifacts exist
4. Review server startup logs

#### Configuration Errors
```bash
# Validate configuration
npx @lhci/cli healthcheck --config=lighthouserc.js
```

### Performance Optimization Checklist
- [ ] Hero images optimized with next/image
- [ ] TipTap bundle optimized for anonymous users
- [ ] Server response times < 300ms
- [ ] JavaScript bundles < 500KB
- [ ] Images < 1MB total
- [ ] CSS < 100KB
- [ ] Fonts < 200KB

## Environment Variables

### Required Secrets
```yaml
NEXT_PUBLIC_SUPABASE_URL: # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY: # Supabase anonymous key
R2_ACCOUNT_ID: # Cloudflare R2 account ID
R2_ACCESS_KEY_ID: # Cloudflare R2 access key
R2_SECRET_ACCESS_KEY: # Cloudflare R2 secret key
R2_S3_ENDPOINT: # Cloudflare R2 S3 endpoint
NEXT_PUBLIC_R2_BASE_URL: # Public R2 base URL
LHCI_GITHUB_APP_TOKEN: # GitHub App token for reporting
```

## Migration Notes

### Changes from Previous Configuration
1. **Performance threshold**: 0.9 → 1.0 (90% → 100%)
2. **Added Core Web Vitals**: Specific metric thresholds
3. **Added budgets**: Resource size limits
4. **Enhanced reporting**: Detailed performance tracking
5. **Fixed environment variables**: Correct secret references
6. **Added caching**: Faster CI builds
7. **Multiple test URLs**: Comprehensive coverage

### Backward Compatibility
- Existing functionality maintained
- Configuration file structure preserved
- Additional features are additive

## Performance Impact

### Before Optimization
- Performance Score: ~70-80%
- LCP: ~3,050ms
- TTFB: ~602ms
- Bundle Size: Large (unoptimized)

### After Optimization (Target)
- Performance Score: 100%
- LCP: < 1,200ms
- TTFB: < 300ms
- Bundle Size: < 500KB (optimized)

### Expected Improvements
- **60% faster LCP** (1,850ms improvement)
- **50% faster TTFB** (302ms improvement)
- **Significant bundle reduction** (200-500KB)
- **100% performance score** achievement

## Next Steps

1. **Monitor performance** after deployment
2. **Adjust thresholds** if needed based on real-world data
3. **Add more test URLs** for comprehensive coverage
4. **Implement performance budgets** in development workflow
5. **Set up performance alerts** for regressions

## Related Documentation

- [Performance Optimization Guide](./performance-optimization.md)
- [Performance Quick Reference](./performance-quick-reference.md)
- [TipTap Bundle Optimization](./tiptap-bundle-optimization-summary.md)