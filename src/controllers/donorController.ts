import * as donorInterface from '../db/interfaces/donorInterface'
import * as donationInterface from '../db/interfaces/donationInterface'
import * as logInterface from '../db/interfaces/logInterface'
import * as tokenInterface from '../db/interfaces/tokenInterface'
import {Request, Response} from 'express'
import { halls, year2000TimeStamp } from '../constants'

import InternalServerError500 from "../response/models/errorTypes/InternalServerError500";
import ForbiddenError403 from "../response/models/errorTypes/ForbiddenError403";
import ConflictError409 from "../response/models/errorTypes/ConflictError409";
import CreatedResponse201 from "../response/models/successTypes/CreatedResponse201";
import OKResponse200 from "../response/models/successTypes/OKResponse200";
import {IDonation} from "../db/models/Donation";
import {IDonor} from "../db/models/Donor";
import {IToken} from "../db/models/Token";

const handlePOSTDonors = async (req: Request<{},{},{
  phone: number,
  studentId: string,
  bloodGroup: number,
  hall: number,
  address: string,
  roomNumber: string,
  lastDonation: number,
  name: string,
  comment: string,
  availableToAll: boolean,
  extraDonationCount: number
},{}>, res: Response): Promise<Response> => {
  const authenticatedUser: IDonor = res.locals.middlewareResponse.donor

  const duplicateDonorResult: { data?: IDonor; message: string; status: string } = await donorInterface.findDonorByPhone(req.body.phone)

  if (duplicateDonorResult.status === 'OK') {
    if (
      authenticatedUser.designation === 3 ||
      duplicateDonorResult.data!.hall === authenticatedUser.hall ||
      duplicateDonorResult.data!.hall > 6 ||
      duplicateDonorResult.data!.availableToAll
    ) {
      return res.status(409).send(new ConflictError409('Donor found with duplicate phone number in ' + halls[duplicateDonorResult.data!.hall] + ' hall', {
        donorId: duplicateDonorResult.data!._id
      }))
    }
    return res.status(409).send(new ConflictError409('Donor found with duplicate phone number in ' + halls[duplicateDonorResult.data!.hall] + ' hall. You are not permitted to access this donor.', {}))
  }

  // if the hall is unknown, then the donor must be available to all
  let availableToAll: boolean = req.body.availableToAll
  if (req.body.hall === 8) {
    availableToAll = true
  }

  const donorInsertionResult: { data: IDonor; message: string; status: string } = await donorInterface.insertDonor(req.body.phone, req.body.bloodGroup, req.body.hall, req.body.name, req.body.studentId, req.body.address, req.body.roomNumber, 0, req.body.comment, availableToAll)
  if (donorInsertionResult.status !== 'OK') {
    return res.status(500).send(new InternalServerError500('New donor insertion unsuccessful',{},{}))
  }

  const dummyDonations: IDonation[] = []
  for (let i: number = 0; i < req.body.extraDonationCount; i++) {
    dummyDonations.push({
      phone: donorInsertionResult.data.phone,
      donorId: donorInsertionResult.data._id,
      date: year2000TimeStamp
    } as IDonation)
  }

  const dummyInsertionResult: { data: IDonation[]; message: string; status: string } = await donationInterface.insertManyDonations(dummyDonations)

  if (dummyInsertionResult.status !== 'OK') {
    return res.status(500).send(new InternalServerError500('Dummy donations insertion unsuccessful',{},{}))
  }

  await logInterface.addLog(res.locals.middlewareResponse.donor._id, 'POST DONORS', donorInsertionResult.data)
  return res.status(201).send(new CreatedResponse201('New donor inserted successfully', {
    newDonor: donorInsertionResult.data
  }))
}

const handleDELETEDonors = async (req: Request, res: Response):Promise<Response> => {
  const donor: IDonor = res.locals.middlewareResponse.targetDonor

  if (donor.designation! > 1) {
    return res.status(409).send(new ConflictError409('Donor must be demoted for deletion', {}))
  }

  const deleteDonorResult: { data?: IDonor; message: string; status: string } = await donorInterface.deleteDonorById(donor._id)
  if (deleteDonorResult.status !== 'OK') {
    return res.status(500).send(new InternalServerError500('Error occurred in deleting target donor',{},{}))
  }

  await logInterface.addLog(res.locals.middlewareResponse.donor._id, 'DELETE DONORS', deleteDonorResult.data!)

  return res.status(200).send(new OKResponse200('Donor deleted successfully',{}))
}

const handleGETSearchV3 = async (req: Request<{},{},{},{
  bloodGroup: string,
  hall: string,
  batch: string,
  name: string,
  address: string,
  isAvailable: string,
  isNotAvailable: string,
  availableToAll:string,
}>, res: Response):Promise<Response> => {
  const reqQuery: { bloodGroup: number; isAvailable: boolean; address: string; batch: string; name: string; isNotAvailable: boolean; availableToAll: boolean; hall: number } = {
    bloodGroup: parseInt(req.query.bloodGroup,10),
    hall: parseInt(req.query.hall,10),
    batch: req.query.batch,
    name: req.query.name,
    address: req.query.address,
    isAvailable: req.query.isAvailable === 'true',
    isNotAvailable: req.query.isNotAvailable === 'true',
    availableToAll: req.query.availableToAll === 'true',
  }

  if (reqQuery.hall !== res.locals.middlewareResponse.donor.hall &&
    reqQuery.hall <= 6 &&
    res.locals.middlewareResponse.donor.designation !== 3) {
    return res.status(403).send(new ForbiddenError403('You are not allowed to search donors of other halls',{}))
  }
  const result: { data: IDonor[]; message: string; status: string } = await donorInterface.findDonorsByAggregate(reqQuery)
  await logInterface.addLog(res.locals.middlewareResponse.donor._id, 'GET SEARCH V3', {
    filter: reqQuery,
    resultCount: result.data.length
  })

  return res.status(200).send(new OKResponse200('Donors queried successfully', {
    filteredDonors: result.data
  }))
}

const handlePATCHDonorsComment = async (req: Request, res: Response):Promise<Response> => {
  const targetDonor: IDonor = res.locals.middlewareResponse.targetDonor

  targetDonor.comment = req.body.comment
  targetDonor.commentTime = new Date().getTime()
  await targetDonor.save()
  await logInterface.addLog(res.locals.middlewareResponse.donor._id, 'PATCH DONORS COMMENT', targetDonor)
  return res.status(200).send(new OKResponse200('Comment updated successfully',{}))
}

const handlePATCHDonorsPassword = async (req: Request, res: Response):Promise<Response> => {
  const reqBody: {password: string} = req.body
  const target: IDonor = res.locals.middlewareResponse.targetDonor
  if (target.designation === 0) {
    return res.status(409).send(new ConflictError409('Target user does not have an account', {}))
  }

  target.password = reqBody.password

  await target.save()

  await tokenInterface.deleteAllTokensByDonorId(target._id)

  await logInterface.addLog(res.locals.middlewareResponse.donor._id, 'PATCH DONORS PASSWORD', { name: target.name })
  return res.status(200).send(new OKResponse200('Password changed successfully',{}))
}

const handlePATCHDonors = async (req: Request, res: Response):Promise<Response> => {
  const reqBody: {availableToAll: boolean, address: string, roomNumber: string, hall: number, bloodGroup: number, studentId: string,phone: number, name: string, email: string} = req.body

  const target: IDonor = res.locals.middlewareResponse.targetDonor
  const user: IDonor = res.locals.middlewareResponse.donor

  // if (reqBody.email !== '' && !await emailInterface.checkIfEmailExists(reqBody.email)) {
  //   return res.status(404).send(new NotFoundError404('Email address does not exist'))
  // }

  if (target.email !== reqBody.email && !target._id.equals(user._id)) {
    return res.status(403).send(new ForbiddenError403('You do not have permission to edit email address of another user',{}))
  }

  target.name = reqBody.name
  target.phone = reqBody.phone
  target.studentId = reqBody.studentId
  target.bloodGroup = reqBody.bloodGroup
  target.hall = reqBody.hall
  target.roomNumber = reqBody.roomNumber
  target.address = reqBody.address
  target.availableToAll = reqBody.availableToAll
  target.email = reqBody.email

  if (target.hall === 8) {
    target.availableToAll = true
  }

  await target.save()

  await logInterface.addLog(res.locals.middlewareResponse.donor._id, 'PATCH DONORS', target)
  return res.status(200).send(new OKResponse200('Donor updated successfully',{}))
}

const handlePATCHDonorsDesignation = async (req: Request, res: Response):Promise<Response> => {
  const donor: IDonor = res.locals.middlewareResponse.targetDonor
  const donorDesignation: number | undefined = donor.designation

  if ((donorDesignation === 1 && req.body.promoteFlag) ||
    (donorDesignation === 0 && !req.body.promoteFlag) || donorDesignation === 3) {
    return res.status(409).send(new ConflictError409('Can\'t promote volunteer or can\'t demote donor',{}))
  }

  if (donor.hall > 6) {
    return res.status(409).send(new ConflictError409('Donor does not have a valid hall',{}))
  }

  if (req.body.promoteFlag) {
    donor.designation = 1
  } else {
    donor.designation = 0
  }

  await donor.save()

  let logOperation: string = ''
  if (req.body.promoteFlag) {
    logOperation = 'PROMOTE'
  } else {
    logOperation = 'DEMOTE'
  }

  await logInterface.addLog(res.locals.middlewareResponse.donor._id, 'PATCH DONORS DESIGNATION (' + logOperation + ')', donor)
  return res.status(200).send(new OKResponse200('Target user promoted/demoted successfully',{}))
}

const handlePATCHAdmins = async (req: Request, res: Response):Promise<Response> => {
  const targetDonor: IDonor = res.locals.middlewareResponse.targetDonor

  if (targetDonor.designation !== 1) {
    return res.status(409).send(new ConflictError409('User is not a volunteer',{}))
  }

  if (targetDonor.hall > 6) {
    return res.status(409).send(new ConflictError409('User does not have a valid hall',{}))
  }
  await donorInterface.findDonorAndUpdate({
    hall: targetDonor.hall,
    designation: 2
  }, {
    $set: { designation: 1 }
  })

  // Make new hall admin
  targetDonor.designation = 2
  await targetDonor.save()

  await logInterface.addLog(res.locals.middlewareResponse.donor._id, 'PATCH DONORS DESIGNATION (VOLUNTEER)', { name: targetDonor.name })
  return res.status(200).send(new OKResponse200('Changed hall admin successfully',{}))
}

const handleGETDonors = async (req: Request, res: Response):Promise<Response> => {
  const donor: IDonor = res.locals.middlewareResponse.targetDonor
  await donor.populate([
    {
      path: 'donations',
      options: { sort: { date: -1 } }
    },
    {
      path: 'callRecords',
      populate: {
        path: 'callerId',
        select: {
          _id: 1,
          name: 1,
          hall: 1,
          designation: 1
        }
      },
      options: { sort: { date: -1 } }
    },
    {
      path: 'publicContacts',
      select: {
        _id: 1,
        bloodGroup: 1
      }
    },
    {
      path: 'markedBy',
      select: {
        markerId: 1,
        time: 1,
        _id: 0
      },
      populate: {
        path: 'markerId',
        model: 'Donor',
        select: { name: 1 }
      }
    }
  ])

  await logInterface.addLog(res.locals.middlewareResponse.donor._id, 'GET DONORS', { name: donor.name })

  return res.status(200).send(new OKResponse200('Fetched donor details successfully', {
    donor
  }))
}

const handleGETDesignatedDonorsAll = async (req: Request, res: Response):Promise<Response> => {
  const allDesignatedDonorResult: { data: IDonor[]; message: string; status: string } = await donorInterface.findAllDesignatedDonors()

  if (allDesignatedDonorResult.status !== 'OK') {
    return res.status(500).send(new InternalServerError500(allDesignatedDonorResult.message,{},{}))
  }

  await logInterface.addLog(res.locals.middlewareResponse.donor._id, 'GET DONORS DESIGNATION ALL', {})

  return res.status(200).send(new OKResponse200('Fetched donor details successfully', {
    data: allDesignatedDonorResult.data
  }))
}

const handleGETDonorsDuplicate = async (req: Request<{},{},{},{phone: string}>, res: Response):Promise<Response> => {
  const authenticatedUser: IDonor = res.locals.middlewareResponse.donor

  const duplicateDonorResult: { data?: IDonor; message: string; status: string } = await donorInterface.findDonorByPhone(parseInt(req.query.phone,10))

  if (duplicateDonorResult.status === 'OK') {
    if (
      authenticatedUser.designation === 3 ||
      duplicateDonorResult.data!.hall === authenticatedUser.hall ||
      duplicateDonorResult.data!.hall > 6 ||
      duplicateDonorResult.data!.availableToAll
    ) {
      return res.status(200).send(new OKResponse200('Donor found with duplicate phone number in ' + halls[duplicateDonorResult.data!.hall] + ' hall', {
        found: true,
        donor: duplicateDonorResult.data
      }))
    }

    return res.status(200).send(new OKResponse200('Donor found with duplicate phone number in ' + halls[duplicateDonorResult.data!.hall] + ' hall. You are not permitted to access this donor.', {
      found: true,
      donor: null
    }))
  }

  await logInterface.addLog(res.locals.middlewareResponse.donor._id, 'GET DONORS CHECKDUPLICATE', { phone: req.query.phone })

  return res.status(200).send(new OKResponse200('No duplicate donors found', {
    found: false,
    donor: null
  }))
}

const handlePOSTDonorsPasswordRequest = async (req: Request, res: Response):Promise<Response> => {
  const donor: IDonor = res.locals.middlewareResponse.targetDonor

  if (donor.designation === 0) {
    return res.status(409).send(new ConflictError409('Donor is not a volunteer/ admin',{}))
  }

  const tokenDeleteResult: { message: string; status: string } = await tokenInterface.deleteAllTokensByDonorId(donor._id)
  if (tokenDeleteResult.status !== 'OK') {
    return res.status(500).send(new InternalServerError500(tokenDeleteResult.message,{},{}))
  }

  const tokenInsertResult: { data: IToken; message: string; status: string } = await tokenInterface.insertAndSaveTokenWithExpiry(donor._id, res.locals.userAgent, null)
  if (tokenInsertResult.status !== 'OK') {
    return res.status(500).send(new InternalServerError500(tokenInsertResult.message,{},{}))
  }

  await logInterface.addLog(res.locals.middlewareResponse.donor._id, 'POST DONORS PASSWORD (REQUEST)', { name: donor.name })

  return res.status(200).send(new OKResponse200('Created recovery link for user successfully', {
    token: tokenInsertResult.data.token
  }))
}

const handleGETDonorsDesignation = async (req: Request, res: Response):Promise<Response> => {
  const authenticatedUser: IDonor = res.locals.middlewareResponse.donor

  const adminsQueryResult: { data: IDonor[]; message: string; status: string } = await donorInterface.findAdmins(2)
  if (adminsQueryResult.status !== 'OK') {
    return res.status(500).send(new InternalServerError500(adminsQueryResult.message,{},{}))
  }
  const adminList: IDonor[] = adminsQueryResult.data

  const donorsQueryResult: { data: IDonor[]; message: string; status: string } = await donorInterface.findVolunteersOfHall(authenticatedUser.hall)
  if (donorsQueryResult.status !== 'OK') {
    return res.status(500).send(new InternalServerError500(donorsQueryResult.message,{},{}))
  }

  const volunteerList: IDonor[] = donorsQueryResult.data

  const superAdminQuery: { data: IDonor[]; message: string; status: string } = await donorInterface.findAdmins(3)
  if (superAdminQuery.status !== 'OK') {
    return res.status(500).send(new InternalServerError500(superAdminQuery.message,{},{}))
  }
  const superAdminList: IDonor[] = superAdminQuery.data

  await logInterface.addLog(res.locals.middlewareResponse.donor._id, 'GET DONORS DESIGNATION', {})

  return res.status(200).send(new OKResponse200('All designated members fetched', {
    volunteerList,
    adminList,
    superAdminList
  }))
}

const handleGETDonorsDuplicateMany = async (req: Request<{},{},{},{phoneList: string[]}>, res: Response):Promise<Response> => {
  const authenticatedUser: IDonor = res.locals.middlewareResponse.donor
  const existingDonorsResult: { donors: IDonor[]; message: string; status: string } = await donorInterface.findDonorIdsByPhone(authenticatedUser.designation!, authenticatedUser.hall, req.query.phoneList.map((phone:string): number=>parseInt(phone,10)))
  await logInterface.addLog(authenticatedUser._id, 'GET DONORS PHONE', { phones: req.query.phoneList })
  return res.status(200).send(new OKResponse200(existingDonorsResult.message, {
    donors: existingDonorsResult.donors
  }))
}

const handlePATCHAdminsSuperAdmin = async (req: Request, res: Response):Promise<Response>=>{
  const targetDonor: IDonor = res.locals.middlewareResponse.targetDonor

  if(targetDonor.designation!==1 && targetDonor.designation!==3){
    return res.status(409).send(new ConflictError409('Target donor must be a volunteer or super admin',{}))
  }

  let message: string
  if(req.body.promoteFlag){
    targetDonor.designation = 3
    message = 'Donor has been promoted to Super Admin'
  }else {
    targetDonor.designation = 1
    message = 'Donor has been demoted to Volunteer'
  }
  await targetDonor.save()
  await logInterface.addLog(targetDonor._id,'PATCH DONORS DESIGNATION SUPERADMIN',{name: targetDonor.name})
  return res.status(200).send(new OKResponse200(message,{
    donor: targetDonor
  }))

}

export default {
  handlePOSTDonors,
  handleDELETEDonors,
  handlePATCHDonorsComment,
  handlePATCHDonorsPassword,
  handleGETDonorsDesignation,
  handlePATCHDonors,
  handlePATCHDonorsDesignation,
  handlePATCHAdmins,
  handleGETDonors,
  handleGETDesignatedDonorsAll,
  handleGETDonorsDuplicate,
  handlePOSTDonorsPasswordRequest,
  handleGETSearchV3,
  handleGETDonorsDuplicateMany,
  handlePATCHAdminsSuperAdmin
}
