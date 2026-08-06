"use client";

import { useEffect, useState } from "react";
import {
  listMaterialsAll,
  listPlants,
  listPurchasingOrganizations,
  listVendors,
} from "../api/masterData";
import type { CodeNameItem, MaterialListItem } from "../lib/masterDataTypes";

/**
 * PO 选数：采购组织 → 供应商（带 purchasingOrg）→ 工厂 → 全量物料（无 salesOrg）。
 */
export function usePurchaseOrderMasterData(purchasingOrgCode: string) {
  const [purchasingOrgs, setPurchasingOrgs] = useState<CodeNameItem[]>([]);
  const [plants, setPlants] = useState<CodeNameItem[]>([]);
  const [vendors, setVendors] = useState<CodeNameItem[]>([]);
  const [materials, setMaterials] = useState<MaterialListItem[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingOrgs(true);
      setError(null);
      try {
        const [orgs, plantList, mats] = await Promise.all([
          listPurchasingOrganizations(),
          listPlants(),
          listMaterialsAll(),
        ]);
        if (cancelled) return;
        setPurchasingOrgs(orgs ?? []);
        setPlants(plantList ?? []);
        setMaterials(mats ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(err);
        setPurchasingOrgs([]);
        setPlants([]);
        setMaterials([]);
      } finally {
        if (!cancelled) setLoadingOrgs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!purchasingOrgCode.trim()) {
      setVendors([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadingVendors(true);
      try {
        const data = await listVendors({
          purchasingOrg: purchasingOrgCode.trim(),
        });
        if (cancelled) return;
        setVendors(data ?? []);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err);
        setVendors([]);
      } finally {
        if (!cancelled) setLoadingVendors(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [purchasingOrgCode]);

  return {
    purchasingOrgs,
    plants,
    vendors,
    materials,
    loading: loadingOrgs || loadingVendors,
    loadingOrgs,
    loadingVendors,
    error,
  };
}
