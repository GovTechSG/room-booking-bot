
import _ from 'lodash';
import ROOM_CONFIG from '../../config/CalendarConfig';
import { BOOKING_DURATION_OPTIONS } from './Constants';


export function generateAnyRoomDetailText(details) {
  let bookingDetailMsg = {
    "channel": "ephemeral",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Your `any` booking details: *"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `_Description_: *${details.summary}*`
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `_Room_: *${ROOM_CONFIG.roomsListing[details.roomId].name}*`
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `_Date_: *${details.date}*`
        }
      }, {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `_Time_: *${details.timeslot}*`
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `_Duration_: *${BOOKING_DURATION_OPTIONS[details.duration]}*`
        }
      }
    ]
  }
  return bookingDetailMsg;
}


export function generateFreeRoomMenuForAny(freeRoomList) {
  let anyRoomMenu = {
    "text": "Which room would you like to book?",
    "response_type": "ephemeral",
    "replace_original": "true",
    "attachments": [
        {
            "text": "These are the available rooms",
            "fallback": "You are unable to book a room",
            "color": "#3AA3E3",
            "attachment_type": "default",
            "callback_id": "any_room_selection",
            "actions": [
              {
                "name": "rooms_list",
                "text": "Pick a room...",
                "type": "select",
                "options": _.map(freeRoomList, function (item) {
                  return {
                    "text": item.name,
                    "value": item.code
                  }
                })
              }
            ]
        }
    ]
  }
  return anyRoomMenu;
}