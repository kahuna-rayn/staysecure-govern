import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LessonWithTranslation {
  id: string;
  title: string; // Original title
  description: string; // Translated or original description
  status: string;
  created_at: string;
  estimated_duration: number;
  title_translated?: string;
  description_translated?: string;
  language_code?: string;
}

export const useLessonsWithTranslations = (languageCode?: string) => {
  const [lessons, setLessons] = useState<LessonWithTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLessons = async () => {
    try {
      // First fetch all lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false });

      if (lessonsError) throw lessonsError;

      // If no language selected or English, return original lessons
      if (!languageCode || languageCode === 'en') {
        setLessons(lessonsData || []);
        return;
      }

      // Fetch translations for selected language
      const lessonIds = (lessonsData || []).map(lesson => lesson.id);
      const { data: translationsData, error: translationsError } = await supabase
        .from('lesson_translations')
        .select('*')
        .in('lesson_id', lessonIds)
        .eq('language_code', languageCode);

      if (translationsError) {
        console.warn('Failed to fetch translations:', translationsError);
        // Fall back to original lessons
        setLessons(lessonsData || []);
        return;
      }

      // Combine lessons with translations
      const processedLessons = (lessonsData || []).map(lesson => {
        const translation = translationsData?.find(
          (t: any) => t.lesson_id === lesson.id
        );

        return {
          ...lesson,
          title: translation?.title_translated || lesson.title,
          description: translation?.description_translated || lesson.description || '',
          title_translated: translation?.title_translated,
          description_translated: translation?.description_translated,
          language_code: translation?.language_code,
        };
      });

      setLessons(processedLessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch lessons",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [languageCode]);

  return {
    lessons,
    loading,
    refetch: fetchLessons
  };
};