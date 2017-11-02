/**

 **/

'use strict';

//const Alexa = require('alexa-sdk');  //dont use this when zipping the file to bring in pg, it seems to cause issues

var aws = require('aws-sdk');
var pg = require("pg");
const APP_ID = 'amzn1.ask.skill.5b29f753-30dd-4d5f-865b-f1763a86524b';  // TODO replace with your app ID (OPTIONAL).
var CARD_TITLE = "Haas Helper";

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

    if (event.session.application.applicationId !== APP_ID) {
        context.fail("Invalid Application ID");
     }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    getWelcomeResponse(callback);
}


/**
 * Called when the user specifies an intent for this skill. 
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;
        
    if ("pullPictureForName" === intentName) {
        pullPictureForName(intent, session, callback); 
        
    } else if ("showRandomHaasie" === intentName) {
        showRandomHaasie(intent, session, callback); 
        
    } else if ("AMAZON.StartOverIntent" === intentName) {
        getWelcomeResponse(callback);
    } else if ("AMAZON.RepeatIntent" === intentName) {
        handleRepeatRequest(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        handleGetHelpRequest(intent, session, callback);
    } else if ("AMAZON.StopIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else if ("AMAZON.CancelIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else {
        handleInvalidRequest(intent, session, callback) 
        throw "Invalid intent";
    }
}

//--------------logic for functions specific to this skill------------


function pullPictureForName(intent, session, callback){
    //read the input
    var firstname = intent.slots.firstName.value,
    lastname = intent.slots.lastName.value;
    
    var sessionAttributes = {},
    speechOutput = "Sure, here is " + firstname + " " + lastname,
    repromptText = "The name you requested was " + firstname + " " + lastname + ". You can ask about someone else, or say quit.",
	shouldEndSession = false,
	detail, smallImageURL, largeImageURL;
	//var queryResult = 'initialValue'; //create a var to store queryResult

	// connect to our database 
	var connectionString = "postgres://username:password@rds-postgresql-searchtest.clwx4hc000yh.us-east-1.rds.amazonaws.com:5432/paidSearchDB";
    var client = new pg.Client(connectionString);
    client.connect(function (err) {
        if (err) throw err;
    
        // execute a query on our database
		client.query("SELECT * FROM haas_helper_data WHERE firstname = '" + firstname + "'", function (err, result) {	
            if (err) throw err;
            detail = "Notes about " + result.rows[0].firstname + ": " + result.rows[0].notes,  //"Notes: Some additional notes go here",
            CARD_TITLE = result.rows[0].firstname + " " + result.rows[0].lastname,
            smallImageURL = result.rows[0].url,  //'https://s3.us-east-2.amazonaws.com/imagehostbucket/Haas+Helper/SK+720+x+480.png',
            largeImageURL = result.rows[0].url;  //'https://s3.us-east-2.amazonaws.com/imagehostbucket/Haas+Helper/SK+12x8.png';
            
            // just print the result to the console 
            // console.log(result.rows[0]); // outputs: { clicks: 12000 }
            // console.log(result.rows[0].notes);  //console.log(result.rows[0]['clicks']);  //console.log(result.rows[0].clicks);
            // console.log(result.rows[0].imageurl);
            // queryResult = result.rows[0].notes;
            //speechOutput = "Successfully pulled the data. Your output was " + queryResult;

            client.end(function (err) {
                if (err) throw err;
            });

            //if I put this outside this function, it returns initialValue of queryResult. Seems to be because of asynchronous running - callback is completing before queryResult gets update from the table pull. But if I put it nested in here, it seems to work.
            callback(sessionAttributes,
                buildSpeechletResponsewithImage(CARD_TITLE, detail, smallImageURL, largeImageURL, speechOutput, repromptText, shouldEndSession));

        });
    });
    
    // callback(sessionAttributes,
    //     buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function showRandomHaasie(intent, session, callback) {
    
}

// function handleNameRandomGameRequest(intent, session, callback) {
//     var sessionAttributes = {},
    
//     //Send the user's request type and slot input to dynamoDB for analytics
//     currUserSlotInput = "No slot for this intent",  //Update this to the slot name for this handler function
//     requestType = "Name Random Game Request",  //Update this to the Request Type of this handler function
//     currUserID = session.user.userId, currSessionID = session.sessionId;
    
//     var index = games.length,  //all the games defined in json //6 in this case
//         rand = Math.floor(Math.random() * index),
//         chosenGame = games[rand],
//         chosenGameName = Object.keys(chosenGame)[0],
//         chosenGameDetails = chosenGame[chosenGameName],
//         chosenGameCategory = chosenGameDetails[0]["Category"],  //this becomes whatever is in position 0 in that category array
//         chosenGameMinPlayers = chosenGameDetails[0]["Min Players"],
//         chosenGameReminder = chosenGameDetails[0]["Reminder"],
//         chosenGameDefinition = chosenGameDetails[0]["Definition"],
        
//         speechOutput = 
//             "My random game is " + chosenGameName + ". "
//          + "The games category is " + chosenGameCategory + ". "
//          + "The game can be played with " + chosenGameMinPlayers + "players. "
//          + "Your quick refresher is: " + chosenGameReminder + ". "
//          + definitionAdded
//             ,
//         detail = "Rules for " + chosenGameName + ":  " + chosenGameDefinition, //"This is an additional detailed definition for your game.",
//         repromptText = "Try saying: choose a drinking game",
//         shouldEndSession = true;
   
//     sendRequestToAnalyticsDB(currUserSlotInput, currUserID, currSessionID, speechOutput, requestType);    
//     callback(sessionAttributes,
//         buildSpeechletResponseWithDetail(CARD_TITLE, detail, speechOutput, repromptText, shouldEndSession));
//         //buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
// }

//------------logic for required/default Amazon functions-----------
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);
    // Add any cleanup logic here
}

function handleInvalidRequest(intent, session, callback) {
    var sessionAttributes = {},
        speechOutput = "Sorry, I don't follow. Try saying: Who is Steve Keim. ",
        repromptText = "Try saying: Who is Steve Keim. ";
        var shouldEndSession = false;
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function getWelcomeResponse(callback) {
    var sessionAttributes = {},
        speechOutput = "Hi, you can ask me to pull up pictures. Try saying: Who is Christian Keil?";
        var shouldEndSession = false;
        var repromptText = "Try saying: Who is Christian Keil?";
    sessionAttributes = {
        "speechOutput": speechOutput,   //I think this is just recording what Alexa said for use later
        "repromptText": repromptText,   
    };
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function handleRepeatRequest(intent, session, callback) {
    // Repeat the previous speechOutput and repromptText from the session attributes if available
    // else start a new game session
    if (!session.attributes || !session.attributes.speechOutput) {
        getWelcomeResponse(callback);
    } else {
        callback(session.attributes,
            buildSpeechletResponseWithoutCard(session.attributes.speechOutput, session.attributes.repromptText, false));
    }
}

function handleGetHelpRequest(intent, session, callback) {
    // Provide a help prompt for the user, explaining how the game is played. Then, continue the game
    // if there is one in progress, or provide the option to start another one.
    
    // Ensure that session.attributes has been initialized
    if (!session.attributes) {
        session.attributes = {};
    }

    // Set a flag to track that we're in the Help state.
    session.attributes.userPromptedToContinue = true;

    // Do not edit the help dialogue. This has been created by the Alexa team to demonstrate best practices.
    var speechOutput = "You can ask me to pull up a picture for Neeraj Goyal";
    var repromptText = "You can also try saying: Who is Neeraj Goyal";
    var shouldEndSession = false;
    callback(session.attributes,
        buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession));
}
function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the game
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Good bye!", "", true));
}


//-----------helper functions  ----------------
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithDetail(title, detail, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: detail
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponsewithImage(title, detail, smallImageURL, largeImageURL, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
          type: "Standard",
          title: title,
          text: detail,
          image: {
            smallImageUrl: smallImageURL,
            largeImageUrl: largeImageURL
          }
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
