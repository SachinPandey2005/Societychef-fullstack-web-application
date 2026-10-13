import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors';
import { ReviewRepository } from '../repositories/review.repository';
import { OrderRepository } from '../repositories/order.repository';
import { createReviewSchema } from '../validators/review.schema';
import { z } from 'zod';

export const getReviewsForKitchen = asyncHandler(async (req: Request, res: Response) => {
  const kitchenId = String(req.params.kitchenId);
  const data = await ReviewRepository.getByKitchen(kitchenId);
  sendSuccess(res, 'Reviews retrieved successfully', data);
});

/**
 * Previously inserted straight into Supabase with no consumer_id set at
 * all — a review could never be attributed to who wrote it — and no check
 * that the reviewer actually placed the order being reviewed.
 */
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createReviewSchema.parse({ body: req.body });

  const order = await OrderRepository.getOrderById(body.order_id);
  if (!order) throw new NotFoundError('Order not found');
  if (order.customer_id !== req.user!.id) {
    throw new AuthorizationError('You can only review your own orders.');
  }

  const review = await ReviewRepository.create({ ...body, consumer_id: req.user!.id });
  sendSuccess(res, 'Review submitted successfully', review, 201);
});

/** Previously had no ownership check at all — any caller could delete any review by id. */
export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const review = await ReviewRepository.findById(id);
  if (!review) throw new NotFoundError('Review not found');

  const isOwner = review.consumer_id === req.user!.id || review.customer_id === req.user!.id;
  const isAdmin = (req.user!.role || '').toUpperCase().includes('ADMIN');
  if (!isOwner && !isAdmin) {
    throw new AuthorizationError('You can only delete your own reviews.');
  }

  await ReviewRepository.delete(id);
  sendSuccess(res, 'Review deleted successfully');
});
