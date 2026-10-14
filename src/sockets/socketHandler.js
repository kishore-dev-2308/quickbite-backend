let ioInstance = null;

/**
 * Initializes Socket.io listeners and handlers
 * @param {import('socket.io').Server} io
 */
const initSocketHandler = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join isolated room for an order
    socket.on('join_order', (orderId) => {
      if (!orderId) return;
      const room = `order_${orderId}`;
      socket.join(room);
      console.log(`[Socket.io] Socket ${socket.id} joined room ${room}`);
      socket.emit('joined_room', { orderId, room, status: 'subscribed' });
    });

    // Leave order room
    socket.on('leave_order', (orderId) => {
      if (!orderId) return;
      const room = `order_${orderId}`;
      socket.leave(room);
      console.log(`[Socket.io] Socket ${socket.id} left room ${room}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} (${reason})`);
    });
  });
};

/**
 * Emits real-time order update event to all subscribers of the order room
 */
const emitOrderStatusUpdate = (orderId, orderData, note = '') => {
  if (!ioInstance) {
    console.warn('[Socket.io] Emit called before io was initialized.');
    return;
  }
  const room = `order_${orderId}`;
  console.log(`[Socket.io] Broadcasting 'order_status_updated' to room ${room}: ${orderData.status}`);

  ioInstance.to(room).emit('order_status_updated', {
    orderId,
    status: orderData.status,
    note,
    updatedAt: new Date(),
    order: orderData
  });

  // Also broadcast to kitchen dashboard so all kitchen staff screens remain synchronized
  ioInstance.emit('order_status_updated_broadcast', {
    orderId,
    status: orderData.status,
    note,
    updatedAt: new Date(),
    order: orderData
  });
};

/**
 * Emits real-time new order event to kitchen staff
 */
const emitNewOrder = (orderData) => {
  if (!ioInstance) {
    return;
  }
  console.log(`[Socket.io] Broadcasting 'new_order_placed' to kitchen: Order #${orderData._id}`);
  ioInstance.emit('new_order_placed', {
    order: orderData
  });
};

const getIo = () => ioInstance;

module.exports = {
  initSocketHandler,
  emitOrderStatusUpdate,
  emitNewOrder,
  getIo
};
