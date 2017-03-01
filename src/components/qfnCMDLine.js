/*
* QuickFox Notes by Amin E (InBasic)
* eMail: inb.cor@gmail.com
*
* Source Code License: Mozilla Public License, version 1.1
*
* This is extension of inspector-cmdline.js
*/
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm"); 

function qfnCMDLine() {}
 
qfnCMDLine.prototype = {
    classDescription:     "QuickFox Notes Command-line Javascript XPCOM Component",
    classID:             Components.ID("88ab0cb0-0a10-11df-8a39-0800200c9a66"),
    contractID:         "@inbasic.net/quickfoxnotes/commandlinehandler/general-startup;1?type=qfn",

    _xpcom_categories: [{category: "command-line-handler", entry: "m-qfn"}],

    QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsICommandLineHandler]),
    
    // nsICommandLineHandler methods:
    handle : function(cmdLine) {
        Components.utils.import("resource://qfn/openInSingleMode.js");  
        //Argument: qfndata
        try {
            var uristr = cmdLine.handleFlagWithParam("qfndata", false);
            if (uristr) {
                qfn_openInSingleMode.openInWindow (uristr);
                cmdLine.preventDefault = true;
            }
        }
        catch (e) {
            Components.utils.reportError("QFN's command line JS Component> Incorrect parameter passed to -qfndata.");
        }
        //Argument: qfn
        if (cmdLine.handleFlag("qfn", false)) {
            qfn_openInSingleMode.openInWindow (null);
            cmdLine.preventDefault = true;
        }
    },

    helpInfo : "  -qfn                 Open QuickFox Notes\n" +
               "  -qfndata <uri>       Format: openFile <uri>\n"    //general format: cmd1 arg1,cmd2 arg 2,...
};

/**
 * XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4).
 * XPCOMUtils.generateNSGetModule is for Mozilla 1.9.0 (Firefox 3.0).
 */
if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([qfnCMDLine]);
else
  var NSGetModule = XPCOMUtils.generateNSGetModule([qfnCMDLine]);