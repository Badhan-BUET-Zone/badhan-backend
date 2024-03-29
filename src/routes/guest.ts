import {AsyncRouter, AsyncRouterInstance} from 'express-async-router'
import guestController from '../controllers/guestController'

const router: AsyncRouterInstance = AsyncRouter()

router.post('/users/signin',
  guestController.handlePOSTLogIn
)

router.delete('/users/signout',
  guestController.handlePOSTLogOut
)

router.delete('/users/signout/all',
  guestController.handlePOSTLogOutAll
)
router.patch('/users/password',
  guestController.handlePATCHPassword
)

router.get('/users/me',
  guestController.handlePOSTViewDonorDetailsSelf
)

router.post('/donors',
  guestController.handlePOSTInsertDonor
)

router.get('/search/v3',
  guestController.handlePOSTSearchDonors
)

router.delete('/donors',
  guestController.handlePOSTDeleteDonor
)

router.patch('/donors/comment',
  guestController.handlePOSTComment
)

router.post('/donors/password',
  guestController.handlePOSTChangePassword
)

router.patch('/donors/v2',
  guestController.handlePOSTEditDonor
)

router.patch('/donors/designation',
  guestController.handlePOSTPromote
)

router.patch('/admins',
  guestController.handlePOSTChangeAdmin
)

router.patch('/admins/superadmin',
  guestController.handlePATCHAdminsSuperAdmin
)

router.get('/donors',
  guestController.handleGETViewDonorDetails
)

router.get('/donors/designation',
  guestController.handleGETDonorsDesignation
)

router.get('/donors/checkDuplicate',
  guestController.handleGETDonorsDuplicate
)

router.get('/volunteers',
  guestController.handlePOSTViewVolunteersOfOwnHall
)

router.get('/admins',
  guestController.handlePOSTShowHallAdmins
)

router.get('/donors/designation/all',
  guestController.handleGETViewAllVolunteers
)

router.post('/donations',
  guestController.handlePOSTInsertDonation
)

router.delete('/donations',
  guestController.handlePOSTDeleteDonation
)

router.get('/log/statistics',
  guestController.handleGETStatistics
)

router.delete('/log',
  guestController.handleDELETELogs
)

router.post('/callrecords',
  guestController.handlePOSTCallRecord
)

router.delete('/callrecords',
  guestController.handleDELETECallRecord
)

router.get('/log',
  guestController.handleGETLogs
)

router.get('/publicContacts',
  guestController.handleGETPublicContacts
)

router.post('/publicContacts',
  guestController.handlePOSTPublicContact
)

router.delete('/publicContacts',
  guestController.handleDELETEPublicContact
)

router.get('/users/logins',
  guestController.handleGETLogins
)

router.delete('/users/logins/:tokenId',
  guestController.handleDELETELogins
)

router.get('/log/version/v5',
  guestController.handleGETAppVersions
)

router.post('/activeDonors', guestController.handlePOSTActiveDonors)
router.delete('/activeDonors/:donorId', guestController.handleDELETEActiveDonors)
router.get('/activeDonors', guestController.handleGETActiveDonors)

export default router
