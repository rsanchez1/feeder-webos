enyo.kind({
    name: "TouchFeeds.Test3",
    message3: "Testing kind inheritance",
    create: function() {
        enyo.log("creating Test3");
        //this.inherited(arguments);
        enyo.log("created Test3");
    },
    constructor: function() {
        enyo.log("constructing Test3");
        //this.inherited(arguments);
        enyo.log("constructed Test3");
    }
});
