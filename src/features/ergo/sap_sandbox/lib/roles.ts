/** Feature-local role helpers; implementation lives in shared/auth. */
export {
  canAdjustInventory,
  canPostGoodsReceipt,
  canPostInvoiceReceipt,
  canReadAp,
  canReadAr,
  canReadBilling,
  canReadDelivery,
  canReadInventory,
  canReadMasterData,
  canReadProcurement,
  canReadProcurementMasterData,
  canReadSales,
  canWriteBilling,
  canWriteDelivery,
  canWritePurchaseOrder,
  canWriteSales,
} from "@/shared/auth/roles";
