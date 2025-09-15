import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LessonNode, LessonAnswer } from '@/types/flowchart';

export const useLessonData = (lessonId: string) => {
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
      // Fetch nodes
      const { data: nodesData, error: nodesError } = await supabase
        .from('lesson_nodes')
        .select('*')
        .eq('lesson_id', lessonId);

      if (nodesError) throw nodesError;

      // Debug: Log the raw nodes data from Supabase in useLessonData
      

      // Fetch answers
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

  const saveLessonData = async () => {
    try {
      console.log('Starting save operation...');
      console.log('Nodes to save:', nodes);
      
      // Delete existing nodes and answers
      await supabase.from('lesson_answers').delete().in('node_id', nodes.map(n => n.id));
      await supabase.from('lesson_nodes').delete().eq('lesson_id', lessonId);

      // Insert nodes
      if (nodes.length > 0) {
        const nodesToInsert = nodes.map(node => {
          console.log(`Processing node ${node.id} of type: ${node.type}`);
          
          const baseNode = {
            id: node.id,
            lesson_id: lessonId,
            type: node.type,
            content: node.content,
            position_x: node.position_x ? Math.round(node.position_x) : null,
            position_y: node.position_y ? Math.round(node.position_y) : null,
            next_node_id: node.next_node_id || null,
            media_type: node.media_type,
            media_url: node.media_url,
            media_alt: node.media_alt,
            embedded_lesson_id: node.embedded_lesson_id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Only include selection fields for question type nodes
          if (node.type === 'question') {
            const questionNode = {
              ...baseNode,
              allow_multiple: node.allow_multiple || false,
              max_selections: node.max_selections || 1,
              min_selections: node.min_selections || 1,
            };
            console.log(`Question node ${node.id} includes selection fields:`, questionNode);
            return questionNode;
          }

          // For non-question nodes, explicitly set selection fields to null
          const nonQuestionNode = {
            ...baseNode,
            allow_multiple: null,
            max_selections: null,
            min_selections: null,
          };
          console.log(`Non-question node ${node.id} (type: ${node.type}) with null selection fields:`, nonQuestionNode);
          return nonQuestionNode;
        });
        
        console.log('Nodes to insert:', nodesToInsert);
        
        const { data, error: nodesError } = await supabase
          .from('lesson_nodes')
          .insert(nodesToInsert)
          .select();

        if (nodesError) {
          console.error('Supabase nodes error:', nodesError);
          throw nodesError;
        }
        
        console.log('Nodes inserted successfully:', data);
      }

      // Insert answers
      if (answers.length > 0) {
        const answersToInsert = answers.map(answer => ({
          id: answer.id,
          node_id: answer.node_id,
          text: answer.text,
          next_node_id: answer.next_node_id || null,
          score: answer.score || null,
          is_correct: answer.is_correct || false,
          explanation: answer.explanation || null,
          created_at: new Date().toISOString()
        }));
        
        console.log('Answers to insert:', answersToInsert);
        
        const { data: answersData, error: answersError } = await supabase
          .from('lesson_answers')
          .insert(answersToInsert)
          .select();

        if (answersError) {
          console.error('Supabase answers error:', answersError);
          throw answersError;
        }
        
        console.log('Answers inserted successfully:', answersData);
      }

      // Update lesson start node - find the visually first node (top-left position)
      if (nodes.length > 0) {
        // Sort nodes by position: first by Y (top to bottom), then by X (left to right)
        const sortedNodes = [...nodes].sort((a, b) => {
          const aY = a.position_y || 0;
          const bY = b.position_y || 0;
          if (Math.abs(aY - bY) < 50) { // If Y positions are close, sort by X
            const aX = a.position_x || 0;
            const bX = b.position_x || 0;
            return aX - bX;
          }
          return aY - bY;
        });
        
        const startNodeId = sortedNodes[0].id;
        console.log(`Setting start node to: ${startNodeId} (${sortedNodes[0].content})`);
        
        const { error: lessonError } = await supabase
          .from('lessons')
          .update({ start_node_id: startNodeId })
          .eq('id', lessonId);

        if (lessonError) throw lessonError;
      }

      toast({
        title: "Success",
        description: "Lesson decision tree saved successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast({
        title: "Error",
        description: "Failed to save lesson",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  return {
    nodes,
    setNodes,
    answers,
    setAnswers,
    loading,
    saveLessonData,
    refetch: fetchLessonData
  };
};