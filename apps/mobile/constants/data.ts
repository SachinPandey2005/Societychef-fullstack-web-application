import type { ChefDish, Dish, Kitchen, Supply } from '../types';

const UNS = 'https://images.unsplash.com/photo';

export const DISHES: Dish[] = [];

export const KITCHENS: Kitchen[] = [
  {
    id: 'sachin-kitchen',
    name: "Sachin's Kitchen",
    chefName: 'Chef Sachin',
    society: 'Lotus Heights',
    tower: 'Tower A',
    flat: 'A-202',
    distanceKm: 0.2,
    rating: 4.9,
    orders: 185,
    anonymous: false,
    hygieneBadge: true,
    isLive: true,
    coverImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&auto=format&fit=crop&q=80",
    profileImage: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&auto=format&fit=crop&q=80",
    storyPrompts: [
      { id: 'sp-sachin1', prompt: "❤️ Why I Love Cooking", answer: "I love cooking authentic home-style dishes using fresh, organic ingredients." }
    ],
    gallery: [],
    videos: [],
    hygieneDetails: [],
    hygienePhotos: [],
    hygieneVideos: [],
    trustBadges: [
      { id: 'st1', label: 'Verified Home Kitchen', icon: 'shield-checkmark-outline' }
    ],
    kitchenInfo: {
      cuisine: 'North Indian Homestyle',
      experience: '4+ Years',
      prepTime: '1-2 hours',
      deliveryTime: '20-30 mins',
      operatingHours: '10 AM - 9 PM',
      languages: 'Hindi, English',
      society: 'Lotus Heights'
    },
    stats: { ordersCompleted: 185, responseTime: '10 mins' },
    dishes: [
      {
        dishId: 'matar-paneer',
        name: 'Matar Paneer',
        price: 100,
        leadTimeMinutes: 120,
        weeklyFree: true,
        sample: false,
        available: 'Today 1 PM - 9 PM',
        isEnabled: true,
      },
      {
        dishId: 'dal-makhani',
        name: 'Dal Makhani',
        price: 120,
        leadTimeMinutes: 150,
        weeklyFree: false,
        sample: true,
        available: 'Daily',
        isEnabled: true,
      }
    ],
  },
  {
    id: 'sakshi-kitchen',
    name: "sakshi's kitchen",
    chefName: 'Sakshi Siwal',
    society: 'Lotus Heights',
    tower: 'Tower A',
    flat: 'A-101',
    distanceKm: 0.1,
    rating: 4.9,
    orders: 312,
    anonymous: false,
    hygieneBadge: true,
    isLive: true,
    coverImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&auto=format&fit=crop&q=80",
    profileImage: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&auto=format&fit=crop&q=80",
    storyPrompts: [
      { id: 'sp1', prompt: "❤️ Why I Love Cooking", answer: "I love cooking authentic home-style dishes for our society members using pure, organic ingredients and love." },
      { id: 'sp2', prompt: "🌿 Kitchen & Hygiene Standards", answer: "Our kitchen follows 100% sanitized food prep, clean cookware, and daily fresh ingredient sourcing." }
    ],
    gallery: [
      { id: 'sg1', type: 'image', url: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&auto=format&fit=crop&q=80", caption: "Our Cooking Space", createdAt: new Date().toISOString() },
      { id: 'sg2', type: 'image', url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop&q=80", caption: "Packing Fresh Orders", createdAt: new Date().toISOString() },
      { id: 'sg3', type: 'image', url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80", caption: "Clean Prep Station", createdAt: new Date().toISOString() }
    ],
    videos: [
      { id: 'sv1', type: 'video', url: "https://www.youtube.com/watch?v=ScMzIvxBSi4", thumbnail: "https://img.youtube.com/vi/ScMzIvxBSi4/maxresdefault.jpg", caption: "Kitchen Tour Video", createdAt: new Date().toISOString() }
    ],
    hygieneDetails: [
      { id: 'sh1', title: 'Food-Safe Gloves', description: 'Worn during all preparation and packing.', confirmed: true, icon: 'hand-left-outline' },
      { id: 'sh2', title: 'Sanitized Countertops', description: 'Cleaned and disinfected multiple times daily.', confirmed: true, icon: 'water-outline' },
      { id: 'sh3', title: 'Daily Temperature Checks', description: 'Regular health & hygiene checks for staff.', confirmed: true, icon: 'shield-checkmark-outline' }
    ],
    hygienePhotos: [
      { id: 'shp1', type: 'image', url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80", caption: "Spotless Kitchen Station", createdAt: new Date().toISOString() }
    ],
    hygieneVideos: [],
    trustBadges: [
      { id: 'st1', label: 'Verified Home Kitchen', icon: 'shield-checkmark-outline' },
      { id: 'st2', label: 'Address Verified', icon: 'location-outline' },
      { id: 'st3', label: 'Hygiene Badge Certified', icon: 'ribbon-outline' }
    ],
    kitchenInfo: {
      cuisine: 'North Indian Homestyle',
      experience: '5+ Years',
      prepTime: '1-2 hours',
      deliveryTime: '20-30 mins',
      operatingHours: '10 AM - 9 PM',
      languages: 'Hindi, English',
      society: 'Lotus Heights'
    },
    stats: { ordersCompleted: 312, responseTime: '10 mins' },
    dishes: [
      {
        dishId: 'veg-biryani',
        name: 'Veg Biryani',
        price: 140,
        leadTimeMinutes: 90,
        weeklyFree: false,
        sample: false,
        available: 'Daily 12 PM - 9 PM',
        isEnabled: true,
      },
      {
        dishId: 'matar-paneer',
        name: 'Matar Paneer',
        price: 100,
        leadTimeMinutes: 120,
        weeklyFree: true,
        sample: false,
        available: 'Today 1 PM - 9 PM',
        isEnabled: true,
      },
      {
        dishId: 'rajma-chawal',
        name: 'Rajma Chawal',
        price: 90,
        leadTimeMinutes: 90,
        weeklyFree: false,
        sample: true,
        available: 'Daily',
        isEnabled: true,
      },
    ],
  },
  {
    id: 'kavita',
    name: "Kavita's Kitchen",
    chefName: 'Kavita Sharma',
    society: 'Lotus Heights',
    tower: 'Tower B',
    flat: 'B-1204',
    distanceKm: 0.2,
    rating: 4.8,
    orders: 214,
    anonymous: false,
    hygieneBadge: true,
    isLive: true,
    coverImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d",
    profileImage: "https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=200&h=200&fit=crop&q=80",
    storyPrompts: [
      { id: 'p1', prompt: "❤️ Why I Love Cooking", answer: "Cooking brings people together and I love seeing the smiles on their faces." },
      { id: 'p2', prompt: "🌿 Fresh Ingredients I Use", answer: "I source all my vegetables locally every morning to ensure top quality." }
    ],
    gallery: [
      { id: 'g1', type: 'image', url: "https://images.unsplash.com/photo-1556911220-bff31c812dba", caption: "My cooking space", createdAt: new Date().toISOString() },
      { id: 'g2', type: 'image', url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136", caption: "Packing orders", createdAt: new Date().toISOString() }
    ],
    videos: [
      { id: 'v1', type: 'video', url: "https://www.youtube.com/watch?v=ScMzIvxBSi4", thumbnail: "https://img.youtube.com/vi/ScMzIvxBSi4/maxresdefault.jpg", caption: "Kitchen Tour", createdAt: new Date().toISOString() }
    ],
    hygieneDetails: [
      { id: 'h1', title: 'Gloves Used', description: 'Food safe gloves for all prep.', confirmed: true, icon: 'hand-left-outline' },
      { id: 'h2', title: 'Sanitized Utensils', description: 'Cleaned with hot water.', confirmed: true, icon: 'water-outline' }
    ],
    hygienePhotos: [
      { id: 'hp1', type: 'image', url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop&q=80", caption: "Clean counter", createdAt: new Date().toISOString() }
    ],
    hygieneVideos: [],
    trustBadges: [
      { id: 't1', label: 'Verified Kitchen', icon: 'shield-checkmark-outline' },
      { id: 't2', label: 'Top Rated', icon: 'star-outline' }
    ],
    kitchenInfo: { cuisine: 'North Indian', experience: '5 years', prepTime: '1-2 hrs', deliveryTime: '45 mins', operatingHours: '10 AM - 8 PM', languages: 'English, Hindi', society: 'Lotus Heights' },
    stats: { ordersCompleted: 214, responseTime: '15 mins' },
    dishes: [
      {
        dishId: 'matar-paneer',
        name: 'Matar Paneer',
        price: 100,
        leadTimeMinutes: 120,
        weeklyFree: true,
        sample: false,
        available: 'Today 1 PM - 9 PM',
        isEnabled: true,
      },
      {
        dishId: 'palak-paneer',
        name: 'Palak Paneer',
        price: 115,
        leadTimeMinutes: 180,
        weeklyFree: false,
        sample: false,
        available: 'Tomorrow',
        isEnabled: true,
      },
      {
        dishId: 'rajma-chawal',
        name: 'Rajma Chawal',
        price: 90,
        leadTimeMinutes: 90,
        weeklyFree: false,
        sample: true,
        available: 'Daily',
        isEnabled: true,
      },
    ],
  },
  {
    id: 'bakers',
    name: 'Bakers Delight',
    chefName: 'Private chef',
    society: 'Green Valley',
    tower: 'Tower A',
    flat: 'A-304',
    distanceKm: 1.1,
    rating: 4.7,
    orders: 128,
    anonymous: true,
    hygieneBadge: true,
    isLive: true,
    coverImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d",
    storyPrompts: [],
    gallery: [],
    videos: [],
    hygieneDetails: [],
    hygienePhotos: [],
    hygieneVideos: [],
    trustBadges: [],
    kitchenInfo: { cuisine: 'Bakery', experience: '3 years', prepTime: '3-4 hrs', deliveryTime: '60 mins', operatingHours: 'Weekends', languages: 'English', society: 'Green Valley' },
    stats: { ordersCompleted: 128, responseTime: '1 hr' },
    dishes: [
      {
        dishId: 'chocolate-cake',
        name: 'Chocolate Cake',
        price: 80,
        leadTimeMinutes: 240,
        weeklyFree: false,
        sample: true,
        available: 'Weekend',
        isEnabled: true,
      },
    ],
  },
  {
    id: 'biryani',
    name: "Aunty's Biryani",
    chefName: 'Nazia Khan',
    society: 'Palm Residency',
    tower: 'Tower C',
    flat: 'C-701',
    distanceKm: 1.8,
    rating: 4.9,
    orders: 341,
    anonymous: false,
    hygieneBadge: true,
    isLive: true,
    coverImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d",
    storyPrompts: [],
    gallery: [],
    videos: [],
    hygieneDetails: [],
    hygienePhotos: [],
    hygieneVideos: [],
    trustBadges: [],
    kitchenInfo: { cuisine: 'Biryani', experience: '10 years', prepTime: '1 hr', deliveryTime: '30 mins', operatingHours: '12 PM - 10 PM', languages: 'Hindi, Urdu', society: 'Palm Residency' },
    stats: { ordersCompleted: 341, responseTime: '10 mins' },
    dishes: [
      {
        dishId: 'veg-biryani',
        name: 'Veg Biryani',
        price: 140,
        leadTimeMinutes: 90,
        weeklyFree: false,
        sample: false,
        available: 'Daily after 12 PM',
        isEnabled: true,
      },
    ],
  },
  {
    id: 'swad',
    name: 'Ghar Ka Swad',
    chefName: 'Private chef',
    society: 'Lotus Heights',
    tower: 'Tower A',
    flat: 'A-502',
    distanceKm: 0.4,
    rating: 4.6,
    orders: 97,
    anonymous: true,
    hygieneBadge: false,
    isLive: true,
    coverImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d",
    storyPrompts: [],
    gallery: [],
    videos: [],
    hygieneDetails: [],
    hygienePhotos: [],
    hygieneVideos: [],
    trustBadges: [],
    kitchenInfo: { cuisine: 'South Indian', experience: '2 years', prepTime: '45 mins', deliveryTime: '20 mins', operatingHours: '7 AM - 12 PM', languages: 'Tamil, English', society: 'Lotus Heights' },
    stats: { ordersCompleted: 97, responseTime: '5 mins' },
    dishes: [
      {
        dishId: 'idli-sambar',
        name: 'Idli Sambar',
        price: 70,
        leadTimeMinutes: 75,
        weeklyFree: true,
        sample: false,
        available: 'Morning',
        isEnabled: true,
      },
      {
        dishId: 'aloo-paratha',
        name: 'Aloo Paratha',
        price: 60,
        leadTimeMinutes: 60,
        weeklyFree: false,
        sample: false,
        available: 'Weekend',
        isEnabled: true,
      },
    ],
  },
];

export const SOCIETIES: string[] = [
  'Lotus Heights',
  'Green Valley',
  'Palm Residency',
  'Maple Gardens',
];

export const SUPPLIES: Supply[] = [
  {
    id: 'containers',
    name: 'Microwave containers',
    unit: '25 pcs',
    price: 120,
    iconText: 'MI',
    image: `${UNS}-1585515320310-259814833e62?w=400&h=400&fit=crop&q=80`,
  },
  {
    id: 'foil',
    name: 'Wrapping foil',
    unit: '20 m roll',
    price: 90,
    iconText: 'WR',
    image: `${UNS}-1612392062798-e7eef7e0e54b?w=400&h=400&fit=crop&q=80`,
  },
  {
    id: 'labels',
    name: 'Kitchen labels',
    unit: '100 pcs',
    price: 60,
    iconText: 'KL',
    image: `${UNS}-1586495777744-4e6232bf2f59?w=400&h=400&fit=crop&q=80`,
  },
  {
    id: 'cutlery',
    name: 'Disposable cutlery',
    unit: '50 sets',
    price: 85,
    iconText: 'DI',
    image: `${UNS}-1555443805-658637491dd4?w=400&h=400&fit=crop&q=80`,
  },
  {
    id: 'bags',
    name: 'Kraft paper bags',
    unit: '30 pcs',
    price: 75,
    iconText: 'KR',
    image: `${UNS}-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop&q=80`,
  },
  {
    id: 'gloves',
    name: 'Food-safe gloves',
    unit: '100 pcs',
    price: 55,
    iconText: 'FO',
    image: `${UNS}-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&q=80`,
  },
];

export const INITIAL_CHEF_DISHES: Record<string, ChefDish> = {};

