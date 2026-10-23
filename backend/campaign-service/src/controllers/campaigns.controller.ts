import type { Request, Response } from "express";
import { dbPool } from "../config/database.js";

export async function getCampaigns(req: Request, res: Response): Promise<Response> {
  const { status, ownerId, search, productId, product_id, packageId, package_id } = req.query;
  const targetProductId = productId || product_id;
  const targetPackageId = packageId || package_id;

  try {
    let query = `
      SELECT id, name, objective, product_id as productId, package_id as packageId,
             status, start_date as startDate, budget, spend,
             leads_count as leadsCount, paid_leads as paidLeads, conversions,
             auto_cpl as autoCpl, auto_conversion_pct as autoConversionPct,
             owner_id as ownerId, created_at as createdAt, updated_at as updatedAt
      FROM campaigns
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (status && status !== "ALL") {
      conditions.push("status = ?");
      params.push(status);
    }
    if (ownerId) {
      conditions.push("owner_id = ?");
      params.push(ownerId);
    }
    if (targetProductId) {
      conditions.push("product_id = ?");
      params.push(targetProductId);
    }
    if (targetPackageId) {
      conditions.push("package_id = ?");
      params.push(targetPackageId);
    }
    if (search) {
      conditions.push("name LIKE ?");
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC";

    const [rows]: any = await dbPool.query(query, params);
    return res.json({ success: true, data: rows || [] });
  } catch (e: any) {
    console.error("[getCampaigns DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to fetch campaigns" });
  }
}

export async function getCampaignById(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;

  try {
    const [rows]: any = await dbPool.query(
      `SELECT id, name, objective, product_id as productId, package_id as packageId,
              status, start_date as startDate, budget, spend,
              leads_count as leadsCount, paid_leads as paidLeads, conversions,
              auto_cpl as autoCpl, auto_conversion_pct as autoConversionPct,
              owner_id as ownerId, created_at as createdAt, updated_at as updatedAt
       FROM campaigns
       WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Campaign not found" });
    }

    const campaign = rows[0];

    // Fetch related Ads
    const [ads]: any = await dbPool.query(
      `SELECT id, campaign_id as campaignId, product_id as productId, package_id as packageId,
              meta_connection_id as metaConnectionId, name, platform, task_type as taskType,
              design_id as designId, spend, impressions, clicks, leads_count as leadsCount,
              status, auto_cpl as autoCpl, auto_ctr as autoCtr, created_at as createdAt
       FROM ads
       WHERE campaign_id = ?
       ORDER BY created_at DESC`,
      [id]
    );

    campaign.ads = ads || [];

    return res.json({ success: true, data: campaign });
  } catch (e: any) {
    console.error("[getCampaignById DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to fetch campaign details" });
  }
}

export async function createCampaign(req: Request, res: Response): Promise<Response> {
  const {
    name,
    objective,
    productId,
    product_id,
    packageId,
    package_id,
    status = "PLANNING",
    startDate,
    start_date,
    budget = 0,
    spend = 0,
    ownerId,
    owner_id
  } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ success: false, error: "Campaign 'name' is required" });
  }
  if (!objective || typeof objective !== "string" || !objective.trim()) {
    return res.status(400).json({ success: false, error: "Campaign 'objective' is required" });
  }

  const user = (req as any).user;
  const targetOwnerId = ownerId || owner_id || user?.id || 1;
  const targetStartDate = startDate || start_date || new Date().toISOString().split("T")[0];
  const targetProductId = productId || product_id || null;
  const targetPackageId = packageId || package_id || null;

  try {
    const [result]: any = await dbPool.query(
      `INSERT INTO campaigns (name, objective, product_id, package_id, status, start_date, budget, spend, owner_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name.trim(),
        objective.trim(),
        targetProductId,
        targetPackageId,
        String(status).toUpperCase(),
        targetStartDate,
        Number(budget) || 0,
        Number(spend) || 0,
        targetOwnerId
      ]
    );

    const newId = result.insertId;

    const [created]: any = await dbPool.query(
      `SELECT id, name, objective, product_id as productId, package_id as packageId,
              status, start_date as startDate, budget, spend,
              leads_count as leadsCount, paid_leads as paidLeads, conversions,
              auto_cpl as autoCpl, auto_conversion_pct as autoConversionPct,
              owner_id as ownerId, created_at as createdAt, updated_at as updatedAt
       FROM campaigns WHERE id = ? LIMIT 1`,
      [newId]
    );

    return res.status(201).json({
      success: true,
      data: created?.[0] || { id: newId, name, objective, productId: targetProductId, packageId: targetPackageId, status }
    });
  } catch (e: any) {
    console.error("[createCampaign DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to create campaign in database" });
  }
}

export async function updateCampaign(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;
  const {
    name,
    objective,
    productId,
    product_id,
    packageId,
    package_id,
    status,
    startDate,
    start_date,
    budget,
    spend,
    leadsCount,
    leads_count,
    paidLeads,
    paid_leads,
    conversions
  } = req.body;

  try {
    const [existing]: any = await dbPool.query("SELECT id FROM campaigns WHERE id = ? LIMIT 1", [id]);
    if (!Array.isArray(existing) || existing.length === 0) {
      return res.status(404).json({ success: false, error: "Campaign not found to update" });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name.trim());
    }
    if (objective !== undefined) {
      updates.push("objective = ?");
      params.push(objective.trim());
    }
    if (productId !== undefined || product_id !== undefined) {
      updates.push("product_id = ?");
      params.push(productId !== undefined ? productId : product_id);
    }
    if (packageId !== undefined || package_id !== undefined) {
      updates.push("package_id = ?");
      params.push(packageId !== undefined ? packageId : package_id);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      params.push(String(status).toUpperCase());
    }
    if (startDate || start_date) {
      updates.push("start_date = ?");
      params.push(startDate || start_date);
    }
    if (budget !== undefined) {
      updates.push("budget = ?");
      params.push(Number(budget));
    }
    if (spend !== undefined) {
      updates.push("spend = ?");
      params.push(Number(spend));
    }
    if (leadsCount !== undefined || leads_count !== undefined) {
      updates.push("leads_count = ?");
      params.push(Number(leadsCount !== undefined ? leadsCount : leads_count));
    }
    if (paidLeads !== undefined || paid_leads !== undefined) {
      updates.push("paid_leads = ?");
      params.push(Number(paidLeads !== undefined ? paidLeads : paid_leads));
    }
    if (conversions !== undefined) {
      updates.push("conversions = ?");
      params.push(Number(conversions));
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: "No fields provided to update" });
    }

    updates.push("updated_at = NOW()");
    params.push(id);

    await dbPool.query(`UPDATE campaigns SET ${updates.join(", ")} WHERE id = ?`, params);

    const [updated]: any = await dbPool.query(
      `SELECT id, name, objective, product_id as productId, package_id as packageId,
              status, start_date as startDate, budget, spend,
              leads_count as leadsCount, paid_leads as paidLeads, conversions,
              auto_cpl as autoCpl, auto_conversion_pct as autoConversionPct,
              owner_id as ownerId, created_at as createdAt, updated_at as updatedAt
       FROM campaigns WHERE id = ? LIMIT 1`,
      [id]
    );

    return res.json({ success: true, data: updated?.[0] });
  } catch (e: any) {
    console.error("[updateCampaign DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to update campaign" });
  }
}

export async function deleteCampaign(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;

  try {
    const [result]: any = await dbPool.query("DELETE FROM campaigns WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Campaign not found to delete" });
    }
    return res.json({ success: true, message: `Campaign #${id} deleted successfully` });
  } catch (e: any) {
    console.error("[deleteCampaign DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to delete campaign" });
  }
}

export async function getCampaignMetrics(_req: Request, res: Response): Promise<Response> {
  try {
    const [rows]: any = await dbPool.query(`
      SELECT 
        COUNT(id) as totalCampaigns,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as activeCampaigns,
        SUM(CASE WHEN status = 'PAUSED' THEN 1 ELSE 0 END) as pausedCampaigns,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completedCampaigns,
        COALESCE(SUM(budget), 0) as totalBudget,
        COALESCE(SUM(spend), 0) as totalSpend,
        COALESCE(SUM(leads_count), 0) as totalLeads,
        COALESCE(SUM(conversions), 0) as totalConversions
      FROM campaigns
    `);

    const metrics = rows?.[0] || {};
    const totalLeads = Number(metrics.totalLeads || 0);
    const totalSpend = Number(metrics.totalSpend || 0);
    const totalConversions = Number(metrics.totalConversions || 0);

    const averageCpl = totalLeads > 0 ? Math.round((totalSpend / totalLeads) * 100) / 100 : 0;
    const averageConversionRate = totalLeads > 0 ? Math.round((totalConversions / totalLeads) * 10000) / 100 : 0;

    return res.json({
      success: true,
      data: {
        totalCampaigns: Number(metrics.totalCampaigns || 0),
        activeCampaigns: Number(metrics.activeCampaigns || 0),
        pausedCampaigns: Number(metrics.pausedCampaigns || 0),
        completedCampaigns: Number(metrics.completedCampaigns || 0),
        totalBudget: Number(metrics.totalBudget || 0),
        totalSpend,
        totalLeads,
        totalConversions,
        averageCpl,
        averageConversionRate,
        timestamp: new Date().toISOString()
      }
    });
  } catch (e: any) {
    console.error("[getCampaignMetrics DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to calculate campaign metrics" });
  }
}

