// @ts-nocheck
/* tslint:disable */
const donorInterface = require('../db/interfaces/donorInterface')
const donationInterface = require('../db/interfaces/donationInterface')
const logInterface = require('../db/interfaces/logInterface')
import OKResponse200 from "../response/models/successTypes/OKResponse200";
const constants = require('../constants')
import ForbiddenError403 from "../response/models/errorTypes/ForbiddenError403";
import InternalServerError500 from "../response/models/errorTypes/InternalServerError500";
import { handleGETGitReleaseInfo } from '../microservices/githubAPI'
import {handleGETFirebaseGooglePlayVersion} from '../microservices/firebaseAPI'

const validate = require('jsonschema').validate

const githubResponseSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    tag_name: { type: 'string' },
    assets: {
      type: 'array',
      minItems: 1,
      items: {
        types: 'object',
        additionalProperties: true,
        properties: {
          browser_download_url: { type: 'string' }
        },
        required: ['browser_download_url']
      }
    }
  },
  required: ['tag_name']
}

const firebaseResponseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    backendBaseURL: { type: 'string' },
    backendTestBaseURL: { type: 'string' },
    version: { type: 'string' }
  },
  required: ['backendBaseURL', 'backendTestBaseURL', 'version']
}

function isValidHttpUrl (string) {
  let url
  try {
    url = new URL(string)
  } catch (_) {
    return false
  }
  return url.protocol === 'http:' || url.protocol === 'https:'
}

function isValidVersion (string) {
  return /^\d{1,2}\.\d{1,2}\.\d{1,2}$/.test(string)
}

const handleGETAppVersions = async (req, res) => {
  const githubResponse = await handleGETGitReleaseInfo()

  const githubValidationResult = validate(githubResponse.data, githubResponseSchema)
  if (githubValidationResult.errors.length !== 0) {
    return res.status(500).send(new InternalServerError500('Github API response format not valid'))
  }
  const browserDownloadURL = githubResponse.data.assets[0].browser_download_url
  const githubReleaseVersion = githubResponse.data.tag_name

  if (!isValidHttpUrl(browserDownloadURL) || !isValidVersion(githubReleaseVersion)) {
    return res.status(500).send(new InternalServerError500('Github release browser download URL/ version is not valid'))
  }

  const firebaseResponse = await handleGETFirebaseGooglePlayVersion()
  const firebaseValidationResult = validate(firebaseResponse.data, firebaseResponseSchema)
  if (firebaseValidationResult.errors.length !== 0 || !isValidVersion(firebaseResponse.data.version)) {
    return res.status(500).send(new InternalServerError500('Firebase frontendSettings has invalid format'))
  }
  return res.status(200).send(new OKResponse200('Github and firebase latest app version fetched', {
    githubReleaseVersion: githubReleaseVersion,
    githubReleaseDownloadURL: browserDownloadURL,
    firebaseVersion: firebaseResponse.data.version
  }))
}

const handleGETStatistics = async (req, res) => {
  const donorCount = await donorInterface.getCount()
  const donationCount = await donationInterface.getCount()
  const volunteerCount = await donorInterface.getVolunteerCount()
  return res.status(200).send(new OKResponse200('Statistics fetched successfully', {
    statistics: {
      donorCount: donorCount.data,
      donationCount: donationCount.data,
      volunteerCount: volunteerCount.data
    }
  }))
}

const handleGETLogs = async (req, res) => {
  const logCountsResult = await logInterface.getLogCounts()
  return res.status(200).send(new OKResponse200('Log counts fetched successfully', {
    logs: logCountsResult.data
  }))
}

const handleGETLogsByDate = async (req, res) => {
  const logsByDateResult = await logInterface.getLogsByDate(req.params.date)
  return res.status(200).send(new OKResponse200('Logs fetched by date successfully', {
    logs: logsByDateResult.data
  }))
}
const handleGETLogsByDateAndDonor = async (req, res) => {
  const logsByDateAndDonor = await logInterface.getLogsByDateAndUser(req.params.date, req.params.donorId)
  return res.status(200).send(new OKResponse200('Logs fetched by data and donor successfully', {
    logs: logsByDateAndDonor.data
  }))
}

const handleDELETELogs = async (req, res) => {
  if (!res.locals.middlewareResponse.donor._id.equals(constants.MASTER_ADMIN_ID)) {
    return res.status(403).send(new ForbiddenError403('Only Master Admin is allowed to access this route'))
  }
  await logInterface.deleteLogs()
  await logInterface.addLogOfMasterAdmin('DELETE LOGS', {})
  return res.status(200).send(new OKResponse200('All logs deleted successfully'))
}

export default {
  handleGETStatistics,
  handleGETAppVersions,
  handleGETLogs,
  handleGETLogsByDate,
  handleGETLogsByDateAndDonor,
  handleDELETELogs
}
