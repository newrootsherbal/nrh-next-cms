// app/[slug]/page.utils.ts
import { createClient } from "@/utils/supabase/server";
import type { Page as PageType, Block as BlockType, ImageBlockContent } from "@/utils/supabase/types";

// Ensure types like PageType, BlockType, ImageBlockContent are correctly imported or defined
// if they were local to the original page.tsx

export async function getPageDataBySlug(slug: string): Promise<(PageType & { blocks: BlockType[]; language_code: string; language_id: number; translation_group_id: string; }) | null> {
  const supabase = createClient();

  const { data: pageData, error: pageError } = await supabase
    .from("pages")
    .select(`
      *,
      languages!inner (id, code), 
      blocks (*)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .order('order', { foreignTable: 'blocks', ascending: true })
    .maybeSingle();

  if (pageError || !pageData) {
    if(pageError) console.error(`Error fetching page data for slug '${slug}':`, pageError);
    return null;
  }

  // Ensure 'languages' is correctly typed and accessed
  const langInfo = pageData.languages as unknown as { id: number; code: string };
  if (!langInfo) {
      console.error(`Language information missing for page slug '${slug}'`);
      return null;
  }

  let blocksWithMediaData: BlockType[] = pageData.blocks || [];
  if (blocksWithMediaData.length > 0) {
    const imageBlockMediaIds = blocksWithMediaData
      .filter(block => block.block_type === 'image' && block.content?.media_id)
      .map(block => (block.content as ImageBlockContent).media_id)
      .filter(id => id !== null && typeof id === 'string') as string[];

    if (imageBlockMediaIds.length > 0) {
      const { data: mediaItems, error: mediaError } = await supabase
        .from('media').select('id, object_key').in('id', imageBlockMediaIds);
      if (mediaError) console.error("Error fetching media for blocks:", mediaError);
      else if (mediaItems) {
        const mediaMap = new Map(mediaItems.map(m => [m.id, m.object_key]));
        blocksWithMediaData = blocksWithMediaData.map(block => {
          if (block.block_type === 'image' && block.content?.media_id) {
            const currentContent = block.content as ImageBlockContent;
            const objectKey = mediaMap.get(currentContent.media_id!);
            if (objectKey) return { ...block, content: { ...currentContent, object_key: objectKey } };
          }
          return block;
        });
      }
    }
  }

  return {
    ...pageData,
    blocks: blocksWithMediaData,
    language_code: langInfo.code,
    language_id: langInfo.id,
    // translation_group_id should be on pageData
  } as (PageType & { blocks: BlockType[]; language_code: string; language_id: number; translation_group_id: string; });
}