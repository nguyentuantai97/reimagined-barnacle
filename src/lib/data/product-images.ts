/**
 * Product Image Mapping
 * Maps product codes/names to image URLs
 * Uses paper cup images for AN Milk Tea
 */

// Default fallback images by category
export const categoryDefaultImages: Record<string, string> = {
  'tra-sua': '/images/products/tra-sua-default.jpg',
  'tra-trai-cay': '/images/products/tra-trai-cay-default.jpg',
  'latte': '/images/products/latte-default.jpg',
  'sua-tuoi': '/images/products/sua-tuoi-default.jpg',
  'yaourt': '/images/products/yaourt-default.jpg',
  'topping': '/images/products/tra-sua-default.jpg',
  'tra-dong-gia-12k': '/images/products/tra-12k-default.jpg',
  'tra-bi-dao': '/images/products/tra-bi-dao-default.jpg',
  'tang': '/images/products/tra-sua-default.jpg',
  'khac': '/images/products/tra-sua-default.jpg',
};

// Specific product images (by product code)
export const productImages: Record<string, string> = {
  // === TRA SUA ===
  'TS': '/images/products/tra-sua.jpg',
  'TSTT': '/images/products/tra-sua-tc-trang.jpg',
  'TSTD': '/images/products/tra-sua-tc-den.jpg',
  'TSTHK': '/images/products/tra-sua-tc-hoang-kim.jpg',
  'TSTTM': '/images/products/tra-sua-tc-trang.jpg',
  'TSTDM': '/images/products/tra-sua-tc-den.jpg',
  'TSTHKM': '/images/products/tra-sua-tc-hoang-kim.jpg',
  'TSS': '/images/products/tra-sua-socola.jpg',
  'TSSTHK': '/images/products/tra-sua-socola.jpg',
  'TSFT': '/images/products/tra-sua-full-topping.jpg',
  'TSCCC': '/images/products/tra-sua-cacao.jpg',
  'TSCC': '/images/products/tra-sua.jpg',
  '1': '/images/products/tra-sua-lai.jpg',
  '8': '/images/products/tra-sua-lai-vai.jpg',

  // === TRA TRAI CAY ===
  'TXX': '/images/products/tra-xanh-xoai.jpg',
  'TXD': '/images/products/tra-xanh-dao.jpg',
  'TXV': '/images/products/tra-xanh-vai.jpg',
  'TXM': '/images/products/tra-xoai-macchiato.jpg',
  'TSV': '/images/products/tra-sen-vang.jpg',
  'TDV': '/images/products/tra-dao-vai.jpg',
  'TD': '/images/products/tra-dao.jpg',
  '7': '/images/products/tra-trai-cay-default.jpg', // Tra Oi Hong
  'OD': '/images/products/tra-dao-vai.jpg', // Olong Dao
  'Ôld': '/images/products/tra-dao-vai.jpg', // Olong Dau
  'OV': '/images/products/tra-xanh-vai.jpg', // Olong Vai
  'OX': '/images/products/tra-xanh-xoai.jpg', // Olong Xoai
  'TDD': '/images/products/tra-dao.jpg', // Tra Den Dao
  'TRDADA': '/images/products/tra-dao.jpg', // Tra Dao Dau

  // === TRA DONG GIA 12K ===
  'TX': '/images/products/tra-xanh.jpg',
  'TXC': '/images/products/tra-xanh-chanh.jpg',
  'TT': '/images/products/tra-tac.jpg',
  'TBD': '/images/products/tra-bi-dao.jpg',
  'HT': '/images/products/tra-12k-default.jpg', // Hong Tra
  'HTC': '/images/products/tra-xanh-chanh.jpg', // Hong Tra Chanh
  'TO': '/images/products/tra-12k-default.jpg', // Tra Olong

  // === TRA BI DAO ===
  '3': '/images/products/tra-bi-dao.jpg', // Tra Den Bi Dao
  '5': '/images/products/tra-xanh-bi-dao.jpg',
  '6': '/images/products/tra-bi-dao.jpg', // Olong Bi Dao

  // === LATTE ===
  'ML': '/images/products/latte-matcha.jpg',
  'CL': '/images/products/latte-cacao.jpg',
  'Khoai Môn Latte': '/images/products/latte-khoai-mon.jpg',
  'CPST': '/images/products/latte-default.jpg', // Ca Phe Sua Tuoi
  'CPSC': '/images/products/latte-default.jpg', // Ca Phe Sua Chuoi
  'CPSG': '/images/products/latte-default.jpg', // Ca Phe Sua Gau
  'CSC': '/images/products/latte-cacao.jpg', // Cacao Sua Chuoi
  'CSG': '/images/products/latte-cacao.jpg', // Cacao Sua Gau
  'MSC': '/images/products/latte-matcha.jpg', // Matcha Sua Chuoi
  'MSG': '/images/products/latte-matcha.jpg', // Matcha Sua Gau
  'MlD': '/images/products/latte-matcha.jpg', // Matcha Dau

  // === SUA TUOI ===
  'STTC': '/images/products/sua-tuoi-default.jpg', // Sua Tuoi Thach Caramel
  'STTDD': '/images/products/sua-tuoi-duong-den.jpg',
  'STTDDM': '/images/products/sua-tuoi-duong-den.jpg',
  'STTT': '/images/products/sua-tuoi-tran-chau.jpg',
  'Sữa Tươi SS': '/images/products/sua-tuoi-default.jpg', // Sua Tuoi Suong Sao

  // === YAOURT ===
  '2': '/images/products/yaourt-da.jpg',
  'Yaourt Dâu': '/images/products/yaourt-dau.jpg',
  'YVQ': '/images/products/yaourt-viet-quat.jpg',
  'YTDD': '/images/products/yaourt-tc-duong-den.jpg',

  // === TANG (Promotional) ===
  '15k': '/images/products/latte-matcha.jpg',
  'T15k': '/images/products/tra-sua-tc-trang.jpg',
  'CLT15k': '/images/products/latte-cacao.jpg',
  'TTXX': '/images/products/tra-xanh-xoai.jpg',
};

/**
 * Get product image URL
 * Falls back to category default, then generic placeholder
 */
export function getProductImage(productCode: string, category: string): string {
  // Check specific product image first
  if (productImages[productCode]) {
    return productImages[productCode];
  }

  // Fall back to category default
  if (categoryDefaultImages[category]) {
    return categoryDefaultImages[category];
  }

  // Generic fallback
  return '';
}

/**
 * Check if product has a real image (not placeholder)
 */
export function hasProductImage(productCode: string): boolean {
  return productCode in productImages;
}
