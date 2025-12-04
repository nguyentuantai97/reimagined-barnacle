/**
 * Product Image Mapping
 * Maps product codes/names to image URLs
 *
 * Tạm thời dùng placeholder, sau này thay bằng ảnh thật
 */

// Default fallback images by category
export const categoryDefaultImages: Record<string, string> = {
  'tra-sua': '/images/products/tra-sua-default.jpg',
  'tra-trai-cay': '/images/products/tra-trai-cay-default.jpg',
  'latte': '/images/products/latte-default.jpg',
  'sua-tuoi': '/images/products/sua-tuoi-default.jpg',
  'yaourt': '/images/products/yaourt-default.jpg',
  'topping': '/images/products/topping-default.jpg',
  'tra-dong-gia-12k': '/images/products/tra-12k-default.jpg',
  'tra-bi-dao': '/images/products/tra-bi-dao-default.jpg',
};

// Specific product images (by product code)
export const productImages: Record<string, string> = {
  // === TRÀ SỮA ===
  'TS': '/images/products/tra-sua.jpg', // Trà Sữa
  'TSTT': '/images/products/tra-sua-tc-trang.jpg', // Trà Sữa TC Trắng
  'TSTD': '/images/products/tra-sua-tc-den.jpg', // Trà Sữa TC Đen
  'TSTHK': '/images/products/tra-sua-tc-hoang-kim.jpg', // Trà Sữa TC Hoàng Kim
  'TSTTM': '/images/products/tra-sua-tc-trang-macchiato.jpg', // Trà Sữa TC Trắng Macchiato
  'TSTDM': '/images/products/tra-sua-tc-den-macchiato.jpg', // Trà Sữa TC Đen Macchiato
  'TSTHKM': '/images/products/tra-sua-tc-hoang-kim-macchiato.jpg', // Trà Sữa TC Hoàng Kim Macchiato
  'TSS': '/images/products/tra-sua-socola.jpg', // Trà Sữa Socola
  'TSSTHK': '/images/products/tra-sua-socola-tc-hoang-kim.jpg', // Trà Sữa Socola TC Hoàng Kim
  'TSFT': '/images/products/tra-sua-full-topping.jpg', // Trà Sữa Full Topping
  'TSCCC': '/images/products/tra-sua-cacao.jpg', // Trà Sữa Cacao
  'TSCC': '/images/products/tra-sua-chom-chom.jpg', // Trà Sữa Chôm Chôm
  '1': '/images/products/tra-sua-lai.jpg', // Trà Sữa Lài
  '8': '/images/products/tra-sua-lai-vai.jpg', // Trà Sữa Lài Vải

  // === TRÀ TRÁI CÂY ===
  'TXX': '/images/products/tra-xanh-xoai.jpg', // Trà Xanh Xoài
  'TXD': '/images/products/tra-xanh-dao.jpg', // Trà Xanh Đào
  'TXV': '/images/products/tra-xanh-vai.jpg', // Trà Xanh Vải
  'TXM': '/images/products/tra-xoai-macchiato.jpg', // Trà Xoài Macchiato
  'TSV': '/images/products/tra-sen-vang.jpg', // Trà Sen Vàng
  'TDX': '/images/products/tra-dao-xoai.jpg', // Trà Đào Xoài
  'TDV': '/images/products/tra-dao-vai.jpg', // Trà Đào Vải
  'TVX': '/images/products/tra-vai-xoai.jpg', // Trà Vải Xoài

  // === TRÀ ĐỒNG GIÁ 12K ===
  'TX': '/images/products/tra-xanh.jpg', // Trà Xanh
  'TXC': '/images/products/tra-xanh-chanh.jpg', // Trà Xanh Chanh
  'TT': '/images/products/tra-tac.jpg', // Trà Tắc
  'TD': '/images/products/tra-dao.jpg', // Trà Đào

  // === TRÀ BÍ ĐAO ===
  '5': '/images/products/tra-xanh-bi-dao.jpg', // Trà Xanh Bí Đao
  'TBD': '/images/products/tra-bi-dao.jpg', // Trà Bí Đao

  // === LATTE ===
  'LM': '/images/products/latte-matcha.jpg', // Latte Matcha
  'LS': '/images/products/latte-socola.jpg', // Latte Socola
  'LK': '/images/products/latte-khoai-mon.jpg', // Latte Khoai Môn
  'LC': '/images/products/latte-cacao.jpg', // Latte Cacao

  // === SỮA TƯƠI ===
  'STM': '/images/products/sua-tuoi-matcha.jpg', // Sữa Tươi Matcha
  'STS': '/images/products/sua-tuoi-socola.jpg', // Sữa Tươi Socola
  'STKM': '/images/products/sua-tuoi-khoai-mon.jpg', // Sữa Tươi Khoai Môn
  'STDD': '/images/products/sua-tuoi-duong-den.jpg', // Sữa Tươi Đường Đen
  '3': '/images/products/sua-tuoi-tran-chau.jpg', // Sữa Tươi Trân Châu

  // === YAOURT ===
  '2': '/images/products/yaourt-da.jpg', // Yaourt Đá
  'Yaourt Dâu': '/images/products/yaourt-dau.jpg', // Yaourt Dâu
  'YVQ': '/images/products/yaourt-viet-quat.jpg', // Yaourt Việt Quất
  'YTDD': '/images/products/yaourt-tc-duong-den.jpg', // Yaourt TC Đường Đen

  // === TOPPING ===
  'TV': '/images/products/trai-vai.jpg', // Trái Vải
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
