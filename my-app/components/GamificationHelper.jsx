//call api entities here
import { BADGES_CATALOG, calculateLevel } from './GamificationWidget';

// Points awarded for different activities
const POINTS = {
    QUESTION_CORRECT: 10,
    QUESTION_INCORRECT: 2,
    MOCK_EXAM_COMPLETE: 100,
    MOCK_EXAM_BONUS_HIGH: 50, // 85%+
    MOCK_EXAM_BONUS_PERFECT: 100, // 100%
    FLASHCARD_REVIEW: 5,
    FLASHCARD_EASY: 3, // Bonus for easy rating
    DAILY_CHALLENGE: 50,
    DAILY_CHALLENGE_PERFECT: 25, // Bonus
    STREAK_DAY: 10,
    STREAK_WEEK: 50,
    STREAK_MONTH: 200,
    BLL_QUESTION_CORRECT: 10,
    BLL_SESSION_COMPLETE: 50,
};

// Check and award badges based on user stats
export const checkAndAwardBadges = async (user) => {
    if (!user) return [];
    
    const currentBadges = Array.isArray(user.badges_earned) ? user.badges_earned : [];
    const newBadges = [];
    
    try {
        // Get user's statistics
        const answerLogs = await base44.entities.UserAnswerLog.filter(
            { created_by: user.email },
            '-created_date',
            10000
        );
        const examAttempts = await base44.entities.ExamAttempt.filter(
            { created_by: user.email },
            '-created_date',
            1000
        );
        const flashcardReviews = await base44.entities.FlashCardReview.filter(
            { created_by: user.email },
            '-created_date',
            10000
        );
        
        const safeAnswerLogs = Array.isArray(answerLogs) ? answerLogs : [];
        const safeExamAttempts = Array.isArray(examAttempts) ? examAttempts : [];
        const safeFlashcardReviews = Array.isArray(flashcardReviews) ? flashcardReviews : [];
        
        // Practice badges
        const totalQuestions = safeAnswerLogs.length;
        if (totalQuestions >= 10 && !currentBadges.includes('first_steps')) {
            newBadges.push('first_steps');
        }
        if (totalQuestions >= 100 && !currentBadges.includes('practice_warrior')) {
            newBadges.push('practice_warrior');
        }
        if (totalQuestions >= 500 && !currentBadges.includes('question_master')) {
            newBadges.push('question_master');
        }
        if (totalQuestions >= 1000 && !currentBadges.includes('question_legend')) {
            newBadges.push('question_legend');
        }
        
        // Mock exam badges
        const completedMocks = safeExamAttempts.filter(a => a.completed).length;
        if (completedMocks >= 1 && !currentBadges.includes('mock_beginner')) {
            newBadges.push('mock_beginner');
        }
        if (completedMocks >= 10 && !currentBadges.includes('mock_veteran')) {
            newBadges.push('mock_veteran');
        }
        if (completedMocks >= 25 && !currentBadges.includes('mock_champion')) {
            newBadges.push('mock_champion');
        }
        
        // Accuracy badges
        const highScoreMocks = safeExamAttempts.filter(a => 
            a.completed && (a.score / a.total_questions) >= 0.85
        );
        if (highScoreMocks.length > 0 && !currentBadges.includes('accuracy_ace')) {
            newBadges.push('accuracy_ace');
        }
        
        const perfectScoreMocks = safeExamAttempts.filter(a => 
            a.completed && a.score === a.total_questions
        );
        if (perfectScoreMocks.length > 0 && !currentBadges.includes('perfect_score')) {
            newBadges.push('perfect_score');
        }
        
        // Streak badges
        const currentStreak = user.current_streak || 0;
        if (currentStreak >= 7 && !currentBadges.includes('week_warrior')) {
            newBadges.push('week_warrior');
        }
        if (currentStreak >= 30 && !currentBadges.includes('month_legend')) {
            newBadges.push('month_legend');
        }
        if (currentStreak >= 60 && !currentBadges.includes('unstoppable')) {
            newBadges.push('unstoppable');
        }
        if (currentStreak >= 100 && !currentBadges.includes('dedication_master')) {
            newBadges.push('dedication_master');
        }
        
        // Flashcard badges
        if (safeFlashcardReviews.length >= 100 && !currentBadges.includes('flashcard_fan')) {
            newBadges.push('flashcard_fan');
        }
        
        // Level badges
        const level = user.level || calculateLevel(user.gamification_points || 0);
        if (level >= 5 && !currentBadges.includes('level_5_milestone')) {
            newBadges.push('level_5_milestone');
        }
        if (level >= 10 && !currentBadges.includes('level_10_milestone')) {
            newBadges.push('level_10_milestone');
        }
        
        // Points badges
        const points = user.gamification_points || 0;
        if (points >= 10000 && !currentBadges.includes('points_milestone_10k')) {
            newBadges.push('points_milestone_10k');
        }
        if (points >= 50000 && !currentBadges.includes('points_milestone_50k')) {
            newBadges.push('points_milestone_50k');
        }
        
        // Subject mastery (check if user has 90%+ accuracy in a subject with 50+ questions)
        const subjectStats = {};
        for (const log of safeAnswerLogs) {
            const subject = log.subject || 'Unknown';
            if (!subjectStats[subject]) {
                subjectStats[subject] = { correct: 0, total: 0 };
            }
            subjectStats[subject].total++;
            if (log.was_correct) {
                subjectStats[subject].correct++;
            }
        }
        
        const masteredSubjects = Object.values(subjectStats).filter(stats => 
            stats.total >= 50 && (stats.correct / stats.total) >= 0.9
        );
        
        if (masteredSubjects.length >= 1 && !currentBadges.includes('subject_master')) {
            newBadges.push('subject_master');
        }
        if (masteredSubjects.length >= 3 && !currentBadges.includes('multi_subject_master')) {
            newBadges.push('multi_subject_master');
        }
        
        // Check if practiced all 16 subjects
        const uniqueSubjects = new Set(safeAnswerLogs.map(log => log.subject).filter(Boolean));
        if (uniqueSubjects.size >= 16 && !currentBadges.includes('complete_coverage')) {
            newBadges.push('complete_coverage');
        }
        
        // Update user if new badges were earned
        if (newBadges.length > 0) {
            const updatedBadges = [...currentBadges, ...newBadges];
            const totalBadgePoints = newBadges.reduce((sum, badgeId) => {
                const badge = BADGES_CATALOG[badgeId];
                return sum + (badge?.points || 0);
            }, 0);
            
            await base44.auth.updateMe({
                badges_earned: updatedBadges,
                gamification_points: (user.gamification_points || 0) + totalBadgePoints
            });
        }
        
        return newBadges;
    } catch (error) {
        console.error('Error checking badges:', error);
        return [];
    }
};

// Update streak and award points
export const updateStreak = async (user) => {
    if (!user) return { streakUpdated: false, pointsAwarded: 0 };
    
    try {
        const today = new Date().toISOString().split('T')[0];
        const lastActivity = user.last_activity_date;
        
        let newStreak = user.current_streak || 0;
        let pointsAwarded = 0;
        let streakBroken = false;
        
        if (!lastActivity || lastActivity !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (lastActivity === yesterdayStr) {
                // Continue streak
                newStreak += 1;
                pointsAwarded = POINTS.STREAK_DAY;
                
                // Bonus for milestones
                if (newStreak === 7) pointsAwarded += POINTS.STREAK_WEEK;
                if (newStreak === 30) pointsAwarded += POINTS.STREAK_MONTH;
            } else if (!lastActivity) {
                // First day
                newStreak = 1;
                pointsAwarded = POINTS.STREAK_DAY;
            } else {
                // Streak broken
                newStreak = 1;
                pointsAwarded = POINTS.STREAK_DAY;
                streakBroken = true;
            }
            
            const updatedData = {
                current_streak: newStreak,
                longest_streak: Math.max(newStreak, user.longest_streak || 0),
                last_activity_date: today,
                gamification_points: (user.gamification_points || 0) + pointsAwarded
            };
            
            await base44.auth.updateMe(updatedData);
            
            return { 
                streakUpdated: true, 
                pointsAwarded, 
                newStreak,
                streakBroken
            };
        }
        
        return { streakUpdated: false, pointsAwarded: 0 };
    } catch (error) {
        console.error('Error updating streak:', error);
        return { streakUpdated: false, pointsAwarded: 0 };
    }
};

// Process rewards for completing a practice session (QuestionBank or BLL)
export const processSessionRewards = async (user, score, totalQuestions, isBLL = false) => {
    if (!user) return { points: 0, newBadges: [] };
    
    try {
        let points = 0;
        const correctAnswers = score;
        const incorrectAnswers = totalQuestions - score;
        
        // Points for answers
        points += correctAnswers * (isBLL ? POINTS.BLL_QUESTION_CORRECT : POINTS.QUESTION_CORRECT);
        points += incorrectAnswers * POINTS.QUESTION_INCORRECT;
        
        // Session completion bonus
        if (isBLL) {
            points += POINTS.BLL_SESSION_COMPLETE;
        }
        
        // Update streak
        const streakResult = await updateStreak(user);
        points += streakResult.pointsAwarded;
        
        // Update user
        const newLevel = calculateLevel((user.gamification_points || 0) + points);
        await base44.auth.updateMe({
            gamification_points: (user.gamification_points || 0) + points,
            total_questions_answered: (user.total_questions_answered || 0) + totalQuestions,
            level: newLevel
        });
        
        // Check for new badges
        const updatedUser = await base44.auth.me();
        const newBadges = await checkAndAwardBadges(updatedUser);
        
        return { 
            points, 
            newBadges,
            streakInfo: streakResult
        };
    } catch (error) {
        console.error('Error processing session rewards:', error);
        return { points: 0, newBadges: [] };
    }
};

// Process rewards for completing a mock exam
export const processMockExamRewards = async (user, score, totalQuestions) => {
    if (!user) return { points: 0, newBadges: [] };
    
    try {
        let points = POINTS.MOCK_EXAM_COMPLETE;
        
        const percentage = (score / totalQuestions) * 100;
        
        // Bonus for high scores
        if (percentage >= 85) {
            points += POINTS.MOCK_EXAM_BONUS_HIGH;
        }
        if (percentage === 100) {
            points += POINTS.MOCK_EXAM_BONUS_PERFECT;
        }
        
        // Update streak
        const streakResult = await updateStreak(user);
        points += streakResult.pointsAwarded;
        
        // Update user
        const newLevel = calculateLevel((user.gamification_points || 0) + points);
        await base44.auth.updateMe({
            gamification_points: (user.gamification_points || 0) + points,
            level: newLevel
        });
        
        // Check for new badges
        const updatedUser = await base44.auth.me();
        const newBadges = await checkAndAwardBadges(updatedUser);
        
        return { 
            points, 
            newBadges,
            streakInfo: streakResult
        };
    } catch (error) {
        console.error('Error processing mock exam rewards:', error);
        return { points: 0, newBadges: [] };
    }
};

// Process rewards for flashcard review session
export const processFlashcardRewards = async (user, reviewCount, easyCount = 0) => {
    if (!user) return { points: 0, newBadges: [] };
    
    try {
        let points = reviewCount * POINTS.FLASHCARD_REVIEW;
        points += easyCount * POINTS.FLASHCARD_EASY;
        
        // Update streak
        const streakResult = await updateStreak(user);
        points += streakResult.pointsAwarded;
        
        // Update user
        const newLevel = calculateLevel((user.gamification_points || 0) + points);
        await base44.auth.updateMe({
            gamification_points: (user.gamification_points || 0) + points,
            level: newLevel
        });
        
        // Check for new badges
        const updatedUser = await base44.auth.me();
        const newBadges = await checkAndAwardBadges(updatedUser);
        
        return { 
            points, 
            newBadges,
            streakInfo: streakResult
        };
    } catch (error) {
        console.error('Error processing flashcard rewards:', error);
        return { points: 0, newBadges: [] };
    }
};

// Process rewards for daily challenge
export const processDailyChallengeRewards = async (score, totalQuestions) => {
    try {
        const user = await base44.auth.me();
        if (!user) return { points: 0, newBadges: [] };
        
        let points = POINTS.DAILY_CHALLENGE;
        
        if (score === totalQuestions) {
            points += POINTS.DAILY_CHALLENGE_PERFECT;
        }
        
        // Update streak
        const streakResult = await updateStreak(user);
        points += streakResult.pointsAwarded;
        
        // Update user
        const newLevel = calculateLevel((user.gamification_points || 0) + points);
        await base44.auth.updateMe({
            gamification_points: (user.gamification_points || 0) + points,
            total_questions_answered: (user.total_questions_answered || 0) + totalQuestions,
            level: newLevel
        });
        
        // Check for new badges
        const updatedUser = await base44.auth.me();
        const newBadges = await checkAndAwardBadges(updatedUser);
        
        return { 
            points, 
            newBadges,
            streakInfo: streakResult
        };
    } catch (error) {
        console.error('Error processing daily challenge rewards:', error);
        return { points: 0, newBadges: [] };
    }
};

export { POINTS };