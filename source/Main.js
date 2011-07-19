enyo.kind({
    name: "TouchFeeds.Main",
    kind: enyo.VFlexBox,
    loggedIn: false,
    components: [
        {name: "slidingPane", kind: "SlidingPane", fixedWidth: true, flex: 1, onSelectView: "slidingSelected", components: [
            {name: "feeds", width: "320px", fixedWidth: true, components: [
                {name: "feedsView", kind: "TouchFeeds.FeedsView", headerContent: "TouchFeeds", flex: 1, components: [], onFeedClicked: "feedClicked", onRefreshFeeds: "refreshFeeds"}
            ]},
            {name: "articles", width: "320px", fixedWidth: true, components: [
                {name: "articlesView", kind: "TouchFeeds.ArticlesView", headerContent: "All Items", flex: 1, components: [], onArticleClicked: "articleClicked", onArticleRead: "articleRead", onAllArticlesRead: "markedAllRead"}
            ]},
            {name: "singleArticle", flex: 1, dragAnywhere: false, dismissible: false, onHide: "hideArticle", onShow: "showArticle", onResize: "slidingResize", components: [
                {name: "singleArticleView", dragAnywhere: false, kind: "TouchFeeds.SingleArticleView", flex: 1, components: [], onSelectArticle: "selectArticle", onRead: "readArticle", onChangedOffline: "changeOffline"},
            ]},
            {name: "login", className: "enyo-bg", kind: "TouchFeeds.Login", onCancel: "closeDialog", onConfirm: "confirmDialog", onLogin: "handleLogin"},
            {name: "preferences", className: "enyo-bg", kind: "TouchFeeds.Preferences", onCancel: "closePreferences"}
        ]},
        {kind: "AppMenu", lazy: false, components: [
            {kind: "EditMenu"},
            {name: "loginLabel", caption: "Login", onclick: "showLogin"},
            {name: "preferenesLabel", caption: "Preferences", onclick: "showPreferences"}
        ]},
		{kind: "onecrayon.Database", name: "articlesDB", database: "ext:TouchFeedsArticles", version: 1, debug: false}
    ],

    constructor: function() {
        this.inherited(arguments);
        this.api = new Api();
        //this.prefs = new TouchFeeds.Preferences();
        this.credentials = new Credentials();
        enyo.application.app = this;
    },

    ready: function() {
        enyo.log("called ready method");
        this.$.appMenu.hide();
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
        if (this.credentials.email && this.credentials.password) {
            enyo.log("Login API");
            this.api.login(this.credentials, this.loginSuccess.bind(this), this.loginFailure.bind(this));
        } else {
            enyo.log("get login information from user");
            setTimeout(function() {this.$.login.openAtCenter();}.bind(this), 0);
        }
        Element.addClassName(document.body, Preferences.getColorScheme());
    },

    loginSuccess: function() {
        enyo.log("logged in successfully");
        this.loggedIn = true;
        this.sources = new AllSources(this.api);
		this.refreshFeeds();
        this.$.loginLabel.setCaption("Logout");
		/*
        this.refreshFeeds(function() {
            this.$.articlesView.setHeaderContent("All Items");
            this.$.articlesView.setArticles(this.sources.stickySources.items[0]);
        }.bind(this));
		*/
    },

    refreshFeeds: function(callback) {
        if (!!this.sources) {
            this.$.feedsView.setShowSpinner(true);
            if (!!callback) {
                callback = function() {};
            }
            this.sources.findAll(
                function() {
                    enyo.log("Filtering and refreshing...");
                    this.filterAndRefresh(callback);
                }.bind(this),

                function() {
                    enyo.log("Error fetching all feeds");
                }
            );
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
            }.bind(this),

            function() {
                enyo.log("Error sorting and filtering");
            }
        );
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

    closeDialog: function() {
        this.$.slidingPane.selectViewByName('articles', true);
        this.$.login.close();
    },

    confirmDialog: function() {
        this.$.login.close();
    },
    
    handleLogin: function() {
        enyo.log("successfully logged in");
        this.$.login.close();
        this.loginSuccess();
    },

    feedClicked: function(thing, item) {
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
        }
        this.$.slidingPane.selectViewByName('articles', true);
        //this.$.slidingPane.selectViewByName('ariclesView', true);
    },

    articleClicked: function(thing, article, index, maxIndex) {
        this.$.singleArticleView.setArticle(article);
        this.$.singleArticleView.setIndex(index);
        this.$.singleArticleView.setMaxIndex(maxIndex);
    },

    selectArticle: function(thing, index) {
        enyo.log("selecting article: ", index);
        this.$.articlesView.selectArticle(index);
    },
    readArticle: function(thing, article, index, isRead) {
        enyo.log("received read event");
        if (isRead) {
            enyo.log("mark article read");
            this.sources.articleRead(article.subscriptionId);
        } else {
            enyo.log("mark article not read");
            this.sources.articleNotRead(article.subscriptionId);
        }
        this.$.articlesView.finishArticleRead(index);
        this.sources.sortAndFilter(function() {
            this.$.feedsView.setStickySources(this.sources.stickySources);
            this.$.feedsView.setSubscriptionSources(this.sources.subscriptionSources);
        }.bind(this), function() {enyo.log("error sorting and filtering");});
    },
    articleRead: function(thing, article, index) {
        this.sources.articleRead(article.subscriptionId);
        this.sources.sortAndFilter(function() {
            this.$.feedsView.setStickySources(this.sources.stickySources);
            this.$.feedsView.setSubscriptionSources(this.sources.subscriptionSources);
        }.bind(this), function() {enyo.log("error sorting and filtering");});
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
    },
	changeOffline: function() {
		this.$.articlesDB.query("SELECT * FROM articles", {
			onSuccess: function (results) {
				enyo.log("got results successfully");
                this.offlineArticles = results;
				if (this.$.articlesView.offlineArticles.length) {
					this.$.articlesView.setOfflineArticles(results);
				}
		   }.bind(this),
			onFailure: function() {
				enyo.log("failed to get results");
			}
		});
   }
});