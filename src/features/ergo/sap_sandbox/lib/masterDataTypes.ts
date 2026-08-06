export type CodeNameItem = {
  code: string;
  name: string;
  isActive: boolean;
};

export type MaterialListItem = {
  code: string;
  name: string;
  baseUnit: string;
  isActive: boolean;
};

export type VendorListQuery = {
  purchasingOrg?: string;
  includeInactive?: boolean;
};
