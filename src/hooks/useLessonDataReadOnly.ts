import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LessonNode, LessonAnswer } from '@/types/flowchart';

export const useLessonDataReadOnly = (lessonId: string) => {
  const [nodes, setNodes] = useState<LessonNode[]>([]);
  const [answers, setAnswers] = useState<LessonAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLessonData = async () => {
    // Don't fetch if lessonId is empty, null, or 'temp-id'
    if (!lessonId || lessonId === 'temp-id') {
      setLoading(false);
      return;
    }

    try {
      // Fetch nodes (READ ONLY)
      const { data: nodesData, error: nodesError } = await supabase
        .from('lesson_nodes')
        .select('*')
        .eq('lesson_id', lessonId);

      if (nodesError) throw nodesError;

      // Debug: Log the raw nodes data from Supabase


      // Fetch answers (READ ONLY)
      const { data: answersData, error: answersError } = await supabase
        .from('lesson_answers')
        .select('*')
        .in('node_id', (nodesData || []).map(node => node.id));

      if (answersError) throw answersError;


      setNodes((nodesData || []) as LessonNode[]);
      setAnswers(answersData || []);
    } catch (error) {
      console.error('Error fetching lesson data:', error);
      toast({
        title: "Error",
        description: "Failed to load lesson data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  return {
    nodes,
    answers,
    loading,
    refetch: fetchLessonData
  };
};