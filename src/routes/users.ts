// @ts-nocheck
/* tslint:disable */
const AsyncRouter = require('express-async-router').AsyncRouter
import { underMaintenanceController } from '../controllers/otherControllers'
const router = AsyncRouter()

import authenticator from '../middlewares/authenticate'
import userController from '../controllers/userController'
import rateLimiter from '../middlewares/rateLimiter'
const userValidator = require('../validations/users')

router.post('/signin',
  userValidator.validateLogin,
  rateLimiter.signInLimiter,
  userController.handlePOSTSignIn
)

router.delete('/signout',
  rateLimiter.commonLimiter,
  authenticator.handleAuthentication,
  userController.handleDELETESignOut
)

router.delete('/signout/all',
  rateLimiter.commonLimiter,
  authenticator.handleAuthentication,
  userController.handleDELETESignOutAll
)

router.get('/me',
  rateLimiter.commonLimiter,
  authenticator.handleAuthentication,
  userController.handleGETMe
)

router.post('/redirection',
  rateLimiter.commonLimiter,
  authenticator.handleAuthentication,
  userController.handlePOSTRedirection
)

router.patch('/redirection',
  rateLimiter.redirectionSignInLimiter,
  userController.handlePATCHRedirectedAuthentication
)

router.post('/password/forgot',
    underMaintenanceController
  // rateLimiter.passwordForgotLimiter,
  // userValidator.validatePOSTPasswordForgot,
  // userController.handlePOSTPasswordForgot
)

router.patch('/password',
  rateLimiter.commonLimiter,
  userValidator.validatePATCHPassword,
  authenticator.handleAuthentication,
  userController.handlePATCHPassword
)

router.get('/logins',
  rateLimiter.commonLimiter,
  authenticator.handleAuthentication,
  userController.handleGETLogins
)

router.delete('/logins/:tokenId',
  rateLimiter.commonLimiter,
  userValidator.validateDELETELogins,
  authenticator.handleAuthentication,
  userController.handleDELETELogins
)

export default router
