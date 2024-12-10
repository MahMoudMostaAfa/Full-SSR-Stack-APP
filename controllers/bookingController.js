const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const handlerFactory = require('../controllers/handlerFactory');
const catchAsync = require('../utils/catchAsync');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1 get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) return next(new AppError('No tour found with that ID', 404));

  // 2 create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?user=${req.user.id}&tour=${req.params.tourId}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'egp',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });
  // 3 send it to the client
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { user, price, tour } = req.query;

  if (!user || !price || !tour) return next();

  await Booking.create({ user, price, tour });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.getBookings = handlerFactory.getAll(Booking);
exports.createBooking = handlerFactory.createOne(Booking);
exports.getBooking = handlerFactory.getOne(Booking);
exports.deleteBooking = handlerFactory.deleteOne(Booking);
exports.updateBooking = handlerFactory.updateOne(Booking);
