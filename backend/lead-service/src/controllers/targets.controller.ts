import type { Request, Response } from "express";
import { dbPool } from "../config/database.js";

export async function getAllTargets(_req: Request, res: Response): Promise<Response> {
  try {
    const [rows]: any = await dbPool.query(
      `SELECT telecaller_id as telecallerId,
              telecaller_name as telecallerName,
              telecaller_email as telecallerEmail,
              daily_calls_target as dailyCallsTarget,
              daily_interested_target as dailyInterestedTarget,
              daily_duration_target_seconds as dailyDurationTargetSeconds,
              updated_by as updatedBy,
              updated_at as updatedAt
       FROM telecaller_targets
       ORDER BY telecaller_name ASC`
    );

    return res.json({ success: true, count: rows?.length || 0, data: rows || [] });

  } catch (error: any) {
    console.error("[getAllTargets DB Error]:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to fetch telecaller targets" });
  }
}

export async function getTargetByTelecallerId(req: Request, res: Response): Promise<Response> {
  const { telecallerId } = req.params;

  try {
    const [rows]: any = await dbPool.query(
      `SELECT telecaller_id as telecallerId,
              telecaller_name as telecallerName,
              telecaller_email as telecallerEmail,
              daily_calls_target as dailyCallsTarget,
              daily_interested_target as dailyInterestedTarget,
              daily_duration_target_seconds as dailyDurationTargetSeconds,
              updated_by as updatedBy,
              updated_at as updatedAt
       FROM telecaller_targets
       WHERE telecaller_id = ? LIMIT 1`,
      [String(telecallerId)]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      // Return sensible defaults if not explicitly configured yet
      return res.json({
        success: true,
        data: {
          telecallerId: String(telecallerId),
          telecallerName: "Telecaller Agent",
          telecallerEmail: `agent_${telecallerId}@markops.in`,
          dailyCallsTarget: 30,
          dailyInterestedTarget: 5,
          dailyDurationTargetSeconds: 3600,
          isDefault: true
        }
      });
    }

    return res.json({ success: true, data: rows[0] });

  } catch (error: any) {
    console.error("[getTargetByTelecallerId DB Error]:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to fetch target" });
  }
}

export async function upsertTarget(req: Request, res: Response): Promise<Response> {
  const telecallerId = req.params.telecallerId || req.body.telecallerId || req.body.telecaller_id;
  const {
    telecallerName,
    telecaller_name,
    telecallerEmail,
    telecaller_email,
    dailyCallsTarget,
    daily_calls_target,
    dailyInterestedTarget,
    daily_interested_target,
    dailyDurationTargetSeconds,
    daily_duration_target_seconds,
    talk_time_target_minutes,
    talkTimeTargetMinutes,
    updatedBy,
    updated_by
  } = req.body;

  if (!telecallerId) {
    return res.status(400).json({ success: false, error: "'telecallerId' is required" });
  }

  const user = (req as any).user;
  const targetId = String(telecallerId).trim();
  const name = String(telecallerName || telecaller_name || user?.name || `Agent #${targetId}`).trim();
  const email = String(telecallerEmail || telecaller_email || user?.email || `agent_${targetId}@markops.in`).trim();
  const callsTarget = Number(dailyCallsTarget ?? daily_calls_target ?? 30);
  const interestedTarget = Number(dailyInterestedTarget ?? daily_interested_target ?? 5);

  let rawDuration = dailyDurationTargetSeconds ?? daily_duration_target_seconds;
  if (rawDuration === undefined && (talk_time_target_minutes !== undefined || talkTimeTargetMinutes !== undefined)) {
    rawDuration = Number(talk_time_target_minutes ?? talkTimeTargetMinutes) * 60;
  }
  const durationTarget = Number(rawDuration ?? 3600);
  const editor = String(updatedBy || updated_by || user?.name || user?.email || "System Admin");

  try {
    await dbPool.query(
      `INSERT INTO telecaller_targets 
        (telecaller_id, telecaller_name, telecaller_email, daily_calls_target, daily_interested_target, daily_duration_target_seconds, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
        telecaller_name = VALUES(telecaller_name),
        telecaller_email = VALUES(telecaller_email),
        daily_calls_target = VALUES(daily_calls_target),
        daily_interested_target = VALUES(daily_interested_target),
        daily_duration_target_seconds = VALUES(daily_duration_target_seconds),
        updated_by = VALUES(updated_by),
        updated_at = NOW()`,
      [targetId, name, email, callsTarget, interestedTarget, durationTarget, editor]
    );

    const [saved]: any = await dbPool.query(
      `SELECT telecaller_id as telecallerId,
              telecaller_name as telecallerName,
              telecaller_email as telecallerEmail,
              daily_calls_target as dailyCallsTarget,
              daily_interested_target as dailyInterestedTarget,
              daily_duration_target_seconds as dailyDurationTargetSeconds,
              updated_by as updatedBy,
              updated_at as updatedAt
       FROM telecaller_targets WHERE telecaller_id = ? LIMIT 1`,
      [targetId]
    );

    return res.status(200).json({
      success: true,
      message: `Target for Telecaller #${targetId} configured successfully`,
      data: saved?.[0]
    });

  } catch (error: any) {
    console.error("[upsertTarget DB Error]:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to save telecaller target" });
  }
}

export async function getTelecallerProgress(req: Request, res: Response): Promise<Response> {
  const { telecallerId } = req.params;

  try {
    // 1. Fetch configured target
    const [targets]: any = await dbPool.query(
      "SELECT * FROM telecaller_targets WHERE telecaller_id = ? LIMIT 1",
      [String(telecallerId)]
    );

    const target = targets?.[0] || {
      daily_calls_target: 30,
      daily_interested_target: 5,
      daily_duration_target_seconds: 3600
    };

    // 2. Fetch actuals for today from call_logs
    const [actuals]: any = await dbPool.query(
      `SELECT 
        COUNT(id) as actualCalls,
        COALESCE(SUM(duration_seconds), 0) as actualDurationSeconds,
        COALESCE(SUM(CASE WHEN call_outcome LIKE '%INTERESTED%' AND call_outcome NOT LIKE '%NOT%' THEN 1 ELSE 0 END), 0) as actualInterested,
        COALESCE(SUM(CASE WHEN call_outcome LIKE '%NOT_INTERESTED%' THEN 1 ELSE 0 END), 0) as actualNotInterested,
        COALESCE(SUM(CASE WHEN call_outcome LIKE '%BUSY%' THEN 1 ELSE 0 END), 0) as actualBusy,
        COALESCE(SUM(CASE WHEN call_outcome LIKE '%NO_ANSWER%' THEN 1 ELSE 0 END), 0) as actualNoAnswer
       FROM call_logs
       WHERE telecaller_id = ? 
         AND DATE(created_at) = CURDATE()`,
      [String(telecallerId)]
    );

    const act = actuals?.[0] || {};
    const callsDone = Number(act.actualCalls || 0);
    const durationDone = Number(act.actualDurationSeconds || 0);
    const interestedDone = Number(act.actualInterested || 0);

    const callsTarget = Number(target.daily_calls_target || 30);
    const durationTarget = Number(target.daily_duration_target_seconds || 3600);
    const interestedTarget = Number(target.daily_interested_target || 5);

    return res.json({
      success: true,
      data: {
        telecallerId: String(telecallerId),
        date: new Date().toISOString().split("T")[0],
        calls: {
          target: callsTarget,
          actual: callsDone,
          percentage: callsTarget > 0 ? Math.min(100, Math.round((callsDone / callsTarget) * 100)) : 0,
          completed: callsDone >= callsTarget
        },
        duration: {
          targetSeconds: durationTarget,
          actualSeconds: durationDone,
          percentage: durationTarget > 0 ? Math.min(100, Math.round((durationDone / durationTarget) * 100)) : 0,
          completed: durationDone >= durationTarget
        },
        interested: {
          target: interestedTarget,
          actual: interestedDone,
          percentage: interestedTarget > 0 ? Math.min(100, Math.round((interestedDone / interestedTarget) * 100)) : 0,
          completed: interestedDone >= interestedTarget
        },
        outcomesBreakdown: {
          interested: interestedDone,
          notInterested: Number(act.actualNotInterested || 0),
          busy: Number(act.actualBusy || 0),
          noAnswer: Number(act.actualNoAnswer || 0)
        }
      }
    });

  } catch (error: any) {
    console.error("[getTelecallerProgress DB Error]:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to calculate progress" });
  }
}
