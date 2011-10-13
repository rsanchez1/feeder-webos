enyo.kind({
    name: "TouchFeeds.Main",
    kind: enyo.VFlexBox,
    loggedIn: false,
    components: [
        {name: "slidingPane", kind: "SlidingPane", fixedWidth: true, flex: 1, onSelectView: "slidingSelected", components: [
            {name: "feeds", width: "320px", fixedWidth: true, components: [
                {name: "feedsView", kind: "TouchFeeds.FeedsView", headerContent: "TouchFeeds", flex: 1, components: [], onFeedClicked: "feedClicked", onRefreshFeeds: "refreshFeeds", onHeaderClicked: "feedsHeaderClicked", onNotificationClicked: "notificationClicked"}
            ]},
            {name: "articles", width: "320px", fixedWidth: true, components: [
                {name: "articlesView", kind: "TouchFeeds.ArticlesView", headerContent: "All Items", flex: 1, components: [], onArticleClicked: "articleClicked", onArticleRead: "articleRead", onArticleMultipleRead: "articleMultipleRead", onAllArticlesRead: "markedAllRead", onArticleStarred: "articleStarred", onChangedOffline: "changeOffline"}
            ]},
            {name: "singleArticle", flex: 1, dragAnywhere: false, dismissible: false, onHide: "hideArticle", onShow: "showArticle", onResize: "slidingResize", components: [
                {name: "singleArticleView", dragAnywhere: false, kind: "TouchFeeds.SingleArticleView", flex: 1, components: [], onSelectArticle: "selectArticle", onRead: "readArticle", onChangedOffline: "changeOffline", onStarred: "starredArticle"},
            ]},
            {name: "login", className: "enyo-bg", kind: "TouchFeeds.Login", onCancel: "closeDialog", onLogin: "handleLogin", onOpen: "openDialog"},
            {name: "preferences", className: "enyo-bg", kind: "TouchFeeds.Preferences", onCancel: "closePreferences", onGroupChange: "groupChange", onSortChange: "sortChange", onShowHideFeedsChange: "showHideFeedsChange", onShowHideArticlesChange: "showHideArticlesChange", onEnableAnimations: "animationsChanged", onTimerChange: "timerChanged"},
            {name: "notifications", className: "enyo-bg", kind: "TouchFeeds.Notifications", onCancel: "closeNotifications", onTimerChange: "timerChanged"}
        ]},
        {kind: "AppMenu", lazy: false, components: [
            {kind: "EditMenu"},
            {name: "loginLabel", caption: "Login", onclick: "showLogin"},
            {name: "preferenesLabel", caption: "Preferences", onclick: "showPreferences"},
            {name: "helpLabel", caption: "Help", onclick: "feedsHeaderClicked"}
        ]},
        {kind: "onecrayon.Database", name: "articlesDB", database: "ext:TouchFeedsArticles", version: 1, debug: false},
        {kind: "ApplicationEvents", onWindowRotated: "windowRotated", onApplicationRelaunch: "applicationRelaunch", onUnload: "cleanup"},
    ],

    constructor: function() {
        this.inherited(arguments);
        this.api = new Api();
        this.credentials = new Credentials();
        enyo.application.app = this;
    },

    ready: function() {
        enyo.log("called ready method");
        enyo.keyboard.setManualMode(true);
       this.$.slidingPane.setCanAnimate(Preferences.enableAnimations());
       var orientation = enyo.getWindowOrientation();
       if (orientation == "up" || orientation == "down") {
           this.$.feeds.applyStyle("width", "320px");
           this.$.articles.applyStyle("width", "320px");
       } else {
           this.$.feeds.applyStyle("width", "384px");
           this.$.articles.applyStyle("width", "384px");
       }
        this.$.appMenu.hide();
        (function() {
            this.$.articlesDB.setSchemaFromURL('schema.json', {
                onSuccess: function() {
                    enyo.log("successfully set database schema");
                    this.$.articlesDB.query("SELECT * FROM articles", {
                        onSuccess: function (results) {
                            enyo.log("got results successfully");
                            this.offlineArticles = results;
                            this.$.articlesView.setHeaderContent("Offline Articles");
                            this.$.articlesView.setOfflineArticles(results);
                            }.bind(this),
                        onFailure: function() {
                            enyo.log("failed to get results");
                        }
                    });
                }.bind(this)
            });
        }).bind(this).defer();
        if (this.credentials.email && this.credentials.password) {
            enyo.log("Login API");
            this.api.login(this.credentials, this.loginSuccess.bind(this), this.loginFailure.bind(this));
            setTimeout(this.checkLoggedIn.bind(this), 5000);
        } else {
            enyo.log("get login information from user");
            setTimeout(function() {this.$.login.openAtCenter();}.bind(this), 0);
        }
        Element.addClassName(document.body, Preferences.getColorScheme());
    },

    checkLoggedIn: function() {
        enyo.log("checking if logged in");
        if (!this.loggedIn) {
            this.api.login(this.credentials, this.loginSuccess.bind(this), this.loginFailure.bind(this));
            setTimeout(this.checkLoggedIn.bind(this), 5000);
        }
    },

    loginSuccess: function() {
        enyo.log("logged in successfully");
        this.loggedIn = true;
        this.sources = new AllSources(this.api);
        this.refreshFeeds();
        this.$.loginLabel.setCaption("Logout");
        enyo.application.launcher.$.appDashboard.setAlarm();
    },

    refreshFeeds: function(callback) {
        enyo.log("refreshing feeds");
        if (!!this.sources) {
            this.$.feedsView.setShowSpinner(true);
            if (!!callback) {
                callback = function() {};
            }
            this.sources.findAll(
                function() {
                    enyo.log("Filtering and refreshing...");
                    this.allSubscriptions = this.sources.subscriptions.items.slice(0);
                    this.filterAndRefresh(callback);
                }.bind(this),

                function() {
                    enyo.log("Error fetching all feeds");
                }
            );
        }
        setTimeout(this.checkFeedsRefreshed.bind(this), 5000);
    },

    checkFeedsRefreshed: function() {
        enyo.log("CHECKING IF FEEDS SUCCESSFULLY REFRESHED");
        var numberOfItems = this.$.feedsView.getStickySourcesLength();
        if (numberOfItems < 4) {
            enyo.log("feeds not successfully refreshed, refresh again");
            this.refreshFeeds();
        } else {
            enyo.log("feeds successfully refreshed");
        }
    },

    filterAndRefresh: function(success) {
        enyo.log("Called filter and refresh");
        this.sources.sortAndFilter(
            function() {
                //enyo.log("Sticky sources: ", this.sources.stickySources.items);
                //enyo.log("Subscription sources: ", this.sources.subscriptionSources.items);
                enyo.log("success sorting and filtering");
                if (!!success) {
                    success();
                }
                this.$.feedsView.setStickySources(this.sources.stickySources);
                this.$.feedsView.setSubscriptionSources(this.sources.subscriptionSources);
                if (!!enyo.application.launcher.messageTapped) {
                    enyo.log("MESSAGE WAS TAPPED");
                    var notification = enyo.application.launcher.$.appDashboard.$.appDashboard.pop();
                    var subscription = this.sources.subscriptionSources.items.find(function(subscription) {return subscription.title.replace(/[^0-9a-zA-Z]/g, "").toLowerCase() == notification.idTitle;});
                    if (typeof subscription == "undefined") {
                        enyo.log("failed to get subscription");
                    } else {
                        enyo.log("CLICKING A FEED");
                        this.feedClicked("", subscription);
                        enyo.application.launcher.$.appDashboard.removeDashboard();
                        enyo.log("FEED CLICKED");
                    }
                    enyo.application.launcher.messageTapped = false;
                }
            }.bind(this),

            function() {
                enyo.log("Error sorting and filtering");
            }
        );
    },

    sortAndFilter: function() {
        enyo.log("sortin and filterin");
        this.sources.sortAndFilter(function() {
            enyo.log("finished sorting");
            this.$.feedsView.setStickySources(this.sources.stickySources);
            this.$.feedsView.setSubscriptionSources(this.sources.subscriptionSources);
        }.bind(this), function() {enyo.log("error sorting and filtering");});
    },

    getSubscriptionSources: function() {
        return this.allSubscriptions;
    },

    loginFailure: function() {
        this.$.login.openAtCenter();
    },

    showArticle: function() {
        this.$.singleArticle.setShowing(true);
    },

    hideArticle: function() { 
        this.$.singleArticle.setShowing(false);
    },

    slidingSelected: function() {
    },

    slidingResize: function() {
        this.$.singleArticleView.resizedPane();
    },

    openAppMenuHandler: function() {
        this.$.appMenu.open();
    },

    closeAppMenuHandler: function() {
        this.$.appMenu.close();
    },

    showPreferences: function() {
        this.$.preferences.openAtCenter();
    },

    closePreferences: function() {
        this.$.preferences.close();
    },

    closeNotifications: function() {
        this.$.notifications.close();
    },

    showLogin: function() {
        if (this.loggedIn) {
            this.sources = null;
            this.loggedIn = false;
            this.credentials.password = false;
            this.credentials.save();
            this.$.loginLabel.setCaption("Login");
            this.$.login.openAtCenter();
            this.$.feedsView.setStickySources([]);
            this.$.feedsView.setSubscriptionSources([]);
        } else {
            this.$.login.openAtCenter();
        }
    },

    openDialog: function() {
        enyo.log("opened login");
    },

    closeDialog: function() {
        this.$.slidingPane.selectViewByName('articles', true);
        this.$.login.close();

        this.$.feedsView.setStickySources({items: [{isOffline: true, title: "Offline Articles"}]});
    },

    handleLogin: function() {
        enyo.log("successfully logged in");
        this.$.login.close();
        this.loginSuccess();
    },

    feedClicked: function(thing, item, wasFolderChild) {
        enyo.log("received feed clicked event");
        this.$.articlesView.setHeaderContent(item.title);
        if (item.isOffline) {
            this.$.articlesDB.query("SELECT * FROM articles", {
                onSuccess: function (results) {
                    enyo.log("************************");
                    enyo.log("got results successfully");
                    this.offlineArticles = results;
                    this.$.articlesView.setOfflineArticles(results);
               }.bind(this),
                onFailure: function() {
                    enyo.log("failed to get results");
                }
            });
        } else {
            this.$.articlesView.setArticles(item); //pushing all articles to articles view
            this.$.articlesView.setWasFolderChild(wasFolderChild);
        }
        this.$.slidingPane.selectViewByName('articles', true);
        //this.$.slidingPane.selectViewByName('ariclesView', true);
    },

    articleClicked: function(thing, article, index, maxIndex) {
        //this.$.singleArticleView.$.articleScroller.scrollTo(0, 0);
        this.$.singleArticleView.$.articleScroller.setScrollTop(0);
        this.$.singleArticleView.setArticle(article);
        this.$.singleArticleView.setIndex(index);
        this.$.singleArticleView.setMaxIndex(maxIndex);
        var info = enyo.fetchDeviceInfo();
        var height = info.screenHeight;
        if (height == 320 || height == 400 || height == 480 || height == 800) {
            this.$.slidingPane.selectViewByName('singleArticle', true);
        }
    },

    selectArticle: function(thing, index) {
        enyo.log("selecting article: ", index);
        this.$.articlesView.selectArticle(index);
    },
    starredArticle: function(thing, index, isStarred) {
        this.$.articlesView.finishArticleStarred(index, isStarred);
    },
    readArticle: function(thing, article, index, isRead) {
        enyo.log("received read event");
        if (isRead) {
            enyo.log("mark article read");
            enyo.log(article.subscriptionId);
            this.sources.articleRead(article.subscriptionId);
        } else {
            enyo.log("mark article not read");
            this.sources.articleNotRead(article.subscriptionId);
        }
        this.$.articlesView.finishArticleRead(index);
        //this.$.feedsView.refreshLists();
        this.sources.sortAndFilter(function() {
            this.$.feedsView.setStickySources(this.sources.stickySources);
            this.$.feedsView.setSubscriptionSources(this.sources.subscriptionSources);
        }.bind(this), function() {enyo.log("error sorting and filtering");});
    },
    articleRead: function(thing, article, index) {
        this.sources.articleRead(article.subscriptionId);
        this.$.articlesView.finishArticleRead(index);
        this.sources.sortAndFilter(function() {
            this.$.feedsView.setChangeId(article.subscriptionId);
            this.$.feedsView.setStickySources(this.sources.stickySources);
            this.$.feedsView.setSubscriptionSources(this.sources.subscriptionSources);
        }.bind(this), function() {enyo.log("error sorting and filtering");});
    },
    articleMultipleRead: function(thing, article, index) {
        enyo.log("article mulitiple read");
        //this.sources.articleMultipleRead(article.subscriptionId);
        this.sources.articleRead(article.subscriptionId);
        this.$.articlesView.finishArticleRead(index);
        this.sources.sortAndFilter(function() {
            this.$.feedsView.setChangeId(article.subscriptionId);
            this.$.feedsView.setStickySources(this.sources.stickySources);
            this.$.feedsView.setSubscriptionSources(this.sources.subscriptionSources);
        }.bind(this), function() {enyo.log("error sorting and filtering");});
    },
    getUnreadCountForSubscription: function(subscriptionId) {
        enyo.log("getting unread count for subscription from main");
        return this.sources.getUnreadCountForSubscription(subscriptionId);
    },
    articleStarred: function() {
        this.$.singleArticleView.articleStarred();
    },
    markedAllRead: function(thing, count, id) {
        if (id == "user/-/state/com.google/reading-list") {
            this.sources.nukedEmAll();
        } else {
            this.sources.markedAllRead(count);
        }
        this.sources.sortAndFilter(function() {
            this.$.feedsView.setStickySources(this.sources.stickySources);
            this.$.feedsView.setSubscriptionSources(this.sources.subscriptionSources);
        }.bind(this), function() {enyo.log("error sorting and filtering");});
        //this.refreshFeeds();
    },
	changeOffline: function() {
            this.$.articlesView.checkAllArticlesOffline();
		this.$.articlesDB.query("SELECT * FROM articles", {
			onSuccess: function (results) {
				enyo.log("got results successfully");
                                this.offlineArticles = results;
                                this.$.feedsView.setStickySources(this.sources.stickySources);
				if (this.$.articlesView.offlineArticles.length) {
					this.$.articlesView.setOfflineArticles(results);
				}
		   }.bind(this),
			onFailure: function() {
				enyo.log("failed to get results");
			}
		});
   },
   windowRotated: function() {
       var orientation = enyo.getWindowOrientation();
       if (orientation == "up" || orientation == "down") {
           this.$.feeds.applyStyle("width", "320px");
           this.$.articles.applyStyle("width", "320px");
       } else {
           this.$.feeds.applyStyle("width", "384px");
           this.$.articles.applyStyle("width", "384px");
       }
   },

   applicationRelaunch: function(inSender) {
       enyo.log("***********************************");
       enyo.log("***********************************");
       enyo.log("***********************************");
       enyo.log("***********************************");
       enyo.log("relaunched application");
       var params = enyo.windowParams;
       if (params.action !== undefined) {
           return true;
       }
   },

   subscriptionSuccess: function() {
       enyo.log("***********************************");
       enyo.log("***********************************");
       enyo.log("***********************************");
       enyo.log("***********************************");
       enyo.log("set alarm");
   },

   subscriptionFailure: function() {
       enyo.log("***********************************");
       enyo.log("***********************************");
       enyo.log("***********************************");
       enyo.log("***********************************");
       enyo.log("failed to set alarm");
   },

   feedsHeaderClicked: function() {
       this.$.singleArticleView.showSummary();
        this.$.slidingPane.selectViewByName('singleArticle', true);
   },

   notificationClicked: function() {
       this.$.notifications.openAtCenter();
   },

   groupChange: function() {
       this.$.articlesView.reloadArticles();
   },

   sortChange: function() {
       this.$.articlesView.reloadArticles();
       this.$.feedsView.refreshFeeds();
   },

   showHideFeedsChange: function() {
       this.$.feedsView.refreshFeeds();
   },

   showHideArticlesChange: function() {
       this.$.articlesView.refreshArticles();
   },

   animationsChanged: function() {
       this.$.slidingPane.setCanAnimate(Preferences.enableAnimations());
   },

   timerChanged: function() {
        enyo.application.launcher.$.appDashboard.setAlarm();
   },

   cleanup: function() {
        enyo.application.launcher.$.appDashboard.setAlarm();
   }
});
