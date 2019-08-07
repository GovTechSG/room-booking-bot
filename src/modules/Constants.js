import _ from 'lodash';
import ROOM_CONFIG from '../../config/CalendarConfig';

const BOOKING_DURATION_LIST = [ // for displaying selected duration options during booking
	{ 'duration': '30 mins', 'id': '0.5' },
	{ 'duration': '1 hour', 'id': '1' },
	{ 'duration': '1.5 hours', 'id': '1.5' },
	{ 'duration': '2 hours', 'id': '2' },
	{ 'duration': '2.5 hours', 'id': '2.5' },
	{ 'duration': '3 hours', 'id': '3' },
	{ 'duration': '3.5 hours', 'id': '3.5' },
  { 'duration': '4 hours', 'id': '4' }
];

const BOOKING_DURATION_OPTIONS = { // for CalendarApp Api
	1: '30 mins',
	2: '1 hour',
	3: '1.5 hours',
	4: '2 hours',
	5: '2.5 hours',
	6: '3 hours',
	7: '3.5 hours',
	8: '4 hours'
};

const MATCH_DURATION_TEXT = {
  '0.5': { text: '30 mins', duration: 1 },
  '1': { text: '1 hour', duration: 2 },
  '1.5': { text: '1.5 hours', duration: 3 },
  '2': { text: '2 hours', duration: 4 },
  '2.5': { text: '2.5 hours', duration: 5 },
  '3': { text: '3 hours', duration: 6 },
  '3.5': { text: '3.5 hours', duration: 7 },
  '4': { text: '4 hours', duration: 8 }
}

const INTERACTIVE_MENUS = {

  ROOM_OPTIONS: {
    "text": "Which room would you like to book?",
    "response_type": "ephemeral",
    "attachments": [
        {
            "text": "Choose a room to book",
            "fallback": "You are unable to book a room",
            "callback_id": "book_room",
            "color": "#3AA3E3",
            "attachment_type": "default",
            "callback_id": "room_selection",
            "actions": [
              {
                "name": "rooms_list",
                "text": "Pick a room...",
                "type": "select",
                "options":
                  _.map(ROOM_CONFIG.roomsListing, function (item) {
                    return {
                      "text": item.name,
                      "value": item.id
                    }
                  })
              }
            ]
        }
    ]
  },

  DATE_OPTIONS : {
    "channel": "ephemeral",
    "blocks":[ 
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Please select a *date*."
        }
      },
      {
        "type": "actions",
        "block_id": "date_selection",
        "elements": [
          {
            "type": "datepicker",
            "action_id": "date_selection",
            "initial_date": "2019-07-24",
            "placeholder": {
              "type": "plain_text",
              "text": "Select a date"
            }
          }
        ]
      }
      ]
  },

  TIMESLOT_OPTIONS: {
    "text": "Which timeslot would you like to book?",
    "response_type": "ephemeral",
    "attachments": [
        {
            "text": "Choose a timeslot to book",
            "fallback": "You are unable to book the timeslot",
            "callback_id": "book_timeslot",
            "color": "#3AA3E3",
            "attachment_type": "default",
            "callback_id": "timeslot_selection",
            "actions": [
              {
                "name": "timeslots_list",
                "text": "Pick a timeslot...",
                "type": "select",
                "options":''
              }
            ]
        }
    ]
  },

  DURATION_MENU: {
    "text": "How long is your booking?",
    "response_type": "ephemeral",
    "attachments": [
        {
            "text": "Choose a duration:",
            "fallback": "You are unable to book this duration",
            "callback_id": "book_duration",
            "color": "#3AA3E3",
            "attachment_type": "default",
            "callback_id": "duration_selection",
            "actions": [
              {
                "name": "durations_list",
                "text": "Pick a duration...",
                "type": "select",
                "options":
                _.map(BOOKING_DURATION_LIST, function (item) {
                  return {
                    "text": item.duration,
                    "value": item.id
                  }
                })
              }
            ]
        }
    ]
  },

  DESCRIPTION_DIALOG_MENU: {
    "title": 'Describe your event',
    "callback_id": "description_dialog",
    "submit_label": 'Submit',
    "notify_on_cancel": 'true',
    "elements": [
      {
        "label": 'Description',
        "type": 'text',
        "name": 'description',
      },
    ]
  },

  PROMPT_ANY_DIALOG_MENU: {
    "title": 'Book Any Room',
    "callback_id": "prompt_any_dialog",
    "submit_label": 'Submit',
    "notify_on_cancel": 'true',
    "elements": [
      {
        "label": 'Your Booking',
        "type": 'text',
        "name": 'booking',
        "hint": "e.g. today 3pm to 4pm OR tomorrow 1pm to 3pm OR this friday 9am to 10am"
      },
      {
        "label": 'Description',
        "type": 'text',
        "name": 'summary',
        "hint": "Please type a brief description for your booking"
      },
    ]
  },

  CONFIRMATION_BUTTON: {
    "channel": "ephemeral",
    "replace_original": false, 
    "blocks":[
        {
          "type": "actions",
          "block_id": "confirmation_selection",
          "elements": [
          {
            "type": "button",
            "action_id": "confirmation",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Confirm"
            },
            "style": "primary",
            "value": "confirmation123"
          },
          {
            "type": "button",
            "action_id": "cancellation",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Cancel"
            },
            "style": "danger",
            "value": "cancellation"
          }
        ]
      }
    ]
  }
}

export { INTERACTIVE_MENUS as default, BOOKING_DURATION_OPTIONS, BOOKING_DURATION_LIST, MATCH_DURATION_TEXT };
 
