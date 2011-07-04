enyo.kind({
    name: "FeedReader.Test",
    message: "thing testing",
    create: function() {
        enyo.log("creating test kind");
    },
    echo: function() {
        return (function() {
            return this.message;
        }.bind(this))();
    }
});
