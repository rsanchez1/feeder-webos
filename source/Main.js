enyo.kind({
    name: "TouchFeeds.Main",
    kind: enyo.VFlexBox,
    components: [
        {name: "slidingPange", kind: "SlidingPane", flex: 1, onSelectView: "slidingSelected", components: [
            {name: "feeds", width: "320px", components: [
                {kind: "TouchFeeds.FeedsView", headerContent: "TouchFeeds", flex: 1, components: []}
            ]},
            {name: "articles", width: "320px", fixedWidth: true, components: [
                {name: "articlesView", kind: "TouchFeeds.ArticlesView", headerContent: "All Articles", flex: 1, components: []}
            ]},
            {name: "singleArticle", flex: 1, dismissible: true, onHide: "hideArticle", onShow: "showArticle", onResize: "slidingResize", components: [
                {kind: "TouchFeeds.SingleArticleView", headerContent: "Welcome to TouchFeeds", flex: 1, components: []},
            ]},
            {name: "login", className: "enyo-bg", kind: "TouchFeeds.Login", onCancel: "closeDialog", onConfirm: "confirmDialog", onLogin: "handleLogin"}
        ]},
        {kind: "AppMenu", components: [
            {kind: "EditMenu"},
            {caption: "Login", onclick: "showLogin"}
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
        enyo.log("Email: ", this.credentials.email);
        enyo.log("Password: ", this.credentials.password);
        if (this.credentials.email && this.credentials.password) {
            //TODO: Turn on Spinner
            enyo.log("Login API");
            this.api.login(this.credentials, this.loginSuccess.bind(this), this.loginFailure.bind(this));
        } else {
            enyo.log("get login information from user");
            setTimeout(function() {this.$.login.openAtCenter();}.bind(this), 0);
        }
        setTimeout(function() {this.$.articlesView.setHeaderContent("headerChanged!");}.bind(this), 2000);
    },

    loginSuccess: function() {
        enyo.log("logged in successfully");
        //TODO: Initiate feeds here
        this.sources = new AllSources(this.api);
        this.sources.findAll(
            function() {
                enyo.log("Filtering and refreshing...");
                this.filterAndRefresh();
            }.bind(this),

            function() {
                enyo.log("Error fetching all feeds");
            }
        );
    },

    filterAndRefresh: function() {
        enyo.log("Called filter and refresh");
        this.sources.sortAndFilter(
            function() {
                enyo.log("Sticky sources: ", this.sources.stickySources.items);
                enyo.log("Subscription sources: ", this.sources.subscriptionSources.items);
                this.$.articlesView.setArticles(this.sources.stickySources.items[0]); //pushing all articles to articles view
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
    }
});
