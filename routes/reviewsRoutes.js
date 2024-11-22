const express = require('express');
const reviewsController = require('../controllers/reviewsController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(
    authController.restrictTo('admin', 'lead-guide'),
    reviewsController.getAllReviews,
  )
  .post(
    authController.restrictTo('user', 'admin'),
    reviewsController.addTourUserIds,
    reviewsController.createReview,
  );

router.use(authController.restrictTo('admin', 'user'));
router
  .route('/:id')
  .get(reviewsController.getReview)
  .patch(reviewsController.updateReview)
  .delete(reviewsController.deleteReview);
module.exports = router;
