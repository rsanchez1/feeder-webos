enyo.kind({
    name: "TouchFeeds.Article",
    constructor: function(data, subscription) {
        this.app = enyo.application.app;
        this.api = this.app.api;
        this.id = data.id;
        this.subscription = subscription;
        this.subscriptionId = data.origin ? data.origin.streamId : subscription.id;
        this.title = data.title || "No Title";
        this.author = data.author;
        this.origin = this.api.titleFor(this.subscriptionId);
        var content = data.content || data.summary || {content: ""};
        this.summary = this.cleanUp(content.content);
        this.readLocked = data.isReadLocked;
        this.setStates(data.categories);
        this.setDates(parseInt(data.crawlTimeMsec, 10));\

        this.setArticleLink(data.alternate);
    },

    cleanContent: function(content) {
        var cleaned = this.replaceYouTubeLinks(content);
        cleaned = cleaned.replace(/<script.*?<\/script.*?>/g, "");
        cleaned = cleaned.replace(/<iframe.*?<\/iframe.*?>/g, "");
        cleaned = cleaned.replace(/<object.*?<\/object.*?>/g, "");
        return cleaned;
    },

    replaceYouTubeLinks: function(content) {
        var embed = /<(embed|iframe).*src-"(.*?youtube.com.*?)".*<\/(embed|iframe)>/;
        var urlMatch = embed.exec(content);
        if (urlMatch) {
            var idMatch = /\/(embed|v)\/([_\-a-zA-Z0-9]+)/.exec(urlMatch[2]);
            id (idMatch) {
                var id = idMatch[2];
                content = content.replace(embed, '<div class="youtube"><img class="youtube-thumbnail" src="http://img.youtube.com/vi/' + id + '/0.jpg"><div class="youtube-play" data-url="http://youtube.com/watch?v=' + id + '">%nbsp;</div></div>');
            }
        }
        return content;
    }
