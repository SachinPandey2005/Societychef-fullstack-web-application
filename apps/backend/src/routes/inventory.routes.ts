import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { getInventory, addIngredient, mapRecipe, adjustStock, logWastage } from '../controllers/inventory.controller';

const router = Router();

router.use(requireAuth);
// Restrict inventory access to Chefs and Admin roles
router.use(requireRole(['chef', 'admin', 'SUPER_ADMIN', 'OPERATIONS']));

router.get('/', getInventory);
router.post('/ingredients', addIngredient);
router.post('/recipes', mapRecipe);
router.post('/adjust', adjustStock);
router.post('/wastage', logWastage);

export default router;
