enyo.kind({
    name: "TouchFeeds.Main",
    kind: enyo.VFlexBox,
    loggedIn: false,
    sortAndFilterTimeout: false,
    keyWasDown: false,
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
            {name: "preferences", className: "enyo-bg", kind: "TouchFeeds.Preferences", onCancel: "closePreferences", onGroupChange: "groupChange", onSortChange: "sortChange", onShowHideFeedsChange: "showHideFeedsChange", onShowHideArticlesChange: "showHideArticlesChange", onEnableAnimations: "animationsChanged", onTimerChange: "timerChanged", onCombineChange: "combineChanged"},
            {name: "notifications", className: "enyo-bg", kind: "TouchFeeds.Notifications", onCancel: "closeNotifications", onTimerChange: "timerChanged"}
        ]},
        {kind: "AppMenu", lazy: false, components: [
            {kind: "EditMenu"},
            {name: "loginLabel", caption: "Login", onclick: "showLogin"},
            {name: "preferenesLabel", caption: "Preferences", onclick: "showPreferences"},
            {name: "helpLabel", caption: "Help", onclick: "feedsHeaderClicked"}
        ]},
        {kind: "Menu", name: "chromeMenu", lazy: false, components: [
            {name: "loginLabelChrome", caption: "Login", onclick: "showLogin"},
            {name: "preferenesLabelChrome", caption: "Preferences", onclick: "showPreferences"},
            {name: "helpLabelChrome", caption: "Help", onclick: "feedsHeaderClicked"}
        ]},
        {kind: "onecrayon.Database", name: "articlesDB", database: "ext:TouchFeedsArticles", version: 1, debug: false},
        {kind: "ApplicationEvents", onWindowRotated: "windowRotated", onApplicationRelaunch: "applicationRelaunch", onUnload: "cleanup", onBack: "backSwipe", onForward: "forwardSwipe"}
    ],

    constructor: function() {
        this.inherited(arguments);
        this.api = new Api();
        this.credentials = new Credentials();
        enyo.application.app = this;
        this.isPhone = false;
        var info = enyo.fetchDeviceInfo();
        if (!!info) {
            var height = info.screenHeight;
            var width = info.screenWidth;
            if ((height == 320 && width == 480) || (height == 480 && width == 320) || (height == 800 && width == 480) || (height == 480 && width == 800) || (height == 400 && width == 320) || (height == 320 && width == 400)) {
                this.isPhone = true;
            }
        }
        enyo.dispatcher.rootHandler.addListener(this);
    },

    ready: function() {
        (function() {
            var articleTestDiv = document.createElement("div");
            var articleSubDiv = document.createElement("div");
            var articleParentDiv = document.createElement("div");
            articleTestDiv.addClassName("articleTitle");
            articleTestDiv.id = "articleTestDiv";
            articleSubDiv.id = "articleSubDiv";
            articleSubDiv.addClassName("articleOrigin");
            articleParentDiv.addClassName("enyo-item");
            articleParentDiv.addClassName("enyo-swipeableitem");
            articleParentDiv.addClassName("enyo-vflexbox");
            articleParentDiv.style.cssText = "-webkit-box-align: stretch; -webkit-box-orient: vertical; -webkit-box-pack: start;";
            articleParentDiv.setStyle({position: "static", top: "-1000px", left: "-1000px"});
            articleParentDiv.appendChild(articleTestDiv);
            articleParentDiv.appendChild(articleSubDiv);
            document.body.appendChild(articleParentDiv);
            var messageDiv = document.createElement("div");
            messageDiv.id = "touchfeedsBannerMessage";
            document.body.appendChild(messageDiv);
        }).defer();
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
        setTimeout(function() {
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
        if (!window.PalmSystem) {
            if (this.api.isAuthTokenValid()) {
                this.loginSuccess();
            } else {
                //should check refresh token here
                if (!!Preferences.getAuthTimestamp() && !!Preferences.getAuthExpires()) {
                    //this means the token expired, reauthorize
                    this.api.failureCheck(this.loginSuccess.bind(this), this.loginFailure.bind(this), {status: 401});
                } else {
                    setTimeout(function() {this.$.login.openAtCenter();}.bind(this), 0);
                }
            }
        } else { 
            if (this.credentials.email && this.credentials.password) {
                enyo.log("Login API");
                this.api.login(this.credentials, this.loginSuccess.bind(this), this.loginFailure.bind(this));
                setTimeout(this.checkLoggedIn.bind(this), 5000);
            } else {
                enyo.log("get login information from user");
                setTimeout(function() {this.$.login.openAtCenter();}.bind(this), 0);
            }
        }}.bind(this), 100);
        Element.addClassName(document.body, Preferences.getColorScheme());
        setTimeout(this.checkStyle.bind(this), 5000);

        if (!window.PalmSystem) {
            //keyboard shortcuts google reader
            document.onkeyup = function(ev) {
                this.wasKeyDown = false;
            }.bind(this);
            document.onkeydown = function(ev) {
                if (this.isAnythingFocused()) {
                    return;
                }
                var key = ev.which;
                if (key == 38) {
                    this.$.articlesView.scrollBy(12);
                    ev.stopPropagation();
                    ev.preventDefault();
                    return -1;
                }
                if (key == 40) {
                    this.$.articlesView.scrollBy(-12);
                    ev.stopPropagation();
                    ev.preventDefault();
                    return -1;
                }
                if (this.wasKeyDown) {
                    return;
                }
                this.wasKeyDown = true;
                if (key == 74) {
                    //j
                    this.$.singleArticleView.nextClick();
                }
                if (key == 75) {
                    //k
                    this.$.singleArticleView.previousClick();
                }
                if (key == 83) {
                    //s
                    this.$.singleArticleView.starClick();
                }
                if (key == 77) {
                    //m
                    this.$.singleArticleView.readClick();
                }
                if (key == 86) {
                    //v
                    this.$.singleArticleView.sourceClick();
                }
                if (key == 69) {
                    //e
                }
                if (key == 82) {
                    //r
                    this.$.feedsView.refreshClick();
                    this.$.articlesView.refreshClick();
                }
                if (key == 191) {
                    ///
                    this.$.feedsView.$.searchQuery.forceFocus();
                    this.$.slidingPane.selectViewByName('feeds', true);
                }
                if (key == 65) {
                    //a
                    this.$.feedsView.addFeedClick();
                }
                if (key == 79) {
                    //o
                    this.$.singleArticleView.offlineClick();
                }
                if (key == 70) {
                    //f
                    this.$.singleArticleView.fetchClick();
                }
            }.bind(this);
        }
        
    },

    componentsReady: function() {
    },

    isAnythingFocused: function() { 
        if (!!this.$.feedsView.$.searchQuery && this.$.feedsView.$.searchQuery.hasFocus()) {
            return true;
        }
        if (!!this.$.feedsView.$.feedInput && this.$.feedsView.$.feedInput.hasFocus()) {
            return true;
        }
        if (!!this.$.login.$.email && this.$.login.$.email.hasFocus()) {
            return true;
        }
        if (!!this.$.login.$.password && this.$.login.$.password.hasFocus()) {
            return true;
        }
        if (!!this.$.login.$.captcha && this.$.login.$.captcha.hasFocus()) {
            return true;
        }
        return false;
    },

    checkStyle: function() {
        return;
        //this.$.node.style.cssText = "-webkit-box-pack: start !important; -webkit-box-align: stretch !important; -webkit-box-orient: vertical !important; -webkit-box-sizing: border-box !important;";
        enyo.log("************************************************************************");
        enyo.log("************************************************************************");
        enyo.log("************************************************************************");
        enyo.log("************************************************************************");
        var feed = document.getElementById("main_feeds");
        var article = document.getElementById("main_articles");
        var single = document.getElementById("main_singleArticle");
        var body = document.getElementById("popupLayer");
        var main = document.getElementById("main");
        var mainPane = document.getElementById("main_slidingPane");
        var mainPaneClient = document.getElementById("main_slidingPane_client");
        var bodyReal = document.body;
        enyo.log("FEED STYLE: ", feed.style.cssText);
        enyo.log("ARTICLE STYLE: ", article.style.cssText);
        enyo.log("SINGLE STYLE: ", single.style.cssText);
        enyo.log("BODY STYLE: ", body.style.cssText);
        enyo.log("MAIN STYLE: ", main.style.cssText);
        enyo.log("MAIN PANE STYLE: ", mainPane.style.cssText);
        enyo.log("MAIN PANE CLIENT STYLE: ", mainPaneClient.style.cssText);
        enyo.log("BODY REAL STYLE: ", bodyReal.style.cssText);
        setTimeout(this.checkStyle.bind(this), 15000);


        return;
        var st = this.measure(feed, "-webkit-transform");
        enyo.log("3D TRANSFORM FEEDS: ", st);
        st = this.measure(article, "-webkit-transform");
        enyo.log("3D TRANSFORM ARTICLES: ", st);
        st = this.measure(single, "-webkit-transform");
        enyo.log("3D TRANSFORM SINGLE ARTICLE: ", st);
        st = this.measure(body, "-webkit-transform");
        enyo.log("3D TRASFORM BODY: ", st);
        st = this.measure(main, "-webkit-transform");
        enyo.log("3D TRANSFORM MAIN: ", st);
        st = this.measure(mainPane, "-webkit-transform");
        enyo.log("3D TRANSFORM MAIN PANE: ", st);
        st = this.measure(mainPaneClient, "-webkit-transform");
        enyo.log("3D TRANSFORM MAIN PANE CLIENT", st);
        st = this.measure(bodyReal, "-webkit-transform");
        enyo.log("3D TRANSFORM BODY", st);
        enyo.log("************************************************************************");

        var st = this.measure(feed, "left");
        enyo.log("LEFT FEEDS: ", st);
        st = this.measure(article, "left");
        enyo.log("LEFT ARTICLES: ", st);
        st = this.measure(single, "left");
        enyo.log("LEFT SINGLE ARTICLE: ", st);
        st = this.measure(body, "left");
        enyo.log("LEFT BODY: ", st);
        st = this.measure(main, "left");
        enyo.log("LEFT MAIN: ", st);
        st = this.measure(mainPane, "left");
        enyo.log("LEFT MAIN PANE: ", st);
        st = this.measure(mainPaneClient, "left");
        enyo.log("LEFT MAIN PANE CLIENT", st);
        st = this.measure(bodyReal, "left");
        enyo.log("LEFT BODY", st);
        enyo.log("************************************************************************");

        var st = this.measure(feed, "right");
        enyo.log("RIGHT FEEDS: ", st);
        st = this.measure(article, "right");
        enyo.log("RIGHT ARTICLES: ", st);
        st = this.measure(single, "right");
        enyo.log("RIGHT SINGLE ARTICLE: ", st);
        st = this.measure(body, "right");
        enyo.log("RIGHT BODY: ", st);
        st = this.measure(main, "right");
        enyo.log("RIGHT MAIN: ", st);
        st = this.measure(mainPane, "right");
        enyo.log("RIGHT MAIN PANE: ", st);
        st = this.measure(mainPaneClient, "right");
        enyo.log("RIGHT MAIN PANE CLIENT", st);
        st = this.measure(bodyReal, "right");
        enyo.log("RIGHT BODY", st);
        enyo.log("************************************************************************");

        var st = this.measure(feed, "margin-left");
        enyo.log("MARGIN LEFT FEEDS: ", st);
        st = this.measure(article, "margin-left");
        enyo.log("MARGIN LEFT ARTICLES: ", st);
        st = this.measure(single, "margin-left");
        enyo.log("MARGIN LEFT SINGLE ARTICLE: ", st);
        st = this.measure(body, "margin-left");
        enyo.log("MARGIN LEFT BODY: ", st);
        st = this.measure(main, "margin-left");
        enyo.log("MARGIN LEFT MAIN: ", st);
        st = this.measure(mainPane, "margin-left");
        enyo.log("MARGIN LEFT MAIN PANE: ", st);
        st = this.measure(mainPaneClient, "margin-left");
        enyo.log("MARGIN LEFT MAIN PANE CLIENT", st);
        st = this.measure(bodyReal, "margin-left");
        enyo.log("MARGIN LEFT BODY", st);
        enyo.log("************************************************************************");

        var st = this.measure(feed, "margin-right");
        enyo.log("MARGIN RIGHT FEEDS: ", st);
        st = this.measure(article, "margin-right");
        enyo.log("MARGIN RIGHT ARTICLES: ", st);
        st = this.measure(single, "margin-right");
        enyo.log("MARGIN RIGHT SINGLE ARTICLE: ", st);
        st = this.measure(body, "margin-right");
        enyo.log("MARGIN RIGHT BODY: ", st);
        st = this.measure(main, "margin-right");
        enyo.log("MARGIN RIGHT MAIN: ", st);
        st = this.measure(mainPane, "margin-right");
        enyo.log("MARGIN RIGHT MAIN PANE: ", st);
        st = this.measure(mainPaneClient, "margin-right");
        enyo.log("MARGIN RIGHT MAIN PANE CLIENT", st);
        st = this.measure(bodyReal, "margin-right");
        enyo.log("MARGIN RIGHT BODY", st);
        enyo.log("************************************************************************");


        var st = this.measure(feed, "padding-left");
        enyo.log("PADDING LEFT FEEDS: ", st);
        st = this.measure(article, "padding-left");
        enyo.log("PADDING LEFT ARTICLES: ", st);
        st = this.measure(single, "padding-left");
        enyo.log("PADDING LEFT SINGLE ARTICLE: ", st);
        st = this.measure(body, "padding-left");
        enyo.log("PADDING LEFT BODY: ", st);
        st = this.measure(main, "padding-left");
        enyo.log("PADDING LEFT MAIN: ", st);
        st = this.measure(mainPane, "padding-left");
        enyo.log("PADDING LEFT MAIN PANE: ", st);
        st = this.measure(mainPaneClient, "padding-left");
        enyo.log("PADDING LEFT MAIN PANE CLIENT", st);
        st = this.measure(bodyReal, "padding-left");
        enyo.log("PADDING LEFT BODY", st);
        enyo.log("************************************************************************");

        var st = this.measure(feed, "padding-right");
        enyo.log("PADDING RIGHT FEEDS: ", st);
        st = this.measure(article, "padding-right");
        enyo.log("PADDING RIGHT ARTICLES: ", st);
        st = this.measure(single, "padding-right");
        enyo.log("PADDING RIGHT SINGLE ARTICLE: ", st);
        st = this.measure(body, "padding-right");
        enyo.log("PADDING RIGHT BODY: ", st);
        st = this.measure(main, "padding-right");
        enyo.log("PADDING RIGHT MAIN: ", st);
        st = this.measure(mainPane, "padding-right");
        enyo.log("PADDING RIGHT MAIN PANE: ", st);
        st = this.measure(mainPaneClient, "padding-right");
        enyo.log("PADDING RIGHT MAIN PANE CLIENT", st);
        st = this.measure(bodyReal, "padding-right");
        enyo.log("PADDING RIGHT BODY", st);
        enyo.log("************************************************************************");

        var st = this.measure(feed, "width");
        enyo.log("WIDTH FEEDS: ", st);
        st = this.measure(article, "width");
        enyo.log("WIDTH ARTICLES: ", st);
        st = this.measure(single, "width");
        enyo.log("WIDTH SINGLE ARTICLE: ", st);
        st = this.measure(body, "width");
        enyo.log("WIDTH BODY: ", st);
        st = this.measure(main, "width");
        enyo.log("WIDTH MAIN: ", st);
        st = this.measure(mainPane, "width");
        enyo.log("WIDTH MAIN PANE: ", st);
        st = this.measure(mainPaneClient, "width");
        enyo.log("WIDTH MAIN PANE CLIENT", st);
        st = this.measure(bodyReal, "width");
        enyo.log("WIDTH BODY", st);
        enyo.log("************************************************************************");


        enyo.log("          ");
        enyo.log("BODY CHILDREN INSPECT");
        var length = bodyReal.children.length;
        enyo.log(Element.inspect(bodyReal));
        for (var i = 0; i < length; i++) {
            enyo.log("          ");
            enyo.log(Element.inspect(bodyReal.children[i]));
        }
        enyo.log("          ");

        setTimeout(this.checkStyle.bind(this), 15000);
    },

    measure: function(el, prop) {
        return document.defaultView.getComputedStyle(el, null).getPropertyValue(prop);
    },

    checkLoggedIn: function() {
        enyo.log("checking if logged in");
        /*
        if (!this.loggedIn) {
            this.api.login(this.credentials, this.loginSuccess.bind(this), this.loginFailure.bind(this));
            setTimeout(this.checkLoggedIn.bind(this), 5000);
        }
        */
    },

    loginSuccess: function() {
        enyo.log("logged in successfully");
        this.loggedIn = true;
        setTimeout(function() {
            this.sources = new AllSources(this.api);
            this.refreshFeeds();
        }.bind(this), 100);
        this.$.loginLabel.setCaption("Logout");
        this.$.loginLabelChrome.setCaption("Logout");
        if (!!enyo.application.launcher) {
            enyo.application.launcher.$.appDashboard.setAlarm();
        }
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
        setTimeout(this.checkFeedsRefreshed.bind(this), 15000);
    },

    checkFeedsRefreshed: function() {
        enyo.log("CHECKING IF FEEDS SUCCESSFULLY REFRESHED");
        var numberOfItems = this.$.feedsView.getStickySourcesLength();
        if (numberOfItems < 2) {
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
                var count = 0;
                for (var i = 0; i < this.sources.subscriptionSources.items.length; i++) {
                    count += this.sources.subscriptionSources.items[i].unreadCount;
                }
                this.sources.setAllUnreadCount(count);

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

    sortAndFilter: function(article) {
        enyo.log("sortin and filterin");
        if (!!this.sortAndFilterTimeout) {
            clearTimeout(this.sortAndFilterTimeout);
            this.sortAndFilterTimeout = 0;
            article = null;
        }
        var timeout = 2500;
        if (!window.PalmSystem) {
            timeout = 0;
        }
        this.sortAndFilterTimeout = setTimeout(function() {
            this.sources.sortAndFilter(function() {
                this.sortAndFilterTimeout = 0;
                var count = 0;
                for (var i = 0; i < this.sources.subscriptionSources.items.length; i++) {
                    count += this.sources.subscriptionSources.items[i].unreadCount;
                }
                this.sources.setAllUnreadCount(count);
                enyo.log("finished sorting");
                /*
                if (!!article) {
                    this.feedsView.setChangeId(article.subscriptionId);
                }
                */
                this.$.feedsView.setStickySources(this.sources.stickySources);
                this.$.feedsView.setSubscriptionSources(this.sources.subscriptionSources);
            }.bind(this), function() {this.sortAndFilterTimeout = 0; enyo.log("error sorting and filtering");});
        }.bind(this), timeout);
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
            Preferences.setAuthToken("");
            Preferences.setRefreshToken("");
            Preferences.setAuthTimestamp(0);
            Preferences.setAuthExpires(0);
            this.credentials.password = false;
            this.credentials.save();
            this.$.loginLabel.setCaption("Login");
            this.$.loginLabelChrome.setCaption("Login");
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
    },

    selectArticle: function(thing, index) {
        this.$.articlesView.selectArticle(index);
    },
    starredArticle: function(thing, index, isStarred) {
        this.$.articlesView.finishArticleStarred(index, isStarred);
    },
    readArticle: function(thing, article, index, isRead) {
        if (isRead) {
            this.sources.articleRead(article.subscriptionId);
        } else {
            this.sources.articleNotRead(article.subscriptionId);
        }
        this.$.articlesView.finishArticleRead(index);
        //this.$.feedsView.refreshLists();
        this.sortAndFilter(article);
    },
    articleRead: function(thing, article, index) {
        this.sources.articleRead(article.subscriptionId);
        this.$.articlesView.finishArticleRead(index);
        this.sortAndFilter(article);
    },

    articleMultipleRead: function(thing, article, index) {
        enyo.log("article mulitiple read");
        //this.sources.articleMultipleRead(article.subscriptionId);
        this.sources.articleRead(article.subscriptionId);
        this.$.articlesView.finishArticleRead(index);
        this.sortAndFilter(article);
    },

    getUnreadCountForSubscription: function(subscriptionId) {
        enyo.log("getting unread count for subscription from main");
        return this.sources.getUnreadCountForSubscription(subscriptionId);
    },
    articleStarred: function() {
        this.$.singleArticleView.articleStarred();
    },
    markedAllRead: function(thing, count, id, isMultiple, articles) {
        if (id == "user/-/state/com.google/reading-list") {
            this.sources.nukedEmAll();
        } else {
            this.sources.markedAllRead(count);
        }
        if (isMultiple === true && !!articles && !!articles.length) {
            for (var i = articles.length; i--;) {
                this.sources.articleRead(articles[i].subscriptionId);
            }
        }
        this.sortAndFilter();
        //this.refreshFeeds();
    },
	changeOffline: function() {
            this.$.articlesView.checkAllArticlesOffline();
		this.$.articlesDB.query("SELECT * FROM articles", {
			onSuccess: function (results) {
				enyo.log("got results successfully");
                                this.offlineArticles = results;
                                if (!!this.sources) {
                                    this.$.feedsView.setStickySources(this.sources.stickySources);
                                }
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
       if (!window.PalmSystem) {
           this.$.chromeMenu.openAtControl(this.$.feedsView.$.notificationButton, {});
       } else {
            var numberOfItems = this.$.feedsView.getStickySourcesLength();
            if (numberOfItems < 2) {
                Feeder.notify("Error: subscriptions not available.");
            } else {
               this.$.notifications.openAtCenter();
            }
       }
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
       this.$.articlesView.articlesChanged();
   },

   animationsChanged: function() {
       this.$.slidingPane.setCanAnimate(Preferences.enableAnimations());
   },

   timerChanged: function() {
        enyo.application.launcher.$.appDashboard.setAlarm();
   },

   combineChanged: function() {
       this.$.feedsView.refreshFeeds();
   },

   forwardSwipe: function(inSender, inEvent) {
       var current = this.$.slidingPane.getViewName();
       switch (current) {
           case "feeds":
                this.$.slidingPane.selectViewByName('articles', true);
                break;
            case "articles":
                this.$.slidingPane.selectViewByName('singleArticle', true);
                break;
            default:
                break;
       }
       inEvent.stopPropagation();
       inEvent.preventDefault();
       return -1;
   },

   backSwipe: function(inSender, inEvent) {
       var current = this.$.slidingPane.getViewName();
       switch (current) {
           case "articles":
                this.$.slidingPane.selectViewByName('feeds', true);
                break;
            case "singleArticle":
                this.$.slidingPane.selectViewByName('articles', true);
                break;
            default:
                break;
       }
       inEvent.stopPropagation();
       inEvent.preventDefault();
       return -1;
   },

   dispatchDomEvent: function(e) {
        //this.log('on' + enyo.cap(e.type));
        if (e.type == "forward") {
            this.forwardSwipe(null, e);
        }
        if (e.type == "orientationchange") {
            this.log("ORIENTATION CHANGED");
        }
        if (e.type == "shakestart") {
            this.log("started shaking");
        }
        if (e.type == "shaking") {
            this.log("IS SHAKING");
        }
        if (e.type == "shakeend") {
            this.log("STOPPED SHAKING");
        }
        if (e.type == "acceleration") {
            this.log("ACCELERATION");
        }
   },

   cleanup: function() {
        enyo.application.launcher.$.appDashboard.setAlarm();
   }
});
