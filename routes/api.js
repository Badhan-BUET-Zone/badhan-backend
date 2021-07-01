let express = require('express');
let router = express.Router();


const donorController = require('../controllers/donorController');
const donationController = require('../controllers/donationController');
const logController = require('../controllers/logController');
const authenticator = require('../middlewares/authenticate');
const rateLimiter = require('../middlewares/rateLimiter');
let gplay = require('google-play-scraper');


//THIS ROUTE HAS BEEN DEPRECATED ON 30 JUNE 2021. PLEASE DO NOT EDIT THIS ROUTE ANYMORE.
router.post('/v2/donor/insert',
    rateLimiter.donorInsertionLimiter,
    authenticator.handleAuthentication,
    donorController.handlePOSTInsertDonor
);

router.post('/donors',
    rateLimiter.donorInsertionLimiter,
    authenticator.handleAuthentication,
    donorController.handlePOSTDonors
);

//THIS ROUTE HAS BEEN DEPRECATED ON 30 JUNE 2021. PLEASE DO NOT EDIT THIS ROUTE ANYMORE.
router.get('/v3/donor/details',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    donorController.handleGETViewDonorDetails
);

router.get('/donors',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    donorController.handleGETDonors
);

//THIS IS A DEPRECATED ROUTE THAT WILL BE REMOVED. PLEASE DO NOT EDIT THIS ROUTE ANYMORE.
//APP VERSION <= 3.5.1 STILL USES IT
router.post('/v2/donor/details',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    donorController.handlePOSTViewDonorDetails
);

//THIS ROUTE HAS BEEN DEPRECATED ON 30 JUNE 2021. PLEASE DO NOT EDIT THIS ROUTE ANYMORE.

router.post('/v2/donor/details/self',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    donorController.handlePOSTViewDonorDetailsSelf
);

router.get('/donors/me',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    donorController.handleGETDonorsMe
);

router.post('/v2/donor/search',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    donorController.handlePOSTSearchDonors
);

//THIS ROUTE HAS BEEN DEPRECATED ON 30 JUNE 2021. PLEASE DO NOT EDIT THIS ROUTE ANYMORE.
router.post('/v2/donor/donations',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    donationController.handleGETSeeHistory
);

router.get('/donations',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    donationController.handleGETDonations
);

//THIS ROUTE HAS BEEN DEPRECATED ON 30 JUNE 2021. PLEASE DO NOT EDIT THIS ROUTE ANYMORE.
router.post('/v2/donation/insert',
    rateLimiter.donationInsertionLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    donationController.handlePOSTInsertDonation
);

router.post('/donations',
    rateLimiter.donationInsertionLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    donationController.handlePOSTDonations
);

//THIS ROUTE HAS BEEN DEPRECATED ON 30 JUNE 2021. PLEASE DO NOT EDIT THIS ROUTE ANYMORE.
router.post('/v2/donation/delete',
    rateLimiter.deleteDonationLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    donationController.handlePOSTDeleteDonation
);

router.delete('/donations',
    rateLimiter.deleteDonationLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    donationController.handleDeleteDonations
);

//THIS ROUTE HAS BEEN DEPRECATED ON 30 JUNE 2021. PLEASE DO NOT EDIT THIS ROUTE ANYMORE.
router.post('/v2/donor/comment',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    donorController.handlePOSTComment
);

router.patch('/donors/comment',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    donorController.handlePATCHDonorsComment
);

//THIS ROUTE HAS BEEN DEPRECATED ON 30 JUNE 2021. PLEASE DO NOT EDIT THIS ROUTE ANYMORE.
router.post('/v2/donor/password/change',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    authenticator.handleHigherDesignationCheck,
    donorController.handlePOSTChangePassword
);

router.patch('/donors/password',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    authenticator.handleHigherDesignationCheck,
    donorController.handlePATCHDonorsPassword
);

//THIS ROUTE HAS BEEN DEPRECATED ON 30 JUNE 2021. PLEASE DO NOT EDIT THIS ROUTE ANYMORE.
router.post('/v2/donor/edit',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    authenticator.handleHigherDesignationCheck,
    donorController.handlePOSTEditDonor
);

router.patch('/donors',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    authenticator.handleHigherDesignationCheck,
    donorController.handlePATCHDonors
);

//THIS ROUTE HAS BEEN DEPRECATED ON 30 JUNE 2021. PLEASE DO NOT EDIT THIS ROUTE ANYMORE.
router.post('/v2/admin/donor/delete',
    rateLimiter.donorDeletionLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    authenticator.handleHigherDesignationCheck,
    donorController.handlePOSTDeleteDonor
);

router.delete('/donors',
    rateLimiter.donorDeletionLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    authenticator.handleHigherDesignationCheck,
    donorController.handleDeleteDonors
);

/********Hall admin APIs*********/

router.post('/v2/admin/promote',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleHallPermission,
    authenticator.handleHallAdminCheck,
    donorController.handlePOSTPromote
);

router.post('/v2/admin/volunteers',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    donorController.handlePOSTViewVolunteersOfOwnHall
);

router.get('/v1/admin/volunteers/all',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleSuperAdminCheck,
    donorController.handleGETViewAllVolunteers,
)

router.post('/v2/admin/hall/change',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleSuperAdminCheck,
    donorController.handlePOSTChangeAdmin
);

router.post('/v2/admin/hall/show',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    donorController.handlePOSTShowHallAdmins
);

router.get('/v3/log/version',
    rateLimiter.commonLimiter,
    logController.handleGETAppVersion
);

//THIS IS A DEPRECATED ROUTE THAT WILL BE REMOVED ON 25 MAY 2022. PLEASE DO NOT EDIT THIS ROUTE ANYMORE.
//APP VERSION <= 3.5.1 STILL USES IT
router.get('/v2/version',(req,res,next)=>{

    /*#swagger.tags = ['Deprecated']
    #swagger.description = 'Get app info deployed to play store' */
    rateLimiter.commonLimiter,
    gplay.app({appId: 'com.mmmbadhan'})
        .then((response)=>{
            res.status(200).send(response)
        });
});

router.get('/v2/log/statistics',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleSuperAdminCheck,
    logController.handleGETStatistics
);

router.get('/v1/log',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleSuperAdminCheck,
    logController.handleGETLogs
);

router.delete('/v1/log',
    rateLimiter.commonLimiter,
    authenticator.handleAuthentication,
    authenticator.handleSuperAdminCheck,
    logController.handleDELETELogs
);

/* GET home page. */
// router.get('/', logController.handleGETOnlineCheck);

module.exports = router;
