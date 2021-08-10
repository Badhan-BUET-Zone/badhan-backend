let express = require('express');
let router = express.Router();

const callRecordController = require('../controllers/callRecordController');
const authenticator = require('../middlewares/authenticate');
const rateLimiter = require('../middlewares/rateLimiter');

const callRecordValidator = require('../validations/callRecords');

const {deprecatedController} = require('../controllers/otherControllers');

router.post('/',
    callRecordValidator.validatePOSTCallRecords,
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleFetchTargetDonor,
    authenticator.handleHallPermissionOrCheckAvailableToAll,
    callRecordController.handlePOSTCallRecord
);

router.get('/',
    deprecatedController
    // rateLimiter.commonLimiter,
    // authenticator.handleAuthentication,
    // authenticator.handleFetchTargetDonor,
    // authenticator.handleHallPermissionOrCheckAvailableToAll,
    // callRecordController.handleGETCallRecords
);

router.delete('/',
    callRecordValidator.validateDELETECallRecords,
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleFetchTargetDonor,
    authenticator.handleHallPermissionOrCheckAvailableToAll,
    callRecordController.handleDELETESingleCallRecord
);

module.exports = router;
