// Title: Twitch Stream List V2
// Version 1.0
// Author: Jari Senhorst
// Website: http://jarisenhorst.com
// Note: This script uses html data from the old Twitch Stream List 
// script that was modded by 100chilly and Kweh for use on the Qubed Q3 site and related projects.
//
// This script is basically a rewrite of Noah Shrader's Twitch Stream List script, 
// but this script works with Twitch API V5.

/////// Config variables ////////
var mainUserID = "139203270"; //The userID to pull the followers from
var mainClientID = "3r9xxl9vect563p9npg9x70u8gwoy9v"; //The userID's Client-ID
var mainAcceptToken = "application/vnd.twitchtv.v5+json"; //The accept token
var twitchAPIUrl = "https://api.twitch.tv/kraken"; //The Twitch API URL to use
var updateRate = 300000; //The refresh rate of the script (default 300000 milliseconds, 5 minutes)
var twitchElementName = "#twitch_player"; //The name of the Twitch player element
var twitchChatElementName = "#chat_embed"; //The name of the Twitch chat element

/////// Other variables ////////
var userList; //The raw follower data, as received from Twitch
var userDefList = new Array(); //The list with our custom user definition objects
var twitchPlayer; //The variable that will hold the twitch player from our watch page
var twitchChat; //The variable that will hold our embedded Twitch chat element
var processedDefs = 0;
var defProcessingDone = false;

/////// Script start ////////
jQuery(document).ready(function( $ ) 
{
	findPlayerElement(); //Find the Twitch player element
	populateUserList(); //Start the script by beginning at square one, populating the user list (the mainUserID's followers)
});
///////////////

///
// This function searches for the player elements on the page
// and stores it in our correct variables.
///
function findPlayerElement()
{
	twitchPlayer = jQuery(twitchElementName);
	twitchChat = jQuery(twitchChatElementName);
}

///
// This function sends a request to Twitch for the mainUserID's followers, then
// calls onUserListRetrieved with the received data.
///
function populateUserList()
{
	jQuery.ajax(
	{
		dataType: 'json',
		headers:
		{
			"Client-ID": mainClientID,
			"Accept": mainAcceptToken
		},
		type: 'GET',
		contentType: 'application/json',
		url: twitchAPIUrl + '/users/' + mainUserID + '/follows/channels?limit=100',
		success: onUserListRetrieved
	});
	
}

///
// This function should only be called by the request that was sent from populateUserList.
// Upon receiving the requested data, it assigns the raw data to userList and starts other
// needed tasks.
///
function onUserListRetrieved(data)
{
	userList = data['follows'];
	setupUserDefinitions();
	window.setInterval(scriptUpdate, updateRate);
}

///
// This is the script's update loop. It's executed each x milliseconds (as specified on the
// top, under the config variables)
///
function scriptUpdate()
{
	updateUserCards();
}

///
// This function sets up the user definitions using our custom userDataDefinition objects. 
// It uses the raw userList values for processing (these should have been retrieved upon
// calling this function). It also populates the userDefList array with it for easy referencing 
// later on in the script.
///
function setupUserDefinitions()
{
	for(var i = 0, len = userList.length; i < len; i++)
	{
		var channelData = userList[i]['channel'];
		var uData = new userDataDefinition(channelData['display_name'], channelData['logo'], 0, channelData['game'], channelData['name'], channelData['_id']);
		
		userDefList.push(uData);
		updateUserLiveStatus(uData);
		userCardCreate(uData);
	}
	
	onUserOperationsFinished();
}

///
// This function is called when setup of user data is completed. Here
// we also initialize our page player.
///
function onUserOperationsFinished()
{
	var liveUsers = new Array();
	for(var i = 0, len = userDefList.length; i < len; i++) { if(userDefList[i].isUserLive) liveUsers.push(userDefList[i]); } //Make a list of live users
	
	if(liveUsers.length == 0) //No live users, select a random offline user to show in the player
	{
		//We use userDefList instead of liveUsers, since liveUsers is empty!
		var rnd = Math.floor(Math.random() * (userDefList.length - 1)); //Don't forget -1, otherwise we might get out of bounds issues
		
		showUserInPlayer(userDefList[rnd]);
	}
	else if(liveUsers.length == 1) //One live users, simply show just that user in the player
	{
		showUserInPlayer(liveUsers[0]); //Show the first and only entry in the player
	}
	else if(liveUsers.length > 1) //Multiple live users, select a random one to show
	{
		//Show one of the live streamers in the player
		var rnd = Math.floor(Math.random() * (liveUsers.length - 1)); //Don't forget -1, otherwise we might get out of bounds issues
		showUserInPlayer(liveUsers[rnd]);
	}
}

///
// This function shows a specific user in the player on the page
///
function showUserInPlayer(uData)
{
	twitchPlayer.attr('src', 'https://player.twitch.tv/?channel=' + uData.userName);
	twitchChat.attr("src","https://www.twitch.tv/" + uData.userName + "/chat?popout=");
}

///
// Updates the live status and stream data of a user
///
function updateUserLiveStatus(userdata)
{
	jQuery.ajax(
	{
		dataType: 'json',
		headers:
		{
			"Client-ID": mainClientID,
			"Accept": mainAcceptToken
		},
		type: 'GET',
		contentType: 'application/json',
		url: twitchAPIUrl + '/streams/' + userdata.userChannelID,
		success: function(data)
		{
			if(data['stream'] == null) userdata.isUserLive = false;
			else 
			{
				userdata.isUserLive = true;
				userdata.userViewers = data['stream']['viewers'];
			}
			updateUserCard(userdata);
			if(defProcessingDone == false)
			{
				processedDefs++;
				if(processedDefs == userDefList.length)
				{
					onUserOperationsFinished();
					defProcessingDone = true;
				}
			}
		}
	});
}

///
// Our custom user data object. This holds the most important data which we want to use throughout the script
// to display or interpret certain information.
///
function userDataDefinition(name, avatar, viewers, game, username, chanID)
{
	this.displayName = name;
	this.userName = username;
	this.userAvatar = avatar;
	this.userViewers = viewers;
	this.userGame = game;
	this.userChannelID = chanID;
	
	this.isUserLive = false;
}

///
// This function updates all the existing user cards on the page using our userDefList 
// with our custom userDataDefinition object.
///
function updateUserCards()
{
	for(var i = 0, len = userDefList.length; i < len; i++)
	{
		updateUserLiveStatus(userDefList[i]); //Update the live status
		//updateUserCard(userDefList[i]);
	}
}

///
// This function updates a single user card based on the userDataDefinition received.
///
function updateUserCard(userdata)
{
	//Edit the card
	var cardElement = jQuery("#" + userdata.userName);
	if(cardElement.html())
	{
		var uLive = cardElement.hasClass("online");
		var viewers = "Offline";
		var game = "Last played: ";
		var lClass = "offline";

		//User is live
		if(userdata.isUserLive == true)
		{
			viewers = userdata.userViewers + " viewers";
			game = "Playing: ";
			lClass = "online";
			
			if(cardElement.hasClass("text-darken-4")) cardElement.removeClass("text-darken-4");
		}
		else //User is not live
		{
			if(!cardElement.hasClass("text-darken-4")) cardElement.addClass("text-darken-4");
		}
		
		if(uLive && userdata.isUserLive == false) 
		{
			cardElement.removeClass("online");
		}
		else if(!uLive && userdata.isUserLive == true) 
		{
			cardElement.removeClass("offline");
		}
		
		cardElement.addClass(lClass);
		cardElement.attr("src", userdata.userAvatar);
		
		if(userdata.isUserLive == true || userdata.isUserLive !== uLive)
		{
			jQuery("#" + userdata.userName + "_viewers").html(viewers);
			jQuery("#" + userdata.userName + "_game").html(game + userdata.userGame);
		}
	
	}
}

///
// Returns the userDataDefinition for the given channel ID
///
function getUserDefByChannelID(chanID)
{
	//Search for the correct userDef, return when found
	for(var i = 0, len = userDefList.length; i < len; i++) { if(userDefList[i].userChannelID == chanID) return userDefList[i]; }
	return -1; //When nothing is found, -1 will be returned
}

///
// Called when a user card is clicked on the watch page.
// We receive the clicked channel ID
///
function onUsercardClicked(uChanID)
{
	var uDef = getUserDefByChannelID(uChanID);
	if(uDef == -1) console.log("[ERR]: There was an issue while pairing the channelID with the userDataDefinition.."); 
	else showUserInPlayer(uDef);
}

///
// Creates a user card on the page under the 'members' div.
///
function userCardCreate(userdata)
{
	var viewers = 'Offline',
		game = 'Last played: ',
		liveClass = 'offline',
		textcol = "amber-text text-darken-4 ";
		
		if(userdata.isUserLive == true) 
		{
			viewers = userdata.userViewers + ' viewers';
			game = 'Playing: ';
			liveClass = 'online';
			textcol = "amber-text ";
		}
		
		jQuery('#members').append('<div class="col s6 l4"><a class="member black ' + textcol + liveClass + '" id="' + userdata.userName + '" onclick="onUsercardClicked(' + userdata.userChannelID + ')">');

		jQuery('#' + userdata.userName).append('<img class="circle" src="' + userdata.userAvatar + '" alt="' + userdata.userName + '">');
		jQuery('#' + userdata.userName).append('<p class="viewers" id="'+ userdata.userName + '_viewers">' + viewers + '</p>');
		jQuery('#' + userdata.userName).append('<h6 class="member-name">' + userdata.userName + '</h6>');
		jQuery('#' + userdata.userName).append('<p class="game" id="'+ userdata.userName + '_game">' + game + userdata.userGame + '</p>');
		jQuery('#' + userdata.userName).append('</a></div>');
}