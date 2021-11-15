const AsyncRouter = require('express-async-router').AsyncRouter
const router = AsyncRouter()
const donationController = require('../controllers/donationController')
const authenticator = require('../middlewares/authenticate')
const rateLimiter = require('../middlewares/rateLimiter')
const donationValidator = require('../validations/donations')

const { deprecatedController } = require('../controllers/otherControllers')

router.get('/',
  deprecatedController
  // rateLimiter.commonLimiter,
  // authenticator.handleAuthentication,
  // authenticator.handleFetchTargetDonor,
  // authenticator.handleHallPermissionOrCheckAvailableToAll,
  // donationController.handleGETDonations
)

router.post('/', /* #swagger.path = '/donations' */
  donationValidator.validatePOSTDonations,
  rateLimiter.donationInsertionLimiter,
  authenticator.handleAuthentication,
  authenticator.handleFetchTargetDonor,
  authenticator.handleHallPermissionOrCheckAvailableToAll,
  donationController.handlePOSTDonations
)

router.delete('/', /* #swagger.path = '/donations' */
  donationValidator.validateDELETEDonations,
  rateLimiter.deleteDonationLimiter,
  authenticator.handleAuthentication,
  authenticator.handleFetchTargetDonor,
  authenticator.handleHallPermissionOrCheckAvailableToAll,
  donationController.handleDELETEDonations
)

module.exports = router
