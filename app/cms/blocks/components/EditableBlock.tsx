// app/cms/blocks/components/EditableBlock.tsx
"use client";

import React from 'react'; // Ensure React is imported for JSX
import type { Block, ImageBlockContent } from "@/utils/supabase/types"; // Added ImageBlockContent
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, Edit2, Check, X } from "lucide-react";

// Import individual block editors
import TextBlockEditor from "./TextBlockEditor";
import HeadingBlockEditor from "./HeadingBlockEditor";
import ImageBlockSelector from "./ImageBlockSelector";
import ButtonBlockEditor from "./ButtonBlockEditor";

// Define R2_BASE_URL, ideally this would come from a shared config or context
const R2_BASE_URL = process.env.NEXT_PUBLIC_R2_BASE_URL || "";

export interface EditableBlockProps {
  block: Block;
  onDelete: (blockId: number) => void;
  isEditing: boolean;
  onSetEditing: (isEditing: boolean) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  tempContent: any;
  onTempContentChange: (newContent: any) => void;
  dragHandleProps?: any; // For dnd-kit: spread {...attributes} {...listeners}
}

export default function EditableBlock({
  block,
  onDelete,
  isEditing,
  onSetEditing,
  onSaveEdit,
  onCancelEdit,
  tempContent,
  onTempContentChange,
  dragHandleProps,
}: EditableBlockProps) {

  const renderEditor = () => {
    const currentContent = tempContent || block.content || {};
    switch (block.block_type) {
      case "text":
        return <TextBlockEditor content={currentContent} onChange={onTempContentChange} />;
      case "heading":
        return <HeadingBlockEditor content={currentContent} onChange={onTempContentChange} />;
      case "image":
        return <ImageBlockSelector content={currentContent} onChange={onTempContentChange} />;
      case "button":
        return <ButtonBlockEditor content={currentContent} onChange={onTempContentChange} />;
      default:
        return <p>Unsupported block type: {block.block_type}</p>;
    }
  };

  const renderPreview = () => {
    const displayContent = isEditing ? (tempContent || {}) : (block.content || {});
    switch (block.block_type) {
      case "text": {
        const html = (displayContent as any).html_content;
        return (
          <div
            className="prose dark:prose-invert max-w-none py-2"
            dangerouslySetInnerHTML={{
              __html:
                typeof html === "string" && html.trim().length > 0
                  ? html
                  : "<p class='text-muted-foreground italic'>Empty text block</p>",
            }}
          />
        );
      }
      case "heading": {
        let level = (displayContent as any).level;
        if (typeof level !== 'number' || level < 1 || level > 6) level = 2;
        const text = (displayContent as any).text_content;
        const Tag = `h${level}`;
        return React.createElement(
          Tag,
          { className: "py-2" },
          typeof text === "string" && text.trim().length > 0 ? text : <span className="text-muted-foreground italic">Empty heading</span>
        );
      }
      case "image": {
        const { media_id, object_key, alt_text, caption } = displayContent as Partial<ImageBlockContent>;

        if (object_key) {
          return (
            <div className="py-2">
              <img
                src={`${R2_BASE_URL}/${object_key}`}
                alt={alt_text || "Image preview"}
                className="max-w-full h-auto max-h-48 rounded object-contain mx-auto mb-2" // Adjusted max-h and added mb-2
              />
              {caption && <p className="text-xs text-muted-foreground text-center italic mt-1">{caption}</p>}
              {!caption && !alt_text && <p className="text-xs text-muted-foreground text-center italic mt-1">Image loaded</p>}
            </div>
          );
        } else if (media_id) {
          // If object_key is missing but media_id exists, it might be an old record or an issue.
          return (
            <div className="py-2">
              <p className="text-sm text-muted-foreground">
                Image: {alt_text || `Media ID ${media_id}`} (Preview not available)
              </p>
            </div>
          );
        } else {
          return (
            <div className="py-2 flex flex-col items-center justify-center space-y-2 min-h-[100px] border border-dashed rounded-md">
              <p className="text-sm text-muted-foreground">No image selected</p>
              <Button variant="outline" size="sm" onClick={() => onSetEditing(true)}>
                Add Image
              </Button>
            </div>
          );
        }
      }
      case "button": {
        const variant = (displayContent as any).variant || 'default';
        const size = (displayContent as any).size || 'default';
        const text = (displayContent as any).text;
        return (
          <div className="py-2">
            <Button variant={variant} size={size}>
              {typeof text === "string" && text.trim().length > 0 ? text : "Button"}
            </Button>
          </div>
        );
      }
      default:
        return <p className="text-sm text-muted-foreground py-2">Preview for {block.block_type}</p>;
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-card shadow">
      <div className="flex justify-between items-center mb-2 pb-2 border-b">
        <div className="flex items-center gap-2">
          {dragHandleProps && (
            <button {...dragHandleProps} className="cursor-grab p-1 -ml-1" aria-label="Drag to reorder">
              <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          <span className="font-medium capitalize">{block.block_type}</span>
        </div>
        <div className="flex items-center gap-1">
            {isEditing ? (
                <>
                    <Button variant="ghost" size="icon" onClick={onSaveEdit} title="Save">
                        <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onCancelEdit} title="Cancel">
                        <X className="h-4 w-4 text-red-600" />
                    </Button>
                </>
            ) : (
                 <Button variant="ghost" size="icon" onClick={() => onSetEditing(true)} title="Edit">
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                </Button>
            )}
          <Button variant="ghost" size="icon" onClick={() => onDelete(block.id)} title="Delete">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
      {isEditing ? <div className="mt-2">{renderEditor()}</div> : renderPreview()}
    </div>
  );
}
