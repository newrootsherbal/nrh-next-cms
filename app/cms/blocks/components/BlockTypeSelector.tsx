// app/cms/blocks/components/BlockTypeSelector.tsx
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { blockRegistry, BlockType } from '@/lib/blocks/blockRegistry';
import BlockTypeCard from './BlockTypeCard';

interface BlockTypeSelectorProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectBlockType: (blockType: BlockType) => void;
}

const BlockTypeSelector: React.FC<BlockTypeSelectorProps> = ({ isOpen, onOpenChange, onSelectBlockType }) => {
  const handleSelect = (blockType: BlockType) => {
    onSelectBlockType(blockType);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add a New Block</DialogTitle>
          <DialogDescription>
            Choose a block type from the options below to add it to the page.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
          {Object.values(blockRegistry).map((blockDef) => (
            <BlockTypeCard
              key={blockDef.type}
              name={blockDef.label}
              description={blockDef.documentation?.description}
              icon={blockDef.icon}
              onClick={() => handleSelect(blockDef.type)}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlockTypeSelector;