// Map products to images using barcode or category fallback
// Images are lightweight SVG placeholders stored in src/assets/product-images

import dairy from '../assets/product-images/dairy.svg';
import beverages from '../assets/product-images/beverages.svg';
import grains from '../assets/product-images/grains.svg';
import cereals from '../assets/product-images/cereals.svg';
import vegetables from '../assets/product-images/vegetables.svg';
import fruits from '../assets/product-images/fruits.svg';
import snacks from '../assets/product-images/snacks.svg';
import sweets from '../assets/product-images/sweets.svg';
import personalCare from '../assets/product-images/personal-care.svg';
import household from '../assets/product-images/household.svg';
import fallbackImg from '../assets/product-images/default.svg';

const CATEGORY_MAP = {
  Dairy: dairy,
  Beverages: beverages,
  Grains: grains,
  Cereals: cereals,
  Vegetables: vegetables,
  Fruits: fruits,
  Snacks: snacks,
  Sweets: sweets,
  'Personal Care': personalCare,
  Household: household,
};

// Optional: specific images per known barcode
const BARCODE_IMAGE_MAP = {
  '8901234000001': dairy,
  '8901234000004': beverages,
  '8901234000007': grains,
  '8901234000009': cereals,
  '8901234000011': vegetables,
  '8901234000016': fruits,
  '8901234000020': snacks,
  '8901234000022': sweets,
  '8901234000024': personalCare,
  '8901234000028': household,
};

export function getProductImage(product) {
  if (!product) return fallbackImg;
  const { barcode, category } = product;
  if (barcode && BARCODE_IMAGE_MAP[barcode]) return BARCODE_IMAGE_MAP[barcode];
  if (category && CATEGORY_MAP[category]) return CATEGORY_MAP[category];
  return fallbackImg;
}

export default {
  getProductImage,
};
