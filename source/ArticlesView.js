enyo.kind({
    name: "TouchFeeds.ArticlesView",
    kind: "VFlexBox",
    selectedRow: -1,
    className: "enyo-bg",
    wasOfflineSet: false,
    maxTop: 0, //maximum that the user has scrolled, to track which articles to mark read
    numberRendered: 0,
    published: {
        headerContent: "",
        articles: [],
		offlineArticles: [],
                wasFolderChild: false,
    },
    events: {
        onArticleClicked: "",
        onArticleRead: "",
        onArticleMultipleRead: "",
        onAllArticlesRead: "",
        onArticleStarred: "",
        onChangedOffline: ""
    },
    isRendered: false,
    articleClicked: false,
    markReadTimeout: 0,
    itemsToMarkRead: [],
    itemsToHide: {},
    originCount: {},
    numberToMarkRead: 0,
    wasMarkingAllRead: false,
    components: [
        //{name: "header", kind: "Header"},
        {name: "header", kind: "PageHeader", components: [
            {name: "headerWrapper", className: "tfHeaderWrapper", components: [
                {name: "headerContent", onclick: "headerClick", content: "All Articles", className: "tfHeader"}
            ]},
            {kind: "Spinner", showing: true, className: "tfSpinner",}
        ]},
		{name: "emptyNotice", content: "There are no articles available.", className: "articleTitle itemLists", style: "font-weight: bold; padding-top: 20px; padding-left: 20px; font-size: 0.9rem;", flex: 1},
        {kind: "Scroller", flex: 1, components: [
            {name: "articlesList", kind: "VirtualList", onSetupRow: "getListArticles", className: "itemLists", components: [
                {kind: "Divider", onclick: "articleDividerClick"},
                {name: "articleItem", kind: "SwipeableItem", layoutKind: "VFlexLayout", onConfirm: "swipedArticle", confirmRequired: false, allowLeft: true, components: [
                    {name: "title", className: "articleTitle", kind: "HtmlContent"},
                    {name: "origin", className: "articleOrigin"},
                    {name: "starred"}
                ], onclick: "articleItemClick"}
            ]}
        ]},
        {kind: "Toolbar", components: [
            {kind: "GrabButton"},
           {name: "readAllButton", kind: "IconButton", icon: "images/read-footer.png", onclick: "readAllClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 60px; top: 11px;"},
            {name: "refreshButton", kind: "IconButton", icon: "images/refresh.png", onclick: "refreshClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 120px; top: 11px;"},
            {name: "fontButton", kind: "IconButton", icon: "images/icon_fonts.png", onclick: "fontClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 180px; top: 11px;"},
            {name: "offlineButton", kind: "IconButton", icon: "images/offline-article.png", onclick: "offlineClick", style: "background-color: transparent !important; -webkit-border-image: none !important; position: absolute; left: 240px; top: 11px;"},
        ]},
        {name: "fontsPopup", kind: "Menu", modal: false, dismissWithClick: true, components: [
            {caption: "Small", onclick: "chooseFont"},
            {caption: "Medium", onclick: "chooseFont"},
            {caption: "Large", onclick: "chooseFont"},
        ]},
        {name: "offlineChoicePopup", kind: "ModalDialog", caption: "Are you sure you want to remove all articles from offline?", components: [
            {layoutKind: "HFlexLayout", pack: "center", components: [
                {kind: "Button", caption: "Yes", flex: 1, style: "height: 2.0em !important;", className: "enyo-button-dark", onclick: "confirmClick", components: [
                    {name: "confirmLabel", content: "Yes", style: "float: left; left: 40%; position: relative; width: auto; font-size: 1.15em !important; padding-top: 0.3em !important;"},
                ]},
                {kind: "Button", caption: "No", flex: 1, style: "height: 2.0em !important;", className: "enyo-button", onclick: "cancelClick", components: [
                    {name: "cancelLabel", content: "No", style: "float: left; left: 40%; position: relative; width: auto; font-size: 1.15em !important; padding-top: 0.3em !important;"},
                ]},
            ]}
        ]},
        
    ],
    create: function() {
        this.inherited(arguments);
        this.headerContentChanged();
        this.app = enyo.application.app;
    },
    headerContentChanged: function() {
        //this.$.header.setContent(this.headerContent);
        this.$.headerContent.setContent(Encoder.htmlDecode(this.headerContent));
    },
    offlineArticlesChanged: function() {
        this.articlesChangedHandler();
        this.maxTop = 0;
        for (var i = this.offlineArticles.length; i--;) {
            this.offlineArticles[i].sortDate = +(new Date(this.offlineArticles[i].displayDate));
            this.offlineArticles[i].sortOrigin = this.offlineArticles[i].origin.replace(/[^a-zA-Z 0-9 ]+/g,'');
        }
        this.$.spinner.hide();
		/*
        if (!!this.articles.reset) {
            this.articles.reset();
        }
        if (!!this.articles) {
            this.articles.items = [];
        }
		*/
		this.articles = [];
        if (Preferences.groupFoldersByFeed()) {
            this.offlineArticles.sort(this.originSortingFunction);
            this.offlineArticles = this.sortSortedArticlesByDate(this.offlineArticles);
        } else {
            if (Preferences.isOldestFirst()) {
                this.offlineArticles.sort(function(a, b) {return a.sortDate - b.sortDate;});
            } else {
                this.offlineArticles.sort(function(a, b) {return b.sortDate - a.sortDate;});
            }
        }
        if (this.isRendered) {
            this.$.articlesList.refresh();
        } else {
            this.isRendered = true;
            this.$.articlesList.render();
        }
        if (this.wasOfflineSet) {
            this.selectArticle(0);
        } else {
            this.wasOfflineSet = true;
        }
		//setTimeout(function() {enyo.log("REFRESHING LIST"); this.$.articlesList.refresh();}.bind(this), 3000);
		if (!!this.offlineArticles.length) {
			this.$.emptyNotice.hide();
		} else {
			this.$.emptyNotice.show();
		}
                this.wasFolderChild = false;
	},
    articlesChanged: function() {
        this.wasFolderChild = false;
        this.articlesChangedHandler();
        var scroller = this.$.articlesList.$.scroller;
        this.maxTop = 0;
        this.numberRendered = 0;
        scroller.adjustTop(0);
        scroller.adjustBottom(10);
        scroller.top = 0;
        scroller.bottom = 10;
		this.offlineArticles = [];
        this.articles.reset();
        this.articles.items = [];
        this.$.articlesList.punt();
        /*
        if (this.isRendered) {
            this.$.articlesList.refresh();
        } else {
            this.isRendered = true;
            this.$.articlesList.render();
        }
        */
        if (this.articles.canMarkAllRead) {
            this.$.readAllButton.setIcon("images/read-footer.png");
        } else {
            //set disabled state for read button
        }
        //this.$.spinner.show();
        this.$.spinner.show();
        this.$.spinner.applyStyle("display", "inline-block");
        this.overrodeHide = false;
        this.originalHide = Preferences.hideReadArticles();
        if (!!this.articles.query || this.articles.title == "Starred" || this.articles.title == "Shared") {
            this.overrodeHide = true;
            Preferences.setHideReadArticles(false);
        }
        this.articles.findArticles(this.foundArticles.bind(this), function() {enyo.log("failed to find articles");});
    },
    articlesChangedHandler: function() {
        this.$.articlesList.removeClass("small");
        this.$.articlesList.removeClass("medium");
        this.$.articlesList.removeClass("large");
        this.$.articlesList.addClass(Preferences.getArticleListFontSize());
        this.itemsToHide = {};
        this.originCount = {};
        this.checkAllArticlesOffline();
    },
    foundArticles: function() {
        if (Preferences.hideReadArticles()) {
            for (var i = this.articles.items.length; i--;) {
                if (this.articles.items[i].isRead) {
                    this.articles.items.splice(i, 1);
                }
            }
        }
        if (this.overrodeHide) {
            Preferences.setHideReadArticles(this.originalHide);
            this.overrodeHide = false;
        }
        //enyo.log("Found articles: ", this.articles);
        this.$.spinner.hide();
        //this.articles.items.sort(function(a, b) {return b.sortDate - a.sortDate;});
        if (Preferences.groupFoldersByFeed()) {
            for (var i = this.articles.items.length; i--;) {
                if (!!this.articles.items[i].displayDateAndTime) {
                    this.articles.items[i].sortDateTime = +(new Date(this.articles.items[i].displayDateAndTime));
                }
                this.articles.items[i].sortDate = +(new Date(this.articles.items[i].displayDate));
                if (!this.articles.items[i].origin) {
                    this.articles.items[i].origin = "Unsubscribed";
                }
                this.articles.items[i].sortOrigin = this.articles.items[i].origin.replace(/[^a-zA-Z 0-9 ]+/g,'');
            }
            if (this.articles.items.length && this.articles.showOrigin) {
                this.articles.items.sort(this.originSortingFunction);
                this.articles.items = this.sortSortedArticlesByDate(this.articles.items);
            }
        }
        if (this.isRendered) {
            this.$.articlesList.refresh();
        } else {
            this.isRendered = true;
            this.$.articlesList.render();
        }
        if (this.articles.items.length) {
            this.selectArticle(0);
        }
		if (!!this.articles.items.length) {
			this.$.emptyNotice.hide();
		} else {
			this.$.emptyNotice.show();
		}
        this.checkIfArticlesOffline();
    },
    checkIfArticlesOffline: function() {
		if (!!this.articles.items) {
			var articles = this.articles.items;
			var numArticles = articles.length;
			for (var i = 0; i < numArticles; i++) {
				this.app.$.articlesDB.query('SELECT articleID FROM articles WHERE title="' + Encoder.htmlEncode(articles[i].title) + '"', {onSuccess: this.offlineCallback.bind(this, articles[i]), onFailure: function() {enyo.log("failed to check if article offline");}});
			}
		} else {
			this.checkAllArticlesOffline();
		}
    },
    offlineCallback: function(article, results) {
        if (results.length) {
            article.isOffline = true;
            article.articleID = results[0].articleID
        } else {
            article.isOffline = false;
            article.articleID = undefined;
        }
        this.checkAllArticlesOffline();
    },
    checkAllArticlesOffline: function() {
		if (!!this.articles.items) {
			var articles = this.articles.items;
			if (articles.any(function(n) {return !n.isOffline;})) {
				this.$.offlineButton.setIcon("images/offline-article.png");
			} else {
				this.$.offlineButton.setIcon("images/delete-article.png");
			}
		} else if (!!this.offlineArticles) {
			this.$.offlineButton.setIcon("images/delete-article.png");
		}
    },
    offlineClick: function() {
        if (!!this.articles.items && !!this.articles.items.length) {
            var articles = this.articles.items;
            if (articles.any(function(n) {return !n.isOffline;})) {
                // offline any articles that are not offline
                var dataToInsert = [];
                for (var i = articles.length; i--;) {
                    if (!articles[i].isOffline) {
                        dataToInsert[dataToInsert.length] = {
                            author: Encoder.htmlEncode(articles[i].author),
                            title: Encoder.htmlEncode(articles[i].title),
                            displayDate: articles[i].displayDate,
                            origin: Encoder.htmlEncode(articles[i].origin),
                            summary: Encoder.htmlEncode(articles[i].summary),
                            url: Encoder.htmlEncode(articles[i].url)
                        }
                    }
                }
                this.app.$.articlesDB.insertData({
                    table: "articles",
                    data: dataToInsert
                }, {
                    onSuccess: function(results) {
                        enyo.windows.addBannerMessage("Saved all articles offline", "{}"); 
                        this.$.spinner.hide(); 
                        this.checkIfArticlesOffline(); 
                        this.doChangedOffline();
                    }.bind(this),
                    onFailure: function() {Feeder.notify("Failed to save articles offline"); this.$.spinner.hide();}.bind(this)
                });
            } else {
                // delete all articles that are offline
                this.$.offlineChoicePopup.openAtCenter();
            }
        } else if (!!this.offlineArticles && !!this.offlineArticles.length) {
            this.$.offlineChoicePopup.openAtCenter();
        }
    },

    confirmClick: function() {
        var articles;
        if (!!this.articles.items && !!this.articles.items.length) {
            articles = this.articles.items;
        } else if (!!this.offlineArticles && !!this.offlineArticles.length) {
            articles = this.offlineArticles;
        } else {
			this.$.offlineChoicePopup.close();
            return;
        }
        var queries = [];
        for (var i = articles.length; i--;) {
            if (!!articles[i].isOffline || !!this.offlineArticles) {
                queries[queries.length] = "DELETE FROM articles WHERE articleID="+articles[i].articleID;
            }
        }
        this.app.$.articlesDB.queries(queries, {onSuccess: function() {
                enyo.windows.addBannerMessage("Deleted all articles offline", "{}"); 
                this.$.spinner.hide(); 
                this.checkIfArticlesOffline(); 
                this.doChangedOffline();
        }.bind(this), onFailure: function() {Feeder.notify("Failed to delete articles offline"); this.$.spinner.hide();}.bind(this)});
        this.$.offlineChoicePopup.close();
    },

    cancelClick: function() {
        this.$.offlineChoicePopup.close();
    },
    
    getListArticles: function(inSender, inIndex) {
        var articles = [];
        if (this.offlineArticles.length) {
            articles = this.offlineArticles;
        } else {
            if (!!this.articles.items) {
                articles = this.articles.items;
            }
        }
        var scroller = this.$.articlesList.$.scroller;
        var numberRendered = scroller.bottom - scroller.top;
        if (numberRendered > this.numberRendered) {
            this.numberRendered = numberRendered;
        }
        if (articles.length) {
            r = articles[inIndex];
            if (r) {
                if (!!this.itemsToHide[r.origin]) {
                    this.$.articleItem.hide();
                    this.$.articleItem.addClass("firstRow");
                    this.$.articleItem.addClass("lastRow");
                    if (!!r.displayOrigin) {
                        this.$.divider.setCaption(r.displayOrigin);
                    } else {
                        this.$.divider.setCaption(r.origin);
                    }
                    this.$.divider.canGenerate = true;
                } else {
                    this.$.articleItem.show();
                    if (!r.altTitle) {
                        r.altTitle = r.title;
                    }
                    this.$.title.setContent(Encoder.htmlDecode(r.altTitle));
                    if (!r.isRead && !this.offlineArticles.length) {
                        this.$.articleItem.addClass("unread-item");
                    } else {
                        this.$.articleItem.removeClass("unread-item");
                    }
                    if (r.isStarred && !this.offlineArticles.length) {
                        this.$.title.addClass("starred");
                    } else {
                        this.$.title.removeClass("starred");
                    }
                    if (this.articles.showOrigin && (Preferences.groupFoldersByFeed())) {
                        this.$.origin.setContent(!!r.displayDateAndTime ? r.displayDateAndTime : r.displayDate);
                    } else {
                        this.$.origin.setContent(r.origin);
                    }
                    if (inIndex + 1 >= articles.length) {
                        this.$.articleItem.addClass("lastRow");
                    } else {
                        this.$.articleItem.removeClass("lastRow");
                    }
                    if (inIndex - 1 < 0) {
                        this.$.articleItem.addClass("firstRow");
                    } else {
                        this.$.articleItem.removeClass("firstRow");
                    }
                    if (inIndex == this.selectedRow) {
                        this.$.articleItem.addClass("itemSelected");
                    } else {
                        this.$.articleItem.removeClass("itemSelected");
                    }
                    if (Preferences.markReadAsScroll()) {
                        if (scroller.top > this.maxTop && !this.offlineArticles.length) {
                            for (var i = this.maxTop; i < scroller.top; i++) {
                                if (!articles[i].isRead) {
                                    this.addToMarkReadQueue(articles[i], i);
                                    //this.$.articleItem.removeClass("unread-item");
                                    //articles[i].isRead = true;
                                }
                            }
                            this.maxTop = scroller.top;
                        }
                        if (scroller.bottom >= articles.length - (this.$.articlesList.getLookAhead()) && !this.offlineArticles.length) {
                            var count = this.articles.getUnreadCount();
                            for (var i = this.maxTop; i < articles.length; i++) {
                                if (!articles[i].isRead && !articles[i].keepUnread) {
                                    this.addToMarkReadQueue(articles[i], i);
                                    //this.$.articleItem.removeClass("unread-item");
                                    //articles[i].isRead = true;
                                }
                            }
                        }
                    }
                    if (articles.length == 1) {
                        this.$.articleItem.addClass("firstRow");
                        this.$.articleItem.addClass("lastRow");
                    }
                    setTimeout(function(index, article) {
                        this.$.articlesList.prepareRow(index);
                        if (!!this.$.title.node) {
                            var title = this.$.title.node;
                            while (title.scrollHeight > (+title.offsetHeight * 1.20)) { //give it some errork
                                article.altTitle = article.altTitle.replace(/\W*\s(\S)*$/, "...");
                                title.innerHTML = Encoder.htmlDecode(article.altTitle);
                            }
                        }
                    }.bind(this, inIndex, r), 10);
                    /*
                    var parentHeight = this.$.articleItem.node.parentNode;
                    var myHeight = this.$.articleItem.node.scrollHeight;
                    enyo.log("MY HEIGHT: ", myHeight);
                    enyo.log("PARENT HEIGHT: ", parentHeight);
                    */
                    if ((this.offlineArticles.length || this.articles.showOrigin) && (Preferences.groupFoldersByFeed())) {
                        if (inIndex > 0 && articles[inIndex - 1].origin == r.origin) {
                            if (this.$.divider.getCaption() !== null) {
                                this.$.divider.setCaption(null);
                            }
                            this.$.divider.canGenerate = false;
                            if (inIndex + 1 < articles.length && articles[inIndex + 1].origin != r.origin) {
                                this.$.articleItem.addClass("lastRow");
                                this.$.articleItem.removeClass("firstRow");
                            }
                        } else {
                            if (!!r.displayOrigin) {
                                this.$.divider.setCaption(r.displayOrigin);
                            } else {
                                this.$.divider.setCaption(r.origin);
                            }
                            this.$.divider.canGenerate = true;
                            this.$.articleItem.addClass("firstRow");
                            if (inIndex + 1 < articles.length && articles[inIndex + 1].origin != r.origin) {
                                this.$.articleItem.addClass("lastRow");
                            } else {
                                if (inIndex + 1 >= articles.length) {
                                    this.$.articleItem.addClass("lastRow");
                                } else {
                                    this.$.articleItem.removeClass("lastRow");
                                }
                            }
                        }
                    } else {
                        if (inIndex > 0 && articles[inIndex - 1].sortDate == r.sortDate) {
                            if (this.$.divider.getCaption() !== null) {
                                this.$.divider.setCaption(null);
                            }
                            this.$.divider.canGenerate = false;
                            if (inIndex + 1 < articles.length && articles[inIndex + 1].sortDate != r.sortDate) {
                                this.$.articleItem.addClass("lastRow");
                                this.$.articleItem.removeClass("firstRow");
                            }
                        } else {
                            this.$.divider.setCaption(r.displayDate);
                            this.$.divider.canGenerate = !!r.displayDate;
                            this.$.articleItem.addClass("firstRow");
                            if (inIndex + 1 < articles.length && articles[inIndex + 1].sortDate != r.sortDate) {
                                this.$.articleItem.addClass("lastRow");
                            } else {
                                if (inIndex + 1 >= articles.length) {
                                    this.$.articleItem.addClass("lastRow");
                                } else {
                                    this.$.articleItem.removeClass("lastRow");
                                }
                            }
                        }
                    }
                }
                return true;
            }
        }
    },
    addToMarkReadQueue: function(article, index) {
        clearTimeout(this.markReadTimeout);
        if (!article.isRead) {
            this.itemsToMarkRead.push({article: article, index: index});
        }
        this.markReadTimeout = setTimeout(function() {
            enyo.log("TRIGGERED MARK ARTICLE READ TIMEOUT");
            if (this.itemsToMarkRead.length == this.articles.items.length) {
                var count = this.articles.getUnreadCount();
                this.articles.markAllRead(this.markedAllArticlesRead.bind(this, count, true), function() {enyo.log("error marking all read");});
            } else {
                var articles = [];
                for (var i = this.itemsToMarkRead.length; i--;) {
                    var article = this.itemsToMarkRead[i].article;
                    if (!article.isRead) {
                        article.index = this.itemsToMarkRead[i].index;
                        articles.push(article);
                    }
                    /*
                    var index = this.itemsToMarkRead[i].index;
                    article.turnReadOn(this.markedArticleRead.bind(this, article, index), function() {enyo.log("could not mark article read");});
                    */
                }
                this.articles.markMultipleArticlesRead(articles, this.markedMultipleArticlesRead.bind(this, articles), function() {enyo.log("error marking multiple articles read");});
            }
            this.itemsToMarkRead = [];
            this.markReadTimeout = 0;
            enyo.log("FINISHED MARKING ARTICLES READ");
        }.bind(this), 1500);
    },

    markedArticleRead: function(article, index) {
        this.finishArticleRead(index);
        this.numberToMarkRead--;
        this.doArticleRead(article, index);
        var count = this.articles.getUnreadCount();
        if (count === 0) {
            this.$.spinner.hide();
            this.app.$.slidingPane.selectViewByName('feeds', true);
            this.$.articlesList.punt();
        }
    },

    markedMultipleArticlesRead: function(articles) {
        if (!this.articles) {
            return;
        }
        var apiArticles = this.articles.items;
        var unreadCountObj = {};
        var count = 0;
        for (var i = articles.length; i--;) {
            var index = articles[i].index;
            var article = apiArticles[index];
            this.doArticleMultipleRead(article, index);
            enyo.log("GETTING UNREAD COUNT FOR SUBSCRIPTION FOR ARTICLE");
            if (!unreadCountObj[article.subscriptionId]) {
                unreadCountObj[article.subscriptionId] = 0;
            }
            unreadCountObj[article.subscriptionId] = this.app.getUnreadCountForSubscription(article.subscriptionId);
            enyo.log("GOT UNREAD COUNT FOR SUBSCRIPTION IN ARTICLE");
        }
        for (var i in unreadCountObj) {
            if (unreadCountObj.hasOwnProperty(i)) {
                count += unreadCountObj[i];
            }
        }
        //var count = this.articles.getUnreadCount();
        enyo.log("COUNT FOR MARKED MULTIPLE: " + count);
        if (count === 0) {
            this.$.spinner.hide()
            if (this.wasMarkingAllRead) {
                this.wasMarkingAllRead = false;
                this.app.$.slidingPane.selectViewByName('feeds', true);
                this.$.articlesList.punt();
            }
        } else {
        }
    },

    markedAllArticlesRead: function(count, wasScrolling) {
        this.$.spinner.hide();
        if (!wasScrolling) {
            this.app.$.slidingPane.selectViewByName('feeds', true);
            this.$.articlesList.punt();
        }
        this.doAllArticlesRead(count, this.articles.id);
    },

    articleItemClick: function(inSender, inEvent) {
        this.articleClicked = true;
        this.selectArticle(inEvent.rowIndex);
    },
    headerClick: function(inSender, inEvent) {
        if ((this.offlineArticles.length || this.articles.showOrigin) && (Preferences.groupFoldersByFeed())) {
            var isEmpty = true;
            for (var i in this.itemsToHide) {
                if (this.itemsToHide.hasOwnProperty(i)) {
                    isEmpty = false;
                }
            }
            var articles = [];
            if (this.offlineArticles.length) {
                articles = this.offlineArticles;
            } else {
                if (!!this.articles.items) {
                    articles = this.articles.items;
                }
            }
            if (isEmpty) {
                for (var l = articles.length; l--;) {
                    if (!this.itemsToHide[articles[l].origin]) {
                        var article = articles[l];
                        this.itemsToHide[article.origin] = {items: []};
                        var firstIndex = -1;
                        for (var z = 0; z < articles.length; z++) {
                            if (articles[z].origin == article.origin) {
                                if (firstIndex < 0) {
                                    firstIndex = z;
                                }
                                var temp = articles.splice(z, 1);
                                this.itemsToHide[article.origin].items.push(temp[0]);
                                z--;
                            }
                        }
                        var itemToSplice = {origin: article.origin, sortOrigin: article.origin.replace(/[^a-zA-Z 0-9 ]+/g, ''), sortDate: article.sortDate};
                        if (!!article.sortDateTime) {
                            itemToSplice.sortDateTime = article.sortDateTime;
                        }
                        articles.splice(z, 0, itemToSplice);
                        l = articles.length;
                    }
                }
                articles.sort(this.originSortingFunction);
                articles = this.sortSortedArticlesByDate(articles);
                var scrollTop = 0;
                var scrollBottom = scrollTop + this.numberRendered;
                if (this.offlineArticles.length) {
                    if (scrollBottom >= this.offlineArticles.length) {
                        scrollBottom = this.offlineArticles.length - 1;
                    }
                } else {
                    if (scrollBottom >= this.articles.items.length) {
                        scrollBottom = this.articles.items.length - 1;
                    }
                }
                var scroller = this.$.articlesList.$.scroller;
                scroller.adjustTop(scrollTop);
                scroller.adjustBottom(scrollBottom);
                scroller.top = scrollTop;
                scroller.bottom = scrollBottom;
            } else {
                for (var origin in this.itemsToHide) {
                    if (this.itemsToHide.hasOwnProperty(origin)) {
                        for (var i = articles.length; i--;) {
                            if (articles[i].origin == origin) {
                                articles.splice(i, 1);
                            }
                        }
                        for (var i = 0; i < this.itemsToHide[origin].items.length; i++) {
                            articles.push(this.itemsToHide[origin].items[i]);
                        }
                        delete this.itemsToHide[origin];
                    }
                }
                articles.sort(this.originSortingFunction);
                articles = this.sortSortedArticlesByDate(articles);
            }
            this.$.articlesList.refresh();
        }
    },
    articleDividerClick: function(inSender, inEvent) {
        var articles = [];
        if (this.offlineArticles.length) {
            articles = this.offlineArticles;
        } else {
            if (!!this.articles.items) {
                articles = this.articles.items;
            }
        }
        var article = articles[inEvent.rowIndex];
        if ((this.offlineArticles.length || this.articles.showOrigin) && (Preferences.groupFoldersByFeed())) {
            if (!!this.itemsToHide[article.origin]) {
                for (var i = articles.length; i--;) {
                    if (articles[i].origin == article.origin) {
                        articles.splice(i, 1);
                    }
                }
                for (var i = 0; i < this.itemsToHide[article.origin].items.length; i++) {
                    articles.push(this.itemsToHide[article.origin].items[i]);
                }
                articles.sort(this.originSortingFunction);
                articles = this.sortSortedArticlesByDate(articles);
                delete this.itemsToHide[article.origin];
            } else {
                this.itemsToHide[article.origin] = {items: []};
                var firstIndex = -1;
                for (var i = 0; i < articles.length; i++) {
                    if (articles[i].origin == article.origin) {
                        if (firstIndex < 0) {
                            firstIndex = i;
                        }
                        var temp = articles.splice(i, 1);
                        this.itemsToHide[article.origin].items.push(temp[0]);
                        i--;
                    }
                }
                var itemToSplice = {origin: article.origin, sortOrigin: article.origin.replace(/[^a-zA-Z 0-9 ]+/g, ''), sortDate: article.sortDate};
                if (!!article.sortDateTime) {
                    itemToSplice.sortDateTime = article.sortDateTime;
                }
                articles.splice(i, 0, itemToSplice);

                articles.sort(this.originSortingFunction);
                articles = this.sortSortedArticlesByDate(articles);
            }
            this.$.articlesList.refresh();
        }
    },
    selectArticle: function(index) {
        this.selectedRow = index;
        var previousIndex = this.app.$.singleArticleView.getIndex();
        //var scrollTo = document.getElementById("page-" + index).offsetTop;
        //enyo.log("scrolling to: ", scrollTo);
        //this.$.scroller.scrollTo(-scrollTo, 0);
        if (!this.articleClicked) {
            var scrollTop = index - Math.floor(this.numberRendered / 2);
            if (scrollTop < 0){
                scrollTop = 0;
            }
            var scrollBottom = scrollTop + this.numberRendered;
            if (!!this.offlineArticles && !!this.offlineArticles.length) {
                if (scrollBottom >= this.offlineArticles.length) {
                    scrollBottom = this.offlineArticles.length - 1;
                }
            } else {
				if (!!this.articles.items && !!this.articles.items.length) {
					if (scrollBottom >= this.articles.items.length) {
						scrollBottom = this.articles.items.length - 1;
					}
				}
            }
            var scroller = this.$.articlesList.$.scroller;
            scroller.adjustTop(scrollTop);
            scroller.adjustBottom(scrollBottom);
            scroller.top = scrollTop;
            scroller.bottom = scrollBottom;
        }
        this.articleClicked = false;
        var article;
        var length = 0;
        if (!!this.offlineArticles && !!this.offlineArticles.length) {
            article = this.offlineArticles[index];
            length = this.offlineArticles.length;
        } else if (!!this.articles.items && !!this.articles.items.length) {
            article = this.articles.items[index];
            length = this.articles.items.length;
        } else {
			this.$.articlesList.refresh();
			return;
		}
        this.doArticleClicked(article, index, length - 1);
        this.$.articlesList.refresh();
        this.$.articlesList.updateRow(index);
        this.$.articlesList.updateRow(previousIndex);
    },
    finishArticleRead: function(index) {
        this.$.articlesList.updateRow(index);
        this.$.articlesList.refresh();
    },
    finishArticleStarred: function(index, isStarred) {
        this.$.articlesList.updateRow(index);
        this.$.articlesList.refresh();
        var article;
        if (this.offlineArticles.length) {
            article = this.offlineArticles[index];
        } else {
            article = this.articles.items[index];
        }
        this.doArticleStarred();
    },
    swipedArticle: function(inSender, inIndex, thing) {
        if (this.articles.items.length) {
            if (this.articles.items[inIndex]) {
                if (this.articles.items[inIndex].isStarred) {
                    this.articles.items[inIndex].turnStarOff(this.finishArticleStarred.bind(this, inIndex, false), function() {Feeder.notify("Failed to remove star");});
                } else {
                    this.articles.items[inIndex].turnStarOn(this.finishArticleStarred.bind(this, inIndex, true), function() {Feeder.notify("Failed to add star");});
                }
            }
        }
    },
    readAllClick: function() {
		if (!this.offlineArticles.length) {
			if (this.articles.canMarkAllRead) {
                            this.$.spinner.show();
                            var count = this.articles.getUnreadCount();
                            if (!this.wasFolderChild) {
                                enyo.log("marking normal articles read");
                                this.articles.markAllRead(this.markedAllArticlesRead.bind(this, count), function() {enyo.log("error marking all read");});
                            } else {
                                enyo.log("marking all folder articles read");

                                var articles = [];
                                var items = this.articles.items;
                                this.$.spinner.show();
                                for (var i = items.length; i--;) {
                                    var article = items[i];
                                    if (!article.isRead) {
                                        articles.push(article);
                                        articles[articles.length - 1].index = i;
                                    }
                                }
                                globalArticles = articles;
                                this.wasMarkingAllRead = true;
                                this.articles.markMultipleArticlesRead(articles, this.markedMultipleArticlesRead.bind(this, articles), function() {enyo.log("error marking multiple articles read");});
                            }
			}
		}
    },
    refreshClick: function() {
        if (!this.offlineArticles.length) {
            var scroller = this.$.articlesList.$.scroller;
            this.maxTop = 0;
            scroller.adjustTop(0);
            scroller.adjustBottom(10);
            scroller.top = 0;
            scroller.bottom = 10;
            this.articles.reset();
            this.articles.items = [];
            this.$.articlesList.punt();
            this.$.spinner.show();
            this.$.spinner.applyStyle("display", "inline-block");
            this.articles.findArticles(this.foundArticles.bind(this), function() {enyo.log("failed to find articles");});
        }
    },
    fontClick: function(source, inEvent) {
        this.$.fontsPopup.openAtEvent(inEvent);
    },
    chooseFont: function(source, inEvent) {
        Preferences.setArticleListFontSize(source.caption.toLowerCase());
        this.$.articlesList.removeClass("small");
        this.$.articlesList.removeClass("medium");
        this.$.articlesList.removeClass("large");
        this.$.articlesList.addClass(Preferences.getArticleListFontSize());
        if (this.isRendered) {
            this.$.articlesList.refresh();
        } else {
            this.isRendered = true;
            this.$.articlesList.render();
        }
    },
    originSortingFunction: function(a, b) {
        var originA = a.sortOrigin.toLowerCase();
        var originB = b.sortOrigin.toLowerCase();
        if (originA < originB) {return -1;}
        if (originB < originA) {return 1;}
        return 0;
    },
    sortSortedArticlesByDate: function(articles) {
        var start = 0;
        var i = 0;
        while (i < articles.length) {
            var temp = [];
            var origin = articles[i].origin;
            while (!!articles[i] && articles[i].origin == origin) {
                temp[temp.length] = articles[i];
                i++;
            }
            if (!!temp[0].sortDateTime) {
                if (Preferences.isOldestFirst()) {
                    temp.sort(function(a, b) {return a.sortDateTime - b.sortDateTime;});
                } else {
                    temp.sort(function(a, b) {return b.sortDateTime - a.sortDateTime;});
                }
            } else {
                if (Preferences.isOldestFirst()) {
                    temp.sort(function(a, b) {return a.sortDate - b.sortDate;});
                } else {
                    temp.sort(function(a, b) {return b.sortDate - a.sortDate;});
                }
            }
            var numberOfArticles = temp.length;
            for (var j = 0; j < temp.length; j++) {
                articles[start + j] = temp[j];
                if (!!this.originCount[articles[start + j].origin]) {
                    articles[start + j].displayOrigin = "(" + this.originCount[articles[start + j].origin] + ") " + articles[start + j].origin;
                } else {
                    articles[start + j].displayOrigin = "(" + numberOfArticles + ") " + articles[start + j].origin;
                    this.originCount[articles[start + j].origin] = numberOfArticles;
                }
            }
            start = i;
        }
        return articles;
    },
    reloadArticles: function() {
        if (this.offlineArticles.length) {
            var articles = this.offlineArticles;
            for (var origin in this.itemsToHide) {
                if (this.itemsToHide.hasOwnProperty(origin)) {
                    for (var i = articles.length; i--;) {
                        if (articles[i].origin == origin) {
                            articles.splice(i, 1);
                        }
                    }
                    for (var i = 0; i < this.itemsToHide[origin].items.length; i++) {
                        articles.push(this.itemsToHide[origin].items[i]);
                    }
                    delete this.itemsToHide[origin];
                }
            }
            if (Preferences.isOldestFirst()) {
                articles.sort(function(a, b) {return a.sortDate - b.sortDate;});
            } else {
                articles.sort(function(a, b) {return b.sortDate - a.sortDate;});
            }
            this.offlineArticlesChanged();
        } else {
            if (this.articles.showOrigin) {
                this.refreshArticles();
            }
        }
    },

    refreshArticles: function() {
        this.articlesChanged();
    }
});
