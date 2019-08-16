// Sample Settings.js

const SERVICE_ACCT_ID = "sample-service-acct@test-calendar.iam.gserviceaccount.com"; 
const TIMEZONE = 'UTC+08:00';
const CALENDAR_ID = {};
const key = require('./google-api-key.json').private_key; // download this file from your service acct and put in the config directory

module.exports.serviceAcctId = SERVICE_ACCT_ID;
module.exports.timezone = TIMEZONE;
module.exports.calendarId = CALENDAR_ID;
module.exports.key = key;
