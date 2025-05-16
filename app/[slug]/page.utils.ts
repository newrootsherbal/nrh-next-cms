// app/[slug]/page.utils.ts
// import { createClient } from "@/utils/supabase/server"; // Remove this
import { getSsgSupabaseClient } from "@/utils/supabase/ssg-client"; // Use the new SSG client utility
import type { Page as PageType, Block as BlockType, ImageBlockContent } from "@/utils/supabase/types";
import type { SupabaseClient } from '@supabase/supabase-js';


export async function getPageDataBySlug(slug: string): Promise<(PageType & { blocks: BlockType[]; language_code: string; language_id: number; translation_group_id: string; }) | null> {
  const supabase = getSsgSupabaseClient(); // Use the SSG-safe client

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
    if(pageError) console.error(`Error fetching page data for slug '${slug}':`, pageError.message);
    return null;
  }

  const langInfo = pageData.languages as unknown as { id: number; code: string };
  if (!langInfo || !langInfo.id || !langInfo.code) {
      console.error(`Language information missing or incomplete for page slug '${slug}'. DB response:`, pageData.languages);
      // Attempt to fetch language code directly if language_id is present but join failed
      if (!pageData.language_id) return null; // Cannot proceed without language_id
      const {data: fallbackLang} = await supabase.from("languages").select("id, code").eq("id", pageData.language_id).single();
      if (!fallbackLang) return null; // Still no language info
      Object.assign(langInfo, {id: fallbackLang.id, code: fallbackLang.code });
  }

  if (!pageData.translation_group_id) {
      console.error(`Page with slug '${slug}' is missing a translation_group_id.`);
      return null; // Or handle as appropriate, maybe it's an older page
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
      if (mediaError) console.error("SSG (Pages): Error fetching media items for blocks:", mediaError);
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
    translation_group_id: pageData.translation_group_id,
  } as (PageType & { blocks: BlockType[]; language_code: string; language_id: number; translation_group_id: string; });
}