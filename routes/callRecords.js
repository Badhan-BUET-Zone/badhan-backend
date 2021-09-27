const AsyncRouter = require("express-async-router").AsyncRouter;
let router = AsyncRouter();

const callRecordController = require('../controllers/callRecordController');
const authenticator = require('../middlewares/authenticate');
const rateLimiter = require('../middlewares/rateLimiter');
const callRecordValidator = require('../validations/callRecords');

router.post('/', /*#swagger.path = '/callrecords'*/
    callRecordValidator.validatePOSTCallRecords,
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleFetchTargetDonor,
    authenticator.handleHallPermissionOrCheckAvailableToAll,
    callRecordController.handlePOSTCallRecord,
);

router.delete('/', /*#swagger.path = '/callrecords'*/
    callRecordValidator.validateDELETECallRecords,
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleFetchTargetDonor,
    authenticator.handleHallPermissionOrCheckAvailableToAll,
    callRecordController.handleDELETECallRecord
);

module.exports = router;
