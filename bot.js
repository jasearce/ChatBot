// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// The accessor names for the conversation flow, data and user profile state property accessors.
const CONVERSATION_FLOW_PROPERTY = 'CONVERSATION_FLOW_PROPERTY';
const CONVERSATION_DATA_PROPERTY = 'conversationData';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

const { ActivityHandler, MessageFactory, ActivityTypes } = require('botbuilder');

class EchoBot extends ActivityHandler {
    constructor(conversationState, userState) {
        super();

        // Create the state property accessors for the conversation data and user profile.
        this.conversationDataAccessor = conversationState.createProperty(CONVERSATION_DATA_PROPERTY);
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

        // The state management objects for the conversation and user state.
        this.conversationState = conversationState;
        this.userState = userState;

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (turnContext, next) => {
            // Get the state properties from the turn context.
            const userProfile = await this.userProfileAccessor.get(turnContext, {});
            const conversationData = await this.conversationDataAccessor.get(
                turnContext, { promptedForUserName: false });

            if (!userProfile.name) {
                // First time around this is undefined, so we will prompt user for name.
                if (conversationData.promptedForUserName) {
                    // Set the name to what the user provided
                    userProfile.name = turnContext.activity.text;

                    // Acknowledge that we got their name.
                    await turnContext.sendActivity(`Thanks ${ userProfile.name }. To see conversation data, type anything.`);

                    // Reset the flag to allow the bot to go though the cycle again.
                    conversationData.promptedForUserName = false;
                } else {
                    // Prompt the user for their name.
                    await turnContext.sendActivity('What is your name?');

                    // Set the flag to true, so we don't prompt in the next turn.
                    conversationData.promptedForUserName = true;
                }
            } else {
                // Add message details to the conversation data.
                conversationData.timestamp = turnContext.activity.timestamp.toLocaleString();
                conversationData.channelId = turnContext.activity.channelId;

                // Display state data.
                await turnContext.sendActivity(`${ userProfile.name } sent: ${ turnContext.activity.text }`);
                console.log(`${ userProfile.name } sent: ${ turnContext.activity.text }`);
                console.log(`Message received at: ${ conversationData.timestamp }`);
                console.log(`Message received from: ${ conversationData.channelId }`);
                // await turnContext.sendActivity(`Message received at: ${ conversationData.timestamp }`);
                // await turnContext.sendActivity(`Message received from: ${ conversationData.channelId }`);
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Welcome to ASSR G4 Bot. Type anything to get started.!';
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                    console.log(`${ welcomeText }`);
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    /**
     *  Override the ActivityHandler.run() method to save state changes after the bot logic completes. 
    */
    async run(context) {
        await super.run(context);

        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }
}

module.exports.EchoBot = EchoBot;
