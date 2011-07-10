var Feeder = Feeder || {}

//Feeder.Metrix = new Metrix()

Feeder.notify = function(message) {
  //Mojo.Controller.getAppController().showBanner({messageText: message}, "", "feeder")
  enyo.windows.addBannerMessage(message, "{}");
}

Feeder.Event = {
  refreshWanted: "feeder-refresh",
  refreshComplete: "feeder-refresh-complete"
}
