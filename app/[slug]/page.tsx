// app/[slug]/page.tsx
import React from 'react';
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from 'next';
import type { Page as PageType, Block as BlockType, Language } from "@/utils/supabase/types"; // Removed unused Media, ImageBlockContent
import PageClientContent from "./PageClientContent";
import { getPageDataBySlug } from "./page.utils";

export const dynamicParams = true;
export const revalidate = 3600;

// Define the type for the resolved params object
interface ResolvedPageParams {
  slug: string;
}

// Define the PageProps for the component and generateMetadata
interface PageProps {
  params: Promise<ResolvedPageParams>; // params is now a Promise
  // searchParams?: { [key: string]: string | string[] | undefined }; // Add if you use searchParams
}

export async function generateStaticParams(): Promise<ResolvedPageParams[]> { // Return type uses ResolvedPageParams
  const supabase = createClient();
  const { data: pages, error } = await supabase
    .from("pages")
    .select("slug")
    .eq("status", "published");

  if (error || !pages) {
    console.error("SSG: Error fetching page slugs for static params", error);
    return [];
  }
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata(
  { params: paramsPromise }: PageProps, // Destructure the promise
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await paramsPromise; // Await the promise to get the actual params
  const pageData = await getPageDataBySlug(params.slug);

  if (!pageData) {
    return { title: "Page Not Found" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const supabase = createClient();
  const { data: languages } = await supabase.from('languages').select('id, code');
  const { data: pageTranslations } = await supabase
    .from('pages')
    .select('language_id, slug')
    .eq('translation_group_id', pageData.translation_group_id)
    .eq('status', 'published');

  const alternates: { [key: string]: string } = {};
  if (languages && pageTranslations) {
    pageTranslations.forEach(pt => {
      const langInfo = languages.find(l => l.id === pt.language_id);
      if (langInfo) {
        alternates[langInfo.code] = `${siteUrl}/${pt.slug}`;
      }
    });
  }

  return {
    title: pageData.meta_title || pageData.title,
    description: pageData.meta_description || "",
    alternates: {
      canonical: `${siteUrl}/${params.slug}`,
      languages: Object.keys(alternates).length > 0 ? alternates : undefined,
    },
  };
}

export default async function DynamicPage({ params: paramsPromise }: PageProps) { // Destructure the promise
  const params = await paramsPromise; // Await the promise
  const pageData = await getPageDataBySlug(params.slug);

  if (!pageData) {
    notFound();
  }

  return (
    <PageClientContent
      initialPageData={pageData}
      currentSlug={params.slug}
    />
  );
}