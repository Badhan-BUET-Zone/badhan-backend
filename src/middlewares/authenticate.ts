import dotenv from '../dotenv'
import * as tokenCache from '../cache/tokenCache'
import jwt from 'jsonwebtoken'
import * as donorInterface from '../db/interfaces/donorInterface'
import * as tokenInterface from '../db/interfaces/tokenInterface'
import {Request, Response, NextFunction, RequestHandler} from 'express'

import NotFoundError404 from "../response/models/errorTypes/NotFoundError404";
import UnauthorizedError401 from "../response/models/errorTypes/UnauthorizedError401";
import InternalServerError500 from "../response/models/errorTypes/InternalServerError500";
import ForbiddenError403 from "../response/models/errorTypes/ForbiddenError403";
import {IDonor} from "../db/models/Donor";
import {IToken} from "../db/models/Token";


const handleAuthentication = async (req: Request, res: Response, next:  NextFunction):Promise<Response|void> => {
  const token: string = req.header('x-auth')!

  try {
    await jwt.verify(token, dotenv.JWT_SECRET)
  } catch (e) {
    return res.status(401).send(new UnauthorizedError401('Invalid Authentication',{}))
  }

  // check whether donor is already in cache
  const cachedUser: IDonor = tokenCache.get(token)!
  if (cachedUser) {
    res.locals.middlewareResponse = {
      donor: cachedUser,
      token
    }
    return next()
  }

  const tokenCheckResult: {data?: IToken, message: string, status: string} = await tokenInterface.findTokenDataByToken(token)
  if (tokenCheckResult.status !== 'OK' || !tokenCheckResult.data) {
    return res.status(401).send(new UnauthorizedError401('You have been logged out',{}))
  }

  const tokenData: IToken = tokenCheckResult.data

  const findDonorResult: {message: string, status: string, data?: IDonor} = await donorInterface.findDonorById(tokenData.donorId)
  if (findDonorResult.status !== 'OK' || !findDonorResult.data) {
    return res.status(500).send(new InternalServerError500('No user found associated with token', {file:'Found in handleAuthentication'},{}))
  }

  const donor: IDonor = findDonorResult.data
  // save the donor to cache
  tokenCache.add(token, donor)
  res.locals.middlewareResponse = {
    donor,
    token
  }
  return next()
}

const handleSuperAdminCheck = async (req: Request, res: Response, next:  NextFunction):Promise<Response|void> => {
  if (res.locals.middlewareResponse.donor.designation === 3) {
    return next()
  }
  return res.status(403).send(new ForbiddenError403('You are not permitted to access this route',{}))
}

const handleHallAdminCheck = async (req: Request, res: Response, next:  NextFunction):Promise<Response|void> => {
  if (res.locals.middlewareResponse.donor.designation < 2) {
    return res.status(403).send(new ForbiddenError403('Only hall admins or above can access this route',{}))
  }
  next()
}

const handleHigherDesignationCheck = async (req: Request, res: Response, next:  NextFunction):Promise<Response|void> => {
  if (res.locals.middlewareResponse.donor.designation < res.locals.middlewareResponse.targetDonor.designation &&
        res.locals.middlewareResponse.donor._id !== res.locals.middlewareResponse.targetDonor._id) {
    return res.status(403).send(new ForbiddenError403('You cannot modify the details of a Badhan member with higher designation',{}))
  }
  next()
}

const handleFetchTargetDonor = async (req: Request, res: Response, next:  NextFunction):Promise<Response|void> => {
  /*
    This middleware checks whether the targeted donor is accessible to the logged-in user
    Makes sure that the targeted donor id is available in the request
     */
  let donorId: string = ""
  if (req.body.donorId) {
    donorId = req.body.donorId
  } else if (req.query.donorId) {
    donorId = String(req.query.donorId)
  } else if (req.params.donorId) {
    donorId = req.params.donorId
  }

  const donorQueryResult: {data?: IDonor, message: string, status: string} = await donorInterface.findDonorByQuery({
    _id: donorId
  })
  if (donorQueryResult.status !== 'OK') {
    return res.status(404).send(new NotFoundError404('Donor not found',{}))
  }
  res.locals.middlewareResponse.targetDonor = donorQueryResult.data
  return next()
}

const handleHallPermissionOrCheckAvailableToAll = async (req: Request, res: Response, next:  NextFunction): Promise<Response|void> => {
  const targetDonor: IDonor = res.locals.middlewareResponse.targetDonor
  if (targetDonor.availableToAll) {
    return next()
  }
  await handleHallPermission(req, res, next)
}

const handleHallPermission = async (req: Request, res: Response, next:  NextFunction): Promise<Response|void> => {
  /*
    A super admin can access the data of any hall.
    Every hall admin and volunteer can only access data of their own halls along with the data of
    attached students and covid donors.
     */
  const targetDonor: IDonor = res.locals.middlewareResponse.targetDonor
  if (targetDonor.hall <= 6 &&
        res.locals.middlewareResponse.donor.hall !== targetDonor.hall &&
        res.locals.middlewareResponse.donor.designation !== 3) {
    return res.status(403).send(new ForbiddenError403('You are not authorized to access a donor of different hall',{}))
  }
  return next()
}

export default {
  // CHECK PERMISSIONS
  handleAuthentication,
  handleHallAdminCheck,
  handleSuperAdminCheck,
  handleHallPermission,
  handleHigherDesignationCheck,
  handleFetchTargetDonor,
  handleHallPermissionOrCheckAvailableToAll
}
