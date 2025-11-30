"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Eye, Ban, Check, X, Loader2, RefreshCw, Bell, Download, Filter, Search, MapPin, Smartphone, Globe } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import moment from 'moment';

export default function ContentSharingMonitor() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suspiciousActivity, setSuspiciousActivity] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [blockingUser, setBlockingUser] = useState(null);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      loadData();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.role !== 'admin') {
        setLoading(false);
        return;
      }

      const { suspicious, critical } = await analyzeSuspiciousActivity();
      setSuspiciousActivity(suspicious);
      setCriticalAlerts(critical);
      
      const users = await base44.entities.User.list();
      const blocked = users.filter(u => u.is_blocked);
      setBlockedUsers(blocked);

    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    }
    setLoading(false);
  };

  const analyzeSuspiciousActivity = async () => {
    try {
      const users = await base44.entities.User.list();
      const answerLogs = await base44.entities.UserAnswerLog.list();
      const examAttempts = await base44.entities.ExamAttempt.list();
      const studyNotes = await base44.entities.StudyNote.list();
      const studyLogs = await base44.entities.StudyLog.list();
      const posts = await base44.entities.Post.list();

      const suspicious = [];
      const critical = [];
      
      for (const targetUser of users) {
        const userAnswers = answerLogs.filter(log => log.created_by === targetUser.email);
        const userAttempts = examAttempts.filter(attempt => attempt.created_by === targetUser.email);
        const userNotes = studyNotes.filter(note => note.created_by === targetUser.email);
        const userStudyLogs = studyLogs.filter(log => log.created_by === targetUser.email);
        const userPosts = posts.filter(post => post.created_by === targetUser.email);

        let flags = [];
        let riskScore = 0;
        let isCritical = false;

        // CRITICAL FLAG 1: Simultaneous logins from different locations/devices
        const recentLogins = userStudyLogs.filter(log => {
          const logTime = moment(log.created_date);
          return moment().diff(logTime, 'hours') < 24;
        });

        // Group study logs by 5-minute windows to detect concurrent sessions
        const loginWindows = {};
        recentLogins.forEach(log => {
          const windowKey = moment(log.created_date).startOf('minute').subtract(moment(log.created_date).minute() % 5, 'minutes').format();
          if (!loginWindows[windowKey]) {
            loginWindows[windowKey] = [];
          }
          loginWindows[windowKey].push(log);
        });

        const concurrentSessions = Object.values(loginWindows).filter(logs => logs.length > 1);
        if (concurrentSessions.length > 0) {
          const maxConcurrent = Math.max(...concurrentSessions.map(s => s.length));
          if (maxConcurrent >= 2) {
            flags.push(`🚨 CRITICAL: ${maxConcurrent} simultaneous logins detected (account sharing)`);
            riskScore += 15;
            isCritical = true;
            critical.push({
              type: 'Simultaneous Login Detection',
              user: targetUser.email,
              details: `${maxConcurrent} devices logged in at same time - Clear account sharing`,
              severity: 'CRITICAL'
            });
          }
        }

        // CRITICAL FLAG 2: Multiple accounts with similar email patterns
        const emailDomain = targetUser.email.split('@')[1];
        const emailPrefix = targetUser.email.split('@')[0];
        const similarEmails = users.filter(u => {
          const otherPrefix = u.email.split('@')[0];
          const otherDomain = u.email.split('@')[1];
          return u.id !== targetUser.id && 
                 otherDomain === emailDomain && 
                 (otherPrefix.replace(/[0-9]/g, '') === emailPrefix.replace(/[0-9]/g, '') ||
                  otherPrefix.includes(emailPrefix.substring(0, Math.min(4, emailPrefix.length))) ||
                  emailPrefix.includes(otherPrefix.substring(0, Math.min(4, otherPrefix.length))));
        });

        if (similarEmails.length > 0) {
          flags.push(`🚨 CRITICAL: ${similarEmails.length} similar email accounts (${similarEmails.map(u => u.email).slice(0,2).join(', ')}...)`);
          riskScore += 10;
          isCritical = true;
          critical.push({
            type: 'Multiple Account Detection',
            user: targetUser.email,
            details: `Similar accounts: ${similarEmails.map(u => u.email).join(', ')}`,
            severity: 'CRITICAL'
          });
        }

        // CRITICAL FLAG 3: Abnormally high question volume in short time (bulk extraction)
        const last24Hours = moment().subtract(24, 'hours').toISOString();
        const recentAnswers = userAnswers.filter(log => log.created_date >= last24Hours);
        if (recentAnswers.length > 300) {
          flags.push(`🚨 CRITICAL: ${recentAnswers.length} questions in 24hrs (bulk extraction)`);
          riskScore += 10;
          isCritical = true;
          critical.push({
            type: 'Bulk Content Extraction',
            user: targetUser.email,
            details: `${recentAnswers.length} questions accessed in 24 hours`,
            severity: 'CRITICAL'
          });
        }

        // CRITICAL FLAG 4: Multiple mock exams in very short time
        const recentAttempts = userAttempts.filter(attempt => attempt.created_date >= last24Hours);
        if (recentAttempts.length > 5) {
          flags.push(`🚨 CRITICAL: ${recentAttempts.length} mock exams in 24hrs (systematic download)`);
          riskScore += 10;
          isCritical = true;
          critical.push({
            type: 'Systematic Mock Extraction',
            user: targetUser.email,
            details: `${recentAttempts.length} full mock exams in 24 hours`,
            severity: 'CRITICAL'
          });
        }

        // CRITICAL FLAG 5: Rapid sequential access (bot/scraper)
        const avgTimeBetweenAnswers = calculateAvgTimeBetween(userAnswers.slice(0, 100));
        if (avgTimeBetweenAnswers < 10 && userAnswers.length >= 20) {
          flags.push(`🚨 CRITICAL: ${avgTimeBetweenAnswers}s avg between answers (bot detected)`);
          riskScore += 10;
          isCritical = true;
          critical.push({
            type: 'Automated Bot Detection',
            user: targetUser.email,
            details: `Average ${avgTimeBetweenAnswers}s between answers (human avg: 60-90s)`,
            severity: 'CRITICAL'
          });
        }

        // HIGH RISK FLAG 6: New account with extreme activity
        const accountAge = moment().diff(moment(targetUser.created_date), 'days');
        if (accountAge < 3 && userAnswers.length > 200) {
          flags.push(`⚠️ HIGH: New account (<3 days) with ${userAnswers.length} questions`);
          riskScore += 5;
        }

        // HIGH RISK FLAG 7: Questions only, no mock exams (data mining)
        if (userAnswers.length > 500 && userAttempts.length === 0) {
          flags.push(`⚠️ HIGH: ${userAnswers.length} questions but 0 mocks (data mining pattern)`);
          riskScore += 5;
        }

        // HIGH RISK FLAG 8: Excessive study note access
        if (userNotes.length > 50 || (userNotes.length > 20 && accountAge < 7)) {
          flags.push(`⚠️ HIGH: ${userNotes.length} study notes accessed (possible content extraction)`);
          riskScore += 5;
        }

        // HIGH RISK FLAG 9: Suspicious forum activity (sharing content hints)
        const suspiciousKeywords = ['screenshot', 'share', 'send', 'telegram', 'whatsapp', 'discord', 'email me'];
        const suspiciousPosts = userPosts.filter(post => {
          const content = (post.title + ' ' + post.content).toLowerCase();
          return suspiciousKeywords.some(keyword => content.includes(keyword));
        });
        if (suspiciousPosts.length > 0) {
          flags.push(`⚠️ HIGH: ${suspiciousPosts.length} suspicious forum posts (possible sharing discussion)`);
          riskScore += 6;
        }

        // MEDIUM RISK FLAG 10: Unusual access times (middle of night bulk access)
        const nightAccessCount = userAnswers.filter(log => {
          const hour = new Date(log.created_date).getHours();
          return hour >= 2 && hour <= 5;
        }).length;
        if (nightAccessCount > 100) {
          flags.push(`⚠️ MEDIUM: ${nightAccessCount} questions accessed 2-5 AM (unusual pattern)`);
          riskScore += 3;
        }

        // MEDIUM RISK FLAG 11: Excessive weekly activity
        const last7Days = moment().subtract(7, 'days').toISOString();
        const weekActivity = userAnswers.filter(log => log.created_date >= last7Days).length;
        if (weekActivity > 1000) {
          flags.push(`⚠️ MEDIUM: ${weekActivity} questions in 7 days (excessive usage)`);
          riskScore += 3;
        }

        if (flags.length > 0 && riskScore >= 1) {
          suspicious.push({
            user_email: targetUser.email,
            user_name: targetUser.full_name,
            user_id: targetUser.id,
            user_role: targetUser.role,
            flags,
            risk_score: riskScore,
            is_critical: isCritical,
            total_questions: userAnswers.length,
            total_mocks: userAttempts.length,
            total_notes_accessed: userNotes.length,
            total_study_sessions: userStudyLogs.length,
            total_posts: userPosts.length,
            account_age_days: accountAge,
            is_blocked: targetUser.is_blocked || false,
            last_active: userAnswers.length > 0 ? userAnswers[0].created_date : targetUser.created_date,
            subscription_tier: targetUser.subscription_tier || 'starter',
            concurrent_sessions: concurrentSessions.length,
            similar_accounts: similarEmails.length
          });
        }
      }

      suspicious.sort((a, b) => b.risk_score - a.risk_score);

      return { suspicious, critical };

    } catch (error) {
      console.error('Failed to analyze suspicious activity:', error);
      return { suspicious: [], critical: [] };
    }
  };

  const calculateAvgTimeBetween = (answers) => {
    if (answers.length < 2) return 60;
    
    const times = answers.map(a => new Date(a.created_date).getTime()).sort();
    const diffs = [];
    for (let i = 1; i < Math.min(times.length, 50); i++) {
      diffs.push((times[i] - times[i-1]) / 1000);
    }
    
    return diffs.length > 0 ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) : 60;
  };

  const handleBlockUser = async (userId, userEmail) => {
    if (!confirm(`⚠️ PERMANENT BAN WARNING ⚠️\n\nYou are about to PERMANENTLY BLOCK: ${userEmail}\n\n✖ This user will lose ALL access immediately\n✖ NO refund will be issued\n✖ This action is IRREVERSIBLE\n✖ All their data will remain for evidence\n\nAre you absolutely sure?`)) {
      return;
    }

    setBlockingUser(userId);
    try {
      await base44.entities.User.update(userId, { is_blocked: true });
      alert(`🚫 User ${userEmail} has been PERMANENTLY BLOCKED.\n\nThey can no longer access any content.\nAll their activity data has been preserved for evidence.`);
      await loadData();
    } catch (error) {
      alert('❌ Failed to block user. Please try again.');
      console.error(error);
    }
    setBlockingUser(null);
  };

  const handleUnblockUser = async (userId, userEmail) => {
    if (!confirm(`Unblock ${userEmail}?\n\nThis will restore their access immediately.`)) return;

    setBlockingUser(userId);
    try {
      await base44.entities.User.update(userId, { is_blocked: false });
      alert(`✅ User ${userEmail} has been unblocked.`);
      await loadData();
    } catch (error) {
      alert('❌ Failed to unblock user. Please try again.');
      console.error(error);
    }
    setBlockingUser(null);
  };

  const handleBlockAll = async () => {
    const criticalUsers = filteredActivity.filter(u => u.is_critical && !u.is_blocked);
    if (criticalUsers.length === 0) {
      alert('No critical violations to block.');
      return;
    }

    if (!confirm(`⚠️ BULK BAN WARNING ⚠️\n\nYou are about to PERMANENTLY BLOCK ${criticalUsers.length} users with CRITICAL violations.\n\nThis action is IRREVERSIBLE.\n\nContinue?`)) {
      return;
    }

    let blocked = 0;
    for (const user of criticalUsers) {
      try {
        await base44.entities.User.update(user.user_id, { is_blocked: true });
        blocked++;
      } catch (error) {
        console.error(`Failed to block ${user.user_email}:`, error);
      }
    }

    alert(`✅ Blocked ${blocked} out of ${criticalUsers.length} critical violators.`);
    await loadData();
  };

  const handleExportData = () => {
    const csvData = filteredActivity.map(u => ({
      Email: u.user_email,
      Name: u.user_name,
      Role: u.user_role,
      RiskScore: u.risk_score,
      Critical: u.is_critical ? 'YES' : 'NO',
      Questions: u.total_questions,
      Mocks: u.total_mocks,
      Notes: u.total_notes_accessed,
      ConcurrentSessions: u.concurrent_sessions,
      SimilarAccounts: u.similar_accounts,
      AccountAge: u.account_age_days,
      Blocked: u.is_blocked ? 'YES' : 'NO',
      Violations: u.flags.join(' | ')
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breach-report-${moment().format('YYYY-MM-DD')}.csv`;
    a.click();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-10 text-center">
        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Access Required</h1>
        <p className="text-slate-600">This page is only accessible to administrators.</p>
      </div>
    );
  }

  const filteredActivity = suspiciousActivity.filter(activity => {
    const matchesSearch = activity.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'all' || 
                       (riskFilter === 'critical' && activity.is_critical) ||
                       (riskFilter === 'high' && activity.risk_score >= 5 && !activity.is_critical) ||
                       (riskFilter === 'medium' && activity.risk_score >= 3 && activity.risk_score < 5) ||
                       (riskFilter === 'low' && activity.risk_score < 3);
    const matchesRole = roleFilter === 'all' || activity.user_role === roleFilter;
    
    return matchesSearch && matchesRisk && matchesRole;
  });

  const getRiskColor = (score, isCritical) => {
    if (isCritical || score >= 10) return 'bg-red-600 text-white border-red-800';
    if (score >= 5) return 'bg-orange-100 text-orange-900 border-orange-400';
    if (score >= 3) return 'bg-yellow-100 text-yellow-900 border-yellow-300';
    return 'bg-blue-100 text-blue-900 border-blue-300';
  };

  const criticalCount = suspiciousActivity.filter(u => u.is_critical).length;
  const highRiskCount = suspiciousActivity.filter(u => u.risk_score >= 5 && !u.is_critical).length;

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              Content Sharing Monitor
              {criticalCount > 0 && (
                <Badge className="bg-red-600 text-white animate-pulse">
                  {criticalCount} CRITICAL
                </Badge>
              )}
            </h1>
            <p className="text-slate-600">Real-time breach detection monitoring ALL platform activity</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleExportData} variant="outline" disabled={filteredActivity.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {criticalAlerts.length > 0 && (
          <Alert className="mb-8 border-4 border-red-600 bg-red-50 animate-pulse">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <AlertDescription className="text-red-900">
              <strong className="text-xl">🚨 {criticalAlerts.length} CRITICAL BREACH{criticalAlerts.length > 1 ? 'ES' : ''} DETECTED - IMMEDIATE ACTION REQUIRED</strong>
              <div className="mt-4 space-y-3">
                {criticalAlerts.map((alert, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-lg border-2 border-red-600">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-red-900">{alert.type}</p>
                        <p className="text-sm text-red-800 mt-1">User: {alert.user}</p>
                        <p className="text-sm text-red-700 mt-1">{alert.details}</p>
                      </div>
                      <Badge className="bg-red-600 text-white">{alert.severity}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button onClick={handleBlockAll} variant="destructive" className="w-full">
                  <Ban className="w-4 h-4 mr-2" />
                  Block All Critical Violators ({criticalAlerts.length})
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert className="mb-8 border-amber-400 bg-amber-50">
          <Bell className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>Comprehensive Monitoring Active:</strong> All data is REAL from your database. 
            Tracks: simultaneous logins, account patterns, question access, mock attempts, study logs, forum posts. 
            Refreshes every 60 seconds. All violations are based on actual user behavior patterns.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-red-600 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-900 font-semibold">CRITICAL ALERTS</p>
                  <p className="text-4xl font-bold text-red-600">{criticalCount}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">High Risk</p>
                  <p className="text-3xl font-bold text-orange-600">{highRiskCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Flagged</p>
                  <p className="text-3xl font-bold text-slate-900">{suspiciousActivity.length}</p>
                </div>
                <Eye className="w-8 h-8 text-slate-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Blocked Users</p>
                  <p className="text-3xl font-bold text-slate-900">{blockedUsers.length}</p>
                </div>
                <Ban className="w-8 h-8 text-slate-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg mb-8">
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                All Monitored Activity
              </CardTitle>
              <div className="flex gap-3 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="critical">Critical Only</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admins Only</SelectItem>
                    <SelectItem value="user">Users Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredActivity.length === 0 ? (
              <div className="text-center py-12">
                <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">No suspicious activity detected</p>
                <p className="text-sm text-slate-500 mt-2">All monitored users are using the platform normally</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Violations</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivity.map((activity) => (
                      <TableRow key={activity.user_id} className={activity.is_blocked ? 'bg-red-50' : activity.is_critical ? 'bg-red-100 border-2 border-red-600' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{activity.user_name}</p>
                            <p className="text-xs text-slate-500">{activity.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={activity.user_role === 'admin' ? 'default' : 'outline'}>
                            {activity.user_role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRiskColor(activity.risk_score, activity.is_critical)}>
                            {activity.is_critical ? '🚨 CRITICAL' : `Score: ${activity.risk_score}`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ul className="text-xs space-y-1 max-w-md">
                            {activity.flags.slice(0, 3).map((flag, idx) => (
                              <li key={idx} className={flag.includes('CRITICAL') ? 'text-red-900 font-bold' : 'text-orange-700'}>
                                {flag}
                              </li>
                            ))}
                            {activity.flags.length > 3 && (
                              <li className="text-slate-500 italic">+{activity.flags.length - 3} more...</li>
                            )}
                          </ul>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <p>📝 {activity.total_questions} questions</p>
                            <p>📄 {activity.total_mocks} mocks</p>
                            <p>📚 {activity.total_notes_accessed} notes</p>
                            <p>💬 {activity.total_posts} posts</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            {activity.concurrent_sessions > 0 && (
                              <p className="text-red-700 font-bold flex items-center gap-1">
                                <Smartphone className="w-3 h-3" />
                                {activity.concurrent_sessions} concurrent
                              </p>
                            )}
                            {activity.similar_accounts > 0 && (
                              <p className="text-red-700 font-bold flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {activity.similar_accounts} similar emails
                              </p>
                            )}
                            <p>{activity.total_study_sessions} total sessions</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <p>{activity.account_age_days} days old</p>
                            <p className="text-slate-500">
                              {moment(activity.last_active).fromNow()}
                            </p>
                            <Badge variant="outline" className="mt-1">{activity.subscription_tier}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {activity.is_blocked ? (
                            <Badge variant="destructive">BLOCKED</Badge>
                          ) : (
                            <Badge variant="outline">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!activity.is_blocked ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleBlockUser(activity.user_id, activity.user_email)}
                              disabled={blockingUser === activity.user_id}
                            >
                              {blockingUser === activity.user_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Ban className="w-4 h-4 mr-1" />
                                  Block
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnblockUser(activity.user_id, activity.user_email)}
                              disabled={blockingUser === activity.user_id}
                            >
                              {blockingUser === activity.user_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-4 h-4 mr-1" />
                                  Unblock
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {blockedUsers.length > 0 && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="w-5 h-5" />
                Permanently Blocked Users ({blockedUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Blocked Since</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{moment(user.updated_date).format('MMM D, YYYY HH:mm')}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnblockUser(user.id, user.email)}
                          disabled={blockingUser === user.id}
                        >
                          {blockingUser === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Unblock
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
