import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserAnswerResponse, UserBehaviorAnalytics, LessonSession } from '@/types/flowchart';
import { LessonAnswer } from '@/types/lesson';

export const useBehaviorTracking = (lessonId: string) => {
  const { user } = useAuth();
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [sessionStartTime] = useState(Date.now());
  const [currentNodeStartTime, setCurrentNodeStartTime] = useState(Date.now());
  const [visitedNodes, setVisitedNodes] = useState<string[]>([]);
  const [completionPath, setCompletionPath] = useState<string[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<string, string[]>>(new Map());
  const [responseTimes, setResponseTimes] = useState<Map<string, number>>(new Map());
  const [retryCount, setRetryCount] = useState(0);
  const [isTracking, setIsTracking] = useState(false);

  // Start tracking when hook is initialized
  useEffect(() => {
    if (user && lessonId) {
      setIsTracking(true);
    }
  }, [user, lessonId]);

  // Track node visit
  const trackNodeVisit = (nodeId: string) => {
    if (!isTracking) return;

    const now = Date.now();
    const responseTime = now - currentNodeStartTime;
    
    // Record response time for previous node
    if (visitedNodes.length > 0) {
      const previousNode = visitedNodes[visitedNodes.length - 1];
      setResponseTimes(prev => new Map(prev).set(previousNode, responseTime));
    }

    // Update visited nodes and completion path
    setVisitedNodes(prev => [...prev, nodeId]);
    setCompletionPath(prev => [...prev, nodeId]);
    setCurrentNodeStartTime(now);
  };

  // Track answer selection
  const trackAnswerSelection = async (
    nodeId: string, 
    answers: LessonAnswer[], 
    isMultiple: boolean = false
  ) => {
    if (!isTracking || !user) return;

    const answerIds = answers.map(a => a.id);
    const scores = answers.map(a => a.score !== undefined && a.score !== null ? a.score : 0);
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const responseTime = Date.now() - currentNodeStartTime;

    // Update local state
    setSelectedAnswers(prev => new Map(prev).set(nodeId, answerIds));
    setResponseTimes(prev => new Map(prev).set(nodeId, responseTime));

    // Save to database
    try {
      const { error } = await supabase
        .from('user_answer_responses')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          node_id: nodeId,
          answer_ids: answerIds,
          scores: scores,
          total_score: totalScore,
          response_time_ms: responseTime
        });

      if (error) {
        console.error('Error tracking answer response:', error);
      }
    } catch (error) {
      console.error('Error saving answer response:', error);
    }
  };

  // Track lesson completion
  const trackLessonCompletion = async () => {
    if (!isTracking || !user) return;

    const totalTimeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);

    try {
      const { error } = await supabase
        .from('user_behavior_analytics')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          session_id: sessionId,
          total_time_spent: totalTimeSpent,
          nodes_visited: visitedNodes,
          completion_path: completionPath,
          retry_count: retryCount
        });

      if (error) {
        console.error('Error tracking lesson completion:', error);
      } else {
        console.log('Lesson completion tracked successfully');
      }
    } catch (error) {
      console.error('Error saving behavior analytics:', error);
    }
  };

  // Track lesson restart
  const trackLessonRestart = () => {
    setRetryCount(prev => prev + 1);
    setVisitedNodes([]);
    setCompletionPath([]);
    setSelectedAnswers(new Map());
    setResponseTimes(new Map());
    setCurrentNodeStartTime(Date.now());
  };

  // Get session data
  const getSessionData = (): LessonSession => ({
    session_id: sessionId,
    lesson_id: lessonId,
    user_id: user?.id || '',
    start_time: sessionStartTime,
    current_node_id: visitedNodes[visitedNodes.length - 1] || '',
    visited_nodes: visitedNodes,
    selected_answers: selectedAnswers,
    session_data: {
      total_time_spent: Math.floor((Date.now() - sessionStartTime) / 1000),
      response_times: responseTimes
    }
  });

  // Get analytics summary
  const getAnalyticsSummary = () => {
    const totalTime = Math.floor((Date.now() - sessionStartTime) / 1000);
    const avgResponseTime = visitedNodes.length > 0 
      ? Array.from(responseTimes.values()).reduce((sum, time) => sum + time, 0) / responseTimes.size
      : 0;

    return {
      totalTimeSpent: totalTime,
      nodesVisited: visitedNodes.length,
      averageResponseTime: Math.round(avgResponseTime),
      retryCount,
      completionRate: visitedNodes.length > 0 ? (completionPath.length / visitedNodes.length) * 100 : 0
    };
  };

  return {
    trackNodeVisit,
    trackAnswerSelection,
    trackLessonCompletion,
    trackLessonRestart,
    getSessionData,
    getAnalyticsSummary,
    isTracking,
    sessionId,
    visitedNodes,
    completionPath
  };
}; 