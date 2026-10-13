import { DISH_CATALOG, CatalogDish } from '../constants/dishCatalog';

/**
 * Normalizes input text by converting to lowercase, removing non-alphanumeric
 * characters, and collapsing whitespace.
 *
 * @param text Raw string input
 * @returns Cleaned normalized string
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds a matching dish from DISH_CATALOG by evaluating:
 * 1. Normalized display name match
 * 2. ID exact match
 * 3. Known aliases exact match
 * 4. Substring phrase keyword matching (longest key first)
 * 5. Word token overlap matching
 *
 * @param dishName Name entered by chef (e.g., "Mutter Paneer", "matar paneer")
 * @returns CatalogDish object or null if no match found
 */
export function findDishByName(dishName: string): CatalogDish | null {
  const cleanInput = normalizeText(dishName);
  if (!cleanInput) return null;

  // 1. Exact match against display name (normalized)
  for (const dish of DISH_CATALOG) {
    if (normalizeText(dish.name) === cleanInput) {
      return dish;
    }
  }

  // 2. Exact match against machine ID
  for (const dish of DISH_CATALOG) {
    if (dish.id === cleanInput.replace(/\s+/g, '_')) {
      return dish;
    }
  }

  // 3. Exact match against aliases
  for (const dish of DISH_CATALOG) {
    for (const alias of dish.aliases) {
      if (normalizeText(alias) === cleanInput) {
        return dish;
      }
    }
  }

  // 4. Substring / phrase matching (sort longest catalog names & aliases first)
  for (const dish of DISH_CATALOG) {
    const normName = normalizeText(dish.name);
    if (cleanInput.includes(normName) || normName.includes(cleanInput)) {
      return dish;
    }
    for (const alias of dish.aliases) {
      const normAlias = normalizeText(alias);
      if (cleanInput.includes(normAlias) || normAlias.includes(cleanInput)) {
        return dish;
      }
    }
  }

  // 5. Individual word token matching (words with length >= 3)
  const tokens = cleanInput.split(' ').filter((w) => w.length >= 3);
  for (const token of tokens) {
    for (const dish of DISH_CATALOG) {
      if (normalizeText(dish.name).includes(token)) {
        return dish;
      }
      for (const alias of dish.aliases) {
        if (normalizeText(alias).includes(token)) {
          return dish;
        }
      }
    }
  }

  return null;
}
