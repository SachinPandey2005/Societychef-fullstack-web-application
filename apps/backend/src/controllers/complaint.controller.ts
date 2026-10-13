import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ComplaintService } from '../services/complaint.service';
import { sendSuccess } from '../utils/response';
import { searchSchema } from '../validators/crm.schema';
import { createComplaintSchema, updateComplaintStatusSchema } from '../validators/complaint.schema';

export const getComplaints = asyncHandler(async (req: Request, res: Response) => {
  const { query } = searchSchema.parse({ query: req.query });
  const complaints = await ComplaintService.getComplaints(query.page, query.limit);
  sendSuccess(res, 'Complaints retrieved', complaints);
});

export const createComplaint = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createComplaintSchema.parse({ body: req.body });
  const complaint = await ComplaintService.createComplaint(body.reporter_id, body.type, body.description, body.target_id);
  sendSuccess(res, 'Complaint created', complaint, 201);
});

export const updateComplaintStatus = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { params, body } = updateComplaintStatusSchema.parse({ params: req.params, body: req.body });
  
  const complaint = await ComplaintService.updateStatus(admin_id, params.id, body.status, body.resolution_notes);
  sendSuccess(res, `Complaint status updated to ${body.status}`, complaint);
});
