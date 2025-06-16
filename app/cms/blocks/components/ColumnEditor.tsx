// app/cms/blocks/components/ColumnEditor.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Label } from '../../../../components/ui/label';
import { Button } from '../../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { PlusCircle, Trash2, Edit2, Check, X, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import type { SectionBlockContent } from '../../../../lib/blocks/blockRegistry';
import { availableBlockTypes, getBlockDefinition, getInitialContent, BlockType } from '../../../../lib/blocks/blockRegistry';
import dynamic from 'next/dynamic';
import { useDroppable } from "@dnd-kit/core";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Dynamically imported editor components
const TextBlockEditorComponent = dynamic(() => import('../editors/TextBlockEditor'));
const HeadingBlockEditorComponent = dynamic(() => import('../editors/HeadingBlockEditor'));
const ImageBlockEditorComponent = dynamic(() => import('../editors/ImageBlockEditor'));
const ButtonBlockEditorComponent = dynamic(() => import('../editors/ButtonBlockEditor'));
const PostsGridBlockEditorComponent = dynamic(() => import('../editors/PostsGridBlockEditor'));
const VideoEmbedBlockEditorComponent = dynamic(() => import('../editors/VideoEmbedBlockEditor'));

const editorComponentMap: Partial<Record<BlockType, React.ComponentType<any>>> = {
  text: TextBlockEditorComponent,
  heading: HeadingBlockEditorComponent,
  image: ImageBlockEditorComponent,
  button: ButtonBlockEditorComponent,
  posts_grid: PostsGridBlockEditorComponent,
  video_embed: VideoEmbedBlockEditorComponent,
};

// Sortable block item component for column blocks
interface SortableColumnBlockProps {
  block: SectionBlockContent['column_blocks'][0][0];
  index: number;
  columnIndex: number;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  blockType: 'section' | 'hero';
}

function SortableColumnBlock({ block, index, columnIndex, onEdit, onDelete, isEditing, blockType }: SortableColumnBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${blockType}-column-${columnIndex}-block-${index}`,
    data: {
      type: 'block',
      blockType,
      columnIndex,
      blockIndex: index,
      block
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const blockDefinition = getBlockDefinition(block.block_type);
  const blockLabel = blockDefinition?.label || block.block_type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative p-2 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 shadow-sm"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab p-1 opacity-0 group-hover:opacity-100 transition-opacity touch-none"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-3 w-3 text-gray-400" />
          </button>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 capitalize">
            {blockLabel}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-6 w-6 p-0" title="Edit block">
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-6 w-6 p-0 text-red-600 hover:text-red-700" title="Delete block">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {block.block_type === 'text' && (
          <div dangerouslySetInnerHTML={{ __html: (block.content.html_content || 'Empty text').substring(0, 50) + (block.content.html_content && block.content.html_content.length > 50 ? '...' : '') }} />
        )}
        {block.block_type === 'heading' && (
          <div>H{block.content.level || 1}: {(block.content.text_content || 'Empty heading').substring(0, 30) + (block.content.text_content && block.content.text_content.length > 30 ? '...' : '')}</div>
        )}
        {block.block_type === 'image' && (
          <div>Image: {block.content.alt_text || block.content.media_id ? 'Image selected' : 'No image selected'}</div>
        )}
        {block.block_type === 'button' && (
          <div>Button: {block.content.text || 'No text'} → {block.content.url || '#'}</div>
        )}
        {block.block_type === 'video_embed' && (
          <div>Video: {block.content.title || block.content.url || 'No URL set'}</div>
        )}
        {block.block_type === 'posts_grid' && (
          <div>Posts Grid: {block.content.columns || 3} cols, {block.content.postsPerPage || 12} posts</div>
        )}
      </div>
    </div>
  );
}

// Column editor component
export interface ColumnEditorProps {
  columnIndex: number;
  blocks: SectionBlockContent['column_blocks'][0];
  onBlocksChange: (newBlocks: SectionBlockContent['column_blocks'][0]) => void;
  blockType: 'section' | 'hero';
}

export default function ColumnEditor({ columnIndex, blocks, onBlocksChange, blockType }: ColumnEditorProps) {
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [tempBlockContent, setTempBlockContent] = useState<any>(null);
  const [EditorComponent, setEditorComponent] = useState<React.ComponentType<any> | null>(null);
  const [selectedBlockType, setSelectedBlockType] = useState<BlockType | "">("");

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: `${blockType}-column-droppable-${columnIndex}`,
  });

  useEffect(() => {
    if (editingBlockIndex === null) {
      setEditorComponent(null);
      return;
    }
    const block = blocks[editingBlockIndex];
    const Editor = editorComponentMap[block.block_type];
    if (Editor) {
      setEditorComponent(() => Editor);
    } else {
      if (block.block_type !== 'section') {
        console.error(`No editor component found for block type: ${block.block_type}`);
      }
      setEditorComponent(null);
    }
  }, [editingBlockIndex, blocks]);

  const handleAddBlock = () => {
    if (!selectedBlockType) return;
    const initialContent = getInitialContent(selectedBlockType);
    const newBlock = {
      block_type: selectedBlockType,
      content: initialContent || {},
      temp_id: `temp-${Date.now()}-${Math.random()}`
    };
    onBlocksChange([...blocks, newBlock]);
    setSelectedBlockType("");
  };

  const handleDeleteBlock = (index: number) => {
    const newBlocks = blocks.filter((_: any, i: number) => i !== index);
    onBlocksChange(newBlocks);
    if (editingBlockIndex === index) {
      setEditingBlockIndex(null);
      setTempBlockContent(null);
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingBlockIndex(index);
    setTempBlockContent(JSON.parse(JSON.stringify(blocks[index].content)));
  };

  const handleSaveEdit = () => {
    if (editingBlockIndex === null) return;
    const newBlocks = [...blocks];
    if (tempBlockContent !== null) {
      newBlocks[editingBlockIndex] = {
        ...newBlocks[editingBlockIndex],
        content: tempBlockContent
      };
    }
    onBlocksChange(newBlocks);
    setEditingBlockIndex(null);
    setTempBlockContent(null);
  };

  const handleCancelEdit = () => {
    setEditingBlockIndex(null);
    setTempBlockContent(null);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex flex-col">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Column {columnIndex + 1}
            </h4>
            <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
              {blocks.length} block{blocks.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Select value={selectedBlockType} onValueChange={(value: string) => setSelectedBlockType(value as BlockType)}>
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue placeholder="Add block..." />
            </SelectTrigger>
            <SelectContent>
              {availableBlockTypes.filter((type: BlockType) => type !== 'section' && type !== 'hero').map((type: BlockType) => (
                <SelectItem key={type} value={type} className="text-xs capitalize">
                  {getBlockDefinition(type)?.label || type.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddBlock} disabled={!selectedBlockType} size="sm" className="h-8 px-2">
            <PlusCircle className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="p-3 flex-grow">
        {blocks.length === 0 ? (
          <div
            ref={setDroppableNodeRef}
            className={`h-full flex items-center justify-center text-xs text-gray-500 border-2 border-dashed rounded-lg transition-colors ${
              isOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            Drag block here
          </div>
        ) : (
          <div className="space-y-2">
            {blocks.map((block: SectionBlockContent['column_blocks'][0][0], index: number) => (
              <div key={`${blockType}-column-${columnIndex}-block-${index}`}>
                <SortableColumnBlock
                  block={block}
                  index={index}
                  columnIndex={columnIndex}
                  blockType={blockType}
                  onEdit={() => handleStartEdit(index)}
                  onDelete={() => handleDeleteBlock(index)}
                  isEditing={editingBlockIndex === index}
                />
                {editingBlockIndex === index && EditorComponent && (
                  <div className="mt-2 p-3 border border-blue-200 dark:border-blue-800 rounded bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        Editing {getBlockDefinition(block.block_type)?.label}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={handleSaveEdit} className="h-6 w-6 p-0 text-green-600">
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="h-6 w-6 p-0 text-red-600">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm">
                      <EditorComponent
                        content={tempBlockContent}
                        onChange={setTempBlockContent}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}