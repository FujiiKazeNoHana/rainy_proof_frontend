"use client";

import { useEffect, useState } from "react";
import {
  listCustomers,
  listMaterials,
  listPlants,
  listSalesOrganizations,
} from "../api/masterData";
import {
  CUSTOMERS,
  MATERIALS,
  PLANTS,
  SALES_ORGS,
} from "../lib/masterDataStub";
import type { CodeNameItem, MaterialListItem } from "../lib/masterDataTypes";

function stubOrgs(): CodeNameItem[] {
  return SALES_ORGS.map((x) => ({ ...x, isActive: true }));
}

function stubPlants(): CodeNameItem[] {
  return PLANTS.map((x) => ({ ...x, isActive: true }));
}

function stubCustomers(): CodeNameItem[] {
  return CUSTOMERS.filter((c) => c.code !== "C-2099").map((x) => ({
    ...x,
    isActive: true,
  }));
}

function stubMaterials(): MaterialListItem[] {
  return MATERIALS.filter((m) => m.code !== "FG-NONE").map((x) => ({
    code: x.code,
    name: x.name,
    baseUnit: x.defaultUnit,
    isActive: true,
  }));
}

export type MasterDataSource = "api" | "stub";

/**
 * 销售订单选数：GET 主数据级联；失败时回退 Stub 正例以便本地联调。
 */
export function useSalesOrderMasterData(salesOrgCode: string) {
  const [salesOrgs, setSalesOrgs] = useState<CodeNameItem[]>([]);
  const [plants, setPlants] = useState<CodeNameItem[]>([]);
  const [customers, setCustomers] = useState<CodeNameItem[]>([]);
  const [materials, setMaterials] = useState<MaterialListItem[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingCascade, setLoadingCascade] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [source, setSource] = useState<MasterDataSource>("stub");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingOrgs(true);
      setError(null);
      try {
        const [orgs, plantList] = await Promise.all([
          listSalesOrganizations(),
          listPlants(),
        ]);
        if (cancelled) return;
        setSalesOrgs(orgs ?? []);
        setPlants(plantList ?? []);
        setSource("api");
      } catch (err) {
        if (cancelled) return;
        setError(err);
        setSalesOrgs(stubOrgs());
        setPlants(stubPlants());
        setSource("stub");
      } finally {
        if (!cancelled) setLoadingOrgs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!salesOrgCode) {
      setCustomers([]);
      setMaterials([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadingCascade(true);
      try {
        const [cust, mats] = await Promise.all([
          listCustomers(salesOrgCode),
          listMaterials(salesOrgCode),
        ]);
        if (cancelled) return;
        setCustomers(cust ?? []);
        setMaterials(mats ?? []);
        setSource("api");
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err);
        setCustomers(stubCustomers());
        setMaterials(stubMaterials());
        setSource("stub");
      } finally {
        if (!cancelled) setLoadingCascade(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [salesOrgCode]);

  return {
    salesOrgs,
    plants,
    customers,
    materials,
    loading: loadingOrgs || loadingCascade,
    loadingOrgs,
    loadingCascade,
    error,
    source,
  };
}
