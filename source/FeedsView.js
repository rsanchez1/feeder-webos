enyo.kind({
    name: "TouchFeeds.FeedsView",
    kind: "VFlexBox",
    className: "enyo-bg",
    published: {
        headerContent: "",
        showSpinner: false,
        stickySources: [],
        subscriptionSources: []
    },
    events: {
        onFeedClicked: "",
        onRefreshFeeds: "",
    },
    components: [
        //{name: "header", kind: "Header"},
        {name: "header", kind: "PageHeader", components: [
            {name: "headerWrapper", className: "tfHeaderWrapper", components: [
                {name: "headerContent", content: "TouchFeeds", className: "tfHeader"}
            ]},
            {kind: "Spinner", showing: false, style: "position: absolute; right: 10px; top: 10px;"}
        ]},
        {name: "stickySourcesList", kind: "VirtualRepeater", onSetupRow: "setupStickySources", components: [
            {name: "stickyItem", kind: "Item", layoutKind: "VFlexLayout", components: [
                {name: "stickyTitle", style: "display: inline-block; width: 85%; margin-left: 5px;"},
                {name: "stickyUnreadCountDisplay", style: "display: inline-block; width: 35px; text-align: left; position: absolute; right: 10px;"}
            ], onclick: "stickyItemClick"}
        ]},
        {name: "sourcesDivider", kind: "Divider", caption: "Subscriptions"},
        {kind: "Scroller", flex: 1, components: [
            {name: "subscriptionSourcesList", kind: "VirtualRepeater", onSetupRow: "setupSubscriptionSources", components: [
                {name: "subscriptionItem", kind: "SwipeableItem", confirmCaption: "Remove Feed", onConfirm: "confirmedDeleteItem", layoutKind: "VFlexLayout", components: [
                    {name: "title", style: "display: inline-block; width: 85%; margin-left: 5px; font-size: 0.7rem; font-weight: 500; height: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"},
                    {name: "unreadCountDisplay", style: "display: inline-block; width: 35px; text-align: left; position: absolute; right: 10px;"}
                    ],
                    onclick: "subscriptionItemClick"
                }
            ]
            }
        ]},
        {kind: "Toolbar", components: [
            {name: "addFeedButton", kind: "IconButton", icon: "images/icon_rss_add.png", onclick: "addFeedClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 0; top: 11px;"},
            {name: "refreshButton", kind: "IconButton", icon: "images/refresh.png", onclick: "refreshClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 60px; top: 11px;"},
        ]},
		{name: "addFeedPopup", kind: "ModalDialog", components: [
			{kind: "RowGroup", caption: "Enter Feed URL", components: [
				{kind: "Input", name: "feedInput", hint: "", value: "", flex: 3},
			]},
			{layoutKind: "HFlexLayout", pack: "center", components: [
				{kind: "Button", caption: "", flex: 1, style: "height: 2.0em !important; margin-bottom: 20px !important;", className: "enyo-button-dark", onclick: "confirmClick", components: [
					{name: "feedLabel", content: "OK", style: "float: left; left: 45%; position: relative; width: auto; font-size: 1.15em !important; padding-top: 0.3em !important;"},
					{name: "feedSpinner", kind: "Spinner", showing: false}
				]},
			]}
		]},
    ],
    create: function() {
        this.inherited(arguments);
        this.headerContentChanged();
    },
    ready: function() {
        this.app = enyo.application.app;
        this.$.sourcesDivider.hide();
    },
    showSpinnerChanged: function() {
        if (this.showSpinner) {
            this.$.spinner.show();
            this.$.spinner.applyStyle("display", "inline-block");
        } else {
            this.$.spinner.hide();
        }
    },
    headerContentChanged: function() {
        this.$.headerContent.setContent(Encoder.htmlDecode(this.headerContent));
    },
    stickySourcesChanged: function() {
        enyo.log("changed sticky sources");
        this.$.stickySourcesList.render();
    },
    setupStickySources: function(inSender, inIndex) {
        enyo.log("sticky sources index: ", inIndex);
        if (!!this.stickySources.items) {
            if (inIndex == this.stickySources.items.length && (!this.stickySources.items[this.stickySources.items.length - 1].isOffline)) {
                enyo.log("last item in sticky sources, adding offline");
                this.$.stickyTitle.setContent("Offline Articles");
                this.$.stickyUnreadCountDisplay.setContent(this.app.offlineArticles.length);
                this.$.stickyItem.applyStyle("border-bottom", "none");
                this.stickySources.items[this.stickySources.items.length] = {isOffline: true, title: "Offline Articles"};
                return true;
            } else {
                var r = this.stickySources.items[inIndex];
                if (r) {
                    this.$.stickyTitle.setContent(Encoder.htmlDecode(r.title));
                    this.$.stickyUnreadCountDisplay.setContent(r.unreadCountDisplay);
                    /*
                    if (inIndex + 1 >= this.stickySources.items.length) {
                        this.$.stickyItem.applyStyle("border-bottom", "none");
                    }
                    */
                    if (inIndex - 1 < 0) {
                        this.$.stickyItem.applyStyle("border-top", "none");
                    }
                    return true;
                }
            }
        }
    },
    subscriptionSourcesChanged: function() {
        this.showSpinner = false;
        this.$.spinner.hide();
        this.$.sourcesDivider.show();
        this.$.subscriptionSourcesList.render();
    },
    setupSubscriptionSources: function(inSender, inIndex) {
        if (!!this.subscriptionSources.items) {
            var r = this.subscriptionSources.items[inIndex];
            if (r) {
                this.$.title.setContent(Encoder.htmlDecode(r.title));
                this.$.unreadCountDisplay.setContent(r.unreadCountDisplay);
                if (r.unreadCountDisplay) {
                    this.$.title.applyStyle("font-weight", 700);
                }
                if (inIndex + 1 >= this.subscriptionSources.items.length) {
                    this.$.subscriptionItem.applyStyle("border-bottom", "none");
                }
                if (inIndex - 1 < 0) {
                    this.$.subscriptionItem.applyStyle("border-top", "none");
                }
                return true;
            }
        }
    },
    stickyItemClick: function(inSender, inEvent) {
        enyo.log("tapped number: ", inEvent.rowIndex);
        this.doFeedClicked(this.stickySources.items[inEvent.rowIndex]);
    },
    subscriptionItemClick: function(inSender, inEvent) {
        enyo.log("tapped number: ", inEvent.rowIndex);
        this.doFeedClicked(this.subscriptionSources.items[inEvent.rowIndex]);
    },
    reloadFeeds: function() {
        enyo.log("reloading feeds");
        this.$.subscriptionSourcesList.render();
        this.$.stickySourcesList.render();
    },
	addFeedClick: function(source, inEvent) {
        this.$.addFeedPopup.openAtEvent(inEvent);
	},
	confirmClick: function() {
		enyo.log("confirming feed...");
		this.$.feedSpinner.show();
		this.app.api.addSubscription(this.$.feedInput.getValue(), this.addFeedSuccess.bind(this), function() {Feeder.notify("Could not add feed"); this.$.addFeedPopup.close();}.bind(this));
		//check for feeds
	},
	addFeedSuccess: function() {
		Feeder.notify("Successfully added feed");
		this.doRefreshFeeds();
		this.$.addFeedPopup.close();
	},
    refreshClick: function() {
        this.doRefreshFeeds();
    },
	confirmedDeleteItem: function(inSender, inIndex) {
		enyo.log("wanted to delete item: ", inIndex);
		this.app.api.unsubscribe(this.subscriptionSources.items[inIndex], this.unsubscribedFeed.bind(this));
	},
	unsubscribedFeed: function() {
		Feeder.notify("Successfully removed feed");
        this.doRefreshFeeds();
    },
});