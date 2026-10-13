import { OrderService } from '../../../src/services/order.service';
import { OrderRepository } from '../../../src/repositories/order.repository';
import { KitchenService } from '../../../src/services/kitchen.service';
import { DishService } from '../../../src/services/dish.service';
import { CartService } from '../../../src/services/cart.service';
import { ProfileService } from '../../../src/services/profile.service';

describe('Unit: OrderSyncService & Isolation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Order Creation & Chef Ownership', () => {
    it('should assign correct kitchen_id to normal orders created from cart', async () => {
      const mockCart = {
        kitchen_id: 'chef-kitchen-uuid-1',
        items: [{ dish_id: 'dish-uuid-1', quantity: 2 }],
      };
      const mockDish = { id: 'dish-uuid-1', name: 'Paneer Butter Masala', price: 200, is_available: true, is_archived: false };
      const mockCreatedOrder = { id: 'order-1', profile_id: 'customer-1', kitchen_id: 'chef-kitchen-uuid-1', status: 'PENDING', grand_total: 400 };

      jest.spyOn(CartService, 'getCart').mockResolvedValue(mockCart as any);
      jest.spyOn(DishService, 'getDishById').mockResolvedValue(mockDish as any);
      jest.spyOn(OrderRepository, 'createOrder').mockResolvedValue(mockCreatedOrder as any);
      jest.spyOn(OrderRepository, 'createOrderItems').mockResolvedValue();
      jest.spyOn(CartService, 'clearCart').mockResolvedValue();
      jest.spyOn(KitchenService, 'getKitchenById').mockResolvedValue({ chef_user_id: 'chef-user-1' } as any);
      jest.spyOn(ProfileService, 'getProfileById').mockResolvedValue({ id: 'customer-1', name: 'Test Customer', society_id: 'society-1' } as any);

      const result = await OrderService.createOrderFromCart('customer-1', 'PICKUP');

      expect(result.kitchen_id).toBe('chef-kitchen-uuid-1');
      expect(OrderRepository.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          profile_id: 'customer-1',
          kitchen_id: 'chef-kitchen-uuid-1',
        })
      );
    });
  });

  describe('Chef Isolation', () => {
    it('should strictly return orders belonging to Chef A kitchen and exclude Chef B orders', async () => {
      const chefAOrders = [
        { id: 'order-a1', kitchen_id: 'chef-kitchen-a', status: 'PLACED' },
        { id: 'order-a2', kitchen_id: 'chef-kitchen-a', status: 'ACCEPTED' },
      ];

      jest.spyOn(OrderRepository, 'getKitchenHistory').mockImplementation(async (kitchenId: string) => {
        if (kitchenId === 'chef-kitchen-a') return chefAOrders as any;
        return [];
      });

      const ordersForChefA = await OrderService.getKitchenHistory('chef-kitchen-a');
      const ordersForChefB = await OrderService.getKitchenHistory('chef-kitchen-b');

      expect(ordersForChefA).toHaveLength(2);
      expect(ordersForChefA.every((o) => o.kitchen_id === 'chef-kitchen-a')).toBe(true);
      expect(ordersForChefB).toHaveLength(0);
    });
  });

  describe('Order Status Transition & Acceptance Flow', () => {
    it('should update status to ACCEPTED when chef accepts order', async () => {
      const mockOrder = { id: 'order-1', profile_id: 'customer-1', kitchen_id: 'chef-kitchen-a', status: 'PENDING', grand_total: 350 };
      const updatedOrder = { ...mockOrder, status: 'ACCEPTED' };

      jest.spyOn(OrderRepository, 'getOrderById').mockResolvedValue(mockOrder as any);
      jest.spyOn(OrderRepository, 'updateOrderStatus').mockResolvedValue(updatedOrder as any);

      const result = await OrderService.updateOrderStatus('order-1', 'ACCEPTED', 'chef');

      expect(result.status).toBe('ACCEPTED');
      expect(OrderRepository.updateOrderStatus).toHaveBeenCalledWith('order-1', 'ACCEPTED');
    });

    it('should reject unauthorized status changes', async () => {
      const mockOrder = { id: 'order-1', profile_id: 'customer-1', kitchen_id: 'chef-kitchen-a', status: 'PENDING' };

      jest.spyOn(OrderRepository, 'getOrderById').mockResolvedValue(mockOrder as any);

      await expect(OrderService.updateOrderStatus('order-1', 'ACCEPTED', 'consumer')).rejects.toThrow(
        'Only chefs or admins can manage order preparation'
      );
    });
  });

  describe('Customer to Chef Chat Flow', () => {
    it('should route chat messages to correct chef and broadcast realtime events', async () => {
      const { ChatService } = require('../../../src/services/chat.service');
      const { ChatRepository } = require('../../../src/repositories/chat.repository');
      const { RealtimeService } = require('../../../src/services/realtime.service');

      const mockOrder = { id: 'order-1', profile_id: 'customer-1', kitchen_id: 'chef-kitchen-a' };
      const mockKitchen = { id: 'chef-kitchen-a', chef_user_id: 'chef-user-1' };
      const mockThread = { id: 'thread-1', order_id: 'order-1', consumer_id: 'customer-1', kitchen_id: 'chef-kitchen-a' };
      const mockMsg = { id: 'msg-1', thread_id: 'thread-1', sender_id: 'customer-1', body: 'Heyyy' };

      jest.spyOn(OrderService, 'getOrderById').mockResolvedValue(mockOrder as any);
      jest.spyOn(KitchenService, 'getKitchenById').mockResolvedValue(mockKitchen as any);
      jest.spyOn(ChatRepository, 'findOrCreateOrderConversation').mockResolvedValue(mockThread as any);
      jest.spyOn(ChatRepository, 'createMessage').mockResolvedValue(mockMsg as any);
      jest.spyOn(RealtimeService, 'broadcastEvent').mockResolvedValue(undefined);

      const result = await ChatService.sendOrderMessage('order-1', 'customer-1', 'Heyyy');

      expect(result.body).toBe('Heyyy');
      expect(ChatRepository.findOrCreateOrderConversation).toHaveBeenCalledWith('order-1', 'customer-1', 'chef-kitchen-a');
      expect(RealtimeService.broadcastEvent).toHaveBeenCalledWith('chat:thread-1', 'NEW_MESSAGE', mockMsg);
    });
  });
});
