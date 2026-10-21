import { Router } from "express";
import { dbPool, dbPackagesStore } from "../config/db.js";

const router = Router();

router.get("/packages", async (req, res) => {
  const { productId } = req.query;

  if (dbPool.isConnected()) {
    try {
      let query = 'SELECT * FROM product_packages WHERE status = "ACTIVE"';
      const params: any[] = [];
      if (productId) {
        query += " AND product_id = ?";
        params.push(productId);
      }
      query += " ORDER BY name ASC";
      const [rows] = await dbPool.query(query, params);
      if (Array.isArray(rows) && rows.length > 0) {
        return res.json(rows);
      }
    } catch (e: any) {
      console.warn("[Packages DB Notice]:", e?.message || e);
    }
  }

  let results = [...dbPackagesStore];
  if (productId) {
    results = results.filter((p) => p.productId === productId);
  }
  return res.json(results);
});

export default router;

