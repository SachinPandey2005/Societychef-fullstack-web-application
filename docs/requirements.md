# HomeChef Product Requirements

## 1. Product Summary

HomeChef is a society-first food marketplace where interested home cooks, especially homemakers, can run small branded kitchens from their flats and sell homemade food to nearby residents. Consumers discover dishes from trusted local kitchens rather than restaurants, with society proximity, delivery speed, price, and dish preference driving discovery.

The product should feel much simpler than a restaurant onboarding platform. A chef should be able to go live in minutes after phone verification, address setup, kitchen naming, dish selection, price confirmation, and delivery time selection.

## 2. Target Users

### 2.1 Home Chef

Primary profile:

- Homemaker or resident who cooks well and wants extra income.
- May not be comfortable with complex apps, paperwork, or public exposure.
- Needs guidance on pricing, packing, timing, order handling, and settlements.
- May want privacy by hiding name and flat number from consumers.

### 2.2 Consumer

Primary profile:

- Resident looking for homemade food nearby.
- Wants restaurant-like convenience but better locality, trust, and freshness.
- Searches by dish, taste, budget, distance, delivery time, or society.
- Can be motivated by free samples, weekly free dishes, discounts, and challenges.

### 2.3 Platform Operations

Primary needs:

- Verify phone numbers and kitchen address.
- Moderate dish listings and food quality signals.
- Manage delivery and settlement operations.
- Provide chef enablement supplies such as packing materials.

## 3. Goals

- Let a chef launch a kitchen in under 5 minutes.
- Make local society kitchens easy to discover.
- Encourage repeat visits through weekly free dishes and food challenges.
- Promote hyperlocal orders with society-level discounts.
- Give chefs pricing guidance without removing their control.
- Preserve chef privacy when requested.
- Keep future expansion possible for delivery partnerships and larger settlements.

## 4. Non-Goals for MVP

- Full government licensing workflow.
- Full inventory or ingredient procurement.
- AI recipe creation.
- Complex restaurant POS features.
- Multi-city logistics optimization.
- Subscription meal plans, unless added after MVP validation.

## 5. MVP Scope

### 5.1 Authentication

Users sign in with phone number and OTP.

Required fields:

- Mobile number.
- OTP verification status.
- User role selection: consumer, chef, or both.

Acceptance criteria:

- User can enter a phone number.
- System sends OTP.
- User enters OTP and lands in role-based flow.
- Failed OTP shows a clear retry state.

### 5.2 Chef Onboarding

Chef onboarding should be lightweight.

Required fields:

- Chef display name.
- Kitchen name, for example "Kavita's Kitchen" or "Bakers Delight".
- Society name.
- Tower/block.
- Flat number.
- Visibility preference for name and flat number.
- Cuisine tags.
- Minimum preparation or delivery lead time.
- Bank account details for settlement.

Privacy:

- If privacy is enabled, consumers see only kitchen brand, society, approximate distance, and dish details.
- Name and flat number remain hidden until required for delivery or operational support.

Acceptance criteria:

- Chef can finish onboarding without creating menu items manually from scratch.
- Chef can choose from suggested dishes.
- Chef can add custom dishes.
- Chef can accept or edit platform suggested prices.
- Kitchen can go live after minimum required fields are present.

### 5.3 Dish Catalog and Pricing

The platform provides a starter dish list with suggested prices.

Example dishes:

- Matar Paneer: Rs 100.
- Palak Paneer: Rs 110.
- Veg Biryani: Rs 140.
- Rajma Chawal: Rs 90.
- Aloo Paratha: Rs 60.
- Poha: Rs 50.
- Chocolate Cake Slice: Rs 80.

Chef controls:

- Select dish.
- Set price.
- Set available days.
- Set minimum order quantity, if needed.
- Set preparation lead time.
- Mark as sample, free weekly dish, or regular paid item.

Acceptance criteria:

- Suggested price is visible.
- Chef can override price.
- Consumer listing uses chef-set price.
- Platform can compare same dish across nearby kitchens.

### 5.4 Weekly Menu Upfront

Chefs publish a weekly menu in advance.

Required behavior:

- Menu can be published for each day of the week.
- Each dish has a minimum lead time, such as 2 hours or 4 hours.
- Consumer can request urgent delivery through in-app chat.
- Chef can accept or decline urgent requests.

Acceptance criteria:

- Consumer sees future availability.
- Consumer sees earliest delivery time.
- Urgent request does not create an order until chef confirms.

### 5.5 Consumer Discovery

Consumers browse kitchens and dishes like a food delivery app, but listings are home kitchens.

Filters:

- Dish, for example "Palak Paneer near me" or "Biryani".
- Delivery time.
- Society.
- Price.
- Distance.
- Free dish availability.
- Free sampling availability.
- Cuisine or taste tags.

Sorting:

- Same society first by default.
- Then closer kitchens.
- Then faster delivery.
- Then rating and popularity.

Acceptance criteria:

- Consumer can search for a dish and see matching chefs.
- Consumer can filter by price and delivery time.
- Kitchens from the same society receive preference.
- Anonymous kitchens do not expose name or flat.

### 5.6 Ordering

Consumer order flow:

- Select dish.
- Choose quantity.
- See kitchen, society, price, discount, delivery fee, and estimated time.
- Pay online.
- Track status.

Order states:

- Placed.
- Accepted.
- Preparing.
- Ready for pickup or delivery.
- Out for delivery.
- Delivered.
- Cancelled.

Same society discount:

- Orders from the same society get flat 10% discount on list price.
- Discount should be shown transparently at checkout.

Acceptance criteria:

- Same society order applies 10% discount.
- Different society order does not apply this discount.
- Consumer sees final payable amount before payment.

### 5.7 Payments and Settlements

Payment methods:

- Online payment in app through UPI, cards, net banking, wallet, or payment gateway.

Settlement:

- Platform deducts commission, initially example 10%.
- Payment gateway charges must be tracked separately.
- Settlement can be instant, daily, or weekly depending on chef eligibility and order volume.
- Settlement goes to chef bank account.

Acceptance criteria:

- Order payment is captured by platform.
- Chef ledger shows gross amount, platform fee, payment gateway charge, discount, and net settlement.
- Chef can see settlement status.

### 5.8 Weekly Free Dish

Every active chef publishes one free dish weekly.

Purpose:

- Encourage repeat users to open the app.
- Help consumers discover new kitchens.
- Create platform-level weekly demand.

Rules:

- One free dish per active kitchen per week.
- Limited quantity per free dish.
- Consumer may pay nominal delivery fee.
- Consumer eligibility rules prevent abuse.

Example:

- If 50 chefs are onboarded, 50 free dishes are available that week.

Acceptance criteria:

- Chef can mark one weekly free dish.
- Consumer can browse free dishes.
- Platform enforces quantity and eligibility limits.

### 5.9 Weekly Food Challenge

After every 5 completed orders, a consumer gets a chance to unlock one free dish.

Mechanic:

- Wheel of fortune or similar game.
- Limited winners, for example 10 to 20 users weekly.
- Reward can be free dish, sample, discount, or delivery fee waiver.

Acceptance criteria:

- Completed orders count toward challenge.
- Consumer sees progress.
- Challenge reward inventory is capped.
- Reward has an expiry date.

### 5.10 Free Sampling

Chefs can promote new dishes using free sampling campaigns.

Rules:

- Chef chooses sample dish and quantity.
- Consumer may pay nominal delivery fee.
- Platform can limit one sample per consumer per campaign.
- Sampling campaign has start and end date.

Acceptance criteria:

- Consumer can filter for samples.
- Chef can run and stop sample campaign.
- Sample orders are tracked separately from paid orders.

### 5.11 Packing and Supplies

The platform sells or facilitates packing materials.

Items:

- Disposable containers.
- Wrapping foil.
- Disposable plates.
- Cutlery.
- Stickers or labels.
- Carry bags.

MVP behavior:

- Chef can browse supply catalog.
- Platform offers supplies at nominal price initially.
- Supplies can be ordered inside the app.

Acceptance criteria:

- Chef can see packing catalog.
- Chef can add supplies to cart.
- Platform can track supply orders separately from food orders.

### 5.12 Delivery

Initial delivery:

- Local delivery through platform staff or society-level runners.
- Pickup option can be supported in very local cases.

Future delivery:

- Partner with Zomato, Swiggy, or logistics APIs once order volume is high.

Acceptance criteria:

- Order has delivery mode.
- Delivery fee is visible.
- Delivery assignment can be handled operationally even if automated routing is not in MVP.

### 5.13 Chat

In-app chat allows consumer and chef to discuss urgent delivery or dish customization.

Rules:

- Chat is allowed before an urgent order request.
- Personal phone numbers should be masked where possible.
- Chat history is linked to order or kitchen inquiry.

Acceptance criteria:

- Consumer can send urgent request.
- Chef can approve or decline.
- Approved urgent request can become an order.

## 6. Trust, Safety, and Compliance

MVP should include:

- Phone verification.
- Society and flat capture.
- Basic kitchen guidelines.
- Hygiene checklist.
- Consumer ratings and reviews.
- Report kitchen or dish.
- Platform moderation for unsafe or misleading listings.

Future:

- FSSAI registration guidance.
- Kitchen inspection workflow.
- Training and certification badges.
- Allergy disclosure.
- Ingredient and nutrition information.

## 7. Data Model Draft

### User

- id
- phone
- role
- createdAt
- lastLoginAt

### ChefProfile

- id
- userId
- displayName
- kitchenName
- society
- tower
- flatNumber
- hideName
- hideFlat
- cuisineTags
- defaultLeadTimeMinutes
- bankAccountStatus
- isLive

### Dish

- id
- name
- category
- suggestedPrice
- description
- tags

### KitchenDish

- id
- chefProfileId
- dishId
- customName
- price
- leadTimeMinutes
- isAvailable
- isWeeklyFreeDish
- isSampling
- weeklyQuantityLimit

### WeeklyMenu

- id
- chefProfileId
- weekStartDate
- dayOfWeek
- kitchenDishId
- availableFrom
- availableTo

### Order

- id
- consumerUserId
- chefProfileId
- kitchenDishId
- quantity
- listAmount
- societyDiscount
- deliveryFee
- platformFee
- gatewayFee
- totalPayable
- status
- deliveryMode
- deliveryAddress
- createdAt

### Settlement

- id
- chefProfileId
- orderIds
- grossAmount
- platformFee
- gatewayFee
- netAmount
- status
- settlementType
- expectedSettlementAt

### Campaign

- id
- chefProfileId
- type
- kitchenDishId
- quantityLimit
- claimedCount
- startsAt
- endsAt
- status

## 8. MVP Screens

### Consumer

- Phone login.
- Home discovery.
- Search results by dish.
- Filters.
- Kitchen detail.
- Dish detail.
- Cart and checkout.
- Order tracking.
- Challenge progress.
- Free dishes.
- Profile and addresses.

### Chef

- Phone login.
- Chef onboarding.
- Kitchen dashboard.
- Dish selection and pricing.
- Weekly menu planner.
- Free dish setup.
- Sampling campaign setup.
- Orders.
- Settlement ledger.
- Packing supplies.
- Profile and privacy settings.

## 9. Metrics

Supply:

- Number of onboarded chefs.
- Number of live kitchens.
- Dishes listed per kitchen.
- Weekly menu publication rate.

Demand:

- Consumer signups.
- Searches per consumer.
- Orders per consumer.
- Free dish claims.
- Challenge participation.

Quality:

- Repeat order rate.
- Average rating.
- Cancellation rate.
- Preparation delay rate.
- Refund or complaint rate.

Business:

- Gross order value.
- Platform commission.
- Payment gateway cost.
- Delivery cost.
- Chef net earnings.

## 10. Phased Build Plan

### Phase 1: Clickable Prototype

- Static mobile-first prototype.
- Chef onboarding simulation.
- Consumer discovery simulation.
- Filters and sample order summary.
- Requirements document.

### Phase 2: Real App Foundation

- Choose React Native or Flutter for mobile app.
- Build auth screens with OTP provider integration.
- Set up backend API and database.
- Implement chef profile, dish catalog, and consumer browsing.

### Phase 3: Transactions

- Payment gateway integration.
- Order lifecycle.
- Settlement ledger.
- Delivery assignment admin workflow.

### Phase 4: Growth Mechanics

- Weekly free dish.
- Challenge wheel.
- Sampling campaigns.
- Ratings and trust badges.

### Phase 5: Operations

- Packing supply marketplace.
- Chef quality workflows.
- Delivery partner integration.
- Society-level launch playbook.

## 11. Open Questions

- Which city and societies should be used for the first pilot?
- Will chefs need FSSAI registration before first paid order, or can the platform start with guidance and later verification?
- Should delivery be mandatory, or should pickup from society gate be supported?
- What is the target average order value?
- Will free weekly dishes be funded by chefs, platform, or both?
- What payment gateway and settlement schedule should be used in India?
- Should kitchens be discoverable outside their own society on day one?
