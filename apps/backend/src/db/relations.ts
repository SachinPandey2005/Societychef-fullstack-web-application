import { relations } from "drizzle-orm/relations";
import { kitchens, dishes, chatThreads, chatMessages, profiles, orders, orderItems, weeklyDishes, settlements, addresses, deliveryPartners, wallets, walletTransactions, tickets, refunds, financialAdjustments, disputeCases, disputeComments, notifications, partnerBankAccounts, partnerEmergencyContacts, partnerSocietyAssignments, societies, partnerVerificationLogs, deliveryPartnerMetrics, partnerBadges, partnerTargets, partnerVehicles, partnerRewards, partnerPenalties, emergencySosAlarms, ticketMessages, partnerIncidents, partnerIncentives, partnerLeaderboard, partnerRedemptions, rewardCatalog, partnerSettings, verificationRequests, systemAuditLogs, deviceTokens, notificationPreferences, verificationHistory, deliveryPartnerLocation, partnerFeedback, partnerDevices, kitchenVerifications, partnerDocuments, auditLogs, deliveryAssignments, deliveryTracking, deliveryEarnings, payoutRequests, partyMenus } from "./schema";

export const dishesRelations = relations(dishes, ({one, many}) => ({
	kitchen: one(kitchens, {
		fields: [dishes.kitchenId],
		references: [kitchens.id]
	}),
	orderItems: many(orderItems),
}));

export const kitchensRelations = relations(kitchens, ({one, many}) => ({
	dishes: many(dishes),
	weeklyDishes: many(weeklyDishes),
	chatThreads: many(chatThreads),
	settlements: many(settlements),
	refunds: many(refunds),
	disputeCases: many(disputeCases),
	kitchenVerifications: many(kitchenVerifications),
	orders: many(orders),
	profile: one(profiles, {
		fields: [kitchens.chefUserId],
		references: [profiles.id]
	}),
	payoutRequests: many(payoutRequests),
	partyMenus: many(partyMenus),
}));

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	chatThread: one(chatThreads, {
		fields: [chatMessages.threadId],
		references: [chatThreads.id]
	}),
	profile: one(profiles, {
		fields: [chatMessages.senderId],
		references: [profiles.id]
	}),
}));

export const chatThreadsRelations = relations(chatThreads, ({one, many}) => ({
	chatMessages: many(chatMessages),
	profile: one(profiles, {
		fields: [chatThreads.consumerId],
		references: [profiles.id]
	}),
	kitchen: one(kitchens, {
		fields: [chatThreads.kitchenId],
		references: [kitchens.id]
	}),
}));

export const profilesRelations = relations(profiles, ({many}) => ({
	chatMessages: many(chatMessages),
	chatThreads: many(chatThreads),
	addresses: many(addresses),
	deliveryPartners: many(deliveryPartners),
	wallets_profileId: many(wallets, {
		relationName: "wallets_profileId_profiles_id"
	}),
	wallets_userId: many(wallets, {
		relationName: "wallets_userId_profiles_id"
	}),
	tickets_profileId: many(tickets, {
		relationName: "tickets_profileId_profiles_id"
	}),
	tickets_assignedAgentId: many(tickets, {
		relationName: "tickets_assignedAgentId_profiles_id"
	}),
	refunds_customerId: many(refunds, {
		relationName: "refunds_customerId_profiles_id"
	}),
	refunds_requestedBy: many(refunds, {
		relationName: "refunds_requestedBy_profiles_id"
	}),
	refunds_approvedBy: many(refunds, {
		relationName: "refunds_approvedBy_profiles_id"
	}),
	refunds_processedBy: many(refunds, {
		relationName: "refunds_processedBy_profiles_id"
	}),
	financialAdjustments_requestedBy: many(financialAdjustments, {
		relationName: "financialAdjustments_requestedBy_profiles_id"
	}),
	financialAdjustments_approvedBy: many(financialAdjustments, {
		relationName: "financialAdjustments_approvedBy_profiles_id"
	}),
	disputeCases_customerId: many(disputeCases, {
		relationName: "disputeCases_customerId_profiles_id"
	}),
	disputeCases_assignedAgentId: many(disputeCases, {
		relationName: "disputeCases_assignedAgentId_profiles_id"
	}),
	disputeComments: many(disputeComments),
	notifications: many(notifications),
	partnerVerificationLogs: many(partnerVerificationLogs),
	ticketMessages: many(ticketMessages),
	deviceTokens: many(deviceTokens),
	notificationPreferences: many(notificationPreferences),
	verificationHistories: many(verificationHistory),
	kitchenVerifications: many(kitchenVerifications),
	orders: many(orders),
	kitchens: many(kitchens),
	auditLogs: many(auditLogs),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	dish: one(dishes, {
		fields: [orderItems.dishId],
		references: [dishes.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	orderItems: many(orderItems),
	walletTransactions: many(walletTransactions),
	tickets: many(tickets),
	refunds: many(refunds),
	disputeCases: many(disputeCases),
	emergencySosAlarms: many(emergencySosAlarms),
	partnerIncidents: many(partnerIncidents),
	deliveryPartnerLocations: many(deliveryPartnerLocation),
	profile: one(profiles, {
		fields: [orders.customerId],
		references: [profiles.id]
	}),
	kitchen: one(kitchens, {
		fields: [orders.kitchenId],
		references: [kitchens.id]
	}),
	deliveryPartner: one(deliveryPartners, {
		fields: [orders.deliveryPartnerId],
		references: [deliveryPartners.id]
	}),
	deliveryAssignments: many(deliveryAssignments),
}));

export const weeklyDishesRelations = relations(weeklyDishes, ({one}) => ({
	kitchen: one(kitchens, {
		fields: [weeklyDishes.kitchenId],
		references: [kitchens.id]
	}),
}));

export const settlementsRelations = relations(settlements, ({one}) => ({
	kitchen: one(kitchens, {
		fields: [settlements.kitchenId],
		references: [kitchens.id]
	}),
}));

export const addressesRelations = relations(addresses, ({one}) => ({
	profile: one(profiles, {
		fields: [addresses.consumerId],
		references: [profiles.id]
	}),
}));

export const deliveryPartnersRelations = relations(deliveryPartners, ({one, many}) => ({
	profile: one(profiles, {
		fields: [deliveryPartners.userId],
		references: [profiles.id]
	}),
	partnerBankAccounts: many(partnerBankAccounts),
	partnerEmergencyContacts: many(partnerEmergencyContacts),
	partnerSocietyAssignments: many(partnerSocietyAssignments),
	partnerVerificationLogs: many(partnerVerificationLogs),
	deliveryPartnerMetrics: many(deliveryPartnerMetrics),
	partnerBadges: many(partnerBadges),
	partnerTargets: many(partnerTargets),
	partnerVehicles: many(partnerVehicles),
	partnerRewards: many(partnerRewards),
	partnerPenalties: many(partnerPenalties),
	emergencySosAlarms: many(emergencySosAlarms),
	partnerIncidents: many(partnerIncidents),
	partnerIncentives: many(partnerIncentives),
	partnerLeaderboards: many(partnerLeaderboard),
	partnerRedemptions: many(partnerRedemptions),
	partnerSettings: many(partnerSettings),
	verificationRequests: many(verificationRequests),
	systemAuditLogs: many(systemAuditLogs),
	deliveryPartnerLocations: many(deliveryPartnerLocation),
	partnerFeedbacks: many(partnerFeedback),
	partnerDevices: many(partnerDevices),
	orders: many(orders),
	partnerDocuments: many(partnerDocuments),
	deliveryAssignments: many(deliveryAssignments),
	deliveryEarnings: many(deliveryEarnings),
}));

export const walletsRelations = relations(wallets, ({one, many}) => ({
	profile_profileId: one(profiles, {
		fields: [wallets.profileId],
		references: [profiles.id],
		relationName: "wallets_profileId_profiles_id"
	}),
	profile_userId: one(profiles, {
		fields: [wallets.userId],
		references: [profiles.id],
		relationName: "wallets_userId_profiles_id"
	}),
	walletTransactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({one}) => ({
	wallet: one(wallets, {
		fields: [walletTransactions.walletId],
		references: [wallets.id]
	}),
	order: one(orders, {
		fields: [walletTransactions.orderId],
		references: [orders.id]
	}),
}));

export const ticketsRelations = relations(tickets, ({one, many}) => ({
	profile_profileId: one(profiles, {
		fields: [tickets.profileId],
		references: [profiles.id],
		relationName: "tickets_profileId_profiles_id"
	}),
	order: one(orders, {
		fields: [tickets.orderId],
		references: [orders.id]
	}),
	profile_assignedAgentId: one(profiles, {
		fields: [tickets.assignedAgentId],
		references: [profiles.id],
		relationName: "tickets_assignedAgentId_profiles_id"
	}),
	ticketMessages: many(ticketMessages),
}));

export const refundsRelations = relations(refunds, ({one}) => ({
	order: one(orders, {
		fields: [refunds.orderId],
		references: [orders.id]
	}),
	profile_customerId: one(profiles, {
		fields: [refunds.customerId],
		references: [profiles.id],
		relationName: "refunds_customerId_profiles_id"
	}),
	kitchen: one(kitchens, {
		fields: [refunds.kitchenId],
		references: [kitchens.id]
	}),
	profile_requestedBy: one(profiles, {
		fields: [refunds.requestedBy],
		references: [profiles.id],
		relationName: "refunds_requestedBy_profiles_id"
	}),
	profile_approvedBy: one(profiles, {
		fields: [refunds.approvedBy],
		references: [profiles.id],
		relationName: "refunds_approvedBy_profiles_id"
	}),
	profile_processedBy: one(profiles, {
		fields: [refunds.processedBy],
		references: [profiles.id],
		relationName: "refunds_processedBy_profiles_id"
	}),
}));

export const financialAdjustmentsRelations = relations(financialAdjustments, ({one}) => ({
	profile_requestedBy: one(profiles, {
		fields: [financialAdjustments.requestedBy],
		references: [profiles.id],
		relationName: "financialAdjustments_requestedBy_profiles_id"
	}),
	profile_approvedBy: one(profiles, {
		fields: [financialAdjustments.approvedBy],
		references: [profiles.id],
		relationName: "financialAdjustments_approvedBy_profiles_id"
	}),
}));

export const disputeCasesRelations = relations(disputeCases, ({one, many}) => ({
	order: one(orders, {
		fields: [disputeCases.orderId],
		references: [orders.id]
	}),
	profile_customerId: one(profiles, {
		fields: [disputeCases.customerId],
		references: [profiles.id],
		relationName: "disputeCases_customerId_profiles_id"
	}),
	kitchen: one(kitchens, {
		fields: [disputeCases.kitchenId],
		references: [kitchens.id]
	}),
	profile_assignedAgentId: one(profiles, {
		fields: [disputeCases.assignedAgentId],
		references: [profiles.id],
		relationName: "disputeCases_assignedAgentId_profiles_id"
	}),
	disputeComments: many(disputeComments),
}));

export const disputeCommentsRelations = relations(disputeComments, ({one}) => ({
	disputeCase: one(disputeCases, {
		fields: [disputeComments.disputeId],
		references: [disputeCases.id]
	}),
	profile: one(profiles, {
		fields: [disputeComments.authorId],
		references: [profiles.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	profile: one(profiles, {
		fields: [notifications.profileId],
		references: [profiles.id]
	}),
}));

export const partnerBankAccountsRelations = relations(partnerBankAccounts, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerBankAccounts.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const partnerEmergencyContactsRelations = relations(partnerEmergencyContacts, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerEmergencyContacts.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const partnerSocietyAssignmentsRelations = relations(partnerSocietyAssignments, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerSocietyAssignments.partnerId],
		references: [deliveryPartners.id]
	}),
	society: one(societies, {
		fields: [partnerSocietyAssignments.societyId],
		references: [societies.id]
	}),
}));

export const societiesRelations = relations(societies, ({many}) => ({
	partnerSocietyAssignments: many(partnerSocietyAssignments),
}));

export const partnerVerificationLogsRelations = relations(partnerVerificationLogs, ({one}) => ({
	profile: one(profiles, {
		fields: [partnerVerificationLogs.performedBy],
		references: [profiles.id]
	}),
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerVerificationLogs.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const deliveryPartnerMetricsRelations = relations(deliveryPartnerMetrics, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [deliveryPartnerMetrics.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const partnerBadgesRelations = relations(partnerBadges, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerBadges.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const partnerTargetsRelations = relations(partnerTargets, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerTargets.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const partnerVehiclesRelations = relations(partnerVehicles, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerVehicles.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const partnerRewardsRelations = relations(partnerRewards, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerRewards.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const partnerPenaltiesRelations = relations(partnerPenalties, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerPenalties.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const emergencySosAlarmsRelations = relations(emergencySosAlarms, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [emergencySosAlarms.partnerId],
		references: [deliveryPartners.id]
	}),
	order: one(orders, {
		fields: [emergencySosAlarms.orderId],
		references: [orders.id]
	}),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({one}) => ({
	ticket: one(tickets, {
		fields: [ticketMessages.ticketId],
		references: [tickets.id]
	}),
	profile: one(profiles, {
		fields: [ticketMessages.senderId],
		references: [profiles.id]
	}),
}));

export const partnerIncidentsRelations = relations(partnerIncidents, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerIncidents.partnerId],
		references: [deliveryPartners.id]
	}),
	order: one(orders, {
		fields: [partnerIncidents.orderId],
		references: [orders.id]
	}),
}));

export const partnerIncentivesRelations = relations(partnerIncentives, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerIncentives.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const partnerLeaderboardRelations = relations(partnerLeaderboard, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerLeaderboard.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const partnerRedemptionsRelations = relations(partnerRedemptions, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerRedemptions.partnerId],
		references: [deliveryPartners.id]
	}),
	rewardCatalog: one(rewardCatalog, {
		fields: [partnerRedemptions.rewardCatalogId],
		references: [rewardCatalog.id]
	}),
}));

export const rewardCatalogRelations = relations(rewardCatalog, ({many}) => ({
	partnerRedemptions: many(partnerRedemptions),
}));

export const partnerSettingsRelations = relations(partnerSettings, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerSettings.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const verificationRequestsRelations = relations(verificationRequests, ({one, many}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [verificationRequests.partnerId],
		references: [deliveryPartners.id]
	}),
	verificationHistories: many(verificationHistory),
}));

export const systemAuditLogsRelations = relations(systemAuditLogs, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [systemAuditLogs.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const deviceTokensRelations = relations(deviceTokens, ({one}) => ({
	profile: one(profiles, {
		fields: [deviceTokens.profileId],
		references: [profiles.id]
	}),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({one}) => ({
	profile: one(profiles, {
		fields: [notificationPreferences.profileId],
		references: [profiles.id]
	}),
}));

export const verificationHistoryRelations = relations(verificationHistory, ({one}) => ({
	verificationRequest: one(verificationRequests, {
		fields: [verificationHistory.requestId],
		references: [verificationRequests.id]
	}),
	profile: one(profiles, {
		fields: [verificationHistory.performedBy],
		references: [profiles.id]
	}),
}));

export const deliveryPartnerLocationRelations = relations(deliveryPartnerLocation, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [deliveryPartnerLocation.partnerId],
		references: [deliveryPartners.id]
	}),
	order: one(orders, {
		fields: [deliveryPartnerLocation.orderId],
		references: [orders.id]
	}),
}));

export const partnerFeedbackRelations = relations(partnerFeedback, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerFeedback.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const partnerDevicesRelations = relations(partnerDevices, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerDevices.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const kitchenVerificationsRelations = relations(kitchenVerifications, ({one}) => ({
	kitchen: one(kitchens, {
		fields: [kitchenVerifications.kitchenId],
		references: [kitchens.id]
	}),
	profile: one(profiles, {
		fields: [kitchenVerifications.verifierId],
		references: [profiles.id]
	}),
}));

export const partnerDocumentsRelations = relations(partnerDocuments, ({one}) => ({
	deliveryPartner: one(deliveryPartners, {
		fields: [partnerDocuments.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	profile: one(profiles, {
		fields: [auditLogs.actorId],
		references: [profiles.id]
	}),
}));

export const deliveryAssignmentsRelations = relations(deliveryAssignments, ({one, many}) => ({
	order: one(orders, {
		fields: [deliveryAssignments.orderId],
		references: [orders.id]
	}),
	deliveryPartner: one(deliveryPartners, {
		fields: [deliveryAssignments.partnerId],
		references: [deliveryPartners.id]
	}),
	deliveryTrackings: many(deliveryTracking),
	deliveryEarnings: many(deliveryEarnings),
}));

export const deliveryTrackingRelations = relations(deliveryTracking, ({one}) => ({
	deliveryAssignment: one(deliveryAssignments, {
		fields: [deliveryTracking.assignmentId],
		references: [deliveryAssignments.id]
	}),
}));

export const deliveryEarningsRelations = relations(deliveryEarnings, ({one}) => ({
	deliveryAssignment: one(deliveryAssignments, {
		fields: [deliveryEarnings.assignmentId],
		references: [deliveryAssignments.id]
	}),
	deliveryPartner: one(deliveryPartners, {
		fields: [deliveryEarnings.partnerId],
		references: [deliveryPartners.id]
	}),
}));

export const payoutRequestsRelations = relations(payoutRequests, ({one}) => ({
	kitchen: one(kitchens, {
		fields: [payoutRequests.kitchenId],
		references: [kitchens.id]
	}),
}));

export const partyMenusRelations = relations(partyMenus, ({one}) => ({
	kitchen: one(kitchens, {
		fields: [partyMenus.kitchenId],
		references: [kitchens.id]
	}),
}));