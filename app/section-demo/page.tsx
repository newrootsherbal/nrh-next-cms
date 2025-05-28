// app/section-demo/page.tsx
import React from 'react';
import SectionBlockRenderer from '@/components/blocks/renderers/SectionBlockRenderer';
import type { SectionBlockContent } from '@/lib/blocks/blockRegistry';

export default function SectionDemoPage() {
  // Demo Section 1: 2-column with container and gradient background
  const section1: SectionBlockContent = {
    container_type: "container",
    background: {
      type: "gradient",
      gradient: {
        type: "linear",
        direction: "to right",
        stops: [
          { color: "#3b82f6", position: 0 },
          { color: "#8b5cf6", position: 100 }
        ]
      }
    },
    responsive_columns: { mobile: 1, tablet: 2, desktop: 2 },
    column_gap: "lg",
    padding: { top: "xl", bottom: "xl" },
    column_blocks: [
      {
        block_type: "heading",
        content: {
          level: 1,
          text_content: "Welcome to Section Layouts"
        }
      },
      {
        block_type: "text",
        content: {
          html_content: "<p>This demonstration showcases the powerful section/column layout system with responsive design, flexible backgrounds, and nested block support.</p><p>The system supports 1-4 columns with full responsive breakpoints and various container types.</p>"
        }
      }
    ]
  };

  // Demo Section 2: 3-column with full-width and solid color background
  const section2: SectionBlockContent = {
    container_type: "full-width",
    background: {
      type: "solid",
      solid_color: "#f8fafc"
    },
    responsive_columns: { mobile: 1, tablet: 2, desktop: 3 },
    column_gap: "md",
    padding: { top: "lg", bottom: "lg" },
    column_blocks: [
      {
        block_type: "heading",
        content: {
          level: 2,
          text_content: "Feature Showcase"
        }
      },
      {
        block_type: "text",
        content: {
          html_content: "<h3>Responsive Design</h3><p>Automatically adapts from 1 column on mobile to 2 on tablet and 3 on desktop. The layout is fully responsive and follows modern design principles.</p>"
        }
      },
      {
        block_type: "button",
        content: {
          text: "Learn More",
          url: "#features",
          variant: "default",
          size: "lg"
        }
      }
    ]
  };

  // Demo Section 3: 4-column with theme background
  const section3: SectionBlockContent = {
    container_type: "container-lg",
    background: {
      type: "theme",
      theme: "muted"
    },
    responsive_columns: { mobile: 1, tablet: 2, desktop: 4 },
    column_gap: "sm",
    padding: { top: "md", bottom: "md" },
    column_blocks: [
      {
        block_type: "heading",
        content: {
          level: 3,
          text_content: "Column 1"
        }
      },
      {
        block_type: "text",
        content: {
          html_content: "<p>This is the first column in a 4-column layout. Each column can contain any type of block content.</p>"
        }
      },
      {
        block_type: "heading",
        content: {
          level: 3,
          text_content: "Column 3"
        }
      },
      {
        block_type: "text",
        content: {
          html_content: "<p>The fourth column demonstrates how content flows naturally within the responsive grid system.</p>"
        }
      }
    ]
  };

  // Demo Section 4: 1-column with container-sm (centered content)
  const section4: SectionBlockContent = {
    container_type: "container-sm",
    background: {
      type: "none"
    },
    responsive_columns: { mobile: 1, tablet: 1, desktop: 1 },
    column_gap: "none",
    padding: { top: "xl", bottom: "xl" },
    column_blocks: [
      {
        block_type: "heading",
        content: {
          level: 2,
          text_content: "Centered Content Layout"
        }
      },
      {
        block_type: "text",
        content: {
          html_content: "<p>This section uses a single column with container-sm for a centered, narrow content layout. Perfect for articles, blog posts, or focused content.</p><p>The section system supports various container types:</p><ul><li><strong>full-width:</strong> Spans the entire viewport width</li><li><strong>container:</strong> Standard responsive container with padding</li><li><strong>container-sm:</strong> Narrow container for focused content</li><li><strong>container-lg:</strong> Large container for wider layouts</li><li><strong>container-xl:</strong> Extra large container for maximum width</li></ul>"
        }
      }
    ]
  };

  // Demo Section 5: Mixed content types
  const section5: SectionBlockContent = {
    container_type: "container",
    background: {
      type: "theme",
      theme: "accent"
    },
    responsive_columns: { mobile: 1, tablet: 2, desktop: 3 },
    column_gap: "lg",
    padding: { top: "lg", bottom: "lg" },
    column_blocks: [
      {
        block_type: "heading",
        content: {
          level: 2,
          text_content: "Mixed Content Demo"
        }
      },
      {
        block_type: "text",
        content: {
          html_content: "<p>This section demonstrates how different block types work together within the section layout system.</p><p>Each column can contain any supported block type, creating flexible and dynamic layouts.</p>"
        }
      },
      {
        block_type: "button",
        content: {
          text: "Get Started",
          url: "#start",
          variant: "outline",
          size: "default"
        }
      }
    ]
  };

  // Demo Section 6: Gap variations
  const section6: SectionBlockContent = {
    container_type: "container",
    background: {
      type: "solid",
      solid_color: "#fef3c7"
    },
    responsive_columns: { mobile: 1, tablet: 2, desktop: 2 },
    column_gap: "xl",
    padding: { top: "md", bottom: "md" },
    column_blocks: [
      {
        block_type: "heading",
        content: {
          level: 2,
          text_content: "Gap Control"
        }
      },
      {
        block_type: "text",
        content: {
          html_content: "<p>This section uses 'xl' gap spacing between columns. The system supports:</p><ul><li><strong>none:</strong> No gap between columns</li><li><strong>sm:</strong> Small gap (0.5rem)</li><li><strong>md:</strong> Medium gap (1rem)</li><li><strong>lg:</strong> Large gap (1.5rem)</li><li><strong>xl:</strong> Extra large gap (2rem)</li></ul>"
        }
      }
    ]
  };

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Section/Column Layout System Demonstration
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            This page demonstrates the comprehensive section/column layout system with various configurations, 
            backgrounds, responsive behavior, and nested block content. Each section below showcases different 
            features and capabilities of the system.
          </p>
        </div>
      </div>

      {/* Demo Sections */}
      <SectionBlockRenderer content={section1} languageId={1} />
      <SectionBlockRenderer content={section2} languageId={1} />
      <SectionBlockRenderer content={section3} languageId={1} />
      <SectionBlockRenderer content={section4} languageId={1} />
      <SectionBlockRenderer content={section5} languageId={1} />
      <SectionBlockRenderer content={section6} languageId={1} />

      {/* Technical Details */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Technical Implementation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Features Implemented</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✅ Responsive column layouts (1-4 columns)</li>
                <li>✅ Container type options (full-width, container variants)</li>
                <li>✅ Background support (theme, solid, gradient, image)</li>
                <li>✅ Configurable gaps and padding</li>
                <li>✅ Nested block rendering</li>
                <li>✅ Dynamic component loading</li>
                <li>✅ TypeScript type safety</li>
                <li>✅ SSR compatibility</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Block Registry Integration</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✅ Centralized block type definitions</li>
                <li>✅ Content schema validation</li>
                <li>✅ Editor component mapping</li>
                <li>✅ Renderer component mapping</li>
                <li>✅ Initial content generation</li>
                <li>✅ Documentation and examples</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">User Experience</h3>
            <p className="text-gray-700 mb-4">
              The section/column layout system provides content creators with:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              <li>• Intuitive visual editor interface</li>
              <li>• Real-time preview of column layouts</li>
              <li>• Drag-and-drop block management</li>
              <li>• Responsive design controls</li>
              <li>• Background customization options</li>
              <li>• Flexible content organization</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}