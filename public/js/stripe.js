import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51QSmqpHFFmsZw6zA5oZNmEgzaMaPhxAZx50Tg3QXCuWvzb7fXx1FIvoLw8fDpXwm1DofUHBxvVI58BYI19TdjvCm00bBEIR84D',
);

export async function bookTour(tourId) {
  try {
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
}
