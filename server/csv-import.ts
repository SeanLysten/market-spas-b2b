import * as XLSX from "xlsx";

export interface CSVOrderRow {
  sku: string;
  quantity: number;
}

export interface CSVImportResult {
  success: boolean;
  validRows: Array<{ sku: string; productId: number; productName: string; quantity: number; price: number }>;
  errors: Array<{ row: number; sku: string; error: string }>;
  totalRows: number;
}

/**
 * Parse CSV/Excel file and validate SKUs against products database
 */
export async function parseOrderCSV(
  fileBuffer: Buffer,
  getProductBySKU: (sku: string) => Promise<any>
): Promise<CSVImportResult> {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data: any[] = XLSX.utils.sheet_to_json(worksheet);
  
  const validRows: CSVImportResult["validRows"] = [];
  const errors: CSVImportResult["errors"] = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have header
    
    // Extract SKU and quantity (case-insensitive column names)
    const sku = row.SKU || row.sku || row.Sku || row.code || row.Code || row.CODE;
    const quantity = row.Quantity || row.quantity || row.QUANTITY || row.qty || row.Qty || row.QTY;
    
    // Validation
    if (!sku) {
      errors.push({ row: rowNumber, sku: "", error: "SKU manquant" });
      continue;
    }
    
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      errors.push({ row: rowNumber, sku: String(sku), error: "Quantité invalide" });
      continue;
    }
    
    // Check if product exists
    try {
      const product = await getProductBySKU(String(sku).trim());
      
      if (!product) {
        errors.push({ row: rowNumber, sku: String(sku), error: "Produit introuvable" });
        continue;
      }
      
      // Check stock
      if (product.stockStatus === "OUT_OF_STOCK") {
        errors.push({ row: rowNumber, sku: String(sku), error: "Produit en rupture de stock" });
        continue;
      }
      
      validRows.push({
        sku: String(sku).trim(),
        productId: product.id,
        productName: product.name,
        quantity: Number(quantity),
        price: product.price,
      });
    } catch (error) {
      errors.push({ row: rowNumber, sku: String(sku), error: "Erreur lors de la vérification du produit" });
    }
  }
  
  return {
    success: errors.length === 0,
    validRows,
    errors,
    totalRows: data.length,
  };
}

/**
 * Generate a CSV template for bulk orders
 */
export function generateOrderTemplate(): Buffer {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["SKU", "Quantity"],
    ["WELLIS-SPA-001", "2"],
    ["WELLIS-SPA-002", "1"],
    ["WELLIS-ACC-123", "5"],
  ]);
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Commande");
  
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
