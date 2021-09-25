const dotenv = require('dotenv')
dotenv.config( { path : './config/config.env'} )
const {parseBodyToJSON} = require('./response/bodyParser')
let express = require('express');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./doc/swagger_output.json');
let apiRouter = require('./routes/donors');
let usersRouter = require('./routes/users');
let donationsRouter = require('./routes/donations');
let guestRouter = require('./routes/guest')
let callRecordRouter = require('./routes/callRecords');
let publicContactsRouter = require('./routes/publicContacts');
let logRouter = require('./routes/logs');
require('./db/mongoose');
const {userAgentHandler} = require('./middlewares/userAgent');
const {sendResponse,sendError,routeNotFoundHandler,internalServerErrorHandler,uncaughtExceptionHandler,unhandledRejectionHandler} = require('./response')

let app = express();
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/doc/', swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use(logger('dev'));
app.use(userAgentHandler);
app.response.sendResponse = sendResponse;
app.response.sendError = sendError;
app.use(parseBodyToJSON);

app.use('/users', usersRouter);
app.use('/donations',donationsRouter);
app.use('/guest', guestRouter);
app.use('/callrecords', callRecordRouter);
app.use('/publicContacts',publicContactsRouter);
app.use('/', apiRouter);
app.use('/',logRouter);
app.use('*',routeNotFoundHandler);
app.use(internalServerErrorHandler);

process.on('unhandledRejection', unhandledRejectionHandler);
process.on('uncaughtException', uncaughtExceptionHandler);

module.exports = app;
