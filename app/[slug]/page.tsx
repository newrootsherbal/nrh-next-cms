// app/[slug]/page.tsx
import React from 'react';
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from 'next';
import type { Page as PageType, Block as BlockType, Language, ImageBlockContent, Media } from "@/utils/supabase/types";
import PageClientContent from "./PageClientContent";

export const dynamicParams = true;
export const revalidate = 3600;

interface PageProps {
  params: { slug: string; };
}

// Fetch page data directly by slug. The language is inherent to the slug's DB entry.
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

  const langInfo = pageData.languages as unknown as { id: number; code: string };
  if (!langInfo) {
      console.error(`Language information missing for page slug '${slug}'`);
      return null; // Or handle as critical error
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
    // translation_group_id is already on pageData
  } as (PageType & { blocks: BlockType[]; language_code: string; language_id: number; translation_group_id: string; });
}

export async function generateStaticParams(): Promise<PageProps['params'][]> {
  const supabase = createClient();
  const { data: pages, error } = await supabase
    .from("pages")
    .select("slug") // Select all published slugs
    .eq("status", "published");

  if (error || !pages) {
    console.error("SSG: Error fetching page slugs for static params", error);
    return [];
  }
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const pageData = await getPageDataBySlug(params.slug);

  if (!pageData) {
    return { title: "Page Not Found" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const supabase = createClient();
  const { data: languages } = await supabase.from('languages').select('id, code');
  const { data: pageTranslations } = await supabase
    .from('pages')
    .select('language_id, slug') // Now slug will be different for each language
    .eq('translation_group_id', pageData.translation_group_id) // Find by group
    .eq('status', 'published');

  const alternates: { [key: string]: string } = {};
  if (languages && pageTranslations) {
    pageTranslations.forEach(pt => {
      const langInfo = languages.find(l => l.id === pt.language_id);
      if (langInfo) {
        alternates[langInfo.code] = `${siteUrl}/${pt.slug}`; // Use the specific slug for that language
      }
    });
  }

  return {
    title: pageData.meta_title || pageData.title,
    description: pageData.meta_description || "",
    alternates: {
      canonical: `${siteUrl}/${params.slug}`, // The current page's URL
      languages: Object.keys(alternates).length > 0 ? alternates : undefined,
    },
  };
}

export default async function DynamicPage({ params }: PageProps) {
  const pageData = await getPageDataBySlug(params.slug);

  if (!pageData) {
    // Implement smart redirect logic here later (Phase 7 advanced)
    // For now, just 404 if the exact slug isn't found and published.
    notFound();
  }

  return (
    <PageClientContent
      initialPageData={pageData} // Pass the directly fetched page data
      currentSlug={params.slug} // Pass current slug for context
    />
  );
}
