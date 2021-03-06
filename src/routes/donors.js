const AsyncRouter = require('express-async-router').AsyncRouter
const router = AsyncRouter()

const userController = require('../controllers/userController')
const donorController = require('../controllers/donorController')
const authenticator = require('../middlewares/authenticate')
const rateLimiter = require('../middlewares/rateLimiter')
const donorValidator = require('../validations/donors')
const queue = require('../middlewares/queue')

router.post('/donors',
  donorValidator.validatePOSTDonors,
  rateLimiter.donorInsertionLimiter,
  queue.donorInsertionQueue,
  authenticator.handleAuthentication,
  donorController.handlePOSTDonors
)

router.get('/donors',
  donorValidator.validateGETDonors,
  rateLimiter.commonLimiter,
  authenticator.handleAuthentication,
  authenticator.handleFetchTargetDonor,
  authenticator.handleHallPermissionOrCheckAvailableToAll,
  donorController.handleGETDonors
)

router.get('/donors/me',
  rateLimiter.commonLimiter,
  authenticator.handleAuthentication,
  userController.handleGETMe
)

router.get('/search/v3',
  donorValidator.validateGETSearchDonors,
  rateLimiter.commonLimiter,
  authenticator.handleAuthentication,
  donorController.handleGETSearchV3
)

router.patch('/donors/comment',
  donorValidator.validatePATCHDonorsComment,
  rateLimiter.commonLimiter,
  authenticator.handleAuthentication,
  authenticator.handleFetchTargetDonor,
  authenticator.handleHallPermissionOrCheckAvailableToAll,
  donorController.handlePATCHDonorsComment
)

router.post('/donors/password',
  donorValidator.validatePOSTDonorsPasswordRequest,
  rateLimiter.passwordRequestLimiter,
  authenticator.handleAuthentication,
  authenticator.handleFetchTargetDonor,
  authenticator.handleHallPermission,
  authenticator.handleHigherDesignationCheck,
  donorController.handlePOSTDonorsPasswordRequest
)

router.patch('/donors/v2',
  donorValidator.validatePATCHDonors,
  rateLimiter.commonLimiter,
  authenticator.handleAuthentication,
  authenticator.handleFetchTargetDonor,
  authenticator.handleHallPermission,
  authenticator.handleHigherDesignationCheck,
  donorController.handlePATCHDonors
)

router.delete('/donors',
  donorValidator.validateDELETEDonors,
  rateLimiter.donorDeletionLimiter,
  authenticator.handleAuthentication,
  authenticator.handleFetchTargetDonor,
  authenticator.handleHallPermission,
  authenticator.handleHigherDesignationCheck,
  donorController.handleDELETEDonors
)

router.patch('/donors/designation',
  donorValidator.validatePATCHDonorsDesignation,
  rateLimiter.commonLimiter,
  authenticator.handleAuthentication,
  authenticator.handleFetchTargetDonor,
  authenticator.handleHallPermission,
  authenticator.handleHallAdminCheck,
  donorController.handlePATCHDonorsDesignation
)

router.get('/donors/designation',
  rateLimiter.commonLimiter,
  authenticator.handleAuthentication,
  donorController.handleGETDonorsDesignation
)

router.get('/donors/checkDuplicate',
  donorValidator.validateGETDonorsDuplicate,
  rateLimiter.commonLimiter,
  authenticator.handleAuthentication,
  donorController.handleGETDonorsDuplicate
)

router.get('/donors/phone',
  rateLimiter.commonLimiter,
  donorValidator.validateGETDonorsDuplicateMany,
  authenticator.handleAuthentication,
  donorController.handleGETDonorsDuplicateMany
)

// ROUTE TO BE DEPRECATED
router.get('/volunteers/all',
  rateLimiter.commonLimiter,
  authenticator.handleAuthentication,
  authenticator.handleSuperAdminCheck,
  donorController.handleGETDesignatedDonorsAll
)

router.get('/donors/designation/all',
  rateLimiter.commonLimiter,
  authenticator.handleAuthentication,
  authenticator.handleSuperAdminCheck,
  donorController.handleGETDesignatedDonorsAll
)

router.patch('/admins',
  donorValidator.validatePATCHAdmins,
  rateLimiter.commonLimiter,
  authenticator.handleAuthentication,
  authenticator.handleFetchTargetDonor,
  authenticator.handleSuperAdminCheck,
  donorController.handlePATCHAdmins
)

module.exports = router
