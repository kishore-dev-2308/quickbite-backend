const mongoose = require('mongoose');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const { ROLES } = require('../config/constants');

const SAMPLE_MENU_ITEMS = [
  {
    _id: new mongoose.Types.ObjectId('65a000000000000000000001'),
    name: 'Truffle Mushroom Burger',
    description: 'Artisan brioche bun, double smashed Angus beef patties, melted Swiss cheese, sautéed wild mushrooms, and black truffle aioli.',
    price: 14.99,
    category: 'Burger',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    preparationTimeMinutes: 18,
    isAvailable: true
  },
  {
    _id: new mongoose.Types.ObjectId('65a000000000000000000002'),
    name: 'Margherita Artisanal Pizza',
    description: 'San Marzano tomato base, fresh buffalo mozzarella, fragrant sweet basil leaves, and cold-pressed extra virgin olive oil.',
    price: 16.50,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    preparationTimeMinutes: 22,
    isAvailable: true
  },
  {
    _id: new mongoose.Types.ObjectId('65a000000000000000000003'),
    name: 'Spicy Pepperoni & Hot Honey Pizza',
    description: 'Crispy slow-cured pepperoni, shredded mozzarella, crushed red pepper flakes, drizzled with organic spicy wildflower honey.',
    price: 18.25,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    preparationTimeMinutes: 20,
    isAvailable: true
  },
  {
    _id: new mongoose.Types.ObjectId('65a000000000000000000004'),
    name: 'Crispy Buttermilk Chicken Burger',
    description: '24-hour buttermilk soaked chicken thigh, crunchy purple cabbage slaw, pickled jalapeños, and house smokey ranch sauce.',
    price: 13.75,
    category: 'Burger',
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    preparationTimeMinutes: 15,
    isAvailable: true
  },
  {
    _id: new mongoose.Types.ObjectId('65a000000000000000000005'),
    name: 'Smoked Bacon Double Smash',
    description: 'Double beef patties, applewood smoked bacon strips, double American cheddar, caramelized onions, and secret burger spread.',
    price: 15.50,
    category: 'Burger',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    preparationTimeMinutes: 16,
    isAvailable: true
  },
  {
    _id: new mongoose.Types.ObjectId('65a000000000000000000006'),
    name: 'Loaded Parmesan Truffle Fries',
    description: 'Hand-cut russet potatoes fried crisp, tossed in white truffle oil, freshly grated aged Parmigiano-Reggiano, and chopped rosemary.',
    price: 7.99,
    category: 'Sides',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    preparationTimeMinutes: 10,
    isAvailable: true
  },
  {
    _id: new mongoose.Types.ObjectId('65a000000000000000000007'),
    name: 'Handcrafted Blood Orange Soda',
    description: 'Sparkling mineral water infused with organic Sicilian blood orange puree and fresh mint.',
    price: 4.50,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    preparationTimeMinutes: 5,
    isAvailable: true
  },
  {
    _id: new mongoose.Types.ObjectId('65a000000000000000000008'),
    name: 'Warm Belgian Chocolate Lava Cake',
    description: 'Decadent dark chocolate molten cake with a warm flowing center, served with vanilla bean dust.',
    price: 8.95,
    category: 'Dessert',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    preparationTimeMinutes: 12,
    isAvailable: true
  }
];

const seedDatabaseIfEmpty = async () => {
  try {
    const menuCount = await MenuItem.countDocuments();
    if (menuCount === 0) {
      console.log('[Seeder] Menu is empty. Seeding initial food items...');
      await MenuItem.insertMany(SAMPLE_MENU_ITEMS);
      console.log(`[Seeder] Seeded ${SAMPLE_MENU_ITEMS.length} menu items.`);
    }

    let customer = await User.findOne({ email: 'customer@quickbite.com' });
    if (!customer) {
      console.log('[Seeder] Creating demo customer account...');
      await User.create({
        name: 'Alex Customer',
        email: 'customer@quickbite.com',
        password: 'password123',
        role: ROLES.CUSTOMER,
        phone: '+1 555-0199',
        address: '742 Evergreen Terrace, Springfield'
      });
    } else {
      customer.password = 'password123';
      customer.role = ROLES.CUSTOMER;
      await customer.save();
    }

    let admin = await User.findOne({ email: 'admin@quickbite.com' });
    if (!admin) {
      console.log('[Seeder] Creating demo admin/kitchen account...');
      await User.create({
        name: 'Chef Gordon (Admin)',
        email: 'admin@quickbite.com',
        password: 'admin123',
        role: ROLES.ADMIN,
        phone: '+1 555-0100',
        address: 'QuickBite Central Kitchen #1'
      });
    } else {
      admin.password = 'admin123';
      admin.role = ROLES.ADMIN;
      await admin.save();
    }
  } catch (err) {
    console.error(`[Seeder Error]: ${err.message}`);
  }
};

// Standalone execution script
if (require.main === module) {
  require('dotenv').config();
  const { connectDB, disconnectDB } = require('../config/db');

  (async () => {
    try {
      await connectDB();
      console.log('[Seeder] Resetting database collections...');
      await MenuItem.deleteMany({});
      await User.deleteMany({});
      await MenuItem.insertMany(SAMPLE_MENU_ITEMS);
      await User.create({
        name: 'Alex Customer',
        email: 'customer@quickbite.com',
        password: 'password123',
        role: ROLES.CUSTOMER,
        phone: '+1 555-0199',
        address: '742 Evergreen Terrace, Springfield'
      });
      await User.create({
        name: 'Chef Gordon (Admin)',
        email: 'admin@quickbite.com',
        password: 'admin123',
        role: ROLES.ADMIN,
        phone: '+1 555-0100',
        address: 'QuickBite Central Kitchen #1'
      });
      console.log('[Seeder] Database successfully reset and seeded!');
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}

module.exports = {
  SAMPLE_MENU_ITEMS,
  seedDatabaseIfEmpty
};
