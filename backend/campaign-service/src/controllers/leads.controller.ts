import type { Request, Response } from "express";
import { dbPool } from "../config/database.js";
import * as XLSX from "xlsx";

export async function getLeads(req: Request, res: Response): Promise<Response> {
  const {
    campaign,
    campaignName,
    campaign_name,
    campaignId,
    campaign_id,
    ad,
    adName,
    ad_name,
    adId,
    ad_id,
    productId,
    product_id,
    packageId,
    package_id,
    status,
    assignmentStatus,
    assignment_status,
    telecallerId,
    assigned_telecaller_id,
    search
  } = req.query;

  const targetCampaign = (campaign || campaignName || campaign_name) as string | undefined;
  const targetCampaignId = campaignId || campaign_id;
  const targetAd = (ad || adName || ad_name) as string | undefined;
  const targetAdId = adId || ad_id;
  const targetProductId = productId || product_id;
  const targetPackageId = packageId || package_id;
  const targetAssignmentStatus = assignmentStatus || assignment_status;
  const targetTelecallerId = telecallerId || assigned_telecaller_id;

  try {
    let query = `
      SELECT l.id, l.first_name as firstName, l.last_name as lastName,
             l.email, l.phone, l.source,
             l.campaign, l.campaign as campaignName,
             l.ad, l.ad as adName,
             l.product_id as productId, l.package_id as packageId,
             l.call_disposition as callDisposition,
             l.status, l.assignment_status as assignmentStatus,
             l.assigned_telecaller_id as assignedTelecallerId,
             l.meta_lead_id as metaLeadId,
             l.created_at as createdAt, l.updated_at as updatedAt
      FROM leads l
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (targetCampaign) {
      conditions.push("(l.campaign = ? OR l.campaign LIKE ?)");
      params.push(targetCampaign, `%${targetCampaign}%`);
    } else if (targetCampaignId) {
      const [camp]: any = await dbPool.query("SELECT name FROM campaigns WHERE id = ? LIMIT 1", [targetCampaignId]);
      if (camp?.[0]?.name) {
        conditions.push("l.campaign = ?");
        params.push(camp[0].name);
      }
    }

    if (targetAd) {
      conditions.push("(l.ad = ? OR l.ad LIKE ?)");
      params.push(targetAd, `%${targetAd}%`);
    } else if (targetAdId) {
      const [adRow]: any = await dbPool.query("SELECT name FROM ads WHERE id = ? LIMIT 1", [targetAdId]);
      if (adRow?.[0]?.name) {
        conditions.push("l.ad = ?");
        params.push(adRow[0].name);
      }
    }

    if (targetProductId) {
      conditions.push("l.product_id = ?");
      params.push(targetProductId);
    }
    if (targetPackageId) {
      conditions.push("l.package_id = ?");
      params.push(targetPackageId);
    }
    if (status && status !== "ALL") {
      conditions.push("l.status = ?");
      params.push(status);
    }
    if (targetAssignmentStatus && targetAssignmentStatus !== "ALL") {
      conditions.push("l.assignment_status = ?");
      params.push(targetAssignmentStatus);
    }
    if (targetTelecallerId) {
      conditions.push("l.assigned_telecaller_id = ?");
      params.push(targetTelecallerId);
    }
    if (search) {
      conditions.push("(l.first_name LIKE ? OR l.last_name LIKE ? OR l.phone LIKE ? OR l.email LIKE ? OR l.campaign LIKE ? OR l.ad LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY l.created_at DESC";

    const [rows]: any = await dbPool.query(query, params);
    return res.json({ success: true, data: rows || [] });
  } catch (e: any) {
    console.error("[getLeads DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to fetch leads" });
  }
}

export async function getLeadById(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;

  try {
    const [rows]: any = await dbPool.query(
      `SELECT l.id, l.first_name as firstName, l.last_name as lastName,
              l.email, l.phone, l.source,
              l.campaign, l.campaign as campaignName,
              l.ad, l.ad as adName,
              l.product_id as productId, l.package_id as packageId,
              l.call_disposition as callDisposition,
              l.status, l.assignment_status as assignmentStatus,
              l.assigned_telecaller_id as assignedTelecallerId,
              l.meta_lead_id as metaLeadId,
              l.created_at as createdAt, l.updated_at as updatedAt
       FROM leads l
       WHERE l.id = ? LIMIT 1`,
      [id]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ success: false, error: "Lead not found" });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (e: any) {
    console.error("[getLeadById DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to fetch lead details" });
  }
}

export async function createLead(req: Request, res: Response): Promise<Response> {
  const {
    firstName,
    first_name,
    lastName,
    last_name,
    email,
    phone,
    source = "META_ADS",
    campaign,
    campaignName,
    campaign_name,
    campaignId,
    campaign_id,
    ad,
    adName,
    ad_name,
    adId,
    ad_id,
    productId,
    product_id,
    packageId,
    package_id,
    callDisposition,
    call_disposition,
    status = "ASSIGNED",
    assignmentStatus,
    assignment_status,
    assignedTelecallerId,
    assigned_telecaller_id,
    metaLeadId,
    meta_lead_id
  } = req.body;

  const targetFirstName = firstName || first_name;
  const targetLastName = lastName !== undefined ? lastName : (last_name || null);
  const targetCallDisposition = callDisposition || call_disposition || null;
  let targetTelecallerId = assignedTelecallerId || assigned_telecaller_id ? parseInt(String(assignedTelecallerId || assigned_telecaller_id), 10) : null;
  const targetMetaLeadId = metaLeadId || meta_lead_id || null;

  // Auto-assign telecaller if not explicitly provided
  if (!targetTelecallerId) {
    try {
      const [telecallers]: any = await dbPool.query(`
        SELECT u.id, COUNT(l.id) as active_leads
        FROM auth_db.User u
        JOIN auth_db.Role r ON u.roleId = r.id
        LEFT JOIN digital_db.leads l ON l.assigned_telecaller_id = u.id AND l.status NOT IN ('PAID', 'NOT_INTERESTED')
        WHERE (r.name = 'TELECALLER' OR u.roleId = 'telecaller') AND u.isActive = 1
        GROUP BY u.id
        ORDER BY active_leads ASC, u.id ASC
        LIMIT 1
      `);
      if (Array.isArray(telecallers) && telecallers.length > 0) {
        targetTelecallerId = telecallers[0].id;
      }
    } catch (tErr: any) {
      console.warn("[createLead auto-assign telecaller notice]:", tErr?.message);
    }
  }

  const targetAssignmentStatus = assignmentStatus || assignment_status || (targetTelecallerId ? "ASSIGNED" : "UNASSIGNED");

  let finalCampaign: string | null = campaign || campaignName || campaign_name || null;
  let finalAd: string | null = ad || adName || ad_name || null;
  let finalProductId = productId || product_id || null;
  let finalPackageId = packageId || package_id || null;

  // Resolve ad name / inherit product & package if adId / ad name provided
  const inputAdId = adId || ad_id ? parseInt(String(adId || ad_id), 10) : null;
  if (inputAdId || finalAd) {
    try {
      const [adRows]: any = await dbPool.query(
        inputAdId
          ? "SELECT id, name, campaign_id, product_id, package_id FROM ads WHERE id = ? LIMIT 1"
          : "SELECT id, name, campaign_id, product_id, package_id FROM ads WHERE name = ? LIMIT 1",
        [inputAdId || finalAd]
      );
      if (Array.isArray(adRows) && adRows.length > 0) {
        if (!finalAd) finalAd = adRows[0].name;
        if (!finalProductId && adRows[0].product_id) finalProductId = adRows[0].product_id;
        if (!finalPackageId && adRows[0].package_id) finalPackageId = adRows[0].package_id;
        if (!finalCampaign && adRows[0].campaign_id) {
          const [campFromAd]: any = await dbPool.query("SELECT name FROM campaigns WHERE id = ? LIMIT 1", [adRows[0].campaign_id]);
          if (campFromAd?.[0]?.name) finalCampaign = campFromAd[0].name;
        }
      }
    } catch (err: any) {
      console.warn("[createLead inherit Ad error]:", err?.message);
    }
  }

  // Resolve campaign name / inherit product & package if campaignId / campaign name provided
  const inputCampId = campaignId || campaign_id ? parseInt(String(campaignId || campaign_id), 10) : null;
  if (inputCampId || finalCampaign) {
    try {
      const [campRows]: any = await dbPool.query(
        inputCampId
          ? "SELECT id, name, product_id, package_id FROM campaigns WHERE id = ? LIMIT 1"
          : "SELECT id, name, product_id, package_id FROM campaigns WHERE name = ? LIMIT 1",
        [inputCampId || finalCampaign]
      );
      if (Array.isArray(campRows) && campRows.length > 0) {
        if (!finalCampaign) finalCampaign = campRows[0].name;
        if (!finalProductId && campRows[0].product_id) finalProductId = campRows[0].product_id;
        if (!finalPackageId && campRows[0].package_id) finalPackageId = campRows[0].package_id;
      }
    } catch (err: any) {
      console.warn("[createLead inherit Campaign error]:", err?.message);
    }
  }

  if (!targetFirstName || typeof targetFirstName !== "string" || !targetFirstName.trim()) {
    return res.status(400).json({ success: false, error: "'firstName' is required" });
  }
  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return res.status(400).json({ success: false, error: "'phone' is required" });
  }

  const cleanPhone = phone.trim();

  try {
    // Check if phone already exists
    const [existing]: any = await dbPool.query("SELECT id FROM leads WHERE phone = ? LIMIT 1", [cleanPhone]);
    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: `A lead with phone '${cleanPhone}' already exists (Lead #${existing[0].id})`
      });
    }

    const [result]: any = await dbPool.query(
      `INSERT INTO leads (first_name, last_name, email, phone, source, campaign, ad, product_id, package_id, call_disposition, status, assignment_status, assigned_telecaller_id, meta_lead_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        targetFirstName.trim(),
        targetLastName ? targetLastName.trim() : null,
        email ? String(email).trim().toLowerCase() : null,
        cleanPhone,
        source,
        finalCampaign,
        finalAd,
        finalProductId,
        finalPackageId,
        targetCallDisposition,
        status,
        targetAssignmentStatus,
        targetTelecallerId,
        targetMetaLeadId
      ]
    );

    const newLeadId = result.insertId;

  
    if (finalCampaign) {
      try {
        await dbPool.query("UPDATE campaigns SET leads_count = leads_count + 1, updated_at = NOW() WHERE name = ?", [finalCampaign]);
      } catch (err: any) {
        console.warn("[createLead Campaign sync notice]:", err?.message);
      }
    }

    if (finalAd) {
      try {
        await dbPool.query("UPDATE ads SET leads_count = leads_count + 1, updated_at = NOW() WHERE name = ?", [finalAd]);
      } catch (err: any) {
        console.warn("[createLead Ad sync notice]:", err?.message);
      }
    }

    const [created]: any = await dbPool.query(
      `SELECT l.id, l.first_name as firstName, l.last_name as lastName,
              l.email, l.phone, l.source,
              l.campaign, l.campaign as campaignName,
              l.ad, l.ad as adName,
              l.product_id as productId, l.package_id as packageId,
              l.call_disposition as callDisposition,
              l.status, l.assignment_status as assignmentStatus,
              l.assigned_telecaller_id as assignedTelecallerId,
              l.meta_lead_id as metaLeadId,
              l.created_at as createdAt, l.updated_at as updatedAt
       FROM leads l
       WHERE l.id = ? LIMIT 1`,
      [newLeadId]
    );

    return res.status(201).json({
      success: true,
      data: created?.[0] || { id: newLeadId, firstName: targetFirstName, phone: cleanPhone, campaign: finalCampaign, ad: finalAd, productId: finalProductId, packageId: finalPackageId, status }
    });
  } catch (e: any) {
    console.error("[createLead DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: e?.message || "Failed to create lead" });
  }
}

export async function uploadLeadsFromExcel(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Please upload an Excel file" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: "The uploaded Excel sheet is empty" });
    }

    let telecallers: any[] = [];
    try {
      const [tRows]: any = await dbPool.query(
        "SELECT id FROM auth_db.users WHERE role = 'TELECALLER' AND status = 'ACTIVE' ORDER BY id ASC"
      );
      telecallers = tRows || [];
    } catch {
      telecallers = [];
    }

    const hasTelecallers = Array.isArray(telecallers) && telecallers.length > 0;
    let telecallerIndex = 0; 

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; 

      const {
        firstName, first_name,
        lastName, last_name,
        email, phone,
        source = "META",
        campaign, campaignName, campaign_name, campaignId, campaign_id,
        ad, adName, ad_name, adId, ad_id,
        productId, product_id,
        packageId, package_id,
        callDisposition, call_disposition,
        status = "ASSIGNED",
        assignmentStatus, assignment_status,
        assignedTelecallerId, assigned_telecaller_id,
        metaLeadId, meta_lead_id
      } = row;

      const targetFirstName = firstName || first_name;
      const targetLastName = lastName !== undefined ? lastName : (last_name || null);
      const targetCallDisposition = callDisposition || call_disposition || null;
      const targetMetaLeadId = metaLeadId || meta_lead_id || null;

      let finalCampaign: string | null = campaign || campaignName || campaign_name || null;
      let finalAd: string | null = ad || adName || ad_name || null;
      let finalProductId = productId || product_id || null;
      let finalPackageId = packageId || package_id || null;

      if (!targetFirstName || !String(targetFirstName).trim()) {
        failureCount++;
        errors.push(`Row ${rowNumber}: 'firstName' is missing`);
        continue;
      }
      if (!phone || !String(phone).trim()) {
        failureCount++;
        errors.push(`Row ${rowNumber}: 'phone' number is missing`);
        continue;
      }

      const cleanPhone = String(phone).trim();

      try {
        const [existing]: any = await dbPool.query("SELECT id FROM leads WHERE phone = ? LIMIT 1", [cleanPhone]);
        if (Array.isArray(existing) && existing.length > 0) {
          failureCount++;
          errors.push(`Row ${rowNumber}: Phone '${cleanPhone}' already exists (Lead #${existing[0].id})`);
          continue;
        }

  
        let targetTelecallerId = assignedTelecallerId || assigned_telecaller_id ? parseInt(String(assignedTelecallerId || assigned_telecaller_id), 10) : null;

        if (!targetTelecallerId && hasTelecallers) {
          targetTelecallerId = telecallers[telecallerIndex].id;

          telecallerIndex = (telecallerIndex + 1) % telecallers.length;
        }

        const targetAssignmentStatus = assignmentStatus || assignment_status || (targetTelecallerId ? "ASSIGNED" : "UNASSIGNED");

  
        const inputAdId = adId || ad_id ? parseInt(String(adId || ad_id), 10) : null;
        if (inputAdId || finalAd) {
          const [adRows]: any = await dbPool.query(
            inputAdId
              ? "SELECT id, name, campaign_id, product_id, package_id FROM ads WHERE id = ? LIMIT 1"
              : "SELECT id, name, campaign_id, product_id, package_id FROM ads WHERE name = ? LIMIT 1",
            [inputAdId || finalAd]
          );
          if (Array.isArray(adRows) && adRows.length > 0) {
            if (!finalAd) finalAd = adRows[0].name;
            if (!finalProductId && adRows[0].product_id) finalProductId = adRows[0].product_id;
            if (!finalPackageId && adRows[0].package_id) finalPackageId = adRows[0].package_id;
            if (!finalCampaign && adRows[0].campaign_id) {
              const [campFromAd]: any = await dbPool.query("SELECT name FROM campaigns WHERE id = ? LIMIT 1", [adRows[0].campaign_id]);
              if (campFromAd?.[0]?.name) finalCampaign = campFromAd[0].name;
            }
          }
        }

        const inputCampId = campaignId || campaign_id ? parseInt(String(campaignId || campaign_id), 10) : null;
        if (inputCampId || finalCampaign) {
          const [campRows]: any = await dbPool.query(
            inputCampId
              ? "SELECT id, name, product_id, package_id FROM campaigns WHERE id = ? LIMIT 1"
              : "SELECT id, name, product_id, package_id FROM campaigns WHERE name = ? LIMIT 1",
            [inputCampId || finalCampaign]
          );
          if (Array.isArray(campRows) && campRows.length > 0) {
            if (!finalCampaign) finalCampaign = campRows[0].name;
            if (!finalProductId && campRows[0].product_id) finalProductId = campRows[0].product_id;
            if (!finalPackageId && campRows[0].package_id) finalPackageId = campRows[0].package_id;
          }
        }

  
        await dbPool.query(
          `INSERT INTO leads (first_name, last_name, email, phone, source, campaign, ad, product_id, package_id, call_disposition, status, assignment_status, assigned_telecaller_id, meta_lead_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            String(targetFirstName).trim(),
            targetLastName ? String(targetLastName).trim() : null,
            email ? String(email).trim().toLowerCase() : null,
            cleanPhone,
            source,
            finalCampaign,
            finalAd,
            finalProductId,
            finalPackageId,
            targetCallDisposition,
            status,
            targetAssignmentStatus,
            targetTelecallerId,
            targetMetaLeadId
          ]
        );

        if (finalCampaign) {
          await dbPool.query("UPDATE campaigns SET leads_count = leads_count + 1, updated_at = NOW() WHERE name = ?", [finalCampaign]).catch(() => {});
        }
        if (finalAd) {
          await dbPool.query("UPDATE ads SET leads_count = leads_count + 1, updated_at = NOW() WHERE name = ?", [finalAd]).catch(() => {});
        }

        successCount++;
      } catch (rowErr: any) {
        failureCount++;
        errors.push(`Row ${rowNumber} Database error: ${rowErr.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Excel parsing completed",
      summary: { totalRowsProcessed: rows.length, successfullySaved: successCount, failedRows: failureCount },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error("[Excel Upload Controller Error]:", error);
    return res.status(500).json({ success: false, error: "Failed to process Excel file upload" });
  }
}


export async function updateLead(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;
  const {
    firstName,
    first_name,
    lastName,
    last_name,
    email,
    phone,
    campaign,
    campaignName,
    campaign_name,
    ad,
    adName,
    ad_name,
    productId,
    product_id,
    packageId,
    package_id,
    callDisposition,
    call_disposition,
    status,
    assignmentStatus,
    assignment_status,
    assignedTelecallerId,
    assigned_telecaller_id
  } = req.body;

  // Lead status updates are not permitted in Campaign Service
  if (status !== undefined) {
    return res.status(400).json({
      success: false,
      error: "Updating lead 'status' is not allowed in Campaign Service. Lead status is managed by the Telecaller/Conversion system."
    });
  }

  try {
    const [existing]: any = await dbPool.query("SELECT * FROM leads WHERE id = ? LIMIT 1", [id]);
    if (!Array.isArray(existing) || existing.length === 0) {
      return res.status(404).json({ success: false, error: "Lead not found to update" });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (firstName || first_name) {
      updates.push("first_name = ?");
      params.push((firstName || first_name).trim());
    }
    if (lastName !== undefined || last_name !== undefined) {
      updates.push("last_name = ?");
      params.push(lastName !== undefined ? lastName : last_name);
    }
    if (email !== undefined) {
      updates.push("email = ?");
      params.push(email ? email.trim().toLowerCase() : null);
    }
    if (phone) {
      updates.push("phone = ?");
      params.push(phone.trim());
    }
    if (campaign !== undefined || campaignName !== undefined || campaign_name !== undefined) {
      updates.push("campaign = ?");
      params.push(campaign || campaignName || campaign_name);
    }
    if (ad !== undefined || adName !== undefined || ad_name !== undefined) {
      updates.push("ad = ?");
      params.push(ad || adName || ad_name);
    }
    if (productId !== undefined || product_id !== undefined) {
      updates.push("product_id = ?");
      params.push(productId !== undefined ? productId : product_id);
    }
    if (packageId !== undefined || package_id !== undefined) {
      updates.push("package_id = ?");
      params.push(packageId !== undefined ? packageId : package_id);
    }
    if (callDisposition !== undefined || call_disposition !== undefined) {
      updates.push("call_disposition = ?");
      params.push(callDisposition !== undefined ? callDisposition : call_disposition);
    }
    if (assignmentStatus !== undefined || assignment_status !== undefined) {
      updates.push("assignment_status = ?");
      params.push(assignmentStatus !== undefined ? assignmentStatus : assignment_status);
    }
    if (assignedTelecallerId !== undefined || assigned_telecaller_id !== undefined) {
      updates.push("assigned_telecaller_id = ?");
      params.push(assignedTelecallerId !== undefined ? assignedTelecallerId : assigned_telecaller_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: "No fields provided to update" });
    }

    updates.push("updated_at = NOW()");
    params.push(id);

    await dbPool.query(`UPDATE leads SET ${updates.join(", ")} WHERE id = ?`, params);

    const [updated]: any = await dbPool.query(
      `SELECT l.id, l.first_name as firstName, l.last_name as lastName,
              l.email, l.phone, l.source,
              l.campaign, l.campaign as campaignName,
              l.ad, l.ad as adName,
              l.product_id as productId, l.package_id as packageId,
              l.call_disposition as callDisposition,
              l.status, l.assignment_status as assignmentStatus,
              l.assigned_telecaller_id as assignedTelecallerId,
              l.meta_lead_id as metaLeadId,
              l.created_at as createdAt, l.updated_at as updatedAt
       FROM leads l
       WHERE l.id = ? LIMIT 1`,
      [id]
    );

    return res.json({ success: true, data: updated?.[0] });
  } catch (e: any) {
    console.error("[updateLead DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to update lead" });
  }
}

export async function deleteLead(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;

  try {
    const [result]: any = await dbPool.query("DELETE FROM leads WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Lead not found to delete" });
    }
    return res.json({ success: true, message: `Lead #${id} deleted successfully` });
  } catch (e: any) {
    console.error("[deleteLead DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to delete lead" });
  }
}


export async function reassignTelecallerLeads(req: Request, res: Response): Promise<Response> {
  const {
    fromTelecallerId,
    from_telecaller_id,
    resignedTelecallerId,
    resigned_telecaller_id,
    toTelecallerIds,
    to_telecaller_ids,
    toTelecallerId,
    to_telecaller_id,
    statusFilter
  } = req.body;

  const sourceTelecallerId =
    fromTelecallerId ||
    from_telecaller_id ||
    resignedTelecallerId ||
    resigned_telecaller_id
      ? parseInt(String(fromTelecallerId || from_telecaller_id || resignedTelecallerId || resigned_telecaller_id), 10)
      : null;

  try {
    // 1. Resolve target telecaller IDs
    let targets: number[] = [];
    if (Array.isArray(toTelecallerIds) && toTelecallerIds.length > 0) {
      targets = toTelecallerIds.map((id: any) => parseInt(String(id), 10)).filter(Boolean);
    } else if (Array.isArray(to_telecaller_ids) && to_telecaller_ids.length > 0) {
      targets = to_telecaller_ids.map((id: any) => parseInt(String(id), 10)).filter(Boolean);
    } else if (toTelecallerId || to_telecaller_id) {
      targets = [parseInt(String(toTelecallerId || to_telecaller_id), 10)];
    } else {
      // Auto-fetch active telecallers from auth_db
      const [activeRows]: any = await dbPool.query(`
        SELECT u.id
        FROM auth_db.User u
        JOIN auth_db.Role r ON u.roleId = r.id
        WHERE (r.name = 'TELECALLER' OR u.roleId = 'telecaller') AND u.isActive = 1
        ORDER BY u.id ASC
      `);
      if (Array.isArray(activeRows) && activeRows.length > 0) {
        targets = activeRows
          .map((r: any) => r.id)
          .filter((id: number) => !sourceTelecallerId || id !== sourceTelecallerId);
      }
    }

    if (targets.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No active telecallers available to receive reassigned leads"
      });
    }

    // 2. Build leads query
    let queryConditions = "";
    const queryParams: any[] = [];

    if (sourceTelecallerId) {
      queryConditions = "WHERE assigned_telecaller_id = ?";
      queryParams.push(sourceTelecallerId);
    } else {
      // Find leads with inactive/resigned telecaller or unassigned leads
      queryConditions = `
        WHERE (
          assigned_telecaller_id IS NULL
          OR assigned_telecaller_id NOT IN (
            SELECT u.id FROM auth_db.User u
            JOIN auth_db.Role r ON u.roleId = r.id
            WHERE (r.name = 'TELECALLER' OR u.roleId = 'telecaller') AND u.isActive = 1
          )
        )
      `;
    }

    if (statusFilter && Array.isArray(statusFilter) && statusFilter.length > 0) {
      queryConditions += " AND status IN (?)";
      queryParams.push(statusFilter);
    } else {
      queryConditions += " AND status NOT IN ('PAID', 'NOT_INTERESTED')";
    }

    const [leadsToMove]: any = await dbPool.query(
      `SELECT id, assigned_telecaller_id as currentTelecallerId FROM leads ${queryConditions}`,
      queryParams
    );

    if (!Array.isArray(leadsToMove) || leadsToMove.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active leads found to reassign.",
        summary: { totalLeadsMoved: 0 }
      });
    }

    // 3. Distribute leads equally using Round-Robin across target telecallers
    let reassignedCount = 0;
    let targetIndex = 0;
    const details: any[] = [];

    const connection = await dbPool.getConnection();
    await connection.beginTransaction();

    try {
      for (const lead of leadsToMove) {
        const nextTelecallerId = targets[targetIndex];

        await connection.query(
          `UPDATE leads 
           SET assigned_telecaller_id = ?, 
               assignment_status = 'REASSIGNED', 
               updated_at = NOW() 
           WHERE id = ?`,
          [nextTelecallerId, lead.id]
        );

        details.push({
          leadId: lead.id,
          fromTelecallerId: lead.currentTelecallerId,
          toTelecallerId: nextTelecallerId
        });

        reassignedCount++;
        targetIndex = (targetIndex + 1) % targets.length;
      }

      await connection.commit();
      connection.release();

      return res.status(200).json({
        success: true,
        message: `Successfully reassigned ${reassignedCount} leads to active telecallers.`,
        summary: {
          totalLeadsMoved: reassignedCount,
          movedFromId: sourceTelecallerId || "INACTIVE_OR_UNASSIGNED",
          distributedAmong: targets
        },
        details
      });

    } catch (txError) {
      await connection.rollback();
      connection.release();
      throw txError;
    }

  } catch (error: any) {
    console.error("[Reassign Telecaller Leads Error]:", error);
    return res.status(500).json({ success: false, error: "Failed to reassign telecaller leads" });
  }
}

export async function getTelecallingSummary(_req: Request, res: Response): Promise<Response> {
  try {
    const [totalRows]: any = await dbPool.query("SELECT COUNT(*) as total FROM leads");
    const [assignedRows]: any = await dbPool.query("SELECT COUNT(*) as assigned FROM leads WHERE assigned_telecaller_id IS NOT NULL");
    const [statusRows]: any = await dbPool.query("SELECT status, COUNT(*) as count FROM leads GROUP BY status");
    const statusBreakdown: Record<string, number> = {};
    for (const r of (statusRows || [])) {
      statusBreakdown[r.status] = Number(r.count);
    }
    const totalLeads = Number(totalRows?.[0]?.total || 0);
    const assignedLeads = Number(assignedRows?.[0]?.assigned || 0);
    return res.json({
      success: true,
      totalLeads,
      assignedLeads,
      unassignedLeads: Math.max(0, totalLeads - assignedLeads),
      totalCallsLogged: 0,
      statusBreakdown,
      telecallerMetrics: []
    });
  } catch (err: any) {
    console.error("[getTelecallingSummary Error]:", err?.message || err);
    return res.status(500).json({ success: false, error: "Failed to fetch telecalling summary" });
  }
}

export async function assignLead(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;
  const { assignedTo, assignedTelecallerId, assigneeName } = req.body;
  const telecallerId = parseInt(String(assignedTo || assignedTelecallerId), 10) || null;
  try {
    await dbPool.query(
      "UPDATE leads SET assigned_telecaller_id = ?, assignment_status = ?, updated_at = NOW() WHERE id = ?",
      [telecallerId, telecallerId ? "ASSIGNED" : "UNASSIGNED", id]
    );
    const [rows]: any = await dbPool.query("SELECT * FROM leads WHERE id = ? LIMIT 1", [id]);
    return res.json({ success: true, lead: rows?.[0], data: rows?.[0] });
  } catch (err: any) {
    console.error("[assignLead Error]:", err?.message || err);
    return res.status(500).json({ success: false, error: "Failed to assign lead" });
  }
}
