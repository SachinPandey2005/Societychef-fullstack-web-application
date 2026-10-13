import { findDishByName } from './dishMatching';
import { dishImageCatalog, DEFAULT_DISH_IMAGES, DEFAULT_DISH_IMAGE } from '../constants/dishImageCatalog';
import { CatalogDish } from '../constants/dishCatalog';

export interface DishImageResult {
  image: any;
  dish: CatalogDish | null;
  isFallback: boolean;
  imagesList: any[];
}

/**
 * Deterministic index picker — same input string always yields the same
 * index into an array of a given length. Used instead of Math.random() below
 * so a dish's auto-picked stock photo is stable across renders/screens.
 */
function stableIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

/**
 * Returns a predefined image for a given dish name string, picked
 * deterministically from the matching pool so the same dish name always
 * resolves to the same photo. Uses findDishByName to resolve aliases and
 * canonical IDs. If dish is unrecognized, returns fallback image safely.
 *
 * This used to pick with Math.random() on every call — meaning the exact
 * same dish rendered on two different screens (e.g. a dish detail page, then
 * the cart) could show two different photos, since nothing carried the
 * actually-displayed image forward and this function re-rolled fresh each
 * time it ran.
 *
 * @param dishName Name of the dish (e.g. "Mutter Paneer", "Special Homemade Pasta")
 * @returns DishImageResult containing the deterministically selected image, dish metadata, and fallback status
 */
export function getRandomDishImage(dishName: string): DishImageResult {
  const matchedDish = findDishByName(dishName);

  if (matchedDish) {
    const images = dishImageCatalog[matchedDish.id];
    if (images && images.length > 0) {
      const index = stableIndex(matchedDish.id, images.length);
      return {
        image: images[index],
        dish: matchedDish,
        isFallback: false,
        imagesList: images,
      };
    }
  }

  // Safe Fallback for Unknown / Unmapped Dishes — still stable per dish name.
  const index = stableIndex(dishName || 'unknown', DEFAULT_DISH_IMAGES.length);
  return {
    image: DEFAULT_DISH_IMAGES[index],
    dish: null,
    isFallback: true,
    imagesList: DEFAULT_DISH_IMAGES,
  };
}

/**
 * Gets all available predefined images for a matched dish ID.
 *
 * @param dishId Canonical dish ID (e.g. "matar_paneer")
 * @returns Array of image assets or default fallback array
 */
export function getPredefinedImagesForDish(dishId: string): any[] {
  if (dishId && dishImageCatalog[dishId] && dishImageCatalog[dishId].length > 0) {
    return dishImageCatalog[dishId];
  }
  return DEFAULT_DISH_IMAGES;
}

export { DEFAULT_DISH_IMAGE };
