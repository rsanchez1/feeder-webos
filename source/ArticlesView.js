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
		offlineArticles: []
    },
    events: {
        onArticleClicked: "",
        onArticleRead: "",
        onAllArticlesRead: "",
        onArticleStarred: ""
    },
    isRendered: false,
    articleClicked: false,
    markReadTimeout: 0,
    itemsToMarkRead: [],
    itemsToHide: {},
    originCount: {},
    components: [
        //{name: "header", kind: "Header"},
        {name: "header", kind: "PageHeader", components: [
            {name: "headerWrapper", className: "tfHeaderWrapper", components: [
                {name: "headerContent", onclick: "headerClick", content: "All Articles", className: "tfHeader"}
            ]},
            {kind: "Spinner", showing: true, className: "tfSpinner",}
        ]},
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
        ]},
        {name: "fontsPopup", kind: "Menu", modal: false, dismissWithClick: true, components: [
            {caption: "Small", onclick: "chooseFont"},
            {caption: "Medium", onclick: "chooseFont"},
            {caption: "Large", onclick: "chooseFont"},
        ]},
    ],
    create: function() {
        this.inherited(arguments);
        this.headerContentChanged();
        this.app = enyo.application.app;
        globalList = this.$.articlesList;
    },
    headerContentChanged: function() {
        //this.$.header.setContent(this.headerContent);
        this.$.headerContent.setContent(Encoder.htmlDecode(this.headerContent));
    },
    offlineArticlesChanged: function() {
        this.articlesChangedHandler();
        this.maxTop = 0;
		enyo.log("changed offline articles");
        for (var i = this.offlineArticles.length; i--;) {
            this.offlineArticles[i].sortDate = +(new Date(this.offlineArticles[i].displayDate));
            this.offlineArticles[i].sortOrigin = this.offlineArticles[i].origin.replace(/[^a-zA-Z 0-9 ]+/g,'');
        }
        this.$.spinner.hide();
        if (!!this.articles.reset) {
            this.articles.reset();
        }
        if (!!this.articles.items) {
            this.articles.items = [];
        }
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
	},
    articlesChanged: function() {
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
        enyo.log("got articles");
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
    },
    foundArticles: function() {
        enyo.log("Found articles");
        if (Preferences.hideReadArticles()) {
            enyo.log("hide read articles");
            for (var i = this.articles.items.length; i--;) {
                enyo.log("is article read? ", this.articles.items[i].isRead);
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
            enyo.log('preparing to sort articles');
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
            enyo.log('finished sorting articles');
        }
        if (this.isRendered) {
            enyo.log("refresh list");
            this.$.articlesList.refresh();
        } else {
            enyo.log("render list");
            this.isRendered = true;
            this.$.articlesList.render();
        }
        if (this.articles.items.length) {
            this.selectArticle(0);
        }
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
                    this.$.title.setContent(Encoder.htmlDecode(r.title));
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
                                    this.$.articleItem.removeClass("unread-item");
                                    articles[i].isRead = true;
                                }
                            }
                            this.maxTop = scroller.top;
                        }
                        if (scroller.bottom >= articles.length - (this.$.articlesList.getLookAhead()) && !this.offlineArticles.length) {
                            var count = this.articles.getUnreadCount();
                            for (var i = this.maxTop; i < articles.length; i++) {
                                if (!articles[i].isRead && !articles[i].keepUnread) {
                                    this.addToMarkReadQueue(articles[i], i);
                                    this.$.articleItem.removeClass("unread-item");
                                    articles[i].isRead = true;
                                }
                            }
                        }
                    }
                    if (articles.length == 1) {
                        this.$.articleItem.addClass("firstRow");
                        this.$.articleItem.addClass("lastRow");
                    }
                    setTimeout(function(index) {
                        this.$.articlesList.prepareRow(index);
                        if (!!this.$.title.node) {
                            var title = this.$.title.node;
                            while (title.scrollHeight > (+title.offsetHeight * 1.20)) { //give it some errork
                                title.innerHTML = title.innerHTML.replace(/\W*\s(\S)*$/, "...");
                            }
                        }
                    }.bind(this, inIndex), 10);
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
        this.itemsToMarkRead.push({article: article, index: index});
        this.markReadTimeout = setTimeout(function() {
            enyo.log("TRIGGERED MARK ARTICLE READ TIMEOUT");
            if (this.itemsToMarkRead.length == this.articles.items.length) {
                var count = this.articles.getUnreadCount();
                this.articles.markAllRead(this.markedAllArticlesRead.bind(this, count, true), function() {enyo.log("error marking all read");});
            } else {
                for (var i = this.itemsToMarkRead.length; i--;) {
                    var article = this.itemsToMarkRead[i].article;
                    var index = this.itemsToMarkRead[i].index;
                    article.turnReadOn(this.markedArticleRead.bind(this, article, index), function() {enyo.log("could not mark article read");});
                }
            }
            this.itemsToMarkRead = [];
            this.markReadTimeout = 0;
            enyo.log("FINISHED MARKING ARTICLES READ");
        }.bind(this), 1500);
    },

    markedArticleRead: function(article, index) {
        this.finishArticleRead(index);
        this.doArticleRead(article, index);
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
                enyo.log("hide all articles");
                enyo.log("set articles");
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
                enyo.log("marked articles to be hidden");
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
                enyo.log("show all articles");
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
                enyo.log("marked all articles to be shown");
            }
            enyo.log("refresh articles list");
            this.$.articlesList.refresh();
        }
    },
    articleDividerClick: function(inSender, inEvent) {
        enyo.log("clicked article divider: ", inEvent.rowIndex);
        var articles = [];
        if (this.offlineArticles.length) {
            articles = this.offlineArticles;
        } else {
            if (!!this.articles.items) {
                articles = this.articles.items;
            }
        }
        enyo.log("set articles");
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
                enyo.log("show articles");
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
            enyo.log("refresh list");
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
        }
        this.articleClicked = false;
        var article;
        var length = 0;
        if (this.offlineArticles.length) {
            article = this.offlineArticles[index];
            length = this.offlineArticles.length;
        } else {
            article = this.articles.items[index];
            length = this.articles.items.length;
        }
        this.doArticleClicked(article, index, length - 1);
        this.$.articlesList.refresh();
        /*
        this.$.articlesList.updateRow(index);
        this.$.articlesList.updateRow(previousIndex);
        */
    },
    finishArticleRead: function(index) {
        this.$.articlesList.updateRow(index);
    },
    finishArticleStarred: function(index, isStarred) {
        enyo.log("finished article star");
        this.$.articlesList.updateRow(index);
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
				this.articles.markAllRead(this.markedAllArticlesRead.bind(this, count), function() {enyo.log("error marking all read");});
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
            enyo.log("got articles");
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
    markedAllArticlesRead: function(count, wasScrolling) {
        enyo.log("marked all articles read: ", count);
        this.$.spinner.hide();
        if (!this.articles.getUnreadCount()) {
            enyo.log("selecting feeds view");
            if (!wasScrolling) {
                this.app.$.slidingPane.selectViewByName('feeds', true);
                this.$.articlesList.punt();
            }
        }
        this.doAllArticlesRead(count, this.articles.id);
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
