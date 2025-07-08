import { createClient } from '@/utils/supabase/server';
import { cache } from 'react';

export const getTranslations = cache(async () => {
  const supabase = createClient();
  const { data, error } = await supabase.from('translations').select('*');
  if (error) {
    console.error('Error fetching translations:', error);
    return {};
  }
  const translations = data.reduce((acc, item) => {
    acc[item.key] = item.translations;
    return acc;
  }, {} as Record<string, any>);

  return translations;
});

export const getTranslator = async (locale: string) => {
  const translations = await getTranslations();

  return (key: string, params?: Record<string, string | number>) => {
    const translationData = translations[key];
    let text = translationData?.[locale] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }

    return text;
  };
};