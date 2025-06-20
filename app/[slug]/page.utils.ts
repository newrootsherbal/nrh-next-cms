// app/[slug]/page.utils.ts
import { getSsgSupabaseClient } from "../../utils/supabase/ssg-client";
import type { Database } from "../../utils/supabase/types";

type PageType = Database['public']['Tables']['pages']['Row'];
type BlockType = Database['public']['Tables']['blocks']['Row'];

// Define a more specific type for the content of an Image Block
export type ImageBlockContent = {
  media_id: string | null;
  object_key?: string; // Optional because it's added later
};
// SupabaseClient import removed as it's unused

// Interface to represent a page object after the initial database query and selection
interface SelectedPageType extends PageType { // Assumes PageType includes fields like id, slug, status, language_id, translation_group_id
  language_details: { id: number; code: string } | null; // From the join; kept nullable due to original code's caution
  blocks: BlockType[];
}

export async function getPageDataBySlug(slug: string): Promise<(PageType & { blocks: BlockType[]; language_code: string; language_id: number; translation_group_id: string | null; }) | null> {
  const supabase = getSsgSupabaseClient();

  const { data: candidatePagesData, error: pageError } = await supabase
    .from("pages")
    .select(`
      *,
      language_details:languages!inner(id, code), 
      blocks (*)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .order('order', { foreignTable: 'blocks', ascending: true });

  if (pageError) {
    return null;
  }

  const candidatePages: SelectedPageType[] = (candidatePagesData || []) as SelectedPageType[];


  if (candidatePages.length === 0) {
    return null;
  }

  let selectedPage: SelectedPageType | null = null;

  if (candidatePages.length === 1) {
    selectedPage = candidatePages[0];
  } else {
    const enPage = candidatePages.find(p => p.language_details && p.language_details.code === 'en');
    if (enPage) {
      selectedPage = enPage;
    } else {
      return null;
    }
  }
  
  if (!selectedPage) {
    return null;
  }
  
  let languageCode: string | undefined = selectedPage.language_details?.code;
  let languageId: number | undefined = selectedPage.language_details?.id;

  if (!languageCode || typeof languageId !== 'number') {
    
    if (typeof selectedPage.language_id === 'number') {
        const { data: fallbackLang, error: langFetchError } = await supabase
            .from("languages")
            .select("id, code")
            .eq("id", selectedPage.language_id)
            .single();

        if (langFetchError) {
            return null;
        }
        
        if (fallbackLang) {
            languageCode = fallbackLang.code;
            languageId = fallbackLang.id;
        } else {
            return null;
        }
    } else {
        return null;
    }
  }

  if (typeof languageCode !== 'string' || typeof languageId !== 'number') {
      return null;
  }

  if (!selectedPage.translation_group_id) {
  }

  let blocksWithMediaData: BlockType[] = selectedPage.blocks || [];
  if (blocksWithMediaData.length > 0) {
    const imageBlockMediaIds = blocksWithMediaData
      .filter(block => block.block_type === 'image' && (block.content as ImageBlockContent)?.media_id)
      .map(block => (block.content as ImageBlockContent).media_id)
      .filter(id => id !== null && typeof id === 'string') as string[];

    if (imageBlockMediaIds.length > 0) {
      const { data: mediaItems, error: mediaError } = await supabase
        .from('media').select('id, object_key').in('id', imageBlockMediaIds);
      if (mediaError) {
      } else if (mediaItems) {
        const mediaMap = new Map(mediaItems.map(m => [m.id, m.object_key]));
        blocksWithMediaData = blocksWithMediaData.map(block => {
          if (block.block_type === 'image' && (block.content as ImageBlockContent)?.media_id) {
            const currentContent = block.content as ImageBlockContent;
            const objectKey = mediaMap.get(currentContent.media_id!);
            if (objectKey) return { ...block, content: { ...currentContent, object_key: objectKey } };
          }
          return block;
        });
      }
    }
  }
  
  const { language_details, blocks, ...basePageData } = selectedPage;

  return {
    ...(basePageData as PageType),
    blocks: blocksWithMediaData,
    language_code: languageCode,
    language_id: languageId,
    translation_group_id: selectedPage.translation_group_id,
  };
}