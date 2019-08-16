// Sample CalendarConfig.js

const ROOM_CONFIG = {
  roomsListing: { // used for insert, reading & displaying event room info
    'ab': { name: 'Room 1 (4 pax)', id: 'ab' },
    'cd': { name: 'Room 2 [Level 7] (4 pax)', id: 'cd' },
    'ef': { name: 'Room 3 [Level 7] (4 pax)', id: 'ef' },
    'gh': { name: 'Room 4 [Level 7] (6 pax)', id: 'gh' },
  },
  roomIdToCalendarId: {
    "ab": "calendar1@group.calendar.google.com",
    "cd": "calendar2@group.calendar.google.com",
    "ef": "calendar3@group.calendar.google.com",
    "gh": "calendar4@group.calendar.google.com"
  }

};

export { ROOM_CONFIG as default };
