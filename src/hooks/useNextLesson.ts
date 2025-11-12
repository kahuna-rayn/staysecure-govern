import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from 'staysecure-auth';

interface NextLessonInfo {
  hasNext: boolean;
  nextLessonTitle?: string;
  nextLessonId?: string;
  canStart: boolean;
}

export const useNextLesson = (lessonId: string, learningTrackId?: string) => {
  console.log('🔍 useNextLesson - Hook called with:', { lessonId, learningTrackId });
  
  const [nextLessonInfo, setNextLessonInfo] = useState<NextLessonInfo>({
    hasNext: false,
    canStart: false
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  console.log('🔍 useNextLesson - About to define fetchNextLesson');

  const fetchNextLesson = useCallback(async () => {
    console.log('🔍 fetchNextLesson - Starting with:', { learningTrackId, lessonId });
    if (!learningTrackId || !lessonId) {
      console.log('🔍 fetchNextLesson - Missing IDs, returning');
      return;
    }
    
    setLoading(true);
    try {
      // Get current lesson's order in the track
      console.log('🔍 fetchNextLesson - Getting current lesson order');
      const { data: currentLessonData, error: currentError } = await supabase
        .from('learning_track_lessons')
        .select('order_index')
        .eq('learning_track_id', learningTrackId)
        .eq('lesson_id', lessonId)
        .single();

      console.log('🔍 fetchNextLesson - Current lesson data:', { currentLessonData, currentError });

      if (currentError || !currentLessonData) {
        console.log('🔍 fetchNextLesson - No current lesson data found');
        setNextLessonInfo({ hasNext: false, canStart: false });
        return;
      }

      // Get next available (uncompleted) lesson in the track
      const { data: nextLessonsData, error: nextError } = await supabase
        .from('learning_track_lessons')
        .select(`
          order_index,
          lesson_id,
          lessons!inner(
            id,
            title,
            status
          )
        `)
        .eq('learning_track_id', learningTrackId)
        .gt('order_index', currentLessonData.order_index)
        .order('order_index');

      if (nextError || !nextLessonsData || nextLessonsData.length === 0) {
        setNextLessonInfo({ hasNext: false, canStart: false });
        return;
      }

      // Check each next lesson to find the first uncompleted one
      console.log('🔍 fetchNextLesson - Found next lessons:', nextLessonsData.length);
      for (const nextLessonData of nextLessonsData) {
        console.log('🔍 fetchNextLesson - Checking lesson:', {
          title: nextLessonData.lessons.title,
          id: nextLessonData.lessons.id,
          status: nextLessonData.lessons.status
        });
        
        // Check if this lesson is already completed
        const { data: progressData } = await supabase
          .from('user_lesson_progress')
          .select('completed_at')
          .eq('lesson_id', nextLessonData.lessons.id)
          .eq('user_id', user?.id || '')
          .maybeSingle();

        // If this lesson is not completed and is published, use it
        const isCompleted = !!progressData?.completed_at;
        const canStart = nextLessonData.lessons.status === 'published';
        
        console.log('🔍 fetchNextLesson - Lesson status:', {
          title: nextLessonData.lessons.title,
          isCompleted,
          canStart,
          completedAt: progressData?.completed_at
        });

        if (!isCompleted && canStart) {
          console.log('🔍 useNextLesson - Found next lesson:', {
            title: nextLessonData.lessons.title,
            id: nextLessonData.lessons.id,
            isCompleted,
            canStart
          });
          setNextLessonInfo({
            hasNext: true,
            nextLessonTitle: nextLessonData.lessons.title,
            nextLessonId: nextLessonData.lessons.id,
            canStart: true
          });
          return;
        }
      }

      // No uncompleted lessons found
      setNextLessonInfo({ hasNext: false, canStart: false });
    } catch (error) {
      console.error('Error fetching next lesson:', error);
      setNextLessonInfo({ hasNext: false, canStart: false });
    } finally {
      setLoading(false);
    }
  }, [learningTrackId, lessonId, user?.id]);

  useEffect(() => {
    console.log('🔍 useNextLesson - Effect triggered:', { learningTrackId, lessonId });
    console.log('🔍 useNextLesson - Condition check:', { 
      hasLearningTrackId: !!learningTrackId, 
      hasLessonId: !!lessonId,
      learningTrackId,
      lessonId
    });
    if (learningTrackId && lessonId) {
      console.log('🔍 useNextLesson - Calling fetchNextLesson');
      fetchNextLesson();
    } else {
      console.log('🔍 useNextLesson - No track or lesson ID, setting hasNext to false');
      setNextLessonInfo({ hasNext: false, canStart: false });
    }
  }, [lessonId, learningTrackId, fetchNextLesson]);

  return { nextLessonInfo, loading };
};