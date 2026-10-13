import { Router } from 'express';
import { getSocieties, getSociety, createSociety, updateSociety, deleteSociety } from '../controllers/society.controller';

const router = Router();

router.route('/')
  .get(getSocieties)
  .post(createSociety);

router.route('/:id')
  .get(getSociety)
  .put(updateSociety)
  .delete(deleteSociety);

export default router;
