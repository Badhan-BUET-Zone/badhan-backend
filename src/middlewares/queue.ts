// @ts-nocheck
/* tslint:disable */
const queue = require('express-queue')

const donorInsertionQueue = queue({ activeLimit: 1, queuedLimit: -1 })

export default {
  donorInsertionQueue
}