enyo.kind({
    name: "TouchFeeds.Main",
    kind: enyo.VFlexBox,
    components: [
        {name: "slidingPange", kind: "SlidingPane", flex: 1, onSelectView: "slidingSelected", components: [
            {name: "feeds", width: "320px", components: [
                {kind: "TouchFeeds.FeedsView", headerContent: "TouchFeeds", flex: 1, components: []}
            ]},
            {name: "articles", width: "320px", fixedWidth: true, components: [
                {kind: "TouchFeeds.ArticlesView", headerContent: "All Articles", flex: 1, components: []}
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
        this.api = new TouchFeeds.API();
        //this.prefs = new TouchFeeds.Preferences();
        this.allSources = new TouchFeeds.AllSources();
        this.allArticles = new TouchFeeds.AllArticles();
        this.starred = new TouchFeeds.Starred();
        this.shared = new TouchFeeds.Shared();
        this.allSubscriptions = new TouchFeeds.AllSubscriptions();
        enyo.application.app = this;
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
        //TODO: Initiate feeds here
        this.$.login.close();
    }
});
