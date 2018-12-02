"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://qfn/qfnServices.js");

function AboutNotes() { }
AboutNotes.prototype = {
	classDescription: "NoteStruck About Handler",
	contractID: "@mozilla.org/network/protocol/about;1?what=notes",
	classID: Components.ID("76ef6bc8-bcc9-4814-8016-5fbe0d84e382"),
	QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),

	getURIFlags: function(aURI) {
		return Ci.nsIAboutModule.ALLOW_SCRIPT;
	},

	newChannel: function(aURI, aLoadInfo) {
		var channel;
		
		//QFN is opened in Tab mode
        qfnServices.prefs.setIntPref("openedIn", 2);
        //Close old instance
        qfnServices.prefs.setCharPref("qfnPrefCMD", "");
        qfnServices.prefs.setCharPref("qfnPrefCMD", "closeMe");
		
        let uri = Services.io.newURI("chrome://qfnotes/content/editor.xul", null, null);
        channel = Services.io.newChannelFromURIWithLoadInfo(uri, aLoadInfo);
        
		channel.originalURI = aURI;
		return channel;
	}
};

const NSGetFactory = XPCOMUtils.generateNSGetFactory([AboutNotes]);