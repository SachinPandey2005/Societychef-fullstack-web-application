import { Router } from 'express';
import { getCart, addDishToCart, updateCartItem, removeCartItem, clearCart } from '../controllers/cart.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Cart is inherently protected to the active consumer
router.use(requireAuth);

router.route('/')
  .get(getCart)
  .delete(clearCart);

router.route('/items')
  .post(addDishToCart);

router.route('/items/:id')
  .patch(updateCartItem)
  .delete(removeCartItem);

export default router;
