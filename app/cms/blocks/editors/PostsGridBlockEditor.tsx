// app/cms/blocks/editors/PostsGridBlockEditor.tsx
import React, { useState, useEffect } from 'react';
import type { Block } from '@/utils/supabase/types';
import { updateBlock } from '@/app/cms/blocks/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
// import { useToast } from "@/components/ui/use-toast"; // Assuming you have a toast component - Removed for now

interface PostsGridBlockEditorProps {
  block: Block;
  isNestedEditing?: boolean; // New prop
  onChange?: (newContent: any) => void; // New prop for nested editing
}

const PostsGridBlockEditor: React.FC<PostsGridBlockEditorProps> = ({ block, isNestedEditing = false, onChange }) => {
  // const { toast } = useToast(); // Removed for now

  // More explicit check for undefined or null block prop
  if (block === undefined || block === null) {
    console.error("PostsGridBlockEditor: 'block' prop is undefined or null.");
    return <div>Loading block data... (block is undefined or null)</div>;
  }

  // Ensure block.content is a valid object, defaulting to an empty object if it's not.
  const safeContent = (typeof block.content === 'object' && block.content !== null)
    ? block.content
    : {};

  const initialContent = safeContent as { title?: string, postsPerPage?: number, columns?: number, showPagination?: boolean };

  const [currentTitle, setCurrentTitle] = useState(initialContent.title || 'Recent Posts');
  const [currentPostsPerPage, setCurrentPostsPerPage] = useState(initialContent.postsPerPage || 6);
  const [currentColumns, setCurrentColumns] = useState(initialContent.columns || 3);
  // showPagination is not editable in this iteration as per request, but we retain its value.
  const showPagination = initialContent.showPagination === undefined ? true : initialContent.showPagination;

  useEffect(() => {
    // Use safeContent pattern in useEffect as well
    const newContentFromProp = (typeof block.content === 'object' && block.content !== null)
      ? block.content
      : {};
    setCurrentTitle(newContentFromProp.title || 'Recent Posts');
    setCurrentPostsPerPage(newContentFromProp.postsPerPage || 6);
    setCurrentColumns(newContentFromProp.columns || 3);
    // Dependency array remains [block] to re-run if the block prop instance changes.
  }, [block]);

  const handleContentChange = () => {
    const newContentPayload = {
      title: currentTitle,
      postsPerPage: Number(currentPostsPerPage),
      columns: Number(currentColumns),
      showPagination: showPagination,
    };
    if (isNestedEditing && onChange) {
      onChange(newContentPayload);
    }
    // If not nested, the regular save button will handle it.
  };

  // Update content via onChange whenever an editable field changes, if in nested mode
  useEffect(() => {
    if (isNestedEditing && onChange) {
      handleContentChange();
    }
  }, [currentTitle, currentPostsPerPage, currentColumns, showPagination, isNestedEditing, onChange]);


  const handleSaveChanges = async () => {
    // This function is now only for non-nested editing
    if (isNestedEditing) return;

    const newContentPayload = {
      title: currentTitle,
      postsPerPage: Number(currentPostsPerPage),
      columns: Number(currentColumns),
      showPagination: showPagination,
    };

    // Ensure block.id is valid before calling updateBlock
    if (block.id === 0 || block.id === undefined || block.id === null) {
        console.error("PostsGridBlockEditor: Attempted to save with invalid block ID.", block);
        // alert("Error: Cannot save changes, block ID is invalid."); // Optional user feedback
        return;
    }

    const result = await updateBlock(block.id, newContentPayload, block.page_id, block.post_id);

    if (result.success) {
      console.log("Posts Grid block updated successfully.");
    } else {
      console.error("Failed to update block:", result.error);
      // alert(`Error saving block: ${result.error}`); // Optional user feedback
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <h4 className="text-lg font-semibold">Posts Grid Block Editor</h4>
      
      <div>
        <Label htmlFor={`posts-grid-title-${block.id}`}>Title</Label>
        <Input
          id={`posts-grid-title-${block.id}`}
          value={currentTitle}
          onChange={(e) => setCurrentTitle(e.target.value)}
          placeholder="Enter title for the posts grid"
        />
      </div>

      <div>
        <Label htmlFor={`posts-grid-per-page-${block.id}`}>Posts Per Page</Label>
        <Input
          id={`posts-grid-per-page-${block.id}`}
          type="number"
          value={currentPostsPerPage}
          onChange={(e) => setCurrentPostsPerPage(parseInt(e.target.value, 10))}
          min="1"
        />
      </div>

      <div>
        <Label htmlFor={`posts-grid-columns-${block.id}`}>Columns</Label>
        <Input
          id={`posts-grid-columns-${block.id}`}
          type="number"
          value={currentColumns}
          onChange={(e) => setCurrentColumns(parseInt(e.target.value, 10))}
          min="1"
          max="6" // Example max, adjust as needed
        />
      </div>
      
      <p className="text-sm">
        <strong>Show Pagination:</strong> {showPagination ? 'Yes' : 'No'}
      </p>

      {!isNestedEditing && (
        <Button onClick={handleSaveChanges} size="sm">Save Changes</Button>
      )}

      <p className="text-xs text-muted-foreground pt-2">
        Displays a grid of posts. Frontend rendering and further configuration options will be implemented in subsequent steps.
      </p>
    </div>
  );
};

export default PostsGridBlockEditor;