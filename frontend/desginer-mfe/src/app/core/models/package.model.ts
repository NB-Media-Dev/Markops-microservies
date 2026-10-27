export interface ProductPackage {
  id: string;
  name: string;
  productId: string;
  productName?: string;
  icon?: string;
  badgeColor?: string;
  workspace?: string;
  createdAt?: string;
  updatedAt?: string;
  totalTasks?: number;
  completedTasks?: number;
}

export interface PackageSummary {
  totalPackages: number;
  totalActiveTasks: number;
  totalCompletedTasks: number;
  byProduct?: Record<string, { total: number; completed: number }>;
}

export interface FixedPackageMeta {
  id: string;
  name: string;
  icon: string;
  badgeColor: string;
}

export interface RoleOperationTab {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  badgeType?: string;
}



export function isProduct(nameOrId?: string): boolean {
  if (!nameOrId) return false;
  const clean = nameOrId.toLowerCase().trim();
  return clean.length > 0;
}

export interface ResolvedTaskScope {
  productId: string;
  productName: string;
  packageName: string;
}

export function resolveTaskProductAndPackage(
  t: { packageName?: string; title?: string; campaignName?: string; description?: string; content?: string; productId?: string; productName?: string },
  packages?: ProductPackage[] | { name: string; productId?: string }[]
): ResolvedTaskScope {
  if (t.productId || t.productName) {
    return {
      productId: t.productId || '',
      productName: t.productName || t.productId || '',
      packageName: t.packageName || 'General',
    };
  }

  const rawPkg = (t.packageName || '').trim();
  if (rawPkg && packages && packages.length > 0) {
    const matchedPkg = packages.find((p) => p.name.toLowerCase() === rawPkg.toLowerCase());
    if (matchedPkg) {
      return {
        productId: matchedPkg.productId || '',
        productName: matchedPkg.productId || matchedPkg.name,
        packageName: matchedPkg.name,
      };
    }
  }

  return {
    productId: t.productId || '',
    productName: t.productName || 'General',
    packageName: rawPkg || 'General',
  };
}

export function resolveProductContext(
  targetPackage?: string,
  targetProduct?: string,
  dbPackages: ProductPackage[] = []
): { productId: string; productName: string; isSpecificPackage: boolean } {
  const normProd = (targetProduct || '').toLowerCase().trim();
  const normPkg = (targetPackage || '').toLowerCase().trim();

  if (normProd && normProd !== 'all') {
    return {
      productId: targetProduct || normProd,
      productName: targetProduct || normProd,
      isSpecificPackage: !!normPkg && normPkg !== normProd && normPkg !== 'all',
    };
  }

  if (normPkg && normPkg !== 'all') {
    const match = dbPackages.find((p) => (p.name || '').toLowerCase().trim() === normPkg || String(p.id).toLowerCase() === normPkg);
    if (match) {
      return {
        productId: match.productId || match.name,
        productName: match.productId || match.name,
        isSpecificPackage: true,
      };
    }
    return {
      productId: targetPackage || normPkg,
      productName: targetPackage || normPkg,
      isSpecificPackage: true,
    };
  }

  return {
    productId: targetProduct || 'all',
    productName: targetProduct || 'All Products',
    isSpecificPackage: false,
  };
}

export function isItemForPackage(
  item: { productId?: string | null; packageName?: string | null; campaignName?: string | null; name?: string | null; source?: string | null; title?: string | null },
  targetPackage?: string,
  targetProduct?: string,
  dbPackages: ProductPackage[] = []
): boolean {
  if (!targetPackage && !targetProduct) return true;
  const cleanPkg = (targetPackage || '').toLowerCase().trim();
  const cleanProd = (targetProduct || '').toLowerCase().trim();
  if ((!cleanPkg || cleanPkg === 'all') && (!cleanProd || cleanProd === 'all')) return true;

  const itemPkg = (item.packageName || '').toLowerCase().trim();
  const itemProd = (item.productId || '').toLowerCase().trim();
  const itemName = (item.name || item.title || '').toLowerCase().trim();

  if (cleanPkg && cleanPkg !== 'all') {
    if (itemPkg === cleanPkg || itemPkg.includes(cleanPkg) || cleanPkg.includes(itemPkg) || itemName.includes(cleanPkg)) {
      return true;
    }
  }

  if (cleanProd && cleanProd !== 'all') {
    if (itemProd === cleanProd || itemProd.includes(cleanProd) || cleanProd.includes(itemProd)) {
      return true;
    }
    const resolved = resolveProductContext(targetPackage, targetProduct, dbPackages);
    if (resolved.productId && itemProd === resolved.productId.toLowerCase()) {
      return true;
    }
  }

  return true;
}

export function isTaskForPackage(
  task: any,
  targetPackage?: string,
  packagesOrProduct?: ProductPackage[] | string,
  maybePackages?: ProductPackage[]
): boolean {
  if (Array.isArray(packagesOrProduct)) {
    return isItemForPackage(task, targetPackage, undefined, packagesOrProduct);
  }
  return isItemForPackage(task, targetPackage, packagesOrProduct, maybePackages);
}

