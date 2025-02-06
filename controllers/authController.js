const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const { request } = require('http');

// eslint-disable-next-line arrow-body-style
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createTokenAndSend = (user, statusCode, res, req) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // we can not access or modify the cookie in any way
    httpOnly: true,
    // this means that we can get tokens only in https
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };

  res.cookie('jwt', token, cookieOptions);
  // Remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://localhost:3000/me`;
  await new Email(newUser, url).sendWelcome();
  createTokenAndSend(newUser, 201, res, req);
  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1 )  check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  //2 ) check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password +active');
  if (
    !user ||
    !(await user.isCorrectPassword(password, user.password)) ||
    !user.active
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // 3 ) if everything is ok, send token to client

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
  createTokenAndSend(user, 200, res, req);
});

exports.logout = (req, res) => {
  // console.log('logout');
  // res.cookie('jwt', 'loggedout', {
  //   expires: new Date(Date.now() + 10 * 1000),
  //   httpOnly: true,
  // });
  res.clearCookie('jwt');
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1 ) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // console.log(token);
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return res.redirect('/');
    // return next(
    //   new AppError('You are not logged in! Please log in to get access.', 401),
    // );
  }

  // 2 ) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // is the same as  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {})
  // but the  problem with this is that it will not work with async await so we use promisify

  // 3 ) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401,
      ),
    );
  }
  // 4 ) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// for rendering pages
exports.isLoggedIn = async (req, res, next) => {
  // 1 ) Getting token and check if it's there
  try {
    if (req.cookies.jwt) {
      const token = req.cookies.jwt;

      if (!token) {
        return next();
      }

      // 2 ) Verification token
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET,
      );
      // is the same as  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {})
      // but the  problem with this is that it will not work with async await so we use promisify

      // 3 ) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // 4 ) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // pass the user to the template
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }

  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1 ) Get user based on email address
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }
  // 2 ) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // save the user data to the database
  await user.save({ validateBeforeSave: false });

  try {
    // 3 ) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1 ) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2 ) If token has not expired, and there is user, set the new password
  if (!user)
    return next(
      new AppError(
        'token has been expired , please select forget password again',
        400,
      ),
    );

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  // i want to validate
  await user.save();
  // 3 ) Update changedPasswordAt property for the user

  // 4 ) Log the user in, send JWT
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
  createTokenAndSend(user, 200, res, req);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // 2) check if the POSTed current password is correct
  // console.log(user, req.body);
  if (
    !(await user.isCorrectPassword(req.body.currentPassword, user.password))
  ) {
    return next(new AppError('current password is incorrect', 401));
  }
  // 3) if so update password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.confirmNewPassword;
  // find by id and update not working here because i need middle ware in model and validation it working only in save
  await user.save();
  // 4) login user in ,send JWT
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
  createTokenAndSend(user, 200, res, req);
});
