import type { Request, Response } from "express";
import { dbPool, LEADS_TABLE } from "../config/database.js";


function toMysqlDatetime(isoOrDate: string | Date | null | undefined): string | null {
  if (!isoOrDate) return null;
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace("T", " ");
}


function mapOutcomeToLeadStatus(outcome: string, followUpRequired: boolean): string {
  const norm = outcome.trim().toUpperCase();
  if (norm.includes("NOT_INTERESTED") || norm === "REJECTED") return "NOT_INTERESTED";
  if (norm.includes("INTERESTED")) return "INTERESTED";
  if (norm.includes("PAID") || norm === "CONVERTED") return "PAID";
  if (norm.includes("BUSY")) return "CALL_BUSY";
  if (norm.includes("NO_ANSWER") || norm.includes("RINGING") || norm.includes("UNANSWERED")) return "NO_ANSWER";
  if (norm.includes("FOLLOW_UP") || norm.includes("CALLBACK") || followUpRequired) return "FOLLOW_UP";
  return "ASSIGNED";
}

export async function createCallLog(req: Request, res: Response): Promise<Response> {
  const {
    leadId,
    lead_id,
    telecallerId,
    telecaller_id,
    callOutcome,
    call_outcome,
    durationSeconds,
    duration_seconds,
    callRemarks,
    call_remarks,
    followUpRequired,
    follow_up_required,
    followUpTime,
    follow_up_time
  } = req.body;

  const targetLeadId = leadId || lead_id ? parseInt(String(leadId || lead_id), 10) : null;
  const user = (req as any).user;
  const targetTelecallerId = telecallerId || telecaller_id ? parseInt(String(telecallerId || telecaller_id), 10) : (user?.id || 1);
  const targetOutcome = (callOutcome || call_outcome || (req.body as any)?.outcome || "").trim();
  const targetDuration = durationSeconds !== undefined ? parseInt(String(durationSeconds), 10) : (duration_seconds !== undefined ? parseInt(String(duration_seconds), 10) : 0);
  const targetRemarks = callRemarks || call_remarks || (req.body as any)?.remarks || (req.body as any)?.notes || null;
  const targetFollowUpReq = followUpRequired === true || follow_up_required === true || followUpRequired === 1 || follow_up_required === 1 || Boolean((req.body as any)?.followUpDate || (req.body as any)?.followUpTime) ? 1 : 0;
  const targetFollowUpTime = (targetFollowUpReq && (followUpTime || follow_up_time || (req.body as any)?.followUpDate)) ? toMysqlDatetime(followUpTime || follow_up_time || (req.body as any)?.followUpDate) : null;

  if (!targetLeadId) {
    return res.status(400).json({ success: false, error: "'leadId' is required" });
  }
  if (!targetOutcome) {
    return res.status(400).json({ success: false, error: "'callOutcome' is required (e.g. Connected, Busy, No Answer, Interested, Follow-up)" });
  }

  try {
   
    // 1. Verify lead exists in campaign database (digital_db.leads)
    const [leads]: any = await dbPool.query(`SELECT id, status, call_disposition FROM ${LEADS_TABLE} WHERE id = ? LIMIT 1`, [targetLeadId]);
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(404).json({ success: false, error: `Lead #${targetLeadId} not found in campaign database` });
    }


    const [result]: any = await dbPool.query(
      `INSERT INTO call_logs 
        (lead_id, telecaller_id, call_outcome, duration_seconds, call_remarks, follow_up_required, follow_up_time, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        targetLeadId,
        targetTelecallerId,
        targetOutcome,
        targetDuration,
        targetRemarks,
        targetFollowUpReq,
        targetFollowUpTime
      ]
    );

    const callLogId = result.insertId;

  
    const newStatus = mapOutcomeToLeadStatus(targetOutcome, targetFollowUpReq === 1);
    await dbPool.query(
      `UPDATE ${LEADS_TABLE} SET call_disposition = ?, status = ?, updated_at = NOW() WHERE id = ?`,
      [targetOutcome, newStatus, targetLeadId]
    );


    const [created]: any = await dbPool.query(
      `SELECT cl.id, cl.lead_id as leadId, cl.telecaller_id as telecallerId,
              cl.call_outcome as callOutcome, cl.duration_seconds as durationSeconds,
              cl.call_remarks as callRemarks, cl.follow_up_required as followUpRequired,
              cl.follow_up_time as followUpTime, cl.created_at as createdAt, cl.updated_at as updatedAt,
              l.first_name as leadFirstName, l.last_name as leadLastName, l.phone as leadPhone,
              l.status as leadCurrentStatus, l.call_disposition as leadCallDisposition
       FROM call_logs cl
       LEFT JOIN ${LEADS_TABLE} l ON cl.lead_id = l.id
       WHERE cl.id = ? LIMIT 1`,
      [callLogId]
    );

    return res.status(201).json({
      success: true,
      message: "Call log recorded and lead status updated successfully",
      call: created?.[0],
      lead: leads?.[0],
      data: created?.[0]
    });

  } catch (error: any) {
    console.error("[createCallLog DB Error]:", error?.message || error);
    return res.status(500).json({ success: false, error: error?.message || "Failed to record call log" });
  }
}

export async function getCallLogs(req: Request, res: Response): Promise<Response> {
  const {
    leadId,
    lead_id,
    telecallerId,
    telecaller_id,
    callOutcome,
    call_outcome,
    followUpRequired,
    follow_up_required,
    startDate,
    endDate,
    search,
    limit = 50,
    offset = 0
  } = req.query;

  const targetLeadId = leadId || lead_id;
  const targetTelecallerId = telecallerId || telecaller_id;
  const targetOutcome = callOutcome || call_outcome;

  try {
    let query = `
      SELECT cl.id, cl.lead_id as leadId, cl.telecaller_id as telecallerId,
             cl.call_outcome as callOutcome, cl.duration_seconds as durationSeconds,
             cl.call_remarks as callRemarks, cl.follow_up_required as followUpRequired,
             cl.follow_up_time as followUpTime, cl.created_at as createdAt, cl.updated_at as updatedAt,
             l.first_name as leadFirstName, l.last_name as leadLastName, l.phone as leadPhone,
             l.email as leadEmail, l.campaign as campaignName, l.ad as adName,
             l.status as leadCurrentStatus
      FROM call_logs cl
      LEFT JOIN ${LEADS_TABLE} l ON cl.lead_id = l.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (targetLeadId) {
      conditions.push("cl.lead_id = ?");
      params.push(targetLeadId);
    }
    if (targetTelecallerId) {
      conditions.push("cl.telecaller_id = ?");
      params.push(targetTelecallerId);
    }
    if (targetOutcome && targetOutcome !== "ALL") {
      conditions.push("cl.call_outcome = ?");
      params.push(targetOutcome);
    }
    if (followUpRequired !== undefined || follow_up_required !== undefined) {
      const val = (followUpRequired === "true" || follow_up_required === "true" || followUpRequired === "1" || follow_up_required === "1") ? 1 : 0;
      conditions.push("cl.follow_up_required = ?");
      params.push(val);
    }
    if (startDate) {
      conditions.push("cl.created_at >= ?");
      params.push(startDate);
    }
    if (endDate) {
      conditions.push("cl.created_at <= ?");
      params.push(endDate);
    }
    if (search) {
      conditions.push("(l.first_name LIKE ? OR l.last_name LIKE ? OR l.phone LIKE ? OR cl.call_remarks LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY cl.created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit) || 50, Number(offset) || 0);

    const [rows]: any = await dbPool.query(query, params);
    return res.json({ success: true, count: rows?.length || 0, data: rows || [] });

  } catch (error: any) {
    console.error("[getCallLogs DB Error]:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to fetch call logs" });
  }
}

export async function getCallLogById(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;

  try {
    const [rows]: any = await dbPool.query(
      `SELECT cl.id, cl.lead_id as leadId, cl.telecaller_id as telecallerId,
              cl.call_outcome as callOutcome, cl.duration_seconds as durationSeconds,
              cl.call_remarks as callRemarks, cl.follow_up_required as followUpRequired,
              cl.follow_up_time as followUpTime, cl.created_at as createdAt, cl.updated_at as updatedAt,
              l.first_name as leadFirstName, l.last_name as leadLastName, l.phone as leadPhone,
              l.email as leadEmail, l.campaign as campaignName, l.ad as adName,
              l.status as leadCurrentStatus
       FROM call_logs cl
       LEFT JOIN ${LEADS_TABLE} l ON cl.lead_id = l.id
       WHERE cl.id = ? LIMIT 1`,
      [id]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Call log not found" });
    }

    return res.json({ success: true, data: rows[0] });

  } catch (error: any) {
    console.error("[getCallLogById DB Error]:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to fetch call log" });
  }
}

export async function updateCallLog(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;
  const {
    callOutcome,
    call_outcome,
    durationSeconds,
    duration_seconds,
    callRemarks,
    call_remarks,
    followUpRequired,
    follow_up_required,
    followUpTime,
    follow_up_time
  } = req.body;

  try {
    const [existing]: any = await dbPool.query("SELECT * FROM call_logs WHERE id = ? LIMIT 1", [id]);
    if (!Array.isArray(existing) || existing.length === 0) {
      return res.status(404).json({ success: false, error: "Call log not found to update" });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (callOutcome || call_outcome) {
      updates.push("call_outcome = ?");
      params.push((callOutcome || call_outcome).trim());
    }
    if (durationSeconds !== undefined || duration_seconds !== undefined) {
      updates.push("duration_seconds = ?");
      params.push(Number(durationSeconds !== undefined ? durationSeconds : duration_seconds));
    }
    if (callRemarks !== undefined || call_remarks !== undefined) {
      updates.push("call_remarks = ?");
      params.push(callRemarks !== undefined ? callRemarks : call_remarks);
    }
    if (followUpRequired !== undefined || follow_up_required !== undefined) {
      const isReq = (followUpRequired === true || follow_up_required === true || followUpRequired === 1 || follow_up_required === 1) ? 1 : 0;
      updates.push("follow_up_required = ?");
      params.push(isReq);
    }
    if (followUpTime !== undefined || follow_up_time !== undefined) {
      updates.push("follow_up_time = ?");
      params.push(toMysqlDatetime(followUpTime !== undefined ? followUpTime : follow_up_time));
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: "No fields provided to update" });
    }

    updates.push("updated_at = NOW()");
    params.push(id);

    await dbPool.query(`UPDATE call_logs SET ${updates.join(", ")} WHERE id = ?`, params);

    const [updated]: any = await dbPool.query(
      `SELECT cl.id, cl.lead_id as leadId, cl.telecaller_id as telecallerId,
              cl.call_outcome as callOutcome, cl.duration_seconds as durationSeconds,
              cl.call_remarks as callRemarks, cl.follow_up_required as followUpRequired,
              cl.follow_up_time as followUpTime, cl.created_at as createdAt, cl.updated_at as updatedAt
       FROM call_logs cl
       WHERE cl.id = ? LIMIT 1`,
      [id]
    );

    return res.json({ success: true, data: updated?.[0] });

  } catch (error: any) {
    console.error("[updateCallLog DB Error]:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to update call log" });
  }
}

export async function deleteCallLog(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;

  try {
    const [result]: any = await dbPool.query("DELETE FROM call_logs WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Call log not found to delete" });
    }
    return res.json({ success: true, message: `Call log #${id} deleted successfully` });
  } catch (error: any) {
    console.error("[deleteCallLog DB Error]:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to delete call log" });
  }
}

export async function getLeadCallHistory(req: Request, res: Response): Promise<Response> {
  const { leadId } = req.params;

  try {
    const [rows]: any = await dbPool.query(
      `SELECT cl.id, cl.lead_id as leadId, cl.telecaller_id as telecallerId,
              cl.call_outcome as callOutcome, cl.duration_seconds as durationSeconds,
              cl.call_remarks as callRemarks, cl.follow_up_required as followUpRequired,
              cl.follow_up_time as followUpTime, cl.created_at as createdAt
       FROM call_logs cl
       WHERE cl.lead_id = ?
       ORDER BY cl.created_at DESC`,
      [leadId]
    );

    return res.json({ success: true, count: rows?.length || 0, data: rows || [] });
  } catch (error: any) {
    console.error("[getLeadCallHistory DB Error]:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to fetch lead call history" });
  }
}
