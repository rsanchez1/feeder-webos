enyo.kind({
	name: "FeedReader",
	kind: enyo.VFlexBox,
	components: [
        {kind: "PageHeader", components: [
            {kind: enyo.VFlexBox, content: "Enyo FeedReader", flex: 1},
            {name: "backButton", kind: "Button", content: "Back", onclick: "goBack"}
        ]},
        {name: "pane", kind: "Pane", flex: 1, onSelectView: "viewSelected", components: [
            {name: "search", className: "enyo-bg", kind: "FeedReaderSearch", onSelect: "feedSelected", onLinkClick: "linkClicked"},
            {name: "detail", className: "enyo-bg", kind: "Scroller", components: [
                {name: "webView", kind: "WebView", className: "enyo-view"}
            ]
            },
            {name: "login", className: "enyo-bg", kind: "FeedReader.Login", onCancel: "closeDialog", onConfirm: "confirmDialog"}
        ]
        },
        {kind: "AppMenu", components: [
            {kind: "EditMenu"},
            {caption: "Login", onclick: "showLogin"}]}
    ],
    create: function() {
        this.inherited(arguments);
        var test = new FeedReader.Test();
        enyo.log(test.echo());
        this.$.pane.selectViewByName("search");
    },
    openAppMenuHandler: function() {
        this.$.appMenu.open();
    },
    closeAppMenuHandler: function() {
        this.$.appMenu.close();
    },
    showLogin: function() { 
        //this.$.pane.selectViewByName("login");
        this.$.login.openAtCenter();
    },
    feedSelected: function(inSender, inFeed) {
        enyo.log("selected feed");
        this.$.pane.selectViewByName("detail");
        this.$.webView.setUrl(inFeed.link);
        enyo.log("feed link: ", inFeed);
    },
    linkClicked: function(inSender, inUrl) {
        enyo.log("clicked link");
        this.$.webView.setUrl(inUrl);
        this.$.pane.selectViewByName("detail");
    },
    viewSelected: function(inSender, inView) {
        enyo.log("view selected");
        if (inView == this.$.search) {
            enyo.log("search");
            this.$.webView.setUrl("");
            this.$.backButton.hide();
        } else if (inView == this.$.detail) {
            enyo.log("detail");
            this.$.backButton.show();
        }
    },
    goBack: function(inSender, inEvent) {
        enyo.log("go back");
        this.$.pane.back(inEvent);
    },
    closeDialog: function() {
        this.$.login.close();
    },
    confirmDialog: function() {
        this.$.login.close();
    }
});
