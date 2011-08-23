enyo.kind({
    name: "TouchFeeds.FeedsView",
    kind: "VFlexBox",
    className: "enyo-bg itemLists",
    published: {
        headerContent: "",
        showSpinner: false,
        stickySources: [],
        changeId: "",
        subscriptionSources: []
    },
    events: {
        onFeedClicked: "",
        onRefreshFeeds: "",
        onHeaderClicked: "",
        onNotificationClicked: "",
    },
    openedFolders: [],
    components: [
        //{name: "header", kind: "Header"},
        {name: "header", kind: "PageHeader", components: [
            {name: "headerWrapper", className: "tfHeaderWrapper", components: [
                {name: "headerContent", content: "TouchFeeds", className: "tfHeader", onclick: "headerClicked"}
            ]},
            {kind: "Spinner", showing: false, style: "position: absolute; right: 10px; top: 10px;"}
        ]},
        {kind: "InputBox", className: "itemLists", style: "margin-top: 5px !important; border-width: 0px 14px 1px 14px !important; -webkit-border-image: none !important; margin-bottom: 0 !important; padding-bottom: 5px !important; border-bottom: 1px solid rgba(0, 0, 0, 0.2);", components: [
            {name: "searchQuery", kind: "Input", flex: 1, className: "enyo-input", style: "border-width: 7px 14px 7px 14px !important; margin-left: -8px;", onfocus: "searchFocused", onblur: "searchBlurred", onkeypress: "searchKey", hint: "Tap Here To Search"},
            {kind: "Button", caption: "Search", onclick: "searchClick"}
        ]},
        {kind: "Scroller", flex: 1, className: "itemLists", components: [
            {name: "stickySourcesList", kind: "VirtualRepeater", onSetupRow: "setupStickySources", className: "itemLists", components: [
                {name: "stickyItem", kind: "Item", layoutKind: "VFlexLayout", components: [
                    {name: "stickyTitle", style: "display: inline-block; width: 85%; margin-left: 5px;"},
                    {name: "stickyUnreadCountDisplay", style: "display: inline-block; width: 35px; text-align: left; position: absolute; right: 10px;"}
                ], onclick: "stickyItemClick"}
            ]},
            {name: "sourcesDivider", kind: "Divider", caption: "Subscriptions", className: "itemLists"},
            {name: "subscriptionSourcesList", kind: "VirtualRepeater", onSetupRow: "setupSubscriptionSources", className: "itemLists", components: [
                {name: "subscriptionItem", kind: "SwipeableItem", confirmCaption: "Remove Feed", onConfirm: "confirmedDeleteItem", layoutKind: "VFlexLayout", components: [
                    {name: "title", style: "display: inline-block; width: 85%; margin-left: 5px; font-size: 0.7rem; font-weight: normal !important; height: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"},
                    {name: "unreadCountDisplay", style: "display: inline-block; width: 35px; text-align: left; position: absolute; right: 10px;"}
                    ],
                    onclick: "subscriptionItemClick"
                }
            ]
            }
        ]},
        {kind: "Toolbar", components: [
            {name: "addFeedButton", kind: "IconButton", icon: "images/icon_rss_add.png", onclick: "addFeedClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 60px; top: 11px;"},
            {name: "refreshButton", kind: "IconButton", icon: "images/refresh.png", onclick: "refreshClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 120px; top: 11px;"},
            {name: "notificationButton", kind: "IconButton", icon: "images/icon_bell.png", onclick: "notificationClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 180px; top: 11px;"},
        ]},
		{name: "addFeedPopup", kind: "ModalDialog", components: [
			{kind: "RowGroup", caption: "Enter Feed URL", components: [
				{kind: "Input", name: "feedInput", hint: "", value: "", flex: 3, onfocus: "feedAddFocused", onblur: "feedAddBlurred", onkeypress: "feedAddKey"},
			]},
			{layoutKind: "HFlexLayout", pack: "center", components: [
				{kind: "Button", caption: "", flex: 1, style: "height: 2.0em !important; margin-bottom: 20px !important;", className: "enyo-button-dark", onclick: "confirmClick", components: [
					{name: "feedLabel", content: "OK", style: "float: left; left: 35%; position: relative; width: auto; font-size: 1.15em !important; padding-top: 0.3em !important;"},
					{name: "feedSpinner", kind: "Spinner", showing: false}
				]},
                {kind: "Button", caption: "Cancel", flex: 1, style: "height: 2.0em !important;", className: "enyo-button", onclick: "cancelClick", components: [
                    {name: "cancelLabel", content: "Cancel", style: "float: left; left: 5%; position: relative; width: auto; font-size: 1.15em !important; padding-top: 0.3em !important;"},
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
    getStickySourcesLength: function() {
        if (!!this.stickySources && !!this.stickySources.items && !!this.stickySources.items.length) {
            return this.stickySources.items.length;
        } else {
            return 0;
        }
    },
    setupStickySources: function(inSender, inIndex) {
        enyo.log("sticky sources index: ", inIndex);
        if (!!this.stickySources.items) {
            enyo.log("sticky sources items");
            if ((inIndex == this.stickySources.items.length && (!this.stickySources.items[this.stickySources.items.length - 1].isOffline)) || (!!this.stickySources.items[inIndex] && this.stickySources.items[inIndex].isOffline)) {
                enyo.log("setting offline");
                enyo.log("__________________________________________");
                enyo.log("last item in sticky sources, adding offline");
                this.$.stickyTitle.setContent("Offline Articles");
                this.$.stickyUnreadCountDisplay.setContent(this.app.offlineArticles.length);
                this.$.stickyItem.applyStyle("border-bottom", "none");
                if (!this.stickySources.items[this.stickySources.items.length - 1].isOffline) {
                    this.stickySources.items[this.stickySources.items.length] = {isOffline: true, title: "Offline Articles"};
                }
                return true;
            } else {
                enyo.log("not offline");
                var r = this.stickySources.items[inIndex];
                if (r) {
                    enyo.log("setting source");
                    this.$.stickyTitle.setContent(Encoder.htmlDecode(r.title));
                    this.$.stickyUnreadCountDisplay.setContent(r.unreadCountDisplay);
                    if (inIndex + 1 > this.stickySources.items.length) {
                        this.$.stickyItem.applyStyle("border-bottom", "none");
                    }
                    return true;
                }
            }
        }
    },
    subscriptionSourcesChanged: function() {
        enyo.log("changed subscription sources");
        this.showSpinner = false;
        this.$.spinner.hide();
        this.$.sourcesDivider.show();

        var numberOfItems;

        numberOfItems = 0;
        for (var i = this.subscriptionSources.items.length; i--;) {
            var item = this.subscriptionSources.items[i];
            if (item.icon == "folder" && !!item.subscriptions) {
                numberOfItems++;
            }
        }
        enyo.log("NUMBER OF ITEMS: " + numberOfItems);

        for (var i = this.subscriptionSources.items.length; i--;) {
            var item = this.subscriptionSources.items[i];
            if (this.openedFolders.any(function(n) {return n == item.id;})) {
                if (!!item.subscriptions) {
                    this.closeFolder(item);
                    this.openFolder(item, i);
                }
            }
        }

        numberOfItems = 0;
        for (var i = this.subscriptionSources.items.length; i--;) {
            var item = this.subscriptionSources.items[i];
            if (item.icon == "folder" && !!item.subscriptions) {
                numberOfItems++;
            }
        }
        enyo.log("NUMBER OF ITEMS: " + numberOfItems);

        if (this.changeId !== "") {
            var index = 0;
            for (var i = this.subscriptionSources.items.length; i--;) {
                if (this.subscriptionSources.items[i].subscriptionId == this.changeId) {
                    index = i;
                }
            }
            this.$.subscriptionSourcesList.renderRow(index);
            this.changeId = "";
        } else {
            this.$.subscriptionSourcesList.render();
        }
    },
    setupSubscriptionSources: function(inSender, inIndex) {
        if (!!this.subscriptionSources.items) {
            var r = this.subscriptionSources.items[inIndex];
            if (r) {
                this.$.title.setContent(Encoder.htmlDecode(r.title));
                this.$.unreadCountDisplay.setContent(r.unreadCountDisplay);
                if (r.unreadCountDisplay) {
                    this.$.title.applyStyle("font-weight", "bold !important");
                }
                if (inIndex + 1 >= this.subscriptionSources.items.length) {
                    this.$.subscriptionItem.applyStyle("border-bottom", "none");
                }
                if (inIndex - 1 < 0) {
                    this.$.subscriptionItem.applyStyle("border-top", "none");
                }
                this.$.subscriptionItem.removeClass("rss");
                this.$.subscriptionItem.removeClass("folder");
                this.$.subscriptionItem.removeClass("folderChild");
                this.$.subscriptionItem.addClass(r.icon);
                if (!!r.isFolderChild) {
                    this.$.subscriptionItem.addClass("folderChild");
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
        var tappedSub = this.subscriptionSources.items[inEvent.rowIndex];
        if (!!tappedSub.subscriptions) {
            var nextSub = this.subscriptionSources.items[inEvent.rowIndex + 2];
            enyo.log("CLICKED A FOLDER THINGY");
            if (!!nextSub && nextSub.id == tappedSub.subscriptions.items[0].id) {
                enyo.log("folder opened, close it up");
                this.closeFolder(tappedSub);
                for (var i = this.openedFolders.length; i--;) {
                    if (this.openedFolders[i] == tappedSub.id) {
                        this.openedFolders.splice(i, 1);
                    }
                }
            } else {
                this.openedFolders.push(tappedSub.id);
                //this.openFolder(tappedSub, inEvent.rowIndex);
            }
            this.subscriptionSourcesChanged();
        } else {
            this.doFeedClicked(this.subscriptionSources.items[inEvent.rowIndex]);
        }
    },
    openFolder: function(folder, index) {
        for (var i = folder.subscriptions.items.length; i--;) {
            var itemToAdd = Object.clone(folder.subscriptions.items[i]);
            if (!Preferences.hideReadFeeds() || (Preferences.hideReadFeeds() && itemToAdd.unreadCountDisplay)) {
                itemToAdd.isFolderChild = true;
                this.subscriptionSources.items.splice(index + 1, 0, itemToAdd);
            }
        }
        var folderToAdd = Object.clone(folder);
        folderToAdd.subscriptions = undefined;
        folderToAdd.categories = [{label: folder.title}];
        folderToAdd.title = "All Items - " + folder.title;
        folderToAdd.isFolderChild = true;
        this.subscriptionSources.items.splice(index + 1, 0, folderToAdd);
    },
    closeFolder: function(folder) { 
        var isThisFolder;
        var checkFolder;
        var j;
        var i;
        for (i = this.subscriptionSources.items.length; i--;) {
            if (!!this.subscriptionSources.items[i].isFolderChild) {
                if (!!this.subscriptionSources.items[i].categories) {
                    if (this.subscriptionSources.items[i].categories.any(function(n) {return n.label == folder.title;})) {
                        // item would be in current folder, check to see if it would not also be in another folder
                        for (j = i; j--;) {
                            if (!!this.subscriptionSources.items[j].subscriptions) {
                                checkFolder = this.subscriptionSources.items[j];
                                if (checkFolder.title == folder.title) {
                                    isThisFolder = true;
                                    break;
                                } else {
                                    isThisFolder = false;
                                    break;
                                }
                            }
                        }
                        if (isThisFolder) {
                            this.subscriptionSources.items.splice(i, 1);
                        }
                    }
                }
            }
        }
    },
    refreshLists: function() {
        enyo.log("REFRESHING LISTS");
        this.$.stickySourcesList.refresh();
        this.$.subscriptionSourcesList.refresh();
    },
    searchClick: function() {
        var query = this.$.searchQuery.getValue();
        if (query === "") {
            return;
        }
        this.doFeedClicked(new Search(this.app.api, query));
        this.$.searchQuery.setValue("");
        enyo.keyboard.hide();
    },
    searchFocused: function(source, event) {
        Element.setStyle(this.$.searchQuery.node, {marginLeft: 0});
        enyo.keyboard.show();
    },
    feedAddFocused: function(source, event) {
        enyo.keyboard.show(enyo.keyboard.typeURL);
    },
    searchBlurred: function() {
        Element.setStyle(this.$.searchQuery.node, {marginLeft: "-8px"});
        enyo.keyboard.hide();
    },
    feedAddBlurred: function() {
    },
    searchKey: function(source, event) {
        if (event.keyCode == 13) {
            this.searchClick();
        }
    },
    feedAddKey: function(source, event) {
        if (event.keyCode == 13) {
            this.confirmClick();
        }
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
        this.app.api.addSubscription(this.$.feedInput.getValue(), this.addFeedSuccess.bind(this), function() {Feeder.notify("Could not add feed"); this.$.feedSpinner.hide(); this.$.addFeedPopup.close();}.bind(this));
        enyo.keyboard.hide();
        //check for feeds
    },
    cancelClick: function() {
        this.$.addFeedPopup.close();
        enyo.keyboard.hide();
    },
    addFeedSuccess: function() {
        Feeder.notify("Successfully added feed");
        this.doRefreshFeeds();
        this.$.feedInput.setValue("");
        this.$.feedSpinner.hide();
            this.$.addFeedPopup.close();
    },
    refreshClick: function() {
        this.doRefreshFeeds();
    },
    notificationClick: function() {
        this.doNotificationClicked();
    },
    confirmedDeleteItem: function(inSender, inIndex) {
        enyo.log("wanted to delete item: ", inIndex);
        this.app.api.unsubscribe(this.subscriptionSources.items[inIndex], this.unsubscribedFeed.bind(this));
    },
    unsubscribedFeed: function() {
        Feeder.notify("Successfully removed feed");
        this.doRefreshFeeds();
    },
    headerClicked: function() {
        this.doHeaderClicked();
    },
    refreshFeeds: function() {
        this.doRefreshFeeds();
    }
});
