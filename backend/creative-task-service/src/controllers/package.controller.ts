import type { Request, Response } from "express";
import { dbPool, type PackageItem } from "../config/db.js";

export const getAllPackages = async (req: Request, res: Response): Promise<Response> => {
  const { productId, product_id } = req.query;
  const targetProductId = (productId || product_id) as string | undefined;

  try {
    let query = "SELECT id, product_id as productId, name, created_at as createdAt, updated_at as updatedAt FROM product_packages";
    const params: any[] = [];

    if (targetProductId) {
      query += " WHERE product_id = ?";
      params.push(targetProductId);
    }

    query += " ORDER BY name ASC";
    const [rows]: any = await dbPool.query(query, params);

    return res.json({ success: true, data: rows || [] });
  } catch (e: any) {
    console.error("[getAllPackages DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to fetch packages" });
  }
};

export const getPackageById = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  try {
    const [rows]: any = await dbPool.query(
      "SELECT id, product_id as productId, name, created_at as createdAt, updated_at as updatedAt FROM product_packages WHERE id = ? LIMIT 1",
      [id]
    );
    if (Array.isArray(rows) && rows.length > 0) {
      return res.json({ success: true, data: rows[0] });
    }
    return res.status(404).json({ success: false, error: "Package not found" });
  } catch (e: any) {
    console.error("[getPackageById DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to fetch package" });
  }
};



export const createPackage = async (req: Request, res: Response): Promise<Response> => {
  const { id, productId, product_id, name } = req.body;
  const prodId = productId || product_id;

  if (!name || !prodId) {
    return res.status(400).json({ success: false, error: "Package name and productId are required" });
  }

  const trimmedName = name.trim();
  const packageId = id || `pkg_${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

  try {

    const [existing]: any = await dbPool.query(
      "SELECT id FROM product_packages WHERE name = ? LIMIT 1",
      [trimmedName]
    );
    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(400).json({ success: false, error: "Package name already exists" });
    }

    const newPkg = {
      id: packageId,
      productId: prodId,
      name: trimmedName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dbPool.query(
      "INSERT INTO product_packages (id, product_id, name, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
      [newPkg.id, newPkg.productId, newPkg.name]
    );

    return res.status(201).json({ success: true, data: newPkg });
  } catch (e: any) {
    console.error("[createPackage DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to create package in database" });
  }
};

export const updatePackage = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { productId, product_id, name } = req.body;
  const targetProductId = productId || product_id;

  try {
    if (name) {
      const trimmedName = name.trim();
      const [existing]: any = await dbPool.query(
        "SELECT id FROM product_packages WHERE name = ? AND id != ? LIMIT 1",
        [trimmedName, id]
      );
      if (Array.isArray(existing) && existing.length > 0) {
        return res.status(400).json({ success: false, error: "Package name already exists" });
      }
    }

    let query = "UPDATE product_packages SET ";
    const updates: string[] = [];
    const params: any[] = [];

    if (targetProductId) {
      updates.push("product_id = ?");
      params.push(targetProductId);
    }
    if (name) {
      updates.push("name = ?");
      params.push(name.trim());
    }
    updates.push("updated_at = NOW()");
    query += updates.join(", ") + " WHERE id = ?";
    params.push(id);

    const [result]: any = await dbPool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Package not found to update" });
    }

    return res.json({ success: true, message: "Package updated successfully" });
  } catch (e: any) {
    console.error("[updatePackage DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to update package" });
  }
};



export const deletePackage = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  try {
   
    const [result]: any = await dbPool.query(
      "DELETE FROM product_packages WHERE id = ?",
      [id]
    );

   
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Package not found to delete" });
    }

    return res.json({ success: true, message: "Package deleted successfully" });
  } catch (e: any) {
    console.error("[deletePackage DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to delete package" });
  }
};

