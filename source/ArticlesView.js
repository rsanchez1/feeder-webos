enyo.kind({
    name: "TouchFeeds.ArticlesView",
    kind: "VFlexBox",
    className: "enyo-bg",
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
    selectedRow: -1,
    numberRendered: 0,
    isRendered: false,
    articleClicked: false,
    maxTop: 0, //maximum that the user has scrolled, to track which articles to mark read
    markReadTimeout: 0,
    originCount: {},
    itemsToMarkRead: [],
    numberToMarkRead: 0,
    wasMarkingAllRead: false,
    itemsToHide: {},
    heights: [],
    wasOfflineSet: false,
    isGettingStarredArticles: false,
    rowsPerPage: 20,
    lastTop: 0,
    wasClicked: false,
    shouldAdjust: false,
    isMouseOver: false,
    mouseY: 0,
    didScrollToTop: false,
    didScrollToBottom: false,
    threshold: 0,
    bottom: -9e9,
    markedReadOnScroll: false,
    components: [
        {name: "header", kind: "PageHeader", components: [
            {name: "headerWrapper", className: "tfHeaderWrapper", components: [
                {name: "headerContent", onclick: "headerClick", content: "All Articles", className: "tfHeader"}
            ]},
            {kind: "Spinner", showing: true, className: "tfSpinner",}
        ]},
        {name: "emptyNotice", content: "There are no articles available.", className: "articleTitle itemLists", style: "font-weight: bold; padding-top: 20px; padding-left: 20px; font-size: 0.9rem;", flex: 1},
            {name: "articlesList", flex: 1, kind: "ScrollingList", rowsPerScrollerPage: 20, onSetupRow: "getListArticles", className: "itemLists", onmousemove: "articleListMouseMove", onmouseout: "articleListMouseOut", onmousewheel: "articleMouseWheel", components: [
                {name: "articleContainer", onmousedown: "articleListClicked", components: [
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
    ready: function() {
        this.inherited(arguments);
        if (!window.PalmSystem) {
            enyo.log("not in webos, set up alternate scrolling");
            //this.$.articlesList.$.scroller.setAccelerated(false);
            setTimeout(this.scrollList.bind(this), 60);
            this.$.articlesList.$.scroller.$.scroll.mousewheel = enyo.bind(this.$.articlesList.$.scroller.$.scroll, function(ev) {
                if (!ev.preventDefault) {
                    this.stop();
                    this.y = this.y0 = this.y0 + ev.wheelDeltaY, this.start();
                }
            });
        }
    },
    componentsReady: function() {
        this.inherited(arguments);
        this.$.articlesList.$.scroller.setAccelerated(false);
    },

    headerContentChanged: function() {
        this.$.headerContent.setContent(Encoder.htmlDecode(this.headerContent));
    },

    /*
     *
     Button Callbacks
     *
     */
    readAllClick: function() {
        if (!this.offlineArticles.length) {
            this.$.spinner.show();
            this.articles.markAllRead(this.markedAllArticlesRead.bind(this, this.articles.items.length, false));
        }
        return;
        if (!this.offlineArticles.length) {
            this.$.spinner.show();
            var articles = [];
            var items = this.articles.items;
            for (var i = items.length; i--;) {
                var article = items[i];
                if (!article.isRead) {
                    articles.push(article);
                    articles[articles.length - 1].index = i;
                }
            }
            this.wasMarkingAllRead = true;
            this.articles.markMultipleArticlesRead(articles, this.markedMultipleArticlesRead.bind(this, articles, true), function() {enyo.log("error marking multiple articles read");});
        }
    },

    refreshClick: function() {
        if (!this.offlineArticles.length) {
            this.$.spinner.show();
            this.$.spinner.applyStyle("display", "inline-block");
            var scroller = this.$.articlesList.$.scroller;
            this.maxTop = 0;
            scroller.adjustTop(0);
            scroller.top = 0;
            /*
            var el = this.$.articlesList.$.scroller.node.firstChild.firstChild;
            el.style.cssText = "height: 2048px; -webkit-transform: translate3d(0px, 0px, 0px);";
            */
            this.articles.reset();
            this.articles.items = [];
            this.$.articlesList.punt();
            this.articles.findArticles(this.foundArticles.bind(this), function() {enyo.log("failed to find articles");});
        } else {
            this.app.feedClicked("", {title: "Offline Articles", isOffline: true}, false);
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
                        Feeder.notify("Saved all articles offline"); 
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
            Feeder.notify("Deleted all articles offline"); 
            this.$.spinner.hide(); 
            this.checkIfArticlesOffline(); 
            this.doChangedOffline();
        }.bind(this), onFailure: function() {Feeder.notify("Failed to delete articles offline"); this.$.spinner.hide();}.bind(this)});
        this.$.offlineChoicePopup.close();
    },

    cancelClick: function() {
        this.$.offlineChoicePopup.close();
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


    /*
     *
     Load Articles
     *
     */
    offlineArticlesChanged: function() {
        this.articlesChangedHandler();
        var scroller = this.$.articlesList.$.scroller;
        this.maxTop = 0;
        this.numberRendered = 0;
        scroller.adjustTop(0);
        scroller.top = 0;
        /*
        var el = this.$.articlesList.$.scroller.node.firstChild.firstChild;
        el.style.cssText = "height: 2048px; -webkit-transform: translate3d(0px, 0px, 0px);";
        */
        for (var i = this.offlineArticles.length; i--;) {
            this.offlineArticles[i].sortDate = +(new Date(this.offlineArticles[i].displayDate));
            this.offlineArticles[i].sortOrigin = this.offlineArticles[i].origin.replace(/[^a-zA-Z 0-9 ]+/g,'');
        }
        this.$.spinner.hide();
        this.articles = [];
        this.heights = [];
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
        scroller.top = 0;
        /*
        var el = this.$.articlesList.$.scroller.node.firstChild.firstChild;
        el.style.cssText = "height: 2048px; -webkit-transform: translate3d(0px, 0px, 0px);";
        */
        this.offlineArticles = [];
        this.articles.items = [];
        this.heights = [];
        this.$.articlesList.punt();
        if (this.articles.canMarkAllRead) {
            this.$.readAllButton.setIcon("images/read-footer.png");
        } else {
            //set disabled state for read button
        }
        this.$.spinner.show();
        this.$.spinner.applyStyle("display", "inline-block");
        this.overrodeHide = false;
        this.originalHide = Preferences.hideReadArticles();
        if (!!this.articles.query || this.articles.title == "Starred" || this.articles.title == "Shared") {
            this.overrodeHide = true;
            Preferences.setHideReadArticles(false);
        }
        //if (isGettingStarredArticles) {
            //this.isGettingStarredArticles = true;
            //this.articles.getStarredArticlesFor(this.foundArticles.bind(this), function() {enyo.log("failed to find starred articles");});
        //} else {
            this.articles.findArticles(this.foundArticles.bind(this), function() {enyo.log("failed to find articles");});
        //}
    },

    articlesChangedHandler: function() {
        this.itemsToMarkRead = [];
        this.lastTop = 0;
        this.bottom = -9e9;
        this.articleListClicked();
        this.shouldAdjust = true;
        this.$.articlesList.removeClass("small");
        this.$.articlesList.removeClass("medium");
        this.$.articlesList.removeClass("large");
        this.$.articlesList.addClass(Preferences.getArticleListFontSize());
        this.itemsToHide = {};
        this.originCount = {};
        this.checkAllArticlesOffline();
    },

    foundArticles: function() {
        if (!this.isGettingStarredArticles) {
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
        }
        this.$.spinner.hide();
        if (this.isRendered) {
            this.$.articlesList.refresh();
        } else {
            this.isRendered = true;
            this.$.articlesList.render();
        }
        if (this.articles.items.length) {
            this.selectArticle(0);
        }
        globalArticles = this.articles;
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
    
    getListArticles: function(inSender, inIndex) {
        if (inIndex < 0) {
            return false;
        }
        var articles = [];
        var inOfflineArticles = false;
        var testDiv = document.getElementById("articleTestDiv");
        var subDiv = document.getElementById("articleSubDiv");
        testDiv.parentNode.setStyle({width: Element.measure(this.$.articlesList.node, "width") + "px"});
        if (!!this.offlineArticles.length) {
            inOfflineArticles = true;
        }
        if (inOfflineArticles) {
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
            if (inIndex > articles.length) {
                return false;
            }
            r = articles[inIndex];
            if (!!r) {
                if (!!this.itemsToHide[r.origin]) {
                    this.$.articleItem.hide();
                    if (!!r.displayOrigin) {
                        this.$.divider.setCaption(r.displayOrigin);
                    } else {
                        this.$.divider.setCaption(r.origin);
                    }
                    this.$.divider.canGenerate = true;
                } else {
                    this.$.articleItem.show();
                    if (!r.isRead && !inOfflineArticles) {
                        this.$.articleItem.addClass("unread-item");
                        testDiv.parentNode.addClassName("unread-item");
                    } else {
                        this.$.articleItem.removeClass("unread-item");
                    }
                    if (r.isStarred && !inOfflineArticles) {
                        this.$.title.addClass("starred");
                        testDiv.addClassName("starred");
                    } else {
                        this.$.title.removeClass("starred");
                    }
                    if (inIndex == this.selectedRow) {
                        this.$.articleItem.addClass("itemSelected");
                        testDiv.parentNode.addClassName("itemSelected");
                    } else {
                        this.$.articleItem.removeClass("itemSelected");
                    }
                    if (this.articles.showOrigin && (Preferences.groupFoldersByFeed())) {
                        this.$.origin.setContent(!!r.displayDateAndTime ? r.displayDateAndTime : r.displayDate);
                        subDiv.innerHTML = !!r.displayDateAndTime ? r.displayDateAndTime : r.displayDate;
                    } else {
                        this.$.origin.setContent(r.origin);
                        subDiv.innerHTML = r.origin;
                    }
                    if (!r.altTitle) {
                        r.altTitle = r.title;
                    }
                    testDiv.innerHTML = Encoder.htmlDecode(r.altTitle);
                    while (testDiv.scrollHeight > (+testDiv.offsetHeight * 1.20)) {
                        r.altTitle = r.altTitle.replace(/\W*\s(\S)*$/, "...");
                        testDiv.innerHTML = Encoder.htmlDecode(r.altTitle);
                    }
                    this.heights[inIndex] = testDiv.parentNode.offsetHeight;
                    if (inIndex != articles.length - 1) {
                        testDiv.removeClassName("starred");
                        testDiv.parentNode.removeClassName("unread-item");
                        testDiv.parentNode.removeClassName("itemSelected");
                        testDiv.innerHTML = "";
                        subDiv.innerHTML = "";
                    }
                    this.$.title.setContent(Encoder.htmlDecode(r.altTitle));
                    if ((inOfflineArticles || this.articles.showOrigin) && (Preferences.groupFoldersByFeed())) {
                        if (inIndex > 0 && articles[inIndex - 1].origin == r.origin) {
                            if (this.$.divider.getCaption() !== null) {
                                this.$.divider.setCaption(null);
                            }
                            this.$.divider.canGenerate = false;
                        } else {
                            if (!!r.displayOrigin) {
                                this.$.divider.setCaption(r.displayOrigin);
                            } else {
                                this.$.divider.setCaption(r.origin);
                            }
                            this.$.divider.canGenerate = true;
                        }
                    } else {
                        if (inIndex > 0 && articles[inIndex - 1].sortDate == r.sortDate) {
                            if (this.$.divider.getCaption() !== null) {
                                this.$.divider.setCaption(null);
                            }
                            this.$.divider.canGenerate = false;
                        } else {
                            this.$.divider.setCaption(r.displayDate);
                            this.$.divider.canGenerate = !!r.displayDate;
                        }
                    }
                    if (Preferences.markReadAsScroll()) {
                        //just add them to mark read queue as they are rendered
                        if (!articles[inIndex].isRead) {
                            this.addToMarkReadQueue(articles[inIndex], inIndex);
                        }
                        /*
                            if (scroller.top > this.maxTop && !this.offlineArticles.length) {
                                for (var i = this.maxTop; i < scroller.top; i++) {
                                    if (!articles[i].isRead) {
                                    }
                                }
                                this.maxTop = scroller.top;
                            }
                            if (scroller.bottom >= articles.length - (this.$.articlesList.getLookAhead()) && !this.offlineArticles.length) {
                                var count = this.articles.getUnreadCount();
                                for (var i = this.maxTop; i < articles.length; i++) {
                                    if (!articles[i].isRead && !articles[i].keepUnread) {
                                        this.addToMarkReadQueue(articles[i], i);
                                    }
                                }
                            }
                            */
                    }
                }
                return true;
            } else {
                return false;
            }
        }
    },
    addToMarkReadQueue: function(article, index) {
        clearTimeout(this.markReadTimeout);
        if (!article.isRead) {
            if (!this.itemsToMarkRead.any(function(n) {return n.article.id == article.id;})) {
                this.itemsToMarkRead.push({article: article, index: index});
            }
        }
        this.markReadTimeout = setTimeout(function() {
            enyo.log("TRIGGERED MARK ARTICLE READ TIMEOUT");
            if (this.itemsToMarkRead.length == this.articles.items.length) {
                //var count = this.articles.getUnreadCount();
                //this.articles.markAllRead(this.markedAllArticlesRead.bind(this, count, true), function() {enyo.log("error marking all read");});
                this.markedReadOnScroll = true;
                this.readAllClick();
            } else {
                var articles = [];
                for (var i = this.itemsToMarkRead.length; i--;) {
                    var article = this.itemsToMarkRead[i].article;
                    if (!article.isRead) {
                        article.index = this.itemsToMarkRead[i].index;
                        articles.push(article);
                    }
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

    markedMultipleArticlesRead: function(articles, markedAllRead) {
        if (!this.articles) {
            return;
        }
        if (!!markedAllRead) {
            this.$.spinner.hide()
            if (!this.markedReadOnScroll) {
                this.app.$.slidingPane.selectViewByName('feeds', true);
            } else {
                this.markedReadOnScroll = false;
            }
            this.$.articlesList.punt();
            this.doAllArticlesRead(articles.length, this.articles.id, true, articles);
        } else {
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
        this.wasClicked = true;
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
                var scroller = this.$.articlesList.$.scroller;
                scroller.adjustTop(0);
                scroller.top = 0;
                /*
                var el = this.$.articlesList.$.scroller.node.firstChild.firstChild;
                el.style.cssText = "height: 2048px; -webkit-transform: translate3d(0px, 0px, 0px);";
                */
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
    articleListClicked: function(thing, event) {
        this.wasClicked = false;
        if (this.shouldAdjust) {
            setTimeout(function() {
                if (!this.wasClicked) {
                    /*
                    var el = this.$.articlesList.$.scroller.node.firstChild.firstChild;
                    el.style.cssText = "height: 2048px; -webkit-transform: translate3d(0px, " + (-this.lastTop) + "px, 0px);";
                    */
                }
                this.wasClicked = true;
            }.bind(this), 100);
            this.shouldAdjust = false;
        }
    },
    setTranslate: function(pixels) {
        return;
        enyo.log("PIXEL TRANSFORM");
        enyo.log(pixels);
        var style = "translate3d(0px, " + (-pixels) + "px, 0px) !important";
        globalStyle = style;
        var el = this.$.articlesList.$.scroller.node.firstChild.firstChild;
        globalEl = el;
        el.style.webkitTransform = style;
        this.lastTop = pixels;
        this.shouldAdjust = true;
    },
    getHalfHeight: function() {
        return this.$.articlesList.node.offsetHeight * .70;
    },
    selectArticle: function(index) {
        var time = new Date;
        this.selectedRow = index;
        var previousIndex = this.app.$.singleArticleView.getIndex();
        if (!(!this.articleClicked && previousIndex > -1 && index > -1)) {
            var info = enyo.fetchDeviceInfo();
            if (!!info) {
                var height = info.screenHeight;
                if (height == 320 || height == 400 || height == 480 || height == 800) {
                    enyo.application.app.$.slidingPane.selectViewByName('singleArticle', true);
                }
            }
        } else {
            (function() {
                var list = this.$.articlesList.node;
                var x = this.findX();
                var y = this.findY();
                var topRow = document.elementFromPoint(x + 10, y + 10).up("#main_articlesView_articlesList_list_client");
                if (!!topRow) {
                    topRow = topRow.getAttribute("rowindex");
                    if (!!topRow) {
                    } else {
                        topRow = 0;
                    }
                } else {
                    topRow = 0;
                }
                if (index < topRow) {
                    //scroll up to reveal row
                    enyo.log("SCROLL UP TO REVEAL ROW");
                    var pageHeightTotals = 0;
                    for (var i = index; i < topRow; i++) {
                        pageHeightTotals += this.heights[i];
                    }
                    this.scrollBy(pageHeightTotals + this.getHalfHeight());
                } else {
                    var bottomRow = document.elementFromPoint(x + 10, y + list.offsetHeight - 10).up("#main_articlesView_articlesList_list_client");
                    if (!!bottomRow) {
                        bottomRow = bottomRow.getAttribute("rowindex");
                        if (!!bottomRow) {
                        } else {
                            bottomRow = 99999;
                        }
                    } else {
                        bottomRow = 99999;
                    }
                    if (index > bottomRow) {
                        //scroll down to reveal row
                        enyo.log("SCROLL DOWN TO REVEAL ROW");
                        var pageHeightTotals = 0;
                        for (var i = bottomRow; i < index; i++) {
                            pageHeightTotals += this.heights[i];
                        }
                        this.scrollBy(-pageHeightTotals - this.getHalfHeight());
                    } else {
                        var pageHeightTotals = 0;
                        for (var i = 0; i < index + 1; i++) {
                            pageHeightTotals += this.heights[i];
                        }
                        var halfHeight = this.getHalfHeight();
                        if (pageHeightTotals + this.heights[index + 1] > halfHeight) {
                            if (index > previousIndex) {
                                //go down
                                this.scrollBy(-this.heights[previousIndex]);
                            } else {
                                //go up
                                this.scrollBy(this.heights[previousIndex]);
                            }
                        } else {
                            if (index > previousIndex) {
                                this.scrollBy(-1);
                            } else {
                                this.scrollBy(1);
                            }
                        }
                    }
                }
            }.bind(this)).defer();
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
        enyo.log("BENCHMARK");
        enyo.log(new Date - time);
        this.doArticleClicked(article, index, length - 1);
        if (!window.PalmSystem) {
            this.$.articlesList.refresh();
            this.$.articlesList.updateRow(index);
            this.$.articlesList.updateRow(previousIndex);
        } else {
            setTimeout(function() {
                this.$.articlesList.refresh();
                this.$.articlesList.updateRow(index);
                this.$.articlesList.updateRow(previousIndex);
            }.bind(this), 300);
        }
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
                this.articlesChanged();
            }
        }
    },

    articleListMouseMove: function(inSource, inEvent) {
        enyo.log("article mouse move");
        this.isMouseOver = true;
        var elY = this.findY(this);
        var y = inEvent.pageY - elY;
        this.mouseY = y;
        /*
        var el = this.$.articlesList.$.scroller.node.firstChild.firstChild;
        if (el.style.cssText.indexOf("important") > -1) {
            el.style.cssText = "height: 2048px; -webkit-transform: translate3d(0px, " + (-this.lastTop) + "px, 0px);";
        }
        */
    },

    findY: function() {
        var list = this.$.articlesList.node;
        var curtop = 0;
        do {
            curtop += list.offsetTop;
        } while (list = list.offsetParent);
        return curtop;
    },

    findX: function() {
        var el = enyo.$.main.$.articlesView.$.articlesList.node.offsetParent;
        var match = el.style.cssText.match(/translate3d\(-{0,1}(\d+)px/);
        var translate3dx = 0;
        if (!!match) {
            translate3dx = +match[1];
        }
        return Element.measure(el, "width") - translate3dx;
        var list = this.$.articlesList.node;
        var curtop = 0;
        do {
            curtop += list.offsetLeft;
        } while (list = list.offsetParent);
        return curtop;
    },

    articleListMouseOut: function() {
        this.isMouseOver = false;
    },

    scrollList: function() {
        if (this.isMouseOver && !window.PalmSystem) {
            if (!!this.$.articlesList.node) {
                var height = this.$.articlesList.node.offsetHeight;
                var y = this.mouseY;
                //if (y < 180) {
                if (y < 60) { // decide between stuff
                    if (!this.didScrollToTop) {
                        if (y < 60) {
                            enyo.log(this.threshold);
                            this.threshold++;
                            if (this.threshold > 5) {
                                this.scrollBy(20);
                            }
                        }/* else if (y < 120) {
                            this.scrollBy(10);
                        } else {
                            this.scrollBy(5);
                        }
                        */
                        if (this.getScrollY() > this.getTopBoundary()) {
                            this.didScrollToTop = true;
                        }
                    }
                } else {
                    this.didScrollToTop = false;
                }
                //if (height - y < 180) {
                if (height - y < 180) {
                    if (!this.didScrollToBottom) {
                        var del = height - y;
                        if (del < 60) {
                            this.threshold++;
                            if (this.threshold > 5) {
                                this.scrollBy(-20);
                            }
                        }/* else if (del < 120) {
                            this.scrollBy(-10);
                        } else {
                            this.scrollBy(-5);
                        }
                        */
                        if (this.getScrollY() < this.getBottomBoundary()) {
                            this.didScrollToBottom = true;
                        }
                    }
                } else {
                    this.didScrollToBottom = false;
                }
                //if (!((y < 180) || (height - y < 180))) {
                if (!((y < 60) || (height - y < 60))) { 
                    this.threshold = 0;
                }
            }
        }
        setTimeout(this.scrollList.bind(this), 60);
    },

    articleMouseWheel: function(inSource, inEvent) {
        var del = inEvent.wheelDeltaY;
        inEvent.stopPropagation();
        inEvent.preventDefault();
        inEvent.wheelDeltaY = 0;
        this.scrollBy(inEvent.wheelDeltaY / 3);
        return -1;
    },

    scrollBy: function(amount) {
        var scroller = this.$.articlesList.$.scroller;
        var scroll = scroller.$.scroll;
        var y = scroll.y;
        this.shouldAdjust = false;
        if (amount < 0) {
            if (y + amount < this.bottom) {
                amount = this.bottom - y - 1;
            }
        } else {
            if (y + amount > 0) {
                amount = -y;
            }
        }
        scroll.mousewheel({wheelDeltaY: amount});
        setTimeout(function() {
            var bottomBoundary = scroll.bottomBoundary;
            if (bottomBoundary == -9e9) {
                return;
            }
            if (this.bottom == -9e9) {
                this.bottom = bottomBoundary;
                return;
            }
            if (bottomBoundary < this.bottom) {
                this.bottom = bottomBoundary;
            }
        }.bind(this), 1000/15);
    },

    getTopBoundary: function() {
        return this.$.articlesList.$.scroller.$.scroll.topBoundary;
    },

    getBottomBoundary: function() { 
        return this.$.articlesList.$.scroller.$.scroll.bottomBoundary;
    },

    getScrollY: function() {
        return this.$.articlesList.$.scroller.$.scroll.y;
    },

    oldSelectArticle: function() {
        //keeping this in just in case it's useful later
            var rowsPerPage = this.rowsPerPage;
            var page = Math.floor(index / rowsPerPage);
            if (page < 0) {
                page = 0;
            }
            var scroller = this.$.articlesList.$.scroller;
            scroller.adjustTop(page);
            scroller.top = page;
            if ((index / rowsPerPage) < 1) {
                var pageHeightTotals = 0;
                var tempHeights = this.heights;
                for (var i = 0; i <  index + 1; i++) {
                    pageHeightTotals += this.heights[i];
                    tempHeights[tempHeights.length] = this.heights[i];
                }
                var halfHeight = this.getHalfHeight();
                if (pageHeightTotals + this.heights[index + 1] > halfHeight) {
                    var newHeight = 0;
                    while (pageHeightTotals > halfHeight) {
                        var height = tempHeights.shift();
                        pageHeightTotals -= height;
                        newHeight += height;
                    }
                    this.setTranslate(newHeight);
                }
            } else {
                var pageHeightTotals = 0;
                for (var i = page * rowsPerPage; i < index + 1; i++) {
                    pageHeightTotals += this.heights[i];
                }
                var top = -(this.getHalfHeight() - pageHeightTotals);
                if (top > 0) {
                    this.setTranslate(top);
                } else {
                    this.setTranslate(0);
                }
            }
    },
});
