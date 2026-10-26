import type { Request, Response } from "express";
import { dbPool, LEADS_TABLE } from "../config/database.js";

export async function getFollowUps(req: Request, res: Response): Promise<Response> {
  const {
    telecallerId,
    telecaller_id,
    filter = "ALL", // TODAY, UPCOMING, OVERDUE, ALL
    date,
    limit = 50,
    offset = 0
  } = req.query;

  const targetTelecallerId = telecallerId || telecaller_id;

  try {
    let query = `
      SELECT cl.id as callLogId,
             cl.lead_id as leadId,
             cl.telecaller_id as telecallerId,
             cl.call_outcome as lastCallOutcome,
             cl.call_remarks as lastCallRemarks,
             cl.follow_up_time as scheduledTime,
             cl.created_at as loggedAt,
             l.first_name as leadFirstName,
             l.last_name as leadLastName,
             l.phone as leadPhone,
             l.email as leadEmail,
             l.campaign as campaignName,
             l.ad as adName,
             l.status as leadCurrentStatus,
             CASE
               WHEN cl.follow_up_time < NOW() THEN 'OVERDUE'
               WHEN DATE(cl.follow_up_time) = CURDATE() THEN 'TODAY'
               ELSE 'UPCOMING'
             END as followUpStatus
      FROM call_logs cl
      JOIN ${LEADS_TABLE} l ON cl.lead_id = l.id
      WHERE cl.follow_up_required = 1 
        AND cl.follow_up_time IS NOT NULL
    `;
    const params: any[] = [];

    if (targetTelecallerId) {
      query += " AND cl.telecaller_id = ?";
      params.push(targetTelecallerId);
    }

    if (date) {
      query += " AND DATE(cl.follow_up_time) = ?";
      params.push(date);
    } else if (filter === "TODAY") {
      query += " AND DATE(cl.follow_up_time) = CURDATE()";
    } else if (filter === "UPCOMING") {
      query += " AND cl.follow_up_time > NOW()";
    } else if (filter === "OVERDUE") {
      query += " AND cl.follow_up_time < NOW()";
    }

    query += " ORDER BY cl.follow_up_time ASC LIMIT ? OFFSET ?";
    params.push(Number(limit) || 50, Number(offset) || 0);

    const [rows]: any = await dbPool.query(query, params);

    // Summary counts
    const [counts]: any = await dbPool.query(`
      SELECT 
        COUNT(CASE WHEN DATE(follow_up_time) = CURDATE() THEN 1 END) as todayCount,
        COUNT(CASE WHEN follow_up_time < NOW() THEN 1 END) as overdueCount,
        COUNT(CASE WHEN follow_up_time > NOW() AND DATE(follow_up_time) > CURDATE() THEN 1 END) as upcomingCount,
        COUNT(*) as totalPending
      FROM call_logs
      WHERE follow_up_required = 1 AND follow_up_time IS NOT NULL
    `);

    return res.json({
      success: true,
      summary: counts?.[0] || { todayCount: 0, overdueCount: 0, upcomingCount: 0, totalPending: 0 },
      count: rows?.length || 0,
      data: rows || []
    });

  } catch (error: any) {
    console.error("[getFollowUps DB Error]:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to fetch follow-ups" });
  }
}

export async function completeFollowUp(req: Request, res: Response): Promise<Response> {
  const { callLogId } = req.params;

  try {
    const [result]: any = await dbPool.query(
      "UPDATE call_logs SET follow_up_required = 0, updated_at = NOW() WHERE id = ?",
      [callLogId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Follow-up record not found" });
    }

    return res.json({
      success: true,
      message: `Follow-up on Call Log #${callLogId} marked as completed`
    });

  } catch (error: any) {
    console.error("[completeFollowUp DB Error]:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to complete follow-up" });
  }
}

