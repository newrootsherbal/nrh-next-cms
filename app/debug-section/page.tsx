"use client";

import React, { useState } from 'react';
import SectionBlockEditor from '@/app/cms/blocks/editors/SectionBlockEditor';
import type { SectionBlockContent } from '@/lib/blocks/blockRegistry';

export default function DebugSectionPage() {
  const [sectionContent, setSectionContent] = useState<Partial<SectionBlockContent>>({
    container_type: "container",
    background: { type: "none" },
    responsive_columns: { mobile: 1, tablet: 2, desktop: 3 },
    column_gap: "md",
    padding: { top: "md", bottom: "md" },
    column_blocks: [
      [{ block_type: "text", content: { html_content: "<p>Column 1 Block 1</p>" } }],
      [{ block_type: "text", content: { html_content: "<p>Column 2 Block 1</p>" } }],
      [{ block_type: "text", content: { html_content: "<p>Column 3 Block 1</p>" } }]
    ]
  });

  const handleContentChange = (newContent: SectionBlockContent) => {
    console.log('🔍 DEBUG: Section content changed:', newContent);
    setSectionContent(newContent);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Section Block Editor Debug</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Column Targeting & Cross-Column DND</h2>
          <p className="text-gray-600 mb-6">
            This page tests the SectionBlockEditor to identify column targeting bugs and cross-column drag-and-drop issues.
            Open the browser console to see debug logs.
          </p>
          
          <SectionBlockEditor
            content={sectionContent}
            onChange={handleContentChange}
          />
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Current Section Data</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(sectionContent, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}