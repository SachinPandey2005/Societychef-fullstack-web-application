import { findDishByName } from './services/dishMatching';
import { getRandomDishImage } from './services/dishImageService';

const testCases = [
  "Matar Paneer",
  "matar paneer",
  "Mutter Paneer",
  "Mattar Paneer",
  "Rajma",
  "Veg Thali",
  "Special Homemade Pasta",
];

console.log("\n==========================================");
console.log("   DISH MATCHING & IMAGE TEST RESULTS     ");
console.log("==========================================\n");

testCases.forEach((input) => {
  const matched = findDishByName(input);
  const result = getRandomDishImage(input);
  console.log(`Input: "${input}"`);
  console.log(`  -> Matched ID: ${matched ? matched.id : 'NONE (Unknown Dish)'}`);
  console.log(`  -> Canonical Name: ${matched ? matched.name : 'N/A'}`);
  console.log(`  -> Is Fallback Image: ${result.isFallback}`);
  console.log(`  -> Image Asset Selected: ${Boolean(result.image)}\n`);
});
