enyo.kind({
    name: "TouchFeeds.Preferences",
    kind: "ModalDialog",
    caption: "Preferences",
    style: "top: 50%; height: auto; width: 400px; background-color: transparent",
    events: {
        onCancel: "",
    },
    components: [
        {layoutKind: "HFlexLayout", pack: "center", components: [
            {content: "Color Scheme:", flex: 1, style: "padding-top: 15px;"},
            {kind: "Button", flex: 1, components: [
                {kind: "ListSelector", name: "colorSchemeSelector", onChange: "colorChanged", items: [
                    {caption: "Standard", value: ""},
                    {caption: "Light", value: "light"}
                ]}
            ]}
        ]},
        {style: "padding-top: 15px; padding-bottom: 15px;", layoutKind: "HFlexLayout", pack: "center", components: [
            {content: "Mark read as you scroll:", flex: 1},
            {name: "scrollToggle", kind: "ToggleButton", flex: 1, onChange: "scrollToggle"}
        ]},
        {layoutKind: "HFlexLayout", pack: "center", components: [
            {kind: "Button", caption: "OK", flex: 1, className: "enyo-button-dark", onclick: "okClick"}
        ]}
    ],

    constructor: function() {
        this.inherited(arguments);
    },

    create: function() {
        this.inherited(arguments);
    },

    ready: function() {
        this.inherited(arguments);
    },

    componentsReady: function() {
        this.inherited(arguments);
        this.$.colorSchemeSelector.setValue(Preferences.getColorScheme());
        this.$.scrollToggle.setState(Preferences.markReadAsScroll());
    },

    colorChanged: function(inSender, inValue, inOldValue) {
        var body = document.body;
        Element.removeClassName(body, "light");
        Element.removeClassName(body, "dark");
        Element.addClassName(body, inValue);
        Preferences.setColorScheme(inValue);
    },

    scrollToggle: function(inSender, inState) {
        Preferences.setMarkReadAsScroll(inState);
    },

    okClick: function() {
        this.doCancel();
    }
});
