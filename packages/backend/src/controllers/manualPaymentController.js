const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const SystemLog = require('../models/SystemLog');

/**
 * @desc    Get all manual payment requests (submitted, under_review, rejected, approved)
 * @route   GET /api/admin/payments/manual-requests
 * @access  Private/Admin
 */
exports.getManualPaymentRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = { provider: 'manual' };

    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['submitted', 'under_review', 'approved', 'rejected'] };
    }

    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { senderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const payments = await Payment.find(query)
      .populate('order', 'orderNumber total status')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch manual payments', error: error.message });
  }
};

/**
 * @desc    Update status of manual payment request (approve/reject)
 * @route   PUT /api/admin/payments/manual-requests/:id/status
 * @access  Private/Admin
 */
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, failureReason } = req.body;

    if (!['approved', 'rejected', 'under_review'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const payment = await Payment.findById(id).populate('order');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    const previousStatus = payment.status;
    payment.status = status;
    payment.verifiedBy = req.user._id;
    payment.verifiedAt = new Date();

    if (status === 'rejected' && failureReason) {
      payment.failureReason = failureReason;
    } else if (status === 'approved') {
      payment.paidAt = new Date();
    }

    await payment.save();

    // If approved, update order status
    const order = await Order.findById(payment.order._id);
    if (order) {
      if (status === 'approved') {
        order.paymentStatus = 'paid';
        order.paidAt = new Date();
        if (order.status === 'pending') {
          order.status = 'processing';
        }
        await order.save();
      } else if (status === 'rejected') {
        order.paymentStatus = 'failed';
        await order.save();
        
        // Notify customer
        if (order.user) {
          await Notification.create({
            user: order.user,
            title: 'Payment Rejected',
            message: `Your payment for order #${order.orderNumber} was rejected. Reason: ${failureReason || 'Invalid details'}`,
            type: 'system'
          });
        }
      }
    }

    // Audit Log
    await SystemLog.create({
      action: `Manual payment ${status}`,
      entityType: 'Payment',
      entityId: payment._id,
      user: req.user._id,
      details: `Payment for order ${order ? order.orderNumber : 'Unknown'} ${status} from ${previousStatus}. ${failureReason ? 'Reason: ' + failureReason : ''}`
    });

    res.json({ success: true, message: `Payment ${status} successfully`, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update payment status', error: error.message });
  }
};
