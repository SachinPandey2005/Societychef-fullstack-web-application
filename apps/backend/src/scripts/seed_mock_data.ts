import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

// Helper to pick random element
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to get random date within last N days
function getRandomDate(daysAgoMax: number): string {
  const now = Date.now();
  const pastMs = Math.random() * daysAgoMax * 24 * 60 * 60 * 1000;
  return new Date(now - pastMs).toISOString();
}

// Helper to generate phone number
function getPhone(idx: number): string {
  return `+9198${(76500000 + idx).toString().slice(-8)}`;
}

export async function runSeed() {
  console.log('🚀 Starting Comprehensive Supabase CRM Mock Data Seed...');

  // ----------------------------------------------------
  // 1. Societies (20 records)
  // ----------------------------------------------------
  console.log('📦 Seeding 20 Societies...');
  const societyNames = [
    { name: 'Green Valley Heights', city: 'Bengaluru', lat: 12.9279, lng: 77.6271, addr: 'Bellandur Main Road' },
    { name: 'Sun City Apartments', city: 'Bengaluru', lat: 12.9352, lng: 77.6245, addr: 'Sarjapur Outer Ring Road' },
    { name: 'Prestige Enclave', city: 'Bengaluru', lat: 12.9716, lng: 77.5946, addr: 'Whitefield' },
    { name: 'Royal Palms', city: 'Mumbai', lat: 19.1578, lng: 72.8856, addr: 'Aarey Milk Colony, Goregaon East' },
    { name: 'Sobha Forest View', city: 'Bengaluru', lat: 12.8711, lng: 77.5350, addr: 'Kanakapura Road' },
    { name: 'Godrej Woods', city: 'Noida', lat: 28.5355, lng: 77.3910, addr: 'Sector 43, Noida' },
    { name: 'Brigade Meadows', city: 'Bengaluru', lat: 12.8214, lng: 77.5612, addr: 'Kanakapura Main Road' },
    { name: 'DLF Phase 5', city: 'Gurugram', lat: 28.4595, lng: 77.0266, addr: 'Golf Course Road' },
    { name: 'Tata Primanti', city: 'Gurugram', lat: 28.4089, lng: 77.0425, addr: 'Sector 72' },
    { name: 'Mahindra Eden', city: 'Bengaluru', lat: 12.8845, lng: 77.5510, addr: 'Kanakapura Road' },
    { name: 'Emaar Palm Heights', city: 'Gurugram', lat: 28.3980, lng: 76.9740, addr: 'Sector 77' },
    { name: 'Puravankara Atmosphere', city: 'Bengaluru', lat: 13.0645, lng: 77.5980, addr: 'Thanisandra' },
    { name: 'Salarpuria Sattva', city: 'Hyderabad', lat: 17.4399, lng: 78.3809, addr: 'Hitec City' },
    { name: 'Shapoorji Park', city: 'Pune', lat: 18.5204, lng: 73.8567, addr: 'Bavdhan' },
    { name: 'Mantri Elegance', city: 'Bengaluru', lat: 12.8950, lng: 77.6010, addr: 'BG Road' },
    { name: 'Lodha Palava', city: 'Thane', lat: 19.1600, lng: 73.0800, addr: 'Dombivli East' },
    { name: 'Oberoi Realty', city: 'Mumbai', lat: 19.1700, lng: 72.8600, addr: 'Goregaon East' },
    { name: 'Hiranandani Gardens', city: 'Mumbai', lat: 19.1197, lng: 72.9050, addr: 'Powai' },
    { name: 'Kalpataru Horizon', city: 'Mumbai', lat: 19.0176, lng: 72.8300, addr: 'Worli' },
    { name: 'Adani Shantigram', city: 'Ahmedabad', lat: 23.1400, lng: 72.5400, addr: 'SG Highway' },
  ];

  const societyRecords = societyNames.map(s => ({
    id: uuidv4(),
    name: s.name,
    city: s.city,
    lat: s.lat,
    lng: s.lng,
    address: s.addr,
    state: s.city === 'Bengaluru' ? 'Karnataka' : s.city === 'Mumbai' || s.city === 'Pune' || s.city === 'Thane' ? 'Maharashtra' : 'NCR',
    created_at: getRandomDate(90),
  }));

  const { error: socErr } = await supabase.from('societies').upsert(societyRecords);
  if (socErr) console.error('Society Seed Error:', socErr.message);

  // ----------------------------------------------------
  // 2. Profiles (20 Customers, 20 Chefs, 20 Delivery Partners, Admin)
  // ----------------------------------------------------
  console.log('👤 Seeding 60+ Profiles (Consumers, Chefs, Delivery Partners)...');
  const customerNames = [
    'Rahul Sharma', 'Priya Verma', 'Amitav Das', 'Sneha Reddy', 'Vikram Malhotra',
    'Ananya Iyer', 'Rohan Gupta', 'Neha Kapoor', 'Karan Patel', 'Pooja Nair',
    'Siddharth Joshi', 'Meera Banerji', 'Aditya Rao', 'Divya Saxena', 'Varun Mehta',
    'Riya Sen', 'Gaurav Kumar', 'Swati Deshmukh', 'Tarun Bhatia', 'Kavita Singh'
  ];

  const chefNames = [
    'Chef Sarita Devi', 'Chef Harish Rawat', 'Chef Sunita Rao', 'Chef Sanjay Thapar', 'Chef Meenakshi Sundaram',
    'Chef Rajeshwari Bai', 'Chef Tarun Chatterji', 'Chef Gurpreet Kaur', 'Chef Shalini Saxena', 'Chef Anand Ahuja',
    'Chef Smita Kulkarni', 'Chef Ramesh Nair', 'Chef Vandana Jain', 'Chef Deepa Menon', 'Chef Manish Tandon',
    'Chef Kavita Reddy', 'Chef Pradeep Roy', 'Chef Alka Upadhyay', 'Chef Biren Patel', 'Chef Archana Gautam'
  ];

  const deliveryNames = [
    'Ramesh Kumar', 'Suresh Yadav', 'Dinesh Chand', 'Mahesh Giri', 'Vijay Pal',
    'Sunil Verma', 'Anil Paswan', 'Pankaj Shinde', 'Santosh Gowda', 'Ravi Prakash',
    'Manoj Tiwari', 'Deepak Chauhan', 'Rajesh Solanki', 'Mohan Lal', 'Mukesh Kumar',
    'Ganesh Hegde', 'Nilesh Jadhav', 'Satish Kamble', 'Pravin Mane', 'Ashok Kumar'
  ];

  const consumerProfiles = customerNames.map((name, i) => ({
    id: uuidv4(),
    name,
    email: `customer${i + 1}@example.com`,
    phone: getPhone(i + 1),
    role: 'consumer',
    status: i % 10 === 0 ? 'inactive' : 'active',
    created_at: getRandomDate(85),
  }));

  const chefProfiles = chefNames.map((name, i) => ({
    id: uuidv4(),
    name,
    email: `chef${i + 1}@example.com`,
    phone: getPhone(100 + i + 1),
    role: 'chef',
    status: i % 12 === 0 ? 'inactive' : 'active',
    created_at: getRandomDate(85),
  }));

  const deliveryProfiles = deliveryNames.map((name, i) => ({
    id: uuidv4(),
    name,
    email: `delivery${i + 1}@example.com`,
    phone: getPhone(200 + i + 1),
    role: 'DELIVERY_PARTNER',
    status: 'active',
    created_at: getRandomDate(85),
  }));

  const opsAdminProfile = {
    id: uuidv4(),
    name: 'Ops Admin Master',
    email: 'admin@homechef.com',
    phone: '+919999999999',
    role: 'SUPER_ADMIN',
    status: 'active',
    created_at: getRandomDate(90),
  };

  const devPartnerProfile = {
    id: 'd5be5171-8bc6-4e58-86c3-1c0c69d84300',
    name: 'Dev Partner',
    email: 'dev-partner@societychef.com',
    phone: '+919557208430',
    role: 'DELIVERY_PARTNER',
    status: 'active',
    created_at: getRandomDate(90),
  };

  const allProfiles = [...consumerProfiles, ...chefProfiles, ...deliveryProfiles, opsAdminProfile, devPartnerProfile];
  const { error: profErr } = await supabase.from('profiles').upsert(allProfiles);
  if (profErr) console.error('Profile Seed Error:', profErr.message);

  // ----------------------------------------------------
  // 3. Addresses for Customers
  // ----------------------------------------------------
  console.log('📍 Seeding Addresses...');
  const addressesData = consumerProfiles.map((c, i) => {
    const soc = societyRecords[i % societyRecords.length];
    return {
      id: uuidv4(),
      consumer_id: c.id,
      label: pick(['Home', 'Work', 'Other']),
      full_address: `Flat ${101 + (i * 12) % 900}, Tower ${(i % 4) + 1}, ${soc.name}, ${soc.address}, ${soc.city}`,
      latitude: soc.lat + (Math.random() - 0.5) * 0.01,
      longitude: soc.lng + (Math.random() - 0.5) * 0.01,
      is_default: true,
      created_at: c.created_at,
    };
  });
  await supabase.from('addresses').upsert(addressesData);

  // ----------------------------------------------------
  // 4. Delivery Partners
  // ----------------------------------------------------
  console.log('🛵 Seeding 20 Delivery Partners...');
  const deliveryPartnerRecords = deliveryProfiles.map((dp, i) => {
    const soc = societyRecords[i % societyRecords.length];
    return {
      id: uuidv4(),
      user_id: dp.id,
      vehicle_type: pick(['EV Bike', 'Motorcycle', 'Scooter', 'Bicycle']),
      status: pick(['ONLINE', 'OFFLINE', 'BUSY', 'DELIVERING']),
      current_latitude: soc.lat + (Math.random() - 0.5) * 0.02,
      current_longitude: soc.lng + (Math.random() - 0.5) * 0.02,
      created_at: dp.created_at,
    };
  });

  const devPartnerRecord = {
    id: 'd5be5171-0000-4e58-86c3-1c0c69d84300',
    user_id: 'd5be5171-8bc6-4e58-86c3-1c0c69d84300',
    vehicle_type: 'Scooter',
    status: 'OFFLINE',
    kyc_status: 'APPROVED',
    current_latitude: 12.9716,
    current_longitude: 77.5946,
    created_at: devPartnerProfile.created_at,
  };

  await supabase.from('delivery_partners').upsert([...deliveryPartnerRecords, devPartnerRecord]);

  // ----------------------------------------------------
  // 5. Kitchens (20 records)
  // ----------------------------------------------------
  console.log('🍳 Seeding 20 Kitchens...');
  const kitchenNamesList = [
    "Grandma's Spice Box", "Punjabi Rasoi Express", "South Tiffin House", "Bong Connection",
    "Healthy Bowls & Salads", "Guptaji Sweets & Snacks", "Chai & Paratha Corner", "Mom's Secret Kitchen",
    "Royal Biryani House", "Desi Flavors & Curries", "Coastal Cravings", "Vegan Delights",
    "Kashmiri Zaika", "Rahul's Charcoal Grill", "The Fit Salad Company", "South Indian Express",
    "Awadhi Dawat", "Rajasthani Thali Express", "Maharashtrian Swad", "Northeast Delicacies"
  ];

  const kitchenRecords = chefProfiles.map((chef, i) => {
    const soc = societyRecords[i % societyRecords.length];
    const kName = kitchenNamesList[i % kitchenNamesList.length];
    return {
      id: uuidv4(),
      chef_user_id: chef.id,
      name: kName,
      chef_name: chef.name,
      address: `Kitchen Flat ${201 + i * 5}, ${soc.name}`,
      society_id: soc.id,
      tower: `Tower ${String.fromCharCode(65 + (i % 5))}`,
      flat: `${201 + i * 5}`,
      hide_identity: false,
      default_lead_time_minutes: pick([30, 45, 60, 90]),
      bank_status: 'verified',
      hygiene_status: 'verified',
      is_verified: i % 5 !== 0,
      is_top_rated: i % 3 === 0,
      is_live: i % 6 !== 0,
      cover_image: `https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop&q=60`,
      profile_image: `https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&auto=format&fit=crop&q=60`,
      kitchen_info: {
        description: `Authentic home-cooked ${kName} meals prepared with organic spices, zero preservatives, and pure love.`,
        cuisines: [pick(['North Indian', 'South Indian', 'Continental', 'Bengali', 'Maharashtrian', 'Kashmiri', 'Healthy'])],
      },
      stats: { rating: (4.0 + (i % 10) * 0.1).toFixed(1), total_orders: 120 + i * 45 },
      created_at: chef.created_at,
    };
  });
  await supabase.from('kitchens').upsert(kitchenRecords);

  // ----------------------------------------------------
  // 6. Dishes (80+ records)
  // ----------------------------------------------------
  console.log('🍲 Seeding 80+ Dishes...');
  const dishTemplates = [
    { name: 'Special Aloo Paratha with Curd', cat: 'Breakfast', diet: 'VEG', price: 120, time: 30 },
    { name: 'South Indian Idli Sambhar (4 pcs)', cat: 'Breakfast', diet: 'VEG', price: 90, time: 25 },
    { name: 'Masala Dosa with Coconut Chutney', cat: 'Breakfast', diet: 'VEG', price: 110, time: 30 },
    { name: 'Poha with Roasted Peanuts', cat: 'Breakfast', diet: 'VEG', price: 80, time: 20 },
    { name: 'Butter Chicken Thali', cat: 'Lunch', diet: 'NONVEG', price: 280, time: 45 },
    { name: 'Paneer Butter Masala Meal', cat: 'Lunch', diet: 'VEG', price: 240, time: 40 },
    { name: 'Homestyle Dal Tadka & Rice', cat: 'Lunch', diet: 'VEG', price: 160, time: 30 },
    { name: 'Hyderabadi Veg Biryani', cat: 'Lunch', diet: 'VEG', price: 220, time: 45 },
    { name: 'Dum Chicken Biryani & Raita', cat: 'Dinner', diet: 'NONVEG', price: 290, time: 50 },
    { name: 'Rajma Chawal Executive Combo', cat: 'Dinner', diet: 'VEG', price: 180, time: 35 },
    { name: 'Kadhai Paneer with 3 Phulkas', cat: 'Dinner', diet: 'VEG', price: 230, time: 40 },
    { name: 'Mutton Curry Home Style', cat: 'Dinner', diet: 'NONVEG', price: 380, time: 60 },
    { name: 'Samosa Chat Supreme (2 pcs)', cat: 'Snacks', diet: 'VEG', price: 95, time: 20 },
    { name: 'Mumbai Special Pav Bhaji', cat: 'Snacks', diet: 'VEG', price: 140, time: 25 },
    { name: 'Steamed Chicken Momos (8 pcs)', cat: 'Snacks', diet: 'NONVEG', price: 150, time: 30 },
    { name: 'Kolkata Kathi Roll (Chicken)', cat: 'Snacks', diet: 'NONVEG', price: 160, time: 25 },
    { name: 'Gulab Jamun (2 pcs)', cat: 'Desserts', diet: 'VEG', price: 70, time: 15 },
    { name: 'Bengali Rasgulla (4 pcs)', cat: 'Desserts', diet: 'VEG', price: 90, time: 15 },
    { name: 'Kesari Rice Kheer', cat: 'Desserts', diet: 'VEG', price: 110, time: 20 },
    { name: 'High Protein Grilled Chicken Salad', cat: 'Healthy', diet: 'NONVEG', price: 260, time: 30 },
    { name: 'Quinoa & Roasted Veggie Bowl', cat: 'Healthy', diet: 'VEG', price: 240, time: 30 },
    { name: 'Gym Bro Lean Meat & Rice Bowl', cat: 'Gym Meals', diet: 'NONVEG', price: 310, time: 35 },
  ];

  const dishRecords: any[] = [];
  kitchenRecords.forEach((k, kIdx) => {
    // Each kitchen gets 4-5 dishes
    for (let dIdx = 0; dIdx < 4; dIdx++) {
      const template = dishTemplates[(kIdx * 4 + dIdx) % dishTemplates.length];
      dishRecords.push({
        id: uuidv4(),
        kitchen_id: k.id,
        name: `${template.name} (${k.name.split(' ')[0]})`,
        category: template.cat,
        diet_type: template.diet,
        price: template.price,
        prep_time_minutes: template.time,
        is_available: dIdx !== 3, // 1 in 4 is unavailable for realism
        tags: [template.cat, template.diet, 'HomeCooked'],
        image_url: template.diet === 'VEG' 
          ? 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60'
          : 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&auto=format&fit=crop&q=60',
        is_free: false,
        created_at: k.created_at,
      });
    }
  });
  await supabase.from('dishes').upsert(dishRecords);

  // ----------------------------------------------------
  // 7. Coupons (30 records)
  // ----------------------------------------------------
  console.log('🎟️ Seeding 30 Coupons...');
  const couponCodes = [
    'WELCOME50', 'FEAST20', 'CHEFSPECIAL', 'HEALTHY10', 'HOLIDAY100',
    'SUPERCHEF', 'WEEKEND30', 'MONSOON50', 'TIFTON15', 'FIRSTORDER',
    'HOMECOOKED', 'SAVER25', 'DELIGHT200', 'DIWALI50', 'NEWYEAR30',
    'FITNESS20', 'VEGGIE15', 'BIRYANIFEST', 'PARATHALOVE', 'DESSERTFREE',
    'SUMMER40', 'MEALPASS', 'PARTYPACK', 'SNACKTIME', 'NIGHTCRAVE',
    'EXPRESS50', 'FAMILYPACK', 'OFFICE15', 'SUNDAYFEAST', 'CHEFROYAL'
  ];

  const couponRecords = couponCodes.map((code, i) => ({
    id: uuidv4(),
    code,
    discount_type: i % 2 === 0 ? 'PERCENTAGE' : 'FIXED',
    discount_value: i % 2 === 0 ? (10 + (i % 4) * 5) : (30 + (i % 5) * 20),
    min_order_value: 150 + (i % 3) * 100,
    max_discount: 150,
    starts_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: i % 10 !== 0,
  }));
  await supabase.from('coupons').upsert(couponRecords);

  // ----------------------------------------------------
  // 8. Orders (200 records) & Order Items (400 records)
  // ----------------------------------------------------
  console.log('🛍️ Seeding 200 Orders & 400 Order Items across last 90 days...');
  const orderStatuses = ['DELIVERED', 'DELIVERED', 'DELIVERED', 'DELIVERED', 'OUT_FOR_DELIVERY', 'READY', 'PREPARING', 'ACCEPTED', 'CANCELLED', 'REJECTED'];
  const paymentStatuses = ['paid', 'paid', 'paid', 'paid', 'paid', 'pending', 'FAILED', 'REFUNDED'];

  const orderRecords: any[] = [];
  const orderItemRecords: any[] = [];
  const reviewsData: any[] = [];
  const refundRecords: any[] = [];

  for (let i = 1; i <= 200; i++) {
    const orderId = uuidv4();
    const customer = pick(consumerProfiles);
    const kitchen = pick(kitchenRecords);
    const partner = pick(deliveryPartnerRecords);
    const kDishes = dishRecords.filter(d => d.kitchen_id === kitchen.id);
    const selectedDishes = kDishes.length > 0 ? kDishes.slice(0, 2) : [dishRecords[i % dishRecords.length]];

    const status = pick(orderStatuses);
    const payStatus = status === 'CANCELLED' ? pick(['REFUNDED', 'FAILED']) : (status === 'DELIVERED' ? 'paid' : pick(paymentStatuses));
    const createdDate = getRandomDate(85);

    let itemTotal = 0;
    selectedDishes.forEach(d => {
      const qty = Math.floor(Math.random() * 2) + 1;
      const price = Number(d.price || 150);
      itemTotal += price * qty;
      orderItemRecords.push({
        id: uuidv4(),
        order_id: orderId,
        dish_id: d.id,
        dish_name_snapshot: d.name,
        price_snapshot: price,
        quantity: qty,
        created_at: createdDate,
      });
    });

    const deliveryFee = 35;
    const discount = i % 3 === 0 ? 40 : 0;
    const taxes = Math.round(itemTotal * 0.05);
    const platformCommission = Math.round(itemTotal * 0.12);
    const netChefEarnings = Math.max(0, itemTotal - platformCommission - discount);
    const grandTotal = itemTotal + deliveryFee + taxes - discount;

    const rzpOrderId = `order_rzp_${Date.now().toString().slice(-6)}_${i}`;
    const rzpPayId = payStatus === 'paid' ? `pay_rzp_${Date.now().toString().slice(-6)}_${i}` : undefined;

    orderRecords.push({
      id: orderId,
      order_code: `ORD-${9000 + i}`,
      customer_id: customer.id,
      kitchen_id: kitchen.id,
      status,
      delivery_method: pick(['DELIVERY_PARTNER', 'PICKUP']),
      delivery_partner_id: partner.id,
      delivery_fee: deliveryFee,
      list_price: itemTotal,
      discount,
      total_paid: grandTotal,
      platform_commission: platformCommission,
      net_chef_earnings: netChefEarnings,
      tax_amount: taxes,
      delivery_address: { full_address: `Flat ${101 + i}, Tower A, Home Colony` },
      payment_status: payStatus,
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: rzpPayId,
      created_at: createdDate,
    });

    // Create Review for DELIVERED orders
    if (status === 'DELIVERED' && i % 3 === 0) {
      reviewsData.push({
        id: uuidv4(),
        order_id: orderId,
        consumer_id: customer.id,
        kitchen_id: kitchen.id,
        rating: pick([4, 5, 5, 4, 3, 5]),
        comment: pick([
          'Delicious home-cooked food! Fresh and hot.',
          'Authentic taste, just like my mom makes.',
          'Timely delivery and neat packaging.',
          'Great portion size and clean preparation.',
          'Flavorful and non-oily. Will order again!'
        ]),
        created_at: createdDate,
      });
    }

    // Create Refund record for REFUNDED orders
    if (payStatus === 'REFUNDED' || status === 'CANCELLED') {
      refundRecords.push({
        id: uuidv4(),
        refund_code: `REF-${9000 + i}`,
        order_id: orderId,
        customer_id: customer.id,
        kitchen_id: kitchen.id,
        payment_id: rzpPayId || rzpOrderId,
        amount: grandTotal,
        type: pick(['FULL', 'PARTIAL', 'AUTOMATIC']),
        reason: pick(['Customer Cancelled Before Prep', 'Kitchen Out of Ingredients', 'Delivery Delay']),
        status: pick(['COMPLETED', 'APPROVED', 'PROCESSING']),
        refund_reference: `ref_rzp_${i}`,
        gateway_refund_id: `rzp_ref_${i}`,
        created_at: createdDate,
      });
    }
  }

  await supabase.from('orders').upsert(orderRecords);
  await supabase.from('order_items').upsert(orderItemRecords);
  await supabase.from('reviews').upsert(reviewsData);
  if (refundRecords.length > 0) {
    await supabase.from('refunds').upsert(refundRecords);
  }

  // ----------------------------------------------------
  // 9. Settlements (50 records)
  // ----------------------------------------------------
  console.log('💳 Seeding 50 Settlements...');
  const settlementRecords: any[] = [];
  kitchenRecords.forEach((k, i) => {
    for (let sIdx = 0; sIdx < 3; sIdx++) {
      const totalSales = 2500 + (i * 300) + (sIdx * 400);
      const commission = Math.round(totalSales * 0.10);
      const pgFees = Math.round(totalSales * 0.02);
      const taxes = Math.round(commission * 0.18);
      const netPayable = totalSales - commission - pgFees - taxes;

      const pStart = new Date(Date.now() - (sIdx + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const pEnd = new Date(Date.now() - sIdx * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      settlementRecords.push({
        id: uuidv4(),
        kitchen_id: k.id,
        gross_amount: totalSales,
        platform_fee: commission,
        gateway_fee: pgFees,
        net_amount: netPayable,
        status: pick(['PAID', 'PAID', 'PENDING', 'PROCESSING', 'FAILED']),
        settlement_mode: 'weekly',
        period_start: pStart,
        period_end: pEnd,
        expected_at: pEnd,
        created_at: pEnd,
      });
    }
  });
  await supabase.from('settlements').upsert(settlementRecords.slice(0, 50));

  // ----------------------------------------------------
  // 10. Wallets (Customer & Chef) & Wallet Transactions
  // ----------------------------------------------------
  console.log('👛 Seeding Wallets & 50 Wallet Transactions...');
  const walletRecords: any[] = [];
  const walletTxRecords: any[] = [];

  consumerProfiles.forEach(c => {
    const wId = uuidv4();
    const bal = 200 + Math.floor(Math.random() * 1500);
    walletRecords.push({
      id: wId,
      profile_id: c.id,
      role: 'consumer',
      balance: bal,
      created_at: c.created_at,
    });

    walletTxRecords.push({
      id: uuidv4(),
      wallet_id: wId,
      amount: 500,
      type: 'CREDIT',
      description: 'Added funds via UPI',
      created_at: c.created_at,
    });
  });

  chefProfiles.forEach(ch => {
    const wId = uuidv4();
    const bal = 1200 + Math.floor(Math.random() * 8000);
    walletRecords.push({
      id: wId,
      profile_id: ch.id,
      role: 'chef',
      balance: bal,
      created_at: ch.created_at,
    });

    walletTxRecords.push({
      id: uuidv4(),
      wallet_id: wId,
      amount: 1500,
      type: 'CREDIT',
      description: 'Settlement payout credit',
      created_at: ch.created_at,
    });
  });

  await supabase.from('wallets').upsert(walletRecords);
  await supabase.from('wallet_transactions').upsert(walletTxRecords.slice(0, 50));

  // ----------------------------------------------------
  // 11. Notifications (100 records)
  // ----------------------------------------------------
  console.log('🔔 Seeding 100 Notifications...');
  const notifRecords: any[] = [];
  for (let i = 0; i < 100; i++) {
    const prof = pick(allProfiles);
    notifRecords.push({
      id: uuidv4(),
      profile_id: prof.id,
      title: pick(['Order Update 🛍️', 'Payment Successful 💰', 'Settlement Credited 💳', 'Special Coupon Available 🎉', 'Refund Processed ℹ️']),
      message: pick([
        'Your meal is being freshly prepared by the kitchen.',
        'Payment received successfully via Razorpay.',
        'Weekly settlement of ₹2,450 credited to bank.',
        'Use code WELCOME50 for 50% off on your next home-cooked meal.',
        'Your refund of ₹350 has been credited to wallet.'
      ]),
      type: pick(['ORDER_STATUS', 'PAYMENT_UPDATE', 'PROMOTIONAL', 'CHEF_ALERT', 'FINANCE_ALERT']),
      is_read: i % 2 === 0,
      created_at: getRandomDate(45),
    });
  }
  await supabase.from('notifications').upsert(notifRecords);

  // ----------------------------------------------------
  // 12. Chat Threads (100) & Chat Messages (300)
  // ----------------------------------------------------
  console.log('💬 Seeding 100 Chat Threads & 300 Chat Messages...');
  const chatThreads: any[] = [];
  const chatMessages: any[] = [];

  for (let i = 0; i < 100; i++) {
    const threadId = uuidv4();
    const cust = pick(consumerProfiles);
    const kitchen = pick(kitchenRecords);
    const ord = orderRecords[i % orderRecords.length];

    chatThreads.push({
      id: threadId,
      consumer_id: cust.id,
      kitchen_id: kitchen.id,
      participant_1_id: cust.id,
      participant_2_id: kitchen.chef_user_id,
      order_id: ord.id,
      thread_type: 'ORDER',
      created_at: ord.created_at,
    });

    // 3 messages per thread
    for (let mIdx = 0; mIdx < 3; mIdx++) {
      chatMessages.push({
        id: uuidv4(),
        thread_id: threadId,
        sender_id: mIdx % 2 === 0 ? cust.id : kitchen.chef_user_id,
        body: mIdx === 0 
          ? 'Hi Chef! Could you please make it less spicy?'
          : mIdx === 1 
          ? 'Sure! I will prepare it mild with fresh spices.' 
          : 'Thank you so much! Looking forward to it.',
        is_read: true,
        status: 'DELIVERED',
        created_at: ord.created_at,
      });
    }
  }
  await supabase.from('chat_threads').upsert(chatThreads);
  await supabase.from('chat_messages').upsert(chatMessages);

  // ----------------------------------------------------
  // 13. Support Tickets (40) & Financial Adjustments (20) & Disputes (20)
  // ----------------------------------------------------
  console.log('🎧 Seeding 40 Tickets, 20 Adjustments & 20 Disputes...');
  const ticketRecords: any[] = [];
  for (let i = 0; i < 40; i++) {
    const cust = pick(consumerProfiles);
    ticketRecords.push({
      id: uuidv4(),
      profile_id: cust.id,
      subject: pick(['Delivery Delay Enquiry', 'Coupon Code Not Applying', 'Wallet Balance Discrepancy', 'Dish Customization Request']),
      description: 'Customer requested assistance regarding recent order delivery status and invoice copy.',
      status: pick(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
      created_at: getRandomDate(30),
    });
  }
  await supabase.from('tickets').upsert(ticketRecords);

  const adjRecords: any[] = [];
  for (let i = 0; i < 20; i++) {
    const k = pick(kitchenRecords);
    adjRecords.push({
      id: uuidv4(),
      adjustment_code: `ADJ-${9000 + i}`,
      adjustment_type: pick(['COMMISSION_CORRECTION', 'SETTLEMENT_CORRECTION', 'WALLET_CORRECTION', 'TAX_ADJUSTMENT', 'BONUS', 'PENALTY']),
      target_type: 'CHEF',
      target_id: k.id,
      amount: pick([150, 250, 500, 750, 1000]),
      entry_type: pick(['CREDIT', 'DEBIT']),
      reason: pick(['Weekly bonus incentive', 'Commission percentage correction', 'Late dispatch penalty deduction']),
      status: 'APPROVED',
      created_at: getRandomDate(30),
    });
  }
  await supabase.from('financial_adjustments').upsert(adjRecords);

  const disputeRecords: any[] = [];
  for (let i = 0; i < 20; i++) {
    const ord = pick(orderRecords);
    disputeRecords.push({
      id: uuidv4(),
      dispute_code: `DISP-${9000 + i}`,
      order_id: ord.id,
      customer_id: ord.customer_id,
      kitchen_id: ord.kitchen_id,
      category: pick(['INCORRECT_CHARGE', 'MISSING_REFUND', 'DUPLICATE_PAYMENT', 'WRONG_SETTLEMENT', 'WRONG_COMMISSION']),
      status: pick(['PENDING', 'INVESTIGATING', 'RESOLVED', 'REJECTED']),
      priority: pick(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
      description: 'Customer reported discrepancy between charged amount and receipt invoice.',
      resolution_notes: 'Verified payment log and issued wallet credit difference.',
      created_at: getRandomDate(30),
    });
  }
  await supabase.from('dispute_cases').upsert(disputeRecords);

  console.log('✅ Supabase Comprehensive CRM Mock Data Seeding Completed Successfully!');
}

// Execute if run directly
if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
