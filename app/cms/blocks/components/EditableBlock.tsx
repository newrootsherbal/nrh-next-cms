// app/cms/blocks/components/EditableBlock.tsx
"use client";

import React, { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Block, ImageBlockContent } from "@/utils/supabase/types";
// Directly import PostsGridBlockEditor for the targeted fix
import PostsGridBlockEditor from '../editors/PostsGridBlockEditor';
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, Edit2, Check, X } from "lucide-react";
import { getBlockDefinition } from "@/lib/blocks/blockRegistry";

// Define R2_BASE_URL, ideally this would come from a shared config or context
const R2_BASE_URL = process.env.NEXT_PUBLIC_R2_BASE_URL || "";

export interface EditableBlockProps {
  block: Block;
  onDelete: (blockId: number) => void;
  onContentChange: (blockId: number, newContent: any) => void;
  dragHandleProps?: any;
  onEditNestedBlock?: (parentBlockId: string, columnIndex: number, blockIndexInColumn: number) => void;
}

export default function EditableBlock({
  block,
  onDelete,
  onContentChange,
  dragHandleProps,
  onEditNestedBlock,
}: EditableBlockProps) {
  const isInitialMount = useRef(true);
  // Add a guard for undefined block prop
  if (!block) {
    // Or some other placeholder/error display
    return <div className="p-4 border rounded-lg bg-card shadow text-red-500">Error: Block data is missing in EditableBlock.</div>;
  }

  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  // Define dynamic imports for each editor type
  // Note: PostsGridBlockEditor is imported statically above due to a "targeted fix"
  const DynamicTextBlockEditor = dynamic(() => import(/* webpackChunkName: "text-block-editor" */ '../editors/TextBlockEditor'), { loading: () => <p>Loading editor...</p> });
  const DynamicHeadingBlockEditor = dynamic(() => import(/* webpackChunkName: "heading-block-editor" */ '../editors/HeadingBlockEditor'), { loading: () => <p>Loading editor...</p> });
  const DynamicImageBlockEditor = dynamic(() => import(/* webpackChunkName: "image-block-editor" */ '../editors/ImageBlockEditor'), { loading: () => <p>Loading editor...</p> });
  const DynamicButtonBlockEditor = dynamic(() => import(/* webpackChunkName: "button-block-editor" */ '../editors/ButtonBlockEditor'), { loading: () => <p>Loading editor...</p> });
  const DynamicVideoEmbedBlockEditor = dynamic(() => import(/* webpackChunkName: "video-embed-block-editor" */ '../editors/VideoEmbedBlockEditor'), { loading: () => <p>Loading editor...</p> });
  const DynamicSectionBlockEditor = dynamic(() => import(/* webpackChunkName: "section-block-editor" */ '../editors/SectionBlockEditor'), { loading: () => <p>Loading editor...</p> });


  const EditorComponent = useMemo(() => {
    if (!block?.block_type) return null;

    switch (block.block_type) {
      case 'text':
        return DynamicTextBlockEditor;
      case 'heading':
        return DynamicHeadingBlockEditor;
      case 'image':
        return DynamicImageBlockEditor;
      case 'button':
        return DynamicButtonBlockEditor;
      case 'video_embed':
        return DynamicVideoEmbedBlockEditor;
      case 'hero':
      case 'section':
        return DynamicSectionBlockEditor;
      case 'posts_grid':
        return PostsGridBlockEditor; // Return the statically imported one
      default:
        return null;
    }
  }, [block?.block_type]);


  const renderEditor = () => {
    if (!EditorComponent) {
      return (
        <div className="flex items-center justify-center py-8 min-h-[100px]">
          <div className="text-sm text-muted-foreground">Loading editor...</div>
        </div>
      );
    }

    const editorProps: any = {
      content: block.content || {},
      onChange: (newContent: any) => {
        onContentChange(block.id, newContent);
      },
      blockType: block.block_type,
      isConfigPanelOpen: isConfigPanelOpen,
    };

    return <EditorComponent {...editorProps} />;
  };

  const renderPreview = () => {
    // Safe access to block_type for preview
    const currentBlockType = block && block.block_type;
    if (!currentBlockType) {
      return <div className="text-red-500">Error: Block type missing for preview.</div>;
    }

    const blockDefinition = getBlockDefinition(currentBlockType as any);
    const blockLabel = blockDefinition?.label || currentBlockType;

    // Default preview for other block types
    return (
      <div className="py-4 flex flex-col items-center justify-center space-y-2 min-h-[80px] border border-dashed rounded-md bg-muted/20">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">{blockLabel}</p>
          <p className="text-xs text-muted-foreground">Click edit to modify content</p>
        </div>
        {/* This button is for non-section blocks which are not yet implemented for inline editing */}
        <Button variant="outline" size="sm" onClick={() => console.log('Edit for this block type not implemented')}>
          Edit Block
        </Button>
      </div>
    );
  };

  const isSection = block?.block_type === 'section' || block?.block_type === 'hero';

  const handleEditClick = () => {
    if (isSection) {
      setIsConfigPanelOpen(!isConfigPanelOpen);
    } else {
      // For other blocks, we might want a modal or inline editor.
      // For now, let's just log it. The old logic is removed.
      console.log("Edit clicked for non-section block:", block.block_type);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card shadow">
      <div className="flex justify-between items-center mb-2 pb-2 border-b">
        <div className="flex items-center gap-2">
          {dragHandleProps && (
            <button {...dragHandleProps} className="cursor-grab p-1 -ml-1" aria-label="Drag to reorder">
              <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          <span className="font-medium capitalize">{block?.block_type || 'Unknown Block'}</span>
        </div>
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleEditClick} title={isSection ? "Toggle Section Config" : "Edit"}>
                <Edit2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(block.id)} title="Delete">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
      {isSection ? (
        <div className="mt-2 min-h-[200px]">
          {renderEditor()}
        </div>
      ) : renderPreview()}
    </div>
  );
}
