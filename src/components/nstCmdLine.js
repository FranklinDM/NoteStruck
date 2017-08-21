/*
* QuickFox Notes by Amin E (InBasic)
* eMail: inb.cor@gmail.com
*
* Source Code License: Mozilla Public License, version 2.0
*
* Based on DOM Inspector's component (inspector-cmdline.js)
*/
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm"); 

function qfnCMDLine() {}
 
qfnCMDLine.prototype = {
    classDescription:   "NoteStruck Command Line Component",
    classID:            Components.ID("0e2c6db8-dc58-4840-ab58-dd799daeaa95"),
    contractID:         "@mozilla.org/commandlinehandler/general-startup;1?type=nst",

    _xpcom_categories: [{category: "command-line-handler", entry: "m-nst"}],

    QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsICommandLineHandler]),
    
    // nsICommandLineHandler methods:
    handle : function(cmdLine) {
        Components.utils.import("resource://qfn/openInSingleMode.js");  
        //Argument: nstdata
        try {
            var uristr = cmdLine.handleFlagWithParam("nstdata", false);
            if (uristr) {
                qfn_openInSingleMode.openInWindow (uristr);
                cmdLine.preventDefault = true;
            }
        }
        catch (e) {
            Components.utils.reportError("NoteStruck > Incorrect parameter passed to -nstdata.");
        }
        //Argument: nst
        if (cmdLine.handleFlag("nst", false)) {
            qfn_openInSingleMode.openInWindow (null);
            cmdLine.preventDefault = true;
        }
    },

    helpInfo : "  -nst                 Open NoteStruck\n" +
               "  -nstdata <uri>       Format: openFile <uri>\n"    //general format: cmd1 arg1,cmd2 arg 2,...
};

/**
 * XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4).
 * XPCOMUtils.generateNSGetModule is for Mozilla 1.9.0 (Firefox 3.0).
 */
if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([qfnCMDLine]);
else
  var NSGetModule = XPCOMUtils.generateNSGetModule([qfnCMDLine]);