enyo.kind({
    name: "TouchFeeds.Main",
    kind: enyo.VFlexBox,
    components: [
        {name: "slidingPange", kind: "SlidingPane", flex: 1, onSelectView: "slidingSelected", components: [
            {name: "feeds", width: "320px", components: [
                {name: "feedsView", kind: "TouchFeeds.FeedsView", headerContent: "TouchFeeds", flex: 1, components: [], onFeedClicked: "feedClicked"}
            ]},
            {name: "articles", width: "320px", fixedWidth: true, components: [
                {name: "articlesView", kind: "TouchFeeds.ArticlesView", headerContent: "All Items", flex: 1, components: [], onArticleClicked: "articleClicked", onArticleRead: "articleRead"}
            ]},
            {name: "singleArticle", flex: 1, dismissible: true, onHide: "hideArticle", onShow: "showArticle", onResize: "slidingResize", components: [
                {name: "singleArticleView", kind: "TouchFeeds.SingleArticleView", flex: 1, components: []},
            ]},
            {name: "login", className: "enyo-bg", kind: "TouchFeeds.Login", onCancel: "closeDialog", onConfirm: "confirmDialog", onLogin: "handleLogin"}
        ]},
        {kind: "AppMenu", components: [
            {kind: "EditMenu"},
            /*{caption: "Login", onclick: "showLogin"}*/
        ]}
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
        if (this.credentials.email && this.credentials.password) {
            enyo.log("Login API");
            this.api.login(this.credentials, this.loginSuccess.bind(this), this.loginFailure.bind(this));
        } else {
            enyo.log("get login information from user");
            setTimeout(function() {this.$.login.openAtCenter();}.bind(this), 0);
        }
    },

    loginSuccess: function() {
        enyo.log("logged in successfully");
        this.$.feedsView.setShowSpinner(true);
        this.sources = new AllSources(this.api);
        this.sources.findAll(
            function() {
                enyo.log("Filtering and refreshing...");
                this.filterAndRefresh(function() {
                    this.$.articlesView.setHeaderContent("All Items");
                    this.$.articlesView.setArticles(this.sources.stickySources.items[0]);
                }.bind(this));
            }.bind(this),

            function() {
                enyo.log("Error fetching all feeds");
            }
        );
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
    },

    openAppMenuHandler: function() {
        this.$.appMenu.open();
    },

    closeAppMenuHandler: function() {
        this.$.appMenu.close();
    },

    showLogin: function() {
        this.$.login.openAtCenter();
    },

    closeDialog: function() {
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
        this.$.articlesView.setArticles(item); //pushing all articles to articles view
    },

    articleClicked: function(thing, article) {
        this.$.singleArticleView.setArticle(article);
    },

    articleRead: function(thing, article) {
        enyo.log("marked an article read");
        this.sources.articleRead(article.subscriptionId);
        enyo.log("article title: ", article.title);
        enyo.log("article subscription id: ", article.subscriptionId);
        //this.$.feedsView.reloadFeeds();
        /*
        this.sources.findAll(
            function() {
                enyo.log("Filtering and refreshing...");
                this.filterAndRefresh();
            }.bind(this),

            function() {
                enyo.log("Error fetching all feeds");
            }
        );
        */
        this.sources.sortAndFilter(function() {
            this.$.feedsView.setStickySources(this.sources.stickySources);
            this.$.feedsView.setSubscriptionSources(this.sources.subscriptionSources);
        }.bind(this), function() {enyo.log("error sorting and filtering");});
    }
});
