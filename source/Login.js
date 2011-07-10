enyo.kind({
    name: "TouchFeeds.Login",
    kind: "ModalDialog",
    caption: "Google Login",
    style: "top: 50%; height: auto; background-color: transparent",
    events: {
        onConfirm: "",
        onCancel: "",
        onLogin: "",
    },
    components: [
        {layoutKind: "HFlexLayout", pack: "center", components: [{name: "loginError", kind: "HtmlContent", showing: false, content: "Login failed. Try again.", className: "enyo-text-error warning-icon"}]},
        {kind: "RowGroup", caption: "EMAIL", components: [
            {kind: "Input", name: "email", hint: "", value: ""}
        ]},
        {kind: "RowGroup", caption: "PASSWORD", components: [
            {kind: "PasswordInput", name: "password", hint: "", value: ""}
        ]},
        {layoutKind: "HFlexLayout", pack: "center", components: [
            {kind: "Button", caption: "Login", flex: 1, style: "height: 2.0em !important;", className: "enyo-button-dark", onclick: "confirmClick", components: [
                {name: "loginLabel", content: "Login", style: "float: left; left: 40%; position: relative; width: auto; font-size: 1.15em !important; padding-top: 0.3em !important;"},
                {kind: "Spinner", showing: false}
            ]},
        ]}
    ],

    constructor: function() {
        this.inherited(arguments);
        this.app = enyo.application.app;
        this.credentials = this.app.credentials;
    },

    create: function() {
        enyo.log("creating dialog box");
        this.inherited(arguments);
        this.results = [];
        //this.$.loginError.hide();
    },

    confirmClick: function() {
        enyo.log("clicked OK");
        //this.$.loginError.show();
        this.$.spinner.show();
        var api = this.app.api;
        api.login({email: this.$.email.getValue(), password: this.$.password.getValue()}, this.loginSuccess.bind(this), this.loginFailure.bind(this));
        //this.$.loginLabel.applyStyle("padding-top", "0.5em");
        //this.doConfirm();
    },

    loginSuccess: function(response) {
        enyo.log("login success: ", response);
        this.$.spinner.hide();
        this.credentials.email = this.$.email.getValue();
        this.credentials.password = this.$.password.getValue();
        this.credentials.save();
        //this.doConfirm();
        this.doLogin();
    },

    loginFailure: function(response) {
        enyo.log("login failure: ", response);
        this.$.loginError.show();
        this.$.spinner.hide();
    },

    cancelClick: function() {
        enyo.log("clicked Cancel");
        //this.$.close();
        this.$.spinner.hide();
        this.$.loginError.hide();
        this.doCancel();
    }
});
