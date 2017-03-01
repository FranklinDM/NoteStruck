let EXPORTED_SYMBOLS = ["qfnServices"];

const Ci = Components.interfaces;
const Cc = Components.classes;

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

let qfnServices = {};

XPCOMUtils.defineLazyGetter(qfnServices, "prefs", function () {
    var prefService = Cc["@mozilla.org/preferences-service;1"]
        .getService(Ci.nsIPrefService);
    var branch = prefService.getBranch("extensions.InBasic.QuickFoxNotes.");
    branch.QueryInterface(Ci.nsIPrefBranch2);

    return branch;
});
XPCOMUtils.defineLazyGetter(qfnServices, "dirsvc", function () {
  return Cc["@mozilla.org/file/directory_service;1"]
           .getService(Ci.nsIDirectoryService)
           .QueryInterface(Ci.nsIProperties);
});
XPCOMUtils.defineLazyGetter(qfnServices, "appInfo", function () {
  return Cc["@mozilla.org/xre/app-info;1"]
           .getService(Ci.nsIXULAppInfo)
           .QueryInterface(Ci.nsIXULRuntime);
});
//const FIREFOX_ID = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";  
//const THUNDERBIRD_ID = "{3550f703-e582-4d05-9a08-453d09bdfdc6}";  
//const SEAMONKEY_ID = "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}";  

XPCOMUtils.defineLazyServiceGetter(qfnServices, "protSvc",
                                   "@mozilla.org/uriloader/external-protocol-service;1",
                                   "nsIExternalProtocolService");

XPCOMUtils.defineLazyServiceGetter(qfnServices, "jsDump",
                                   "@mozilla.org/consoleservice;1",
                                   "nsIConsoleService");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "timer",
                                   "@mozilla.org/timer;1",
                                   "nsITimer");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "lFile",
                                   "@mozilla.org/file/local;1",
                                   "nsILocalFile");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "str",
                                   "@mozilla.org/supports-string;1",
                                   "nsISupportsString");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "prompts",
                                   "@mozilla.org/embedcomp/prompt-service;1",
                                   "nsIPromptService");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "annotationService",
                                   "@mozilla.org/browser/annotation-service;1",
                                   "nsIAnnotationService");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "bmsvc",
                                   "@mozilla.org/browser/nav-bookmarks-service;1",
                                   "nsINavBookmarksService");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "scriptloader",
                                   "@mozilla.org/moz/jssubscript-loader;1",
                                   "mozIJSSubScriptLoader");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "wm",
                                   "@mozilla.org/appshell/window-mediator;1",
                                   "nsIWindowMediator");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "ww",
                                   "@mozilla.org/embedcomp/window-watcher;1",
                                   "nsIWindowWatcher");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "params",
                                   "@mozilla.org/embedcomp/command-params;1",
                                   "nsICommandParams");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "clipboard",
                                   "@mozilla.org/widget/clipboard;1",
                                   "nsIClipboard");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "extMan",
                                   "@mozilla.org/extensions/manager;1",
                                   "nsIExtensionManager");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "ioSvc",
                                   "@mozilla.org/network/io-service;1",
                                   "nsIIOService");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "converter",
                                   "@mozilla.org/intl/converter-output-stream;1",
                                   "nsIConverterOutputStream");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "filepicker",
                                   "@mozilla.org/filepicker;1",
                                   "nsIFilePicker");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "loginManager",
                                   "@mozilla.org/login-manager;1",
                                   "nsILoginManager");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "sound",
                                   "@mozilla.org/sound;1",
                                   "nsISound");
XPCOMUtils.defineLazyServiceGetter(qfnServices, "atomService",
                                   "@mozilla.org/atom-service;1",
                                   "nsIAtomService");