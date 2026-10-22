import type { Request, Response } from "express";
import { dbPool, type ProductItem } from "../config/db.js";

export async function getProducts(_req: Request, res: Response): Promise<Response> {
  try {
    const [rows]: any = await dbPool.query(
      "SELECT id, name, created_at as createdAt FROM ourproducts ORDER BY name ASC"
    );
    return res.json({ success: true, data: rows || [] });
  } catch (e: any) {
    console.error("[getProducts DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to fetch products" });
  }
}

export async function getProductById(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;

  try {
    const [rows]: any = await dbPool.query(
      "SELECT id, name, created_at as createdAt FROM ourproducts WHERE id = ? LIMIT 1",
      [id]
    );
    if (Array.isArray(rows) && rows.length > 0) {
      return res.json({ success: true, data: rows[0] });
    }
    return res.status(404).json({ success: false, error: "Product not found" });
  } catch (e: any) {
    console.error("[getProductById DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to fetch product" });
  }
}
