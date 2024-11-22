const express = require('express');
const usersController = require('../controllers/usersConroller');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgetPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);

router.patch('/updatePassword', authController.updatePassword);
router.patch('/updateMe', usersController.updateMe);
router.delete('/deleteMe', usersController.deleteMe);
router.get('/me', usersController.getMe, usersController.getUser);

router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(usersController.getAllUsers)
  .post(usersController.addUser);
router
  .route('/:id')
  .get(usersController.getUser)
  .patch(usersController.updateUser)
  .delete(usersController.deleteUser);

module.exports = router;
