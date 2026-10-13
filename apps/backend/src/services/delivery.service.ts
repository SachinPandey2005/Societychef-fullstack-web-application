import { DeliveryRepository } from '../repositories/delivery.repository';
import { RealtimeService } from './realtime.service';
import { internalEventBus, EVENTS } from '../events/eventEmitter';
import { DeliveryStatus } from '../types/delivery';
import { ValidationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import { KitchenService } from './kitchen.service';
import { supabase } from '../config/supabase';

export class DeliveryService {
  static init() {
    internalEventBus.on(EVENTS.ORDER_READY, async (order) => {
      logger.info(`Assigning delivery partner for order ${order.id}`);
      try {
        await this.assignPartner(order.id);
      } catch (err) {
        logger.error('Failed to assign delivery partner automatically', err);
      }
    });
  }

  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async validateGeofence(kitchen_id: string, address_lat: number, address_lng: number): Promise<boolean> {
    const kitchen = await KitchenService.getKitchenById(kitchen_id);
    
    if (!kitchen.society_id) return false;
    
    const { data: society } = await supabase.from('societies').select('latitude, longitude').eq('id', kitchen.society_id).single();
    if (!society || !society.latitude || !society.longitude) return false;

    const R = 6371; // km
    const dLat = (address_lat - society.latitude) * Math.PI / 180;
    const dLon = (address_lng - society.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(society.latitude * Math.PI / 180) * Math.cos(address_lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; 

    const radius = kitchen.kitchen_info?.delivery_radius_km || 5; 
    return d <= radius;
  }

  static async calculateETA(originLat: number, originLng: number, destLat: number, destLng: number): Promise<number> {
    const R = 6371;
    const dLat = (destLat - originLat) * Math.PI / 180;
    const dLon = (destLng - originLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(originLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; 

    const minutesPerKm = 3;
    const etaMinutes = Math.ceil(d * minutesPerKm);
    return Math.max(5, etaMinutes);
  }

  static async assignPartner(order_id: string, manual_partner_id?: string) {
    let partner_id = manual_partner_id;

    if (!partner_id) {
      // Automatic Assignment Logic
      const availablePartners = await DeliveryRepository.getAvailablePartners(1);
      if (availablePartners.length === 0) {
        throw new Error('No delivery partners available');
      }
      partner_id = availablePartners[0].id;
    }

    const pickup_otp = this.generateOTP();
    const delivery_otp = this.generateOTP();

    const assignment = await DeliveryRepository.createAssignment({
      order_id,
      partner_id,
      status: 'ASSIGNED',
      pickup_otp,
      delivery_otp
    });

    internalEventBus.emit(EVENTS.DELIVERY_ASSIGNED, assignment);
    return assignment;
  }

  static async updateStatus(assignment_id: string, status: DeliveryStatus, partner_id: string, provided_otp?: string) {
    const assignment = await DeliveryRepository.getAssignment(assignment_id);
    
    if (!assignment) throw new NotFoundError('Assignment not found');
    if (assignment.partner_id !== partner_id) throw new ValidationError('Unauthorized to update this assignment');

    let timestampField: string | undefined;

    switch (status) {
      case 'ACCEPTED':
        if (assignment.status !== 'ASSIGNED') throw new ValidationError('Can only accept assigned orders');
        timestampField = 'accepted_at';
        internalEventBus.emit(EVENTS.DELIVERY_ACCEPTED, assignment);
        break;

      case 'REJECTED':
        if (assignment.status !== 'ASSIGNED') throw new ValidationError('Can only reject assigned orders');
        timestampField = 'delivered_at'; // Reusing as metadata timestamp or omit
        
        // Mark partner as AVAILABLE
        await DeliveryRepository.markPartnerAvailable(partner_id);
        // Release order so it is ready for assigning again
        await DeliveryRepository.releaseOrderForReassignment(assignment.order_id);
        
        // Schedule auto assign reattempt
        setTimeout(() => {
          DeliveryService.assignPartner(assignment.order_id).catch(err => logger.error('Re-assignment failed', err));
        }, 1000);
        break;

      case 'AT_PICKUP':
        if (assignment.status !== 'ACCEPTED') throw new ValidationError('Must accept order before reaching pickup location');
        break;

      case 'PICKED_UP':
        if (assignment.status !== 'AT_PICKUP') throw new ValidationError('Must reach pickup location before picking up');
        if (provided_otp !== assignment.pickup_otp) throw new ValidationError('Invalid Pickup OTP');
        timestampField = 'picked_up_at';
        internalEventBus.emit(EVENTS.PICKUP_COMPLETED, assignment);
        break;

      case 'OUT_FOR_DELIVERY':
        if (assignment.status !== 'PICKED_UP') throw new ValidationError('Must pick up order before delivering');
        break;

      case 'REACHED_CUSTOMER':
        if (assignment.status !== 'OUT_FOR_DELIVERY' && assignment.status !== 'PICKED_UP') {
          throw new ValidationError('Must be in transit before reaching customer');
        }
        break;

      case 'DELIVERED':
        if (assignment.status !== 'REACHED_CUSTOMER') throw new ValidationError('Must reach customer first');
        if (provided_otp !== assignment.delivery_otp) throw new ValidationError('Invalid Delivery OTP');
        timestampField = 'delivered_at';
        
        // Calculate earnings (Fixed ₹40 for simplicity in this phase — this
        // was writing 4000 instead of 40, a 100x overpayment on every single
        // delivery, since every other money column in this schema stores
        // plain rupees, not paise).
        await DeliveryRepository.createEarnings({
          assignment_id,
          partner_id,
          amount: 40
        });

        // Set partner status back to AVAILABLE
        await DeliveryRepository.markPartnerAvailable(partner_id);

        internalEventBus.emit(EVENTS.DELIVERY_COMPLETED, assignment);
        break;
        
      default:
        // Basic state transition allowed
        break;
    }

    const updated = await DeliveryRepository.updateAssignmentStatus(assignment_id, status, timestampField);
    await RealtimeService.broadcastEvent(`delivery:${assignment_id}`, 'STATUS_UPDATED', updated);
    return updated;
  }

  static async pushTracking(assignment_id: string, lat: number, lng: number, partner_id: string) {
    const assignment = await DeliveryRepository.getAssignment(assignment_id);
    if (!assignment || assignment.partner_id !== partner_id) throw new ValidationError('Unauthorized');

    await DeliveryRepository.recordTracking({ assignment_id, lat, lng });
    await DeliveryRepository.updatePartnerStatus(partner_id, true, lat, lng);

    await RealtimeService.broadcastEvent(`delivery:${assignment_id}`, 'LOCATION_UPDATE', { lat, lng });
  }
}

// Initialize listeners
DeliveryService.init();
