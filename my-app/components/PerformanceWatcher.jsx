"use client";
import { useEffect, useCallback, useRef } from 'react';
//call api entities here

/**
 * Silent background component that monitors user performance patterns
 * and flags concerning trends to admin for wellbeing support
 */
export default function PerformanceWatcher({ user, recentAttempts }) {
  const hasChecked = useRef(false);

  const createFlag = useCallback(async (concernType, severity, message) => {
    try {
      // Check if similar flag already exists in last 7 days
      const existingFlags = await base44.entities.MentalHealthFlag.filter({
        user_email: user.email,
        resolved: false
      });

      const recentFlag = existingFlags.find(f => {
        const daysSince = (Date.now() - new Date(f.created_date).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince < 7 && f.concern_type === concernType;
      });

      if (recentFlag) {
        return; // Don't create duplicate
      }

      await base44.entities.MentalHealthFlag.create({
        user_email: user.email,
        user_name: user.full_name || 'Student',
        concern_type: concernType,
        severity: severity,
        message: message,
        source: 'performance_pattern',
        performance_context: {
          recent_attempts: recentAttempts.length,
          avg_score: (recentAttempts.reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0) / recentAttempts.length).toFixed(1)
        },
        admin_contacted: false,
        resolved: false
      });

      console.log('🚩 Mental health flag created for admin review');
    } catch (error) {
      console.error('Failed to create flag:', error);
      // Silent fail - don't disrupt user experience
    }
  }, [user, recentAttempts]);

  const checkPerformancePatterns = useCallback(async () => {
    try {
      const lastThree = recentAttempts.slice(0, 3);
      const scores = lastThree.map(a => (a.score / a.total_questions) * 100);
      
      // Pattern 1: Consistent low performance (all < 40%)
      const allLow = scores.every(s => s < 40);
      if (allLow) {
        await createFlag('struggling_with_content', 'high', 
          `Student consistently scoring below 40% (last 3: ${scores.map(s => s.toFixed(0) + '%').join(', ')}). May need study approach adjustment or additional support.`);
        return;
      }

      // Pattern 2: Declining trend (each attempt worse)
      const isDecline = scores.length >= 3 && scores[0] < scores[1] && scores[1] < scores[2];
      const bigDrop = scores.length >= 2 && (scores[1] - scores[0]) > 15;
      
      if (isDecline || bigDrop) {
        await createFlag('low_confidence', 'medium',
          `Performance declining over recent attempts: ${scores.map(s => s.toFixed(0) + '%').join(' → ')}. Student may be losing confidence or experiencing increased stress.`);
        return;
      }

      // Pattern 3: Excessive attempts without improvement
      if (recentAttempts.length > 10) {
        const firstFive = recentAttempts.slice(-5).map(a => (a.score / a.total_questions) * 100);
        const lastFive = recentAttempts.slice(0, 5).map(a => (a.score / a.total_questions) * 100);
        const avgFirst = firstFive.reduce((sum, s) => sum + s, 0) / firstFive.length;
        const avgLast = lastFive.reduce((sum, s) => sum + s, 0) / lastFive.length;
        
        if (avgLast < avgFirst + 5) {
          await createFlag('burnout', 'medium',
            `Student has taken ${recentAttempts.length} exams but scores not improving (${avgFirst.toFixed(0)}% → ${avgLast.toFixed(0)}%). Possible burnout or ineffective study method.`);
        }
      }

    } catch (error) {
      console.error('Performance watcher error:', error);
      // Silent fail - don't disrupt user experience
    }
  }, [recentAttempts, createFlag]);

  useEffect(() => {
    // Only check once when component mounts or when attempts change
    if (!user || !recentAttempts || recentAttempts.length < 3 || hasChecked.current) {
      return;
    }

    hasChecked.current = true;
    checkPerformancePatterns();

    // Reset check after 5 minutes to allow re-checking if data updates
    const resetTimer = setTimeout(() => {
      hasChecked.current = false;
    }, 5 * 60 * 1000);

    return () => clearTimeout(resetTimer);
  }, [user, recentAttempts, checkPerformancePatterns]);

  return null; // Silent component
}