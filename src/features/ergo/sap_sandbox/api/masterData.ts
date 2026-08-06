import { apiFetch } from "@/shared/lib/api-client";
import { MASTERDATA_API } from "../constants";
import type {
  CodeNameItem,
  MaterialListItem,
  VendorListQuery,
} from "../lib/masterDataTypes";

function withSalesOrg(path: string, salesOrg?: string): string {
  if (!salesOrg?.trim()) return path;
  const q = new URLSearchParams({ salesOrg: salesOrg.trim() });
  return `${path}?${q.toString()}`;
}

function vendorQuery(params: VendorListQuery = {}): string {
  const q = new URLSearchParams();
  if (params.purchasingOrg?.trim()) {
    q.set("purchasingOrg", params.purchasingOrg.trim());
  }
  if (params.includeInactive) q.set("includeInactive", "true");
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function listSalesOrganizations(): Promise<CodeNameItem[]> {
  return apiFetch<CodeNameItem[]>(
    `${MASTERDATA_API}/org/sales-organizations`,
  );
}

export async function listPlants(): Promise<CodeNameItem[]> {
  return apiFetch<CodeNameItem[]>(`${MASTERDATA_API}/org/plants`);
}

export async function listCustomers(salesOrg: string): Promise<CodeNameItem[]> {
  return apiFetch<CodeNameItem[]>(
    withSalesOrg(`${MASTERDATA_API}/customers`, salesOrg),
  );
}

export async function listMaterials(
  salesOrg: string,
): Promise<MaterialListItem[]> {
  return apiFetch<MaterialListItem[]>(
    withSalesOrg(`${MASTERDATA_API}/materials`, salesOrg),
  );
}

/** All active materials (no salesOrg) — procurement browse / PO lines. */
export async function listMaterialsAll(): Promise<MaterialListItem[]> {
  return apiFetch<MaterialListItem[]>(`${MASTERDATA_API}/materials`);
}

export async function getCustomer(code: string): Promise<CodeNameItem> {
  return apiFetch<CodeNameItem>(
    `${MASTERDATA_API}/customers/${encodeURIComponent(code)}`,
  );
}

export async function getMaterial(code: string): Promise<MaterialListItem> {
  return apiFetch<MaterialListItem>(
    `${MASTERDATA_API}/materials/${encodeURIComponent(code)}`,
  );
}

export async function listPurchasingOrganizations(): Promise<CodeNameItem[]> {
  return apiFetch<CodeNameItem[]>(
    `${MASTERDATA_API}/org/purchasing-organizations`,
  );
}

export async function getPurchasingOrganization(
  code: string,
): Promise<CodeNameItem> {
  return apiFetch<CodeNameItem>(
    `${MASTERDATA_API}/org/purchasing-organizations/${encodeURIComponent(code)}`,
  );
}

export async function listVendors(
  query: VendorListQuery = {},
): Promise<CodeNameItem[]> {
  return apiFetch<CodeNameItem[]>(
    `${MASTERDATA_API}/vendors${vendorQuery(query)}`,
  );
}

export async function getVendor(code: string): Promise<CodeNameItem> {
  return apiFetch<CodeNameItem>(
    `${MASTERDATA_API}/vendors/${encodeURIComponent(code)}`,
  );
}

export async function listVendorPurchasingOrgs(
  code: string,
): Promise<string[]> {
  return apiFetch<string[]>(
    `${MASTERDATA_API}/vendors/${encodeURIComponent(code)}/purchasing-orgs`,
  );
}
