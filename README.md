# Room Booking Bot

A Bot for booking of meeting rooms in internal Slack Workspace.

## Getting Started
Grab dependencies
```javascript
npm i
```

Run the bot
```javascript
npm start
```

## Configurations

### Create a Slack app

1. Log into your workspae and create a Slack App [here](https://api.slack.com/apps) 
2. Add a Slash command (see below)
3. Set Up Interactive Components (see below)
4. Navigate to **Bot Users** to create a bot user
5. Navigate to the **OAuth & Permissions** page and make sure the following scopes are pre-selected:
    * `commands`
    * `bot`
5. Install the app to your workspace

#### Slash Command Setting
1. Click on Slash Commands in app setting
2. Click the 'Create New Command' button with the following details:
    * Command: `/book`
    * Request URL: Your server URL + `/command`
    * Short description: `A bot for booking of meeting rooms`
    * Usage hint: `Book a room`

#### Interactive Component Setting
1. Click on Interactive Components in setting
2. Put your server URL + `/slack/actions` in the Request URL field
    * e.g. if you used ngrock, it would be something similar to `https://9e123bs8.ngrok.io/slack/actions`

### Set Up Credentials
1. Copy [.sample-env](.sample-env) to `.env` and replace with your own env variables
    * The variables can be found either in the **OAuth & Permissions** or the **Basic Information** page
 2. Create a folder `config` in the root directory
	 * Copy [sample-CalendarConfig.js](sample-CalendarConfig.js) to `config/CalendarConfig.js` and [sample-Settings.js](sample-Settings.js) to `config/Settings.js`; then replace with your own variables
	 

### Set Up Google Calendar 
1. [Setup & grant permission to test google calendar, service account and get auth key](https://github.com/yuhong90/node-google-calendar/wiki#setup-service-accounts)
2.  Download `google-api-key.json` once you have your service account set up; place it in `config` folder


## Contributing

* Step 1: Branch off from ```master``` and work on your feature or bugfix.
* Step 2: Update the changelog.
* Step 3: Create a pull request when you're done.

References:
* [Git branching strategy](http://nvie.com/posts/a-successful-git-branching-model/)
* [Keeping a changelog](http://keepachangelog.com/)
* [Semver](http://semver.org/)

## Todo
* [Feature] 
* [Improvement]

## Credits
This Slack Bot is based off the original telegram bot [butler-bot](https://github.com/GovTechSG/butler-bot/).
* Set up instructions for Slack App adapted from: [template-slash-command-and-dialogs](https://github.com/slackapi/template-slash-command-and-dialogs/blob/master/README.md)