const callRecordInterface = require('../db/interfaces/callRecordInterface')
const logInterface = require('../db/interfaces/logInterface')
const { InternalServerError500, NotFoundError404, ConflictError409 } = require('../response/errorTypes')
const { OKResponse200, CreatedResponse201 } = require('../response/successTypes')

/**
 * @openapi
 * /callrecords:
 *   post:
 *     tags:
 *       - Call Records
 *     summary: Post public contact route
 *     description: Endpoint to insert a public contact
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       description: The JSON contains the donor id of callee
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               donorId:
 *                 type: string
 *                 example: bhjdekj8923
 *     responses:
 *       201:
 *         description: Call record insertion successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 statusCode:
 *                   type: number
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Call record insertion successful
 *                 calleeId:
 *                   type: string
 *                   example: 5e68514546b0e
 *                 expireAt:
 *                   type: string
 *                   example: 2021-11-15T11:23:54.231Z
 *                 callRecord:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 614ec811e29ab430ddfb119a
 *                     name:
 *                       type: string
 *                       example: Mir Mahathir
 *                     designation:
 *                       type: number
 *                       example: 3
 *                     hall:
 *                       type: number
 *                       example: 4
 */
const handlePOSTCallRecord = async (req, res) => {
  /*
    #swagger.auto = false
    #swagger.tags = ['Call Records']
    #swagger.description = 'Endpoint to insert a call record'
    #swagger.parameters['CallRecordObject'] = {
        in: 'body',
        description: 'Contains the donor id of callee',
        schema: {
            donorId: 'fwetiubg43t6847gsdffwekt',
        }
    }
    #swagger.security = [{
        "api_key": []
    }]

    #swagger.responses[200] = {
        schema: {
            status: 'OK',
            message: 'Call record insertion successful',
            statusCode: 201,
            callRecord: {
                date: 1625755390858,
                _id: '60e70f42055a83d88',
                "callerId": {
                    _id: "5e901d56e0177ced73",
                    name: "Mir Mahathir Mohammad",
                    designation: 3,
                    hall: 4
                },
                calleeId: "5e68514546b0e",
                expireAt: "2021-11-15T11:23:54.231Z",
            }
        },
        description: 'Call record insertion successful'
    }

     */

  const donor = res.locals.middlewareResponse.targetDonor
  const user = res.locals.middlewareResponse.donor
  const callRecordInsertionResult = await callRecordInterface.insertOne(user._id, donor._id)

  await logInterface.addLog(user._id, 'POST CALLRECORDS', { callee: donor.name })

  return res.respond(new CreatedResponse201('Call record insertion successful', {
    callRecord: callRecordInsertionResult.data
  }))
}

/**
 * @openapi
 * /callrecords:
 *   delete:
 *     tags:
 *       - Call Records
 *     summary: Delete call record route
 *     security:
 *       - ApiKeyAuth: []
 *     description: Handles the deletion of one call history for a particular donor
 *     parameters:
 *       - in: query
 *         name: donorId
 *         description: Id of donor for call history
 *         required: true
 *         schema:
 *           type: string
 *           example: 5e901d56effc590017712345
 *       - in: query
 *         name: callRecordId
 *         description: Id of call record that is going to be deleted
 *         required: true
 *         schema:
 *           type: string
 *           example: 5e901d56effc590017712345
 *     responses:
 *       200:
 *         description: Success message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Public contact deleted successfully
 *       404:
 *         description: This error occurs if the call record does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ERROR
 *                 statusCode:
 *                   type: number
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: Call record not found
 *       409:
 *         description: This error occurs if the call record does not associate with the target donor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ERROR
 *                 statusCode:
 *                   type: number
 *                   example: 409
 *                 message:
 *                   type: string
 *                   example: Target donor does not have the callee of call record
 */
const handleDELETECallRecord = async (req, res) => {
  /*
    #swagger.auto = false
    #swagger.tags = ['Call Records']
    #swagger.description = 'handles the deletion of one call history for a particular donor.'
    #swagger.parameters['donorId'] = {
        description: 'Id of donor for call history',
        type: 'string',
        name: 'donorId'
    }
    #swagger.parameters['callRecordId'] = {
        description: 'Id of call record that is going to be deleted ',
        type: 'string',
        name: 'callRecordId'
    }
    #swagger.security = [{
        "api_key": []
    }]

    #swagger.responses[200] = {
        schema: {
            status: 'OK',
            statusCode: 200,
            message: 'Call record deletion successful',
            deletedCallRecord: {
                date: 1632553859992,
                _id: "614ecb83a66ce337f8b484e8",
                callerId: "5e901d56effc590017712345",
                calleeId: "5e901d56effc590017712345",
            }
        },
        description: 'Call record deletion successful'
    }

    #swagger.responses[404] = {
        schema: {
            status: 'ERROR',
            statusCode: 404,
            message: 'Call record not found'
        },
        description: 'This error occurs if the call record does not exist'
    }

    #swagger.responses[409] = {
        schema: {
            status: 'ERROR',
            statusCode: 409,
            message: 'Target donor does not have the callee of call record'
        },
        description: 'This error occurs if the call record does not associate with the target donor'
    }

     */
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
