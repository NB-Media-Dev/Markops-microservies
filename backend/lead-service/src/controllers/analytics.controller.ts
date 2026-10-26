import type { Request, Response } from "express";
import { dbPool } from "../config/database.js";

export async function getDashboardMetrics(_req: Request, res: Response): Promise<Response> {
  try {
    // 1. Today's call metrics
    const [todayCalls]: any = await dbPool.query(`
      SELECT 
        COUNT(id) as totalCallsToday,
        COALESCE(SUM(duration_seconds), 0) as totalDurationSecondsToday,
        COALESCE(AVG(duration_seconds), 0) as averageCallDurationSeconds,
        COUNT(DISTINCT telecaller_id) as activeTelecallersToday,
        COALESCE(SUM(CASE WHEN call_outcome LIKE '%INTERESTED%' AND call_outcome NOT LIKE '%NOT%' THEN 1 ELSE 0 END), 0) as interestedCallsToday,
        COALESCE(SUM(CASE WHEN call_outcome LIKE '%NOT_INTERESTED%' THEN 1 ELSE 0 END), 0) as notInterestedCallsToday,
        COALESCE(SUM(CASE WHEN call_outcome LIKE '%BUSY%' THEN 1 ELSE 0 END), 0) as busyCallsToday,
        COALESCE(SUM(CASE WHEN call_outcome LIKE '%NO_ANSWER%' THEN 1 ELSE 0 END), 0) as noAnswerCallsToday,
        COALESCE(SUM(CASE WHEN call_outcome LIKE '%PAID%' THEN 1 ELSE 0 END), 0) as paidConversionsToday
      FROM call_logs
      WHERE DATE(created_at) = CURDATE()
    `);

    // 2. All-time call metrics
    const [allTimeCalls]: any = await dbPool.query(`
      SELECT 
        COUNT(id) as totalCallsAllTime,
        COALESCE(SUM(duration_seconds), 0) as totalDurationSecondsAllTime,
        COUNT(DISTINCT lead_id) as uniqueLeadsCalled
      FROM call_logs
    `);

    // 3. Follow-ups summary
    const [followUps]: any = await dbPool.query(`
      SELECT 
        COUNT(CASE WHEN DATE(follow_up_time) = CURDATE() THEN 1 END) as followUpsToday,
        COUNT(CASE WHEN follow_up_time < NOW() THEN 1 END) as overdueFollowUps,
        COUNT(*) as totalPendingFollowUps
      FROM call_logs
      WHERE follow_up_required = 1 AND follow_up_time IS NOT NULL
    `);

    const metrics = todayCalls?.[0] || {};
    const totalToday = Number(metrics.totalCallsToday || 0);
    const durationToday = Number(metrics.totalDurationSecondsToday || 0);
    const interestedToday = Number(metrics.interestedCallsToday || 0);

    const conversionRateToday = totalToday > 0 
      ? Math.round((interestedToday / totalToday) * 10000) / 100 
      : 0;

    return res.json({
      success: true,
      data: {
        today: {
          totalCalls: totalToday,
          totalDurationSeconds: durationToday,
          totalDurationFormatted: `${Math.floor(durationToday / 3600)}h ${Math.floor((durationToday % 3600) / 60)}m ${durationToday % 60}s`,
          averageDurationSeconds: Math.round(Number(metrics.averageCallDurationSeconds || 0)),
          activeTelecallers: Number(metrics.activeTelecallersToday || 0),
          conversionRatePercent: conversionRateToday,
          outcomes: {
            interested: interestedToday,
            notInterested: Number(metrics.notInterestedCallsToday || 0),
            busy: Number(metrics.busyCallsToday || 0),
            noAnswer: Number(metrics.noAnswerCallsToday || 0),
            paid: Number(metrics.paidConversionsToday || 0)
          }
        },
        followUps: followUps?.[0] || { followUpsToday: 0, overdueFollowUps: 0, totalPendingFollowUps: 0 },
        allTime: allTimeCalls?.[0] || { totalCallsAllTime: 0, totalDurationSecondsAllTime: 0, uniqueLeadsCalled: 0 },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("[getDashboardMetrics DB Error]:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to calculate telecalling metrics" });
  }
}

export async function getLeaderboard(_req: Request, res: Response): Promise<Response> {
  try {
    const [rows]: any = await dbPool.query(`
      SELECT 
        cl.telecaller_id as telecallerId,
        COALESCE(tt.telecaller_name, CONCAT('Agent #', cl.telecaller_id)) as telecallerName,
        COALESCE(tt.telecaller_email, CONCAT('agent_', cl.telecaller_id, '@markops.in')) as telecallerEmail,
        COUNT(cl.id) as callsMadeToday,
        COALESCE(SUM(cl.duration_seconds), 0) as totalDurationSecondsToday,
        COALESCE(SUM(CASE WHEN cl.call_outcome LIKE '%INTERESTED%' AND cl.call_outcome NOT LIKE '%NOT%' THEN 1 ELSE 0 END), 0) as interestedCountToday,
        COALESCE(tt.daily_calls_target, 30) as targetCalls,
        ROUND((COUNT(cl.id) / COALESCE(tt.daily_calls_target, 30)) * 100) as callsTargetCompletionPct
      FROM call_logs cl
      LEFT JOIN telecaller_targets tt ON CAST(cl.telecaller_id AS CHAR) = tt.telecaller_id
      WHERE DATE(cl.created_at) = CURDATE()
      GROUP BY cl.telecaller_id, tt.telecaller_name, tt.telecaller_email, tt.daily_calls_target
      ORDER BY interestedCountToday DESC, callsMadeToday DESC
    `);

    return res.json({ success: true, count: rows?.length || 0, data: rows || [] });

  } catch (error: any) {
    console.error("[getLeaderboard DB Error]:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to fetch telecaller leaderboard" });
  }
}
