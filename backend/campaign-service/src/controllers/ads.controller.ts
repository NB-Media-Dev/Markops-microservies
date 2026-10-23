import type { Request, Response } from "express";
import { dbPool } from "../config/database.js";

export async function getAds(req: Request, res: Response): Promise<Response> {
  const {
    campaignId,
    campaign_id,
    productId,
    product_id,
    packageId,
    package_id,
    status
  } = req.query;

  const targetCampaignId = campaignId || campaign_id;
  const targetProductId = productId || product_id;
  const targetPackageId = packageId || package_id;

  try {
    let query = `
      SELECT id, campaign_id as campaignId, product_id as productId, package_id as packageId,
             meta_connection_id as metaConnectionId, created_by as createdBy, task_type as taskType,
             design_id as designId, platform_ad_id as platformAdId, platform_adset_id as platformAdsetId,
             platform_campaign_id as platformCampaignId, name, platform, spend,
             impressions, clicks, leads_count as leadsCount, status,
             auto_cpl as autoCpl, auto_ctr as autoCtr, created_at as createdAt, updated_at as updatedAt
      FROM ads
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (targetCampaignId) {
      conditions.push("campaign_id = ?");
      params.push(targetCampaignId);
    }
    if (targetProductId) {
      conditions.push("product_id = ?");
      params.push(targetProductId);
    }
    if (targetPackageId) {
      conditions.push("package_id = ?");
      params.push(targetPackageId);
    }
    if (status && status !== "ALL") {
      conditions.push("status = ?");
      params.push(status);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC";

    const [rows]: any = await dbPool.query(query, params);
    return res.json({ success: true, data: rows || [] });
  } catch (e: any) {
    console.error("[getAds DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to fetch ads" });
  }
}

export async function getAdById(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;

  try {
    const [rows]: any = await dbPool.query(
      `SELECT id, campaign_id as campaignId, product_id as productId, package_id as packageId,
              meta_connection_id as metaConnectionId, created_by as createdBy, task_type as taskType,
              design_id as designId, platform_ad_id as platformAdId, platform_adset_id as platformAdsetId,
              platform_campaign_id as platformCampaignId, name, platform, spend,
              impressions, clicks, leads_count as leadsCount, status,
              auto_cpl as autoCpl, auto_ctr as autoCtr, created_at as createdAt, updated_at as updatedAt
       FROM ads WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Ad not found" });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (e: any) {
    console.error("[getAdById DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to fetch ad details" });
  }
}

export async function createAd(req: Request, res: Response): Promise<Response> {
  const {
    campaignId,
    campaign_id,
    productId,
    product_id,
    packageId,
    package_id,
    name,
    platform = "Meta",
    taskType = "BANNER_DESIGN",
    task_type,
    designId,
    design_id,
    spend = 0,
    impressions = 0,
    clicks = 0,
    leadsCount = 0,
    leads_count,
    status = "ACTIVE"
  } = req.body;

  const targetCampaignId = campaignId || campaign_id;

  if (!targetCampaignId) {
    return res.status(400).json({ success: false, error: "'campaignId' is required" });
  }
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ success: false, error: "Ad 'name' is required" });
  }

  let finalProductId = productId || product_id || null;
  let finalPackageId = packageId || package_id || null;

  // Auto-inherit from parent campaign if not explicitly specified
  if ((!finalProductId || !finalPackageId) && targetCampaignId) {
    try {
      const [campRows]: any = await dbPool.query(
        "SELECT product_id, package_id FROM campaigns WHERE id = ? LIMIT 1",
        [targetCampaignId]
      );
      if (Array.isArray(campRows) && campRows.length > 0) {
        if (!finalProductId && campRows[0].product_id) {
          finalProductId = campRows[0].product_id;
        }
        if (!finalPackageId && campRows[0].package_id) {
          finalPackageId = campRows[0].package_id;
        }
      }
    } catch (err: any) {
      console.warn("[createAd inherit campaign product/pkg error]:", err?.message);
    }
  }

  const user = (req as any).user;
  const creatorId = user?.id || 1;

  try {
    const [result]: any = await dbPool.query(
      `INSERT INTO ads (campaign_id, product_id, package_id, created_by, task_type, design_id, name, platform, spend, impressions, clicks, leads_count, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        targetCampaignId,
        finalProductId,
        finalPackageId,
        creatorId,
        taskType || task_type || "BANNER_DESIGN",
        designId || design_id || null,
        name.trim(),
        platform,
        Number(spend) || 0,
        Number(impressions) || 0,
        Number(clicks) || 0,
        Number(leadsCount !== undefined ? leadsCount : (leads_count || 0)),
        status
      ]
    );

    const newId = result.insertId;

    const [created]: any = await dbPool.query(
      `SELECT id, campaign_id as campaignId, product_id as productId, package_id as packageId,
              meta_connection_id as metaConnectionId, created_by as createdBy, task_type as taskType,
              design_id as designId, name, platform, spend, impressions, clicks, leads_count as leadsCount,
              status, auto_cpl as autoCpl, auto_ctr as autoCtr, created_at as createdAt, updated_at as updatedAt
       FROM ads WHERE id = ? LIMIT 1`,
      [newId]
    );

    return res.status(201).json({ success: true, data: created?.[0] });
  } catch (e: any) {
    console.error("[createAd DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to create ad in database" });
  }
}

export async function updateAd(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;
  const {
    name,
    productId,
    product_id,
    packageId,
    package_id,
    status,
    spend,
    impressions,
    clicks,
    leadsCount,
    leads_count
  } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name.trim());
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
      params.push(status);
    }
    if (spend !== undefined) {
      updates.push("spend = ?");
      params.push(Number(spend));
    }
    if (impressions !== undefined) {
      updates.push("impressions = ?");
      params.push(Number(impressions));
    }
    if (clicks !== undefined) {
      updates.push("clicks = ?");
      params.push(Number(clicks));
    }
    if (leadsCount !== undefined || leads_count !== undefined) {
      updates.push("leads_count = ?");
      params.push(Number(leadsCount !== undefined ? leadsCount : leads_count));
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: "No fields provided to update" });
    }

    updates.push("updated_at = NOW()");
    params.push(id);

    const [result]: any = await dbPool.query(`UPDATE ads SET ${updates.join(", ")} WHERE id = ?`, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Ad not found to update" });
    }

    const [updated]: any = await dbPool.query(
      `SELECT id, campaign_id as campaignId, product_id as productId, package_id as packageId,
              name, platform, spend, impressions, clicks, leads_count as leadsCount, status,
              auto_cpl as autoCpl, auto_ctr as autoCtr, created_at as createdAt, updated_at as updatedAt
       FROM ads WHERE id = ? LIMIT 1`,
      [id]
    );

    return res.json({ success: true, data: updated?.[0] });
  } catch (e: any) {
    console.error("[updateAd DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to update ad" });
  }
}

export async function deleteAd(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;

  try {
    const [result]: any = await dbPool.query("DELETE FROM ads WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Ad not found to delete" });
    }
    return res.json({ success: true, message: `Ad #${id} deleted successfully` });
  } catch (e: any) {
    console.error("[deleteAd DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to delete ad" });
  }
}

