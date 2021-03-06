const callRecordInterface = require('../db/interfaces/callRecordInterface')
const logInterface = require('../db/interfaces/logInterface')
const { InternalServerError500, NotFoundError404, ConflictError409 } = require('../response/errorTypes')
const { OKResponse200, CreatedResponse201 } = require('../response/successTypes')

const handlePOSTCallRecord = async (req, res) => {
  const donor = res.locals.middlewareResponse.targetDonor
  const user = res.locals.middlewareResponse.donor
  const callRecordInsertionResult = await callRecordInterface.insertOne(user._id, donor._id)

  await logInterface.addLog(user._id, 'POST CALLRECORDS', { callee: donor.name })

  return res.respond(new CreatedResponse201('Call record insertion successful', {
    callRecord: callRecordInsertionResult.data
  }))
}

const handleDELETECallRecord = async (req, res) => {
  const user = res.locals.middlewareResponse.donor
  const donor = res.locals.middlewareResponse.targetDonor
  const callRecordSearchResult = await callRecordInterface.findById(req.query.callRecordId)
  if (callRecordSearchResult.status !== 'OK') {
    return res.respond(new NotFoundError404('Call record not found'))
  }

  if (!callRecordSearchResult.data.calleeId.equals(donor._id)) {
    return res.respond(new ConflictError409('Target donor does not have the callee of call record'))
  }

  const callRecordDeleteResult = await callRecordInterface.deleteById(req.query.callRecordId)
  if (callRecordDeleteResult.status !== 'OK') {
    return res.respond(new InternalServerError500(callRecordDeleteResult.message))
  }

  await logInterface.addLog(user._id, 'DELETE CALLRECORDS', {
    callee: donor.name,
    ...callRecordDeleteResult.data
  })

  return res.respond(new OKResponse200('Call record deletion successful', {
    deletedCallRecord: callRecordDeleteResult.data
  }))
}

module.exports = {
  handlePOSTCallRecord,
  handleDELETECallRecord
}
