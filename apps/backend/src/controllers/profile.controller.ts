import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ProfileService } from '../services/profile.service';
import { sendSuccess } from '../utils/response';
import { createProfileSchema, updateProfileSchema, profileIdSchema } from '../validators/profile.schema';

export const getProfiles = asyncHandler(async (req: Request, res: Response) => {
  const profiles = await ProfileService.getAllProfiles();
  sendSuccess(res, 'Profiles retrieved successfully', profiles);
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const { params } = profileIdSchema.parse({ params: req.params });
  const profile = await ProfileService.getProfileById(params.id);
  sendSuccess(res, 'Profile retrieved successfully', profile);
});

export const createProfile = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createProfileSchema.parse({ body: req.body });
  // profiles.id has no default (it's meant to come from the auth system) and
  // the request body never carries one — this endpoint is admin-only
  // (profile.routes.ts), creating a profile not tied to a signup flow, so a
  // fresh id is generated here rather than left unset (which would violate
  // the NOT NULL constraint on every call, as it always has until now).
  const profile = await ProfileService.createProfile({ ...body, id: crypto.randomUUID() });
  sendSuccess(res, 'Profile created successfully', profile, 201);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { params } = profileIdSchema.parse({ params: req.params });
  const { body } = updateProfileSchema.parse({ body: req.body });
  const profile = await ProfileService.updateProfile(params.id, body);
  sendSuccess(res, 'Profile updated successfully', profile);
});

export const deleteProfile = asyncHandler(async (req: Request, res: Response) => {
  const { params } = profileIdSchema.parse({ params: req.params });
  await ProfileService.deleteProfile(params.id);
  sendSuccess(res, 'Profile deleted successfully');
});
