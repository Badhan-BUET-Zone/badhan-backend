const express = require('express');
const router = express.Router();

const guestController = require('../controllers/guestController')

router.post('/users/signin',
    guestController.handlePOSTLogIn
);

router.delete('/users/signout',
    guestController.handlePOSTLogOut
);

router.delete('/users/signout/all',
    guestController.handlePOSTLogOutAll
);

router.get('/donors/me',
    guestController.handlePOSTViewDonorDetailsSelf
);

router.post('/donors',
    guestController.handlePOSTInsertDonor
);

router.get('/search/v2',
    guestController.handlePOSTSearchDonors
);

router.delete('/donors',
    guestController.handlePOSTDeleteDonor,
);

router.patch('/donors/comment',
    guestController.handlePOSTComment,
);

router.patch('/donors/password',
    guestController.handlePOSTChangePassword,
);

router.patch('/donors',
    guestController.handlePOSTEditDonor,
);

router.patch('/donors/designation',
    guestController.handlePOSTPromote
);

router.patch('/admins',
    guestController.handlePOSTChangeAdmin
);

router.get('/donors',
    guestController.handleGETViewDonorDetails
);

router.get('/donors/checkDuplicate',
    guestController.handleGETDonorsDuplicate
);

router.get('/volunteers',
    guestController.handlePOSTViewVolunteersOfOwnHall
);

router.get('/admins',
    guestController.handlePOSTShowHallAdmins
);

router.get('/volunteers/all',
    guestController.handleGETViewAllVolunteers,
)

router.post('/donations',
    guestController.handlePOSTInsertDonation
);

router.delete('/donations',
    guestController.handlePOSTDeleteDonation
);

router.get('/v2/log/statistics',
    guestController.handleGETStatistics
);

router.delete('/v1/log',
    guestController.handleDELETELogs
);

router.post('/callrecords',
    guestController.handlePOSTCallRecord
);

router.delete('/callrecords',
    guestController.handleDELETESingleCallRecord
);

router.get('/log/date/:date/donorId/:donorId',
    guestController.handleGETLogsByDateAndDonor
);

router.get('/log/date/:date',
    guestController.handleGETLogsByDate
);

router.get('/log',
    guestController.handleGETLogs
);


module.exports = router;
