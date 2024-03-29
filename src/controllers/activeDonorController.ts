import {Request, Response} from 'express'
import * as activeDonorInterface from '../db/interfaces/activeDonorInterface'
import * as logInterface from '../db/interfaces/logInterface'

import NotFoundError404 from "../response/models/errorTypes/NotFoundError404";
import ConflictError409 from "../response/models/errorTypes/ConflictError409";
import ForbiddenError403 from "../response/models/errorTypes/ForbiddenError403";
import OKResponse200 from "../response/models/successTypes/OKResponse200";
import CreatedResponse201 from "../response/models/successTypes/CreatedResponse201";
import {IDonor} from "../db/models/Donor";
import {IActiveDonor} from "../db/models/ActiveDonor";
const handlePOSTActiveDonors = async (req: Request, res: Response):Promise<Response> => {
  const donor: IDonor = res.locals.middlewareResponse.targetDonor
  const user: IDonor = res.locals.middlewareResponse.donor

  const activeDonorSearch: {data?: IActiveDonor[], message: string, status: string} = await activeDonorInterface.findByDonorId(donor._id)
  if (activeDonorSearch.status === 'OK') {
    return res.status(409).send(new ConflictError409('Active donor already created',{}))
  }

  const activeDonorInsertResult: {message: string, status: string, data: IActiveDonor} = await activeDonorInterface.add(donor._id, user._id)

  await logInterface.addLog(res.locals.middlewareResponse.donor._id, 'POST ACTIVEDONORS', {
    ...activeDonorInsertResult.data,
    donor: donor.name
  })
  return res.status(201).send(new CreatedResponse201('Active donor created', {
    newActiveDonor: activeDonorInsertResult.data
  }))
}

const handleDELETEActiveDonors = async (req: Request, res: Response): Promise<Response> => {
  const donor: IDonor = res.locals.middlewareResponse.targetDonor

  const activeDonorRemoveResult: {data?: IActiveDonor, message: string, status: string} = await activeDonorInterface.remove(donor._id)
  if (activeDonorRemoveResult.status !== 'OK') {
    return res.status(404).send(new NotFoundError404('Active donor not found',{}))
  }
  await logInterface.addLog(res.locals.middlewareResponse.donor._id, 'DELETE ACTIVEDONORS', {
    ...activeDonorRemoveResult.data,
    donor: donor.name
  })
  return res.status(200).send(new OKResponse200('Active donor deleted successfully', {
    removedActiveDonor: activeDonorRemoveResult.data
  }))
}

const handleGETActiveDonors = async (req: Request<{},{},{},{
  bloodGroup: string,
  hall: string,
  batch: string,
  name: string,
  address: string,
  isAvailable: string,
  isNotAvailable: string,
  availableToAll:string,
  markedByMe: string
}>, res: Response): Promise<Response> => {
  const reqQuery:{
    bloodGroup: number,
    hall: number,
    batch: string,
    name: string,
    address: string,
    isAvailable: boolean,
    isNotAvailable: boolean,
    availableToAll: boolean,
    markedByMe: boolean
  } = {
    bloodGroup: parseInt(req.query.bloodGroup,10),
    hall: parseInt(req.query.hall,10),
    batch: req.query.batch,
    name: req.query.name,
    address: req.query.address,
    isAvailable: req.query.isAvailable === 'true',
    isNotAvailable: req.query.isNotAvailable === 'true',
    availableToAll: req.query.availableToAll === 'true',
    markedByMe: req.query.markedByMe === 'true'
  }

  if (reqQuery.hall !== res.locals.middlewareResponse.donor.hall &&
    reqQuery.hall <= 6 &&
    res.locals.middlewareResponse.donor.designation !== 3) {
    return res.status(403).send(new ForbiddenError403('You are not allowed to search donors of other halls',{}))
  }
  const activeDonors: {message: string, status: string, data: IActiveDonor[]} = await activeDonorInterface.findByQueryAndPopulate(reqQuery, res.locals.middlewareResponse.donor._id)
  await logInterface.addLog(res.locals.middlewareResponse.donor._id, 'GET ACTIVEDONORS', {
    filter: reqQuery,
    resultCount: activeDonors.data.length
  })
  return res.status(200).send(new OKResponse200('Active donor queried successfully', {
    activeDonors: activeDonors.data
  }))
}

export default {
  handlePOSTActiveDonors,
  handleDELETEActiveDonors,
  handleGETActiveDonors
}
