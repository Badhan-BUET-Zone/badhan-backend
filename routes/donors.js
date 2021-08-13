let express = require('express');
let router = express.Router();

const donorController = require('../controllers/donorController');
const authenticator = require('../middlewares/authenticate');
const rateLimiter = require('../middlewares/rateLimiter');
const donorValidator = require('../validations/donors');

router.post('/donors',
    donorValidator.validatePOSTDonors,
    rateLimiter.donorInsertionLimiter,
    authenticator.handleAuthentication,
    donorController.handlePOSTDonors
);

router.get('/donors',
    donorValidator.validateGETDonors,
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleFetchTargetDonor,
    authenticator.handleHallPermissionOrCheckAvailableToAll,
    donorController.handleGETDonors
);


router.get('/donors/me',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    donorController.handleGETDonorsMe
);

router.get('/search/v2',
    donorValidator.validateGETSearchDonors,
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    donorController.handleGETSearchOptimized
)


router.patch('/donors/comment',
    donorValidator.validatePATCHDonorsComment,
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleFetchTargetDonor,
    authenticator.handleHallPermissionOrCheckAvailableToAll,
    donorController.handlePATCHDonorsComment
);

router.patch('/donors/password',
    donorValidator.validatePATCHDonorsPassword,
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleFetchTargetDonor,
    authenticator.handleHallPermission,
    authenticator.handleHigherDesignationCheck,
    donorController.handlePATCHDonorsPassword
);

router.patch('/donors',
    donorValidator.validatePATCHDonors,
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleFetchTargetDonor,
    authenticator.handleHallPermission,
    authenticator.handleHigherDesignationCheck,
    donorController.handlePATCHDonors
);

router.delete('/donors',
    donorValidator.validateDELETEDonors,
    rateLimiter.donorDeletionLimiter,
    authenticator.handleAuthentication,
    authenticator.handleFetchTargetDonor,
    authenticator.handleHallPermission,
    authenticator.handleHigherDesignationCheck,
    donorController.handleDELETEDonors
);

router.patch('/donors/designation',
    donorValidator.validatePATCHDonorsDesignation,
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleFetchTargetDonor,
    authenticator.handleHallPermission,
    authenticator.handleHallAdminCheck,
    donorController.handlePATCHDonorsDesignation
);

router.get('/donors/checkDuplicate',
    donorValidator.validateGETDonorsDuplicate,
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    donorController.handleGETDonorsDuplicate
);

router.get('/volunteers',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    donorController.handleGETVolunteers
);

router.get('/volunteers/all',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleSuperAdminCheck,
    donorController.handleGETVolunteersAll,
)

router.patch('/admins',
    donorController.handlePATCHAdmins,
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleSuperAdminCheck,
    donorController.handlePATCHAdmins
);

router.get('/admins',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    donorController.handleGETAdmins
);


module.exports = router;
