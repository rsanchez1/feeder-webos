enyo.kind({
    name: "Greeder.Main",
    kind: enyo.VFlexBox,
    components: [
        {name: "slidingPange", kind: "SlidingPane", flex: 1, onSelectView: "slidingSelected", components: [
            {name: "feeds", width: "320px", components: [
                {kind: "Greeder.FeedsView", headerContent: "Greeder", flex: 1, components: []}
            ]},
            {name: "articles", width: "320px", fixedWidth: true, components: [
                {kind: "Greeder.ArticlesView", headerContent: "All Articles", flex: 1, components: []}
            ]},
            {name: "singleArticle", flex: 1, dismissible: true, onHide: "hideArticle", onShow: "showArticle", onResize: "slidingResize", components: [
                {kind: "Greeder.SingleArticleView", headerContent: "Welcome to Greeder", flex: 1, components: []},
            ]},
            {name: "login", className: "enyo-bg", kind: "Greeder.Login", onCancel: "closeDialog", onConfirm: "confirmDialog"}
        ]},
        {kind: "AppMenu", components: [
            {kind: "EditMenu"},
            {caption: "Login", onclick: "showLogin"}
        ]}
    ],

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
    }
});
