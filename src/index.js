require('dotenv').config();
import http from 'http';
import express from 'express';
import { createMessageAdapter } from '@slack/interactive-messages';
import { WebClient } from '@slack/client';
import bodyParser from 'body-parser';
import INTERACTIVE_MENUS, { MATCH_DURATION_TEXT, BOOKING_DURATION_OPTIONS } from './modules/Constants';
import './modules/Date';
import * as CalendarApp from './modules/CalendarApp';
import axios from 'axios';
import CalendarAPI from 'node-google-calendar';
import _ from 'lodash';
import Chrono from 'chrono-node';
import * as ReplyBuilder from './modules/ReplyBuilder';
import ROOM_CONFIG from '../config/CalendarConfig';
const CONFIG = require('../config/Settings')

// Set up Slack tokens and Slack-Node-Api
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const slackBotAccessToken = process.env.BOT_ACCESS_TOKEN;

if (!slackSigningSecret || !slackBotAccessToken) {
  throw new Error('A Slack signing secret and access token are required to run this app.');
}

const slackInteractions = createMessageAdapter(slackSigningSecret);
const web = new WebClient(slackBotAccessToken);
const app = express();

// Set up server using express 
app.use('/slack/actions', slackInteractions.expressMiddleware());
app.post('/slack/commands', bodyParser.urlencoded({ extended: false }), slackSlashCommand);

const port = process.env.PORT || 0;
http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`);
});

// Initialize global variables
let anyBookingList = {};
let bookerList = {};
const roomlist = ROOM_CONFIG.roomsListing;
const calendarIdList = ROOM_CONFIG.roomIdToCalendarId;

// Initialize CalendarApp
(function initCalendar() {
	console.log('init Calendar');
  let CalAPI = new CalendarAPI(CONFIG);
	CalendarApp.init(CalAPI, calendarIdList, roomlist, BOOKING_DURATION_OPTIONS);
}());

// Listen to slash commands in slack; send response back
function slackSlashCommand(request, respond, next) {
    if (request.body.command === '/book') {
      const type = request.body.text.split(' ')[0];
      if (type === 'room') {
        console.log('(/book room) entered')

        const { user_name } = request.body
        const roomMenu = INTERACTIVE_MENUS.ROOM_OPTIONS;

        bookerList[user_name] = {}; 
        delete anyBookingList[user_name]; // Prevent booking conflict when trying to complete booking

        respond.json(roomMenu);
        
      } else if (type === 'any') {
        console.log('(/book any) entered')

        const { trigger_id, user_name } = request.body
        const dialogMenu = INTERACTIVE_MENUS.PROMPT_ANY_DIALOG_MENU;

        anyBookingList[user_name] = {};
        delete bookerList[user_name]; // Prevent booking conflict when trying to complete booking

        respond.send('')

        web.dialog.open({ trigger_id: trigger_id, dialog: dialogMenu })
          .then((res) => {
            console.log(JSON.stringify(res.data));
          })
          .catch((error) => {
             console.log("Posting promptAny dialog error:", error)
          })

      } else if (type === 'view') {
        console.log('(/book view) entered')
        respond.send('*Check out this link for the overall room booking schedules*: https://sweezharbot.dcube.cf');
      } else if (type === 'delete') {
        console.log('(/book delete) entered')

        testFunction('today 1pm to 3pm');

        respond.send('`delete` is currently work in progress.');
      } else {
        respond.send('Use this command followed by `room`, `any`, `view`, or `delete`.');
      }
    } else {
      next();
    }
  }


// Returns the interactive element once room is selected
slackInteractions.action('room_selection', (payload, respond) => {
  console.log(`The user ${payload.user.name} in team ${payload.team.domain} selected a room`)

  const userName = payload.user.name;
  const selectedRoomId = payload.actions[0].selected_options[0].value;
  const responseUrl = payload.response_url;
  const selectedRoomName = roomlist[selectedRoomId].name;
  bookerList[userName].username = payload.user.name;
  bookerList[userName].roomId = selectedRoomId;

  const updatedMessage = {
    "response_type": "ephemeral",
    "replace_original": "true",
    "text": `:white_check_mark: You've selected the room: *${selectedRoomName}*`
  }

  let nextMenu = INTERACTIVE_MENUS.DATE_OPTIONS;
  nextMenu.replace_original = false;

  axios.post(responseUrl, nextMenu).then(response => { // Post the next menu in Slack using the response url
    console.log("Posting datepicker menu:" + JSON.stringify(response.data)); 
    respond;
   })
   .catch((error) => {
     console.log("Posting date_options error:", error)
    })  

  return updatedMessage;  // Synchronously returns a updated message in response
})


// Return the interactive element once date is selected
// To-do: 
// 1. disable past dates
// 2. start from today's date
// 3. Check if date is today -> then start from the next hour
slackInteractions.action({ actionId: 'date_selection' }, (payload, respond) => {
  console.log(`The user ${payload.user.name} in team ${payload.team.domain} selected a date`)

  const userName = payload.user.name;
  const selectedDate = payload.actions[0].selected_date
  const responseUrl = payload.response_url
  bookerList[userName].date = selectedDate
  
  const updatedMessage = {
    "response_type": "ephemeral",
    "replace_original": "true",
    "text": `:white_check_mark: You've selected the date: *${selectedDate}*`
  }

  CalendarApp.listEmptySlotsInDay(bookerList[userName].date, bookerList[userName].roomId)
    .then((jsonArr) => {
      console.log("listEmptySlotsInDay: Success")
      let temp = populateTimeslots(jsonArr);
      console.log("Filtered timeslots:", temp.attachments[0].actions[0].options)
      return axios.post(responseUrl, temp)
    })
    .then((response) => {
      console.log("Posting available timeslots: " + JSON.stringify(response.data))
    })
    .catch((error) => {
        console.log("Posting timeslot options error:", error)
       }
    )

  respond(updatedMessage); 
})

// Timeslot selection 
slackInteractions.action('timeslot_selection', (payload, respond) => {
  console.log(`The user ${payload.user.name} in team ${payload.team.domain} selected a timeslot`)

  const userName = payload.user.name;
  const selectedTimeslot = payload.actions[0].selected_options[0].value
  const responseUrl = payload.response_url

  let nextMenu = INTERACTIVE_MENUS.DURATION_MENU;
  nextMenu.replace_original = false;
  bookerList[userName].timeslot = selectedTimeslot;

  const updatedMessage = {
    "response_type": "ephemeral",
    "replace_original": "true",
    "text": `:white_check_mark: You've selected the timeslot: *${selectedTimeslot}*`
  }

  axios.post(responseUrl, nextMenu).then(response => {
    console.log("Posting duration menu: " + JSON.stringify(response.data));
    respond;
  }).catch((error) => {
    console.log("Posting duration options error:", error)
   })

   return updatedMessage;
})

// Duration selection
slackInteractions.action('duration_selection', (payload, respond) => {
  console.log(`The user ${payload.user.name} in team ${payload.team.domain} selected a duration`)
  
  const userName = payload.user.name;
  const selectedDuration = payload.actions[0].selected_options[0].value

  bookerList[userName].duration = MATCH_DURATION_TEXT[selectedDuration].duration;

  const updatedMessage = {
    "response_type": "ephemeral",
    "replace_original": "true",
    "text": `:white_check_mark: You've selected the duration of: *${MATCH_DURATION_TEXT[selectedDuration].text}*`
  }

  const triggerId = payload.trigger_id;

  const dialogMenu = INTERACTIVE_MENUS.DESCRIPTION_DIALOG_MENU;
    // Open a dialog for submitting description 
  web.dialog.open({ trigger_id: triggerId, dialog: dialogMenu })
    .then((res) => {
      console.log(JSON.stringify(res.data));
    })
    .catch((error) => {
      console.log("Posting description dialog error:", error)
      })

  return updatedMessage;
})

// Dialog entry for description of the event
// TO-DO: notify_on_cancel
slackInteractions.action('description_dialog', (payload, respond) => {
  console.log(`The user ${payload.user.name} in team ${payload.team.domain} entered a description`)

  const userName = payload.user.name;
  const description = payload.submission.description;
  const responseUrl = payload.response_url;
  const nextMenu = INTERACTIVE_MENUS.CONFIRMATION_BUTTON;
  console.log(description);

  const returnMessage = {
    "response_type": "ephemeral",
    "text": `:white_check_mark: Booking description: *${description}*`
  }

  bookerList[userName].summary = description;

  respond(returnMessage)
    .then((response) => {
      console.log(JSON.stringify(response.data))
      return axios.post(responseUrl, nextMenu)
    })
    .then((res) => console.log('description_dialog -> res.data:', res.data))
    .catch((err) => console.log(err))

})


// anyRoom booking dialog interaction 
slackInteractions.action('prompt_any_dialog', (payload, respond) => {
  console.log(`The user ${payload.user.name} in team ${payload.team.domain} submitted an anyRoom booking`)

  const userName = payload.user.name;
  const bookingMsg = payload.submission.booking;
  const summary = payload.submission.summary;
  const responseUrl = payload.response_url;

  respond({ text: "You're using the `Any` feature" })

  anyRoom(userName, responseUrl, bookingMsg, summary, anyBookingList);
})

// anyRoom booking room selection
slackInteractions.action('any_room_selection', (payload, respond) => {
  console.log(`The user ${payload.user.name} in team ${payload.team.domain} selected a room for anyRoom booking`)
  console.log(payload)

  let userName = payload.user.name;
  let responseUrl = payload.response_url;
  let roomValue = payload.actions[0].selected_options[0].value;

  anyBookingList[userName].roomId = roomValue
  
  console.log('anyBookingList[userName]', anyBookingList[userName]);

  const nextMenu = INTERACTIVE_MENUS.CONFIRMATION_BUTTON;

  const finalDetails = ReplyBuilder.generateAnyRoomDetailText((anyBookingList[userName]));

  console.log(finalDetails)

  respond(finalDetails)
    .then((response) => {
      return axios.post(responseUrl, nextMenu)
    })
    .then((res) => console.log('any_room', res.data))
    .catch((err) => console.log(err))

})
 

// Confirm booking button clicked
// TO-DO: enumerate through each key of bookingDetails to check if any is null -> invalid
slackInteractions.action({ actionId: "confirmation" }, (payload, respond) => {
  console.log(`The user ${payload.user.name} in team ${payload.team.domain} clicked on the submit button`)

  const userName = payload.user.name
  const responseUrl = payload.response_url;


  try {
    if (bookerList[userName] !== undefined && anyBookingList[userName] === undefined) {
      console.log("completeBooking from bookerList: executing")
      console.log("bookerList[userName]", bookerList[userName])

      let bookingDetail = bookerList[userName];
      delete bookerList[userName];
      completeBooking(bookingDetail, responseUrl)

    } else if (anyBookingList[userName] !== undefined && bookerList[userName] === undefined) {
      console.log("completeBooking from bookerList: executing")
      console.log('anyBookingList[userName]', anyBookingList[userName]);

      let bookingDetail = anyBookingList[userName];
      delete anyBookingList[userName];
      completeBooking(bookingDetail, responseUrl)

    } else {

      throw "anyBookingList[userNmae] or bookerList[userName] not in correct condition";

    }
  } 
  catch (err) {
    console.log(err);
    throw err;
  }

  respond({ text: '*Your booking is been processed...*', replace_original: true });
})

// Cancel booking button clicked
slackInteractions.action({ actionId: "cancellation" }, (payload, respond) => {
  console.log(`The user ${payload.user.name} in team ${payload.team.domain} clicked on the cancel button`)
  
  const userName = payload.user.name;
  delete bookerList[userName];
  delete anyBookingList[userName];

  respond({ text: '*Your booking has been cancelled. To restart, type /book again.*', replace_original: true });

})


// Helper functions 
function populateTimeslots(jsonArr) {
  let menu = INTERACTIVE_MENUS.TIMESLOT_OPTIONS;
  let temp = _.map(jsonArr, (key, value) => {
    return {
      "text": key,
      "value": value
    }
  })
  menu.attachments[0].actions[0].options = temp;
  menu.replace_original = false;
  return menu;
}

function sendErrorMessage(responseUrl, message) {
  axios.post(responseUrl, msg)
    .then((res) => {
      console.log("sendErrorMessage: ", message, JSON.stringify(res.data))
    })
    .catch((err) => {
      console.log(err)
    })
}


// Calendar functions
function completeBooking(bookingDetail, responseUrl) {
	if (!bookingDetail || typeof bookingDetail !== "object" || Object.keys(bookingDetail).length === 0) {
    // This is either a null, undefined, not an object, or an object with no keys
		return;
	}

  let booking = bookingDetail;

  console.log(`completeBooking - booking: ${JSON.stringify(booking)}`)
  console.log(new Date().setDateWithSimpleFormat(booking.date))

	insertBookingIntoCalendar(responseUrl, booking.summary, booking.roomId,
    new Date().setDateWithSimpleFormat(booking.date), booking.timeslot, booking.duration, booking.username);

}

// TO-DO: description from text interactive menu
function insertBookingIntoCalendar(responseUrl, description, roomId, startDate, timeSlot, duration, userName) {
	let bookingSummary = `${description} by @${userName}`;
  let startTime = startDate.getISO8601DateWithDefinedTimeString(timeSlot);
  
	for (let i = 0; i < duration; i++) {
		startDate.addMinutes(30);
	}
	let endTime = startDate.getISO8601TimeStamp();


	CalendarApp.queueForInsert(bookingSummary, startTime, endTime, roomId, 'confirmed', 'booked via slack', userName)
		.then((json) => {
			let startDateTime = new Date(json.start);
      let endDateTime = new Date(json.end);
      
      console.log(`insertBookingIntoCalendar: Success, room: ${roomlist[roomId].name}, userName: ${userName}, startDateTime: ${startDateTime}, endDateTime: ${endDateTime}`)
      
      let msg = { text: `:tada: *Your booking is successful* :tada:`, replace_original: true }
      axios.post(responseUrl, msg)
        .catch((err) => console.log(err))

		}).catch((err) => {
      let msg = { text: `:crying_cat_face: *An error has occurred. To retry, use /book again.*`, replace_original: true }
      axios.post(responseUrl, msg)
        .catch((err) => console.log(err))

			console.log('Error insertBookingIntoCalendar: ' + JSON.stringify(err));
      throw err;
    });
    
}

function anyRoom(username, responseUrl, message, eventSummary, anyBookList) {
	let results = new Chrono.parse(message);
	if (!results.length || results[0].end === undefined || results[0].start === undefined) {
		// TO-DO: Send some error message back to Slack 
		return;
	}
	results[0].start.assign('timezoneOffset', 480);
	results[0].end.assign('timezoneOffset', 480);

	let startTime = results[0].start.date();
	let endTime = results[0].end.date();

	startTime = startTime.rounddownToNearestHalfHour();
	endTime = endTime.roundupToNearestHalfHour();

	if (startTime <= new Date() || endTime <= startTime) {
		// TO-DO: Send some error message back to slack for wrongDateTime
		return;
	}

	let maxBookingDurationSlotsAllowed = 8;
	let numOfSlotsBooked = Math.round(startTime.getMinuteDiff(endTime) / 30);
	if (numOfSlotsBooked > maxBookingDurationSlotsAllowed) {
		// TO-DO: Send error message for duration > 4 hours
		return;
	}

  // TO-DO: Show some message checking room IN PROGRESS

  // Populate up booking details
  anyBookList[username].username = username;
  anyBookList[username].summary = eventSummary;
  anyBookList[username].timeslot = startTime.getFormattedTime();
  anyBookList[username].date = startTime.getSimpleDateDash();
  anyBookList[username].duration = numOfSlotsBooked;

  console.log('anyBookList[username]', anyBookList[username]);

	// look up lowest-priority cal for available slot
  let rooms = Object.keys(ROOM_CONFIG.roomsListing).filter(x => x !== 'primary');
  
  // Pass control to the next function for subsequent prompts
	checkRoomFreeAtTimeslot(username, responseUrl, startTime, endTime, rooms, anyBookList);
}


async function checkRoomFreeAtTimeslot(username, responseUrl, startDate, endDate, rooms, anyBookList) {
	let responses = await Promise.all(rooms.map(room => CalendarApp.checkTimeslotFree(startDate, endDate, room)));

	const freeRooms = responses.reduce((result, isRoomFree, index) => {
		if (isRoomFree) {
			const roomCode = rooms[index];
			result.push({ name: roomlist[roomCode].name, code: roomCode });
		}
    return result;
	}, []);

	if (!freeRooms.length) {
		// TO-DO: Send error msg to slack -> Reply no free room
		return;
  }
  
  console.log('freeRooms', freeRooms);
  
  let freeRoomMenu = ReplyBuilder.generateFreeRoomMenuForAny((freeRooms));

  console.log(freeRoomMenu);

  axios.post(responseUrl, freeRoomMenu);

}
