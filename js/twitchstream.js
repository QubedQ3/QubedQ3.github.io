// Title: Twitch Stream List
// Version: 2.5
// Author: Noah Shrader
// Website: http://www.noahshrader.com
// Modded by Kweh and 100chilly for use on the Qubed Q3 site.


var twitchUser = "qubedq3follows",
    hitbox = ["100chilly", "Soldjermon", "JennyLeeP"],
    social = {kweeeeh: "kweh"},

    Page = {
        // This is where the DOM manipulation happens. You may call it the view.
        NO_PLAYER: 0,
        TWITCH_PLAYER: 1,
        HITBOX_PLAYER: 2,
        currentPlayer: this.NO_PLAYER,
        currentUser: "",
        ignoreNextHash: false,
        initialized: false,
        hidePlayer: function() {
            this.currentPlayer = this.NO_PLAYER;
            this.currentUser = "";
            // this prevents the hash to get removed when initially loading the page
            if(this.initialized) {
                if(window.location.hash.length > 1) {
                    this.ignoreNextHash = true;
                }
                window.location.hash = "";
            }
            jQuery("#live_embed_player_flash").hide();
            jQuery('#live_embed_player_flash').attr("data","");
            jQuery('#live_embed_player_flash param[name="flashvars"]').attr("value","");
            jQuery("#chat_embed").hide();
            jQuery("#chat_embed").attr("src", "");
            jQuery("#hitbox_player").hide();
            jQuery("#hitbox_player").attr("src", "");
        },
        showPlayer: function(user) {
            jQuery("#player").hide();
            if(!user) {
                this.hidePlayer();
                return;
            }
            if(this.currentUser != user.name) {
                this.currentUser = user.name;
                if(window.location.hash != "#"+user.name) {
                    this.ignoreNextHash = true;
                    window.location.hash = "#"+user.name;
                }

                // show the player matching the current user, twitch player preferred
                if(user.twitch && (!user.live() || user.tlive)) {
                    jQuery('#live_embed_player_flash').attr("data","http://www.twitch.tv/widgets/live_embed_player.swf?channel=" + user.twitch);
                    jQuery("#hitbox_player").attr("src", "");
                    jQuery('#live_embed_player_flash param[name="flashvars"]').attr("value","hostname=www.twitch.tv&channel=" + user.twitch + "&auto_play=true&start_volume=25");
                    jQuery('#chat_embed').attr("src","http://twitch.tv/chat/embed?channel=" + user.twitch + "&popout_chat=true");

                    if(this.currentPlayer != this.TWITCH_PLAYER) {
                        this.currentPlayer = this.TWITCH_PLAYER;
                        jQuery("#live_embed_player_flash").show();
                        jQuery("#chat_embed").show();
                        jQuery("#hitbox_player").hide();
                    }
                }
                else if(user.hitbox && (!user.live() || user.hlive)) {
                    jQuery("#hitbox_player").attr("src", "http://hitbox.tv/#!/embed/" + user.hitbox);
                    jQuery('#chat_embed').attr("src","http://hitbox.tv/embedchat/"+ user.hitbox);
                    jQuery('#live_embed_player_flash').attr("data","");
                    jQuery('#live_embed_player_flash param[name="flashvars"]').attr("value","");
                    if(this.currentPlayer != this.HITBOX_PLAYER) {
                        this.currentPlayer = this.HITBOX_PLAYER;
                        jQuery("#live_embed_player_flash").hide();
                        jQuery("#chat_embed").show();
                        jQuery("#hitbox_player").show();
                    }
                }
                else {
                    this.hidePlayer();
                    return;
                }
                this.setTitle(user);

                var that = this;
                jQuery('#player').show(400, function() {
                    that.sizePlayer();
                });
            }
        },
        sizePlayer: function() {
            // need to use #player, as the flash object has no width at that point in time, could do a loop to wait for it instead, but this results in the same value
            var vidwidth = jQuery("#player").width();

            if(jQuery(".streaming").width() >= '1074') {
                vidwidth = Math.round(vidwidth *0.7);
            }
            // 31 is the height of the twitch player control bar
            var setheight = Math.round((vidwidth / 16) * 9);

            if(jQuery(".streaming").width() < '1074') {
                jQuery("#chat_embed").css("width", "100%");
                jQuery("#chat_embed").css("height", "450px");
            }
            else {
                jQuery("#chat_embed").css( "width", "29%" );
                jQuery("#chat_embed").css("height", setheight+"px");
            }

            if(this.currentPlayer == this.TWITCH_PLAYER) {
                setheight += 31;
                jQuery("#live_embed_player_flash").css( {"height" : setheight+"px", 'margin-bottom' : '0'} );
                jQuery("#live_embed_player_flash").attr("height", setheight+"");
                if(jQuery(".streaming").width() >= '1074') {
                    jQuery("#chat_embed").css("height", setheight+"px");
                }
            }
            else if(this.currentPlayer == this.HITBOX_PLAYER) {
                jQuery("#hitbox_player").css( {"height": setheight+"px", 'margin-bottom': '0'} );
                jQuery("#hitbox_player").attr("height", setheight+"");
            }
        },
        // Adds the little user card
        createUser: function(user) {
            var viewers = 'Offline',
                game = 'Last played: ',
                liveClass = 'offline';
            if(user.live()) {
                viewers = user.viewers + ' viewers';
                game = 'Playing: ';
                liveClass = 'online';
            }
            jQuery('#members').append('<div class="col s6 l4"><a class="member black amber-text text-darken-4' + liveClass + '" id="' + user.name + '" href="#' + user.name + '">');

            jQuery('#' + user.name).append('<img class="circle" src="' + user.avatar + '" alt="' + user.name + '">');
            jQuery('#' + user.name).append('<p class="viewers">' + viewers + '</p>');
            jQuery('#' + user.name).append('<h6 class="member-name">' + user.name + '</h6>');
            jQuery('#' + user.name).append('<p class="game">' + game + user.game + '</p>');
            jQuery('#' + user.name).append('</a></div>');
        },
        // Updates the content of the little user card
        updateUser: function(user) {
            if(jQuery("#"+user.name).html()) {
                var userLive = jQuery('#' + user.name).hasClass("online"),
                    viewers = 'Offline',
                    game = 'Last played: ',
                    liveClass = 'offline';

                if(user.live()) {
                    viewers = user.viewers + ' viewers';
                    game = 'Playing: ';
                    liveClass = 'online';
                }

                // update title if the state has changed and this user is currently being displayed
                if(this.currentUser == user.name) {
                    this.setTitle(user);
                }

                if(userLive && !user.live()) {
                    jQuery("#"+user.name).removeClass("online");
                }
                else if(!userLive && user.live()) {
                    jQuery("#"+user.name).removeClass("offline");
                }
                jQuery('#'+user.name).addClass(liveClass);
                jQuery('#'+user.name+' img').attr("src", user.avatar);
                if(user.live() || user.live() != userLive) {
                    jQuery('#'+user.name+' .viewers').html(viewers);
                    jQuery('#'+user.name+' .game').html(game+user.game);
                }
            }
            else {
                this.createUser(user);
            }
        },
        // Set the title for the given user
        setTitle: function(user) {
            var title = user.live() ? 'Live: ' + user.name + ' playing ' + user.game : user.name + ' is eating cake';
            jQuery('span.stitle').html(title);
        }
    },
    UserList = {
        // Some would call this the model and/or controller
        list: [],
        isLive: function() {
            return this.list.some(function(user) {
                return user.live;
            });
        },
        getUserByName: function(name) {
            name = name.toLowerCase();
            var retUser, cond;
            this.list.some(function(user) {
                cond = user.name.toLowerCase() == name;
                if(cond) {
                    retUser = user;
                }
                return cond;
            });
            return retUser;
        },
        getTwitchUsers: function() {
            var ret = [];
            this.list.forEach(function(user) {
                if(user.twitch != "") {
                    ret.push(user);
                }
            });
            return ret;
        },
        getHitboxUsers: function() {
            var ret = [];
            this.list.forEach(function(user) {
                if(user.hitbox != "") {
                    ret.push(user);
                }
            });
            return ret;
        },
        getTwitchUserByName: function(name) {
            var retUser, cond;
            this.getTwitchUsers().some(function(user) {
                cond = user.twitch == name;
                if(cond) {
                    retUser = user;
                }
                return cond;
            });
            return retUser;
        },
        refresh: function() {
            this.updateTwitch(this.getTwitchUsers());
            this.getHitboxUsers().forEach(function(user) {
                this.updateHitbox(user);
            }, this);
        },
        // Bulk updates all the twitch users, the argument is a comma separated list of their usernames.
        updateTwitch: function(users) {
            var user, that = this;
            users.forEach(function(user) {
                user.tlive = false;
            });
            jQuery.getJSON('https://api.twitch.tv/kraken/streams?channel=' + users.join(",") + '&callback=?', function(d) {
                if(d.streams.length>0) {
                    d.streams.forEach(function(stream) {
                        user = this.getTwitchUserByName(stream.channel.name);
                        if(!user.live()) {
                            user.game = stream.game;
                            user.viewers = stream.viewers;
                        }
                        user.tlive = true;
                        if(user.name == User.prototype.name)
                            user.name = stream.channel.display_name;
                        if(stream.channel.logo)
                            user.avatar = stream.channel.logo;

                        Page.updateUser(user);
                        user.ready = true;
                    }, that);
                }

                users.forEach(function(user) {
                    if(!user.tlive) {
                        this.getTwitchUserInfo(user);
                    }
                    else if(this.onready && this.ready()) {
                        this.onready();
                    }
                }, that);
            });
        },
        getTwitchUserInfo: function(user) {
            var that = this;
            jQuery.getJSON('https://api.twitch.tv/kraken/channels/' + user.twitch + '?callback=?', function(d) {
                if(typeof d == 'object') {
                    if(!user.live()) {
                        if(d.game != null) {
                            user.game = d.game;
                        }
                        user.viewers = 0;
                    }
                    if(user.name == User.prototype.name)
                        user.name = d.display_name;
                    if(d.logo)
                        user.avatar = d.logo;

                    Page.updateUser(user);
                    user.ready = true;

                    if(that.onready && that.ready()) that.onready();
                }
            });
        },
        // Each user with hitbox has to be hit individually by this function.
        updateHitbox: function(user) {
            var that = this;
            jQuery.getJSON('https://api.hitbox.tv/media/live/' + user.hitbox, function(d) {
                if(typeof d == 'object') {
                    user.hlive = d.livestream[0].media_is_live != "0";
                    if(user.hlive && !user.tlive) {
                        user.game = d.livestream[0].category_name;
                        user.viewers = d.livestream[0].media_views;
                    }
                    else if(!user.live()) {
                        user.viewers = 0;
                        user.game = d.livestream[0].category_name;
                    }
                    user.avatar = "http://edge.sf.hitbox.tv"+d.livestream[0].channel.user_logo;
                    if(user.name == User.prototype.name)
                        user.name = d.livestream[0].channel.user_name;

                    Page.updateUser(user);
                    user.ready = true;

                    if(that.onready && that.ready()) that.onready();
                }
            });
        },
        ready: function() {
            return this.list.every(function(user) {
                return user.ready;
            });
        },
        onready: null
    };

/*
 USER
 The only object type with an acutal prototype and instatiation of this whole thing
 Every user is represented by one of these.
 */
// the user's twitch username
User.prototype.twitch = "";
// the user's hitbox username
User.prototype.hitbox = "";
// true, if the user is live on twitch
User.prototype.tlive = false;
// true, if the user is live on hitbox
User.prototype.hlive = false;
// An URL pointing to an avatar image representing this user
User.prototype.avatar = "../img/fYdty6yd.png";
// The displayed name for this user
User.prototype.name = "Unknown";
// Number of viewers this user currently has. Can only be for one source (case where a user is live on two services should be rare enough to ignore it for now)
User.prototype.viewers = 0;
// The game the user has last played or is currently playing
User.prototype.game = "";
// True if at least the name of the user has been set
User.prototype.ready = false;
function User() {
    //void
}
// Returns true if the user is live on any service
User.prototype.live = function() {
    return this.hlive || this.tlive;
};

// Returns the user's twitch username, so we can conveniently .join all the users for the twitchrequest.
User.prototype.toString = function() {
    return this.twitch;
};

jQuery(document).ready(function( $ ) {
    Page.hidePlayer();

    /*
     Complicated initialization path.
     First, all hitbox users get added (see after this method assignement).
     After that, when all hitbox users's details have been loaded, the twitch users get added.
     And after all the twitch user's details have been added too, the default state for the displayed player is chosen.
     */
    UserList.onready = function() {
        UserList.onready = function() {
            // If the user entered the page with a user already selected, directly show that user
            if(window.location.hash.length > 1) {
                Page.showPlayer(UserList.getUserByName(window.location.hash.slice(1)));
            }
            else {
                var allOffline = UserList.list.every(function(user) {
                    return !user.live();
                });
                if(allOffline) {
                    Page.showPlayer(UserList.getTwitchUserByName("qubed_q3"));
                }
                else {
                    UserList.list.some(function(user) {
                        if(user.live())
                            Page.showPlayer(user);
                        return user.live();
                    });
                }
            }
            Page.initialized = true;
            // Thanks, we're done here (else updates will make the page run through this again)
            UserList.onready = null;
        };
        jQuery.getJSON("https://api.twitch.tv/kraken/users/"+ twitchUser + "/follows/channels?limit=250&callback=?", function(data) {
            if(data && data.follows.length > 0) {
                // Now, load the twitch users (we're coming from methods invoked async around line 420)
                data.follows.forEach(function(user, i, a) {
                    var newUser, existingUser = UserList.getUserByName(user.channel.name);
                    if(!existingUser) {
                        newUser = new User();
                        newUser.twitch = user.channel.name;
                        UserList.list.push(newUser);
                    }
                    else {
                        UserList.getUserByName(user.channel.name).twitch = user.channel.name;
                    }

                    if(i+1 == a.length) {
                        // Load all twitch user's user data plus their livestatus
                        UserList.updateTwitch(UserList.getTwitchUsers());
                    }
                });
            }
        });
    };
    // Here is where the hitbox users get added
    hitbox.forEach(function(name) {
        var newUser = new User();
        newUser.hitbox = name;
        UserList.list.push(newUser);
        UserList.updateHitbox(newUser);
    });

    // Display the player of the streamer the user just selected
    $(window).on("hashchange", function() {
        if(!Page.ignoreNextHash) {
            Page.showPlayer(UserList.getUserByName(window.location.hash.slice(1)));
        }
        else {
            Page.ignoreNextHash = false;
        }
    });

    // Window resize event - for dynamic sizing of stream+chat frames
    $(window).on("resize", function(){
        Page.sizePlayer();
    });

    // Updating loop
    window.setInterval(function() {
        if(UserList.ready() && Page.initialized)
            UserList.refresh();
    }, 60000);

});
