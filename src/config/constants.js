const ORDER_STATUSES = [
  'Order Received',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
];

const NEXT_STATUS_MAP = {
  'Order Received': 'Preparing',
  'Preparing': 'Out for Delivery',
  'Out for Delivery': 'Delivered'
};

const STATUS_NOTES = {
  'Order Received': 'Your order has been received by the restaurant.',
  'Preparing': 'The kitchen is preparing your delicious meal.',
  'Out for Delivery': 'A delivery partner has picked up your order and is on the way.',
  'Delivered': 'Your order has been delivered! Enjoy your meal.',
  'Cancelled': 'This order has been cancelled.'
};

const ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin'
};

const PRICING = {
  DEFAULT_DELIVERY_FEE: 3.99,
  FREE_DELIVERY_THRESHOLD: 40.0,
  TAX_RATE: 0.08
};

module.exports = {
  ORDER_STATUSES,
  NEXT_STATUS_MAP,
  STATUS_NOTES,
  ROLES,
  PRICING
};
