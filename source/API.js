enyo.kind({
    name: "TouchFeeds.API",
    BASE_URL: "http://www.google.com/reader/api/0/",
    create: function() {
        this.inherited(arguments);
    },

    constructor: function() {
        this.inherited(arguments);
        this.app = enyo.application.app;
    },

    _requestHeaders: function() {
        return {Authorization:"GoogleLogin auth=" + this.auth};
    },

    _getEditToken: function(success, failure) {
        if (this.editToken && (new Date().getTime() - this.editTokenTime < 120000)) {
            success(this.editToken);
        } else {
            var successFunction = enyo.bind(this, function(response) {
                this.editToken = response.responseText;
                this.editTokenTime = new Date().getTime();
                success(this.editToken);
            });
            this.get(this.BASE_URL + "token", {}, successFunction, failure);
        }
    },

    _editTage: function(articleId, subscriptionId, addTag, removeTag, success, failure) {
        this._getEditToken(enyo.bind(this, function(token) {
            var parameters = {
                T: token,
                i: articleId,
                s: subscriptionId
            };
            
            if (addTag) {
                parameters.a = addTag;
            }

            if (removeTag) {
                parameters.r = removeTag;
            }

            this.post(this.BASE_URL + "edit-tag", parameters, success, failure, this.requestHeaders());
        }),
        failure);
    },

    _getArticles: function(id, exclude, continuation, success, failure) {
        var parameters = {output: "json", n: 40};
        var prefs = this.app.prefs;
        if (id != "user/-/state/com.google/starred" && id != "user/-/state/com.google/broadcast" && prefs.isOldestFirst()) {
            parameters.r = "o";
        }
        
        if (continuation) {
            parameters.c = continuation;
        }

        if (exclude) {
            parameters.xt = exclude;
        }

        this.get(this.BASE_URL + "stream/contents/" + escape(id), parameters, function(response) {
            var articles = response.responseText.evalJSON();
            success(articles.items, articles.id, articles.continuation);
        }, failure, this.requestHeaders());
    },

    post: function(url, parameters, success, failure, requestHeaders) {
        enyo.log("post url: ", url);
        enyo.log("parameters: ", parameters);
        enyo.log("request headers: ", requestHeaders);
        if (!requestHeaders) {
            requestHeaders = {};
        }
        enyo.xhrPost({
            url: url,
            load: function(responseText, xhrObject) {
            },
            requestHeaders: requestHeaders
        });
    },

    get: function(url, parameters, success, failure, requestHeaders) {
        enyo.log("get url: ", url);
        enyo.log("parameters: ", parameters);
        enyo.log("request headers: ", requestHeaders);
        if (!!requestHeaders) {
            requestHeaders = null;
        }
        var isFirst = true;
        var separator = "?";
        for (i in parameters) {
            url = url + separator + i + "=" + parameters[i];
            if (isFirst) {
                isFirst = false;
                separator = "&";
            }
        }
        enyo.xhrGet({
            url: url,
            load: function(responseText, xhrObject) {
                success(responseText);
            },
            requestHeaders: requestHeaders
        });
    },

    login: function(credentials, success, failure) {
        var authSuccess = enyo.bind(this, function(response) {
            enyo.log("auth success: ", response);
            enyo.log(response);
            var authMatch = response.match(/Auth\=(.*)/);
            this.auth = authMatch ? authMatch[1] : '';
            if (this.auth) {
                success(this.auth);
            } else {
                failure(this.auth);
            }
        });
        this.get("https://www.google.com/accounts/ClientLogin", {
            service: "reader",
            Email: credentials.mail,
            Passwd: credentials.password,
            accountType: "GOOGLE"
        }, authSuccess, failure);
    },

    getTags: function(success, failure) {
        this.get(this.BASE_URL + "tag/list", {
            output: "json"
        }, success, failure, this.requestHeaders());
    },

    getSortOrder: function(success, failure) {
        this.get(this.BASE_URL + "preference/stream/list", {
            output: "json"
        }, success, failure, this.requestHeaders());
    },

    setSortOrder: function(sortOrder, stream) {
        this._getEditToken(enyo.bind(this, function(token) {
            var parameters = {
                T: token,
                s: stream || "user/-/state/com.google/root",
                k: "subscription-ordering",
                v: sortOrder
            };
            this.post(this.BASE_URL + "preferences/stream/set", parameters, function() {}, function() {}, this.requestHeaders());
        }));
    },

    unsubscribe: function(feed, success) {
        if (feed.constructor == Folder) {
            this.removeLabel(feed);
        } else {
            this._getEditToken(enyo.bind(this, function(token) {
                var parameters = {
                    T: token,
                    s: feed.id,
                    ac: "unsubscribe",
                    t: feed.title
                };

                this.post(this.BASE_URL + "subscription/edit", parameters, ssuccess, function() {}, this.requestHeaders());
            }));
        }
    },

    removeLabel: function(folder, success) {
        this._getEditToken(enyo.bind(this, function(token) {
            var parameters = {
                T: token,
                s: folder.id,
                t: folder.title
            };

            this.post(this.BASE_URL + "disable-tag", parameters, success, function() {}, this.requestHeaders());
        }));
    },

    searchSubscriptions: function(query, success, failure) {
        this.get(this.BASE_URL + "feed-finder", {
            q: query,
            output: "json"
        }, success, failure, this.requestHeaders());
    },

    addSubscription: function(url, success, failure) {
        this._getEditToken(enyo.bind(this, function(token) {
            var parameters = {
                T: token,
                quickadd: url
            };

            var successFunc = function(response) {
                var json = response.responseText.evalJSON();
                if (json.streamId) {
                    success();
                } else {
                    failure();
                }
            };

            this.post(this.BASE_URL + "subscription/quickadd", parameters, successFunc, function() {}, this.requestHeaders());
        }));
    },

    getAllSubscriptions: function(success, failure) {
        var successFunc = enyo.bind(this, function(response) {
            var subscriptions = response.responseText.evalJSON().subscriptions;
            this.cacheTitles(subscriptions);
            success(subscriptions);
        });
        this.get(this.BASE_URL + "subscription/list", {
            output: "json"
        }, successFunc, failure, this.requestHeaders());
    },

    cacheTitles: function(subscriptions) {
        this.titles = {};
        subscriptions.each(enyo.bind(this, function(subscription) {
            this.titles[subscriptions.id] = subscription.title;
        }));
    },

    titleFor: function(id) {
        return this.titles[id];
    },

    getUnreadCounts: function(success, failure) {
        var successFunc = function(response) {
            var json = response.responseText.evalJSON();
            if (json.denied) {
                failuer();
            } else {
                success(json.unreadcounts);
            }
        };
        this.get(this.BASE_URL + "unread-count", {
            output: "json",
        }, successFunc, function() {}, this.requestHeaders());
    },

    getAllArticles: function(continuation, success, failure) {
        //var prefs = new TouchFeeds.Preferences;
        var prefs = this.app.prefs;
        this._getArticles("user/-/state/com.google/reading-list", prefs.hideReadArticles() ? "user/-/state/com.google/read" : null, continuation, success, failure);
    },

    getAllStarred: function(continuation, success, failure) {
        this._getArticles("user/-/state/com.google/starred", null, continuation, success, failure);
    },

    getAllShared: function(continuation, success, failure) {
        this._getArticles("user/-/state/com.google/broadcast", null, continuation, success, failure);
    },

    getAllArticlesFor: function(id, continuation, success, failure) {
        //var prefs = new TouchFeeds.Preferences;
        var prefs = this.app.prefs;
        this._getArticles(id, prefs.hideReadArticles() ? "user/-/state/com.google/read" : null, continuation, success, failure);
    },

    markAllRead: function(id, success, failure) {
        this._getEditToken(enyo.bind(this, function(token) {
            var parameters = {
                T: token,
                s: id
            };

            this.post(this.BASE_URL + "mark-all-as-read", parameters, success, failure, this.requestHeaders());
        }), failure);
    },

    search: function(query, id, success, failure) {
        var parameters = {
            q: query,
            num: 50,
            output: "json"
        };
        if (id) {
            parameters.s = id;
        }


        this.get(this.BASE_URL + "search/items/ids", parameters, enyo.bind(this, this.searchItemsFound, success, failure), failure, this.requestHeaders());
    },

    searchItemsFound: function(success, failure, response) {
        var ids = response.responseText.evalJSON().results;

        if (ids.length) {
            this._getEditToken(enyo.bind(this, function(token) {
                var parameters = {
                    T: token,
                    i: ids.map(function(n) {return n.id})
                };

                this.post(this.BASE_URL + "stream/items/contents", parameters, function(response) {
                    var articles = response.responseText.evalJSON();
                    success(articles.items, articles.id, articles.continuation);
                }, failure, this.requestHeaders());
            }));
        } else {
            success([], "", false);
        }
    },

    setArticleRead: function(articleId, subscriptionId, success, failure) {
        this._editTag(articleId, subscriptionId, "user/-/state/com.google/read", "user/-/state/com.google/kept-unread", success, failure);
    },

    setArticleNotRead: function(articleId, subscriptionId, success, failure, sticky) {
        this._editTag(articleId, subscriptionId, sticky ? "user/-/state/com.google/kept-unread" : null, "user/-/state/com.google/read", success, failure);
    },

    setArticleShared: function(articleId, subscriptionId, success, failure) {
        this._editTag(articleId, subscriptionId, "user/-/state/com.google/broadcast", null, success, failure);
    },

    setArticleNotShared: function(articleId, subscriptionId, success, failure) {
        this._editTag(articleId, subscriptionId, null, "user/-/state/com.google/broadcast", success, failure);
    },

    setArticleStarred: function(articleId, subscriptionId, success, failure) {
        this._editTag(articleId, subscriptionId, "user/-/state/com.google/starred", null, success, failure);
    },

    setArticleNotStarred: function(articleId, subscriptionId, success, failure) {
        this._editTag(articleId, subscriptionId, null, "user/-/state/com.google/starred", success, failure);
    }
});
