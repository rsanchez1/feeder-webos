enyo.kind({
    name: "TouchFeeds.Test2",
    kind: "TouchFeeds.Test3",
    create: function() {
        enyo.log("creating Test2");
        this.inherited(arguments);
        enyo.log("created Test2");
    },
    constructor: function() {
        enyo.log("constructing Test2");
        this.inherited(arguments);
        enyo.log("constructed Test2");
    },
    echo: function() {
        return this.message3;
    }
});
