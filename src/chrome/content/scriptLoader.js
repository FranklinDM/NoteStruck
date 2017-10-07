/*
* QuickFox Notes by Amin E (InBasic)
* eMail: inb.cor@gmail.com
*
* Source Code License: Mozilla Public License, version 1.1
*/

/**API Loader*/
QuickFoxNotes.api = {
    loadedGUIDs: [],    //This will check whether GUID is loaded or not
    pointers: [],

    initialize: function () {
        //Do I need to load script ?
        var request = qfnServices.prefs.getIntPref("scriptIn");
        var mode = qfnServices.prefs.getIntPref("openedIn");
        switch(mode) {
            case 1:
                if (request != 1 && request != 3 && request != 5 && request != 7)
                    return;
                break;
            case 2:
                if (request != 2 && request != 3 && request != 6 && request != 7)
                    return;
                break;
            case 4:
                if (request != 4 && request != 5 && request != 6 && request != 7)
                    return;
        }

        var arrayPath = this.scriptsPath();
        for (var i = 0; i < arrayPath.length; i++)
            this.loadScript(arrayPath[i]);
    },
    amIdisabled: function (GUID) {
        var blackList = [];
        try {
            blackList = JSON.parse(qfnServices.prefs.getCharPref("addonsBlacklist"));
        } catch (e) {}
        return (blackList.indexOf(GUID) != -1);
    },
    scriptsPath: function () {    //Periority: User folder Z>A, Chrome folder
        var arrayPath = [];

        var path = qfnServices.prefs.getComplexValue("scriptsPath", Components.interfaces.nsISupportsString).data;
        var file;
        if (path) {
            if (qfnServices.prefs.getBoolPref("relativePath"))
                file = qfnServices.prefs.getComplexValue("scriptsPath", Components.interfaces.nsIRelativeFilePref).file;
            else
                file = qfnServices.prefs.getComplexValue("scriptsPath", Components.interfaces.nsILocalFile);
            //Enumerate files:
            var entries = file.directoryEntries;
            while(entries.hasMoreElements()) {
                var entry = entries.getNext();
                entry.QueryInterface(Components.interfaces.nsIFile);

                var URL = qfnServices.ioSvc.newFileURI(entry);
                if (/\.js$/.test(URL.spec))
                    arrayPath.push(URL.spec);
            }
            arrayPath.sort(function(a, b){return b>a})    //Sort array from Z>A so file with bigger version overwrite file with smaller version
        }
        else {
            //Create scripts folder
            var file = qfnServices.dirsvc.get("ProfD", Components.interfaces.nsIFile);
            file.append("qfn-scripts");
            if( !file.exists() || !file.isDirectory() ) {   // if it doesn't exist, create
               file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0o777);
            }
            //Set scriptPath
            var str = qfnServices.str;
            str.data = file.path;
            qfnServices.prefs.setComplexValue("scriptsPath", Components.interfaces.nsISupportsString, str);
        }

        return arrayPath;
    },
    amIUntrusted: function (GUID, path) {
        const GUIDs = [
            "de92ae5c-da21-42ee-955e-c4f01e2c458a",
            "fb369e80-e93e-4895-b974-24c5b77f1b9d",
            "3b90b3f5-0a0d-484a-8dd2-79f5df41081d",
            "710aa4de-872e-4cb7-813d-7da8c051193b",
            "1849fbc2-7494-4830-b7fe-ed800a81a7ed"
        ];
        if (GUIDs.indexOf(GUID) == -1)
            return false;
        //Remove JS extension for untrusted extensions to prevent reload
        var URL = Components.classes["@mozilla.org/network/io-service;1"]
            .getService(Components.interfaces.nsIIOService)
            .newURI(path, null, null);
        var file = URL.QueryInterface(Components.interfaces.nsIFileURL).file;
        file.moveTo(null, file.leafName + "_");

        return true;
    },
    /**Initialize script with path*/
    loadScript: function(path) {
        try{
            //Load Script
            var scope = {};
            Components.utils.import(path, scope);
            var GUID = scope.extLoader.info.GUID;
            if (this.loadedGUIDs.indexOf(GUID) != -1)    //This GUID is already loaded!
                return;
            this.loadedGUIDs.push(GUID);

            this.pointers[this.pointers.length] = scope;
            //Check if addon is disabled or not
            if (this.amIdisabled(GUID))
                return;
            //Disable untrusted GUIDs
            if (this.amIUntrusted(GUID, path))
                return;
            //Addon is enabled
            scope.extLoader.pointers = {window: window, document: document, QFN: QuickFoxNotes, QuickFoxNotes: QuickFoxNotes, api: QuickFoxNotes.api};
            //Install UI
            if ("xul" in scope.extLoader) {
                const before = "data:text/xul, " +
                               (("css" in scope.extLoader) ? "<?xml-stylesheet href='data:text/css, " + scope.extLoader.css + "' type='text/css'?>" : "") +
                                "<overlay id='" + GUID + "' xmlns:html='http://www.w3.org/1999/xhtml' \
                                xmlns='http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul'>";
                const after = "</overlay>";
                try {
                    this.overlayLoader.add(
                        before + this.introMe(scope.extLoader.xul) + after,
                        function() {
                            scope.extLoader.initialize(); //Load initializer after loading of the content
                            if(_("editor-extensions-panel").childNodes.length != 0)    //Show the extension button if it is not empty
                                _("editor-tabbox-toolbar-extensions").collapsed = false;
                        }
                    );
                }
                catch(e) {
                    alert("QFN::XUL Loader Error:\n\nPath: " + path + "\n" + e.name + " @ " + e.message + '\n' + e.lineNumber + ': ' + e.fileName);
                }
            }
            else
                scope.extLoader.initialize();    //There is no content so load initializer independently
        }
        catch(e) {
            alert("QFN::Script Loader Error:\n\nPath: " + path + "\n" + e.name + " @ " + e.message + '\n' + e.lineNumber + ': ' + e.fileName);
        }
    },
    /**https://bugzilla.mozilla.org/show_bug.cgi?id=330458*/
    overlayLoader: {
        queue: [],
        loading: false,

        add: function (path, obs) {
            this.queue.push([path, obs]);
            this.load();
        },
        load: function() {
            if(!QuickFoxNotes.api.overlayLoader.queue.length) return;

            if (!QuickFoxNotes.api.overlayLoader.loading) {
                QuickFoxNotes.api.overlayLoader.loading = true;
                document.loadOverlay(QuickFoxNotes.api.overlayLoader.queue[0][0], {
                    observe:function(){
                        QuickFoxNotes.api.overlayLoader.loading = false;
                        QuickFoxNotes.api.overlayLoader.queue[0][1]();
                        QuickFoxNotes.api.overlayLoader.queue.shift();
                    }
                });
            }
            else {
                setTimeout(function(){QuickFoxNotes.api.overlayLoader.load()}, 100);
            }
        }
    },
    /**Introduce "me" pointer in scrpit*/
    introMe: function (str) {
        return str.replace(/\bme\b/g, "QuickFoxNotes.api.pointers[" + (this.pointers.length - 1) + "].extLoader");
    },
    /**This section contains all functions that are officially available to scripts*/
    list: {
        tab: function() {
            var tmpList = [];
            for (var i = 1; i < QuickFoxNotes.currentNumberOfPanels; i++)    //First Tab is dummy
                tmpList.push(QuickFoxNotes.tabs.getItemAtIndex(i));
            return tmpList;
        },
        note: function() {
            var tmpList = [];
            for (var i = 1; i < QuickFoxNotes.currentNumberOfPanels; i++)    //First Tab is dummy
                tmpList.push(QuickFoxNotes.getEditor(i));
            return tmpList;
        },
        archive: function() {
            QuickFoxNotes.arc.sort();
            return QuickFoxNotes.arc.data;
        }
    },
    statusNotification: {
        id: null,

        show: function(txt) {
            if(this.id)
                clearTimeout(this.id)

            _('statusbar-display').value = txt;
            _('statusbar-display-hbox').collapsed = false;

            this.id = setTimeout(function(){
                _('statusbar-display').value = '';
                _('statusbar-display-hbox').collapsed = true;
            }, qfnServices.prefs.getIntPref("statusNotification"));
        }
    },
    titleNotification: {
        id: null,

        show: function(txt) {
            if(this.id)
            clearTimeout(this.id)
            document.title = txt;
            this.id = setTimeout(function(){QuickFoxNotes.renderTabs()}, qfnServices.prefs.getIntPref("titleNotification"))
        }
    },
    alert: function(from, msg) {
        alert(from + ":\n\n" + msg);
    },
    //Get title and content of notes
    get: {
        noteTitle: function (tab) {
            if (!tab)
                tab = QuickFoxNotes.tabs.selectedItem;
            return QuickFoxNotes.group.readLabel(tab);
        },
        noteGroup: function (tab) {
            if (!tab)
                tab = QuickFoxNotes.tabs.selectedItem;
            return QuickFoxNotes.group.readGroup(tab);
        },
        noteContent: function(index) {
            return QuickFoxNotes.getEditor(index).value;
        },
        archiveTitle: function(menuitem) {
            return QuickFoxNotes.group.readLabel(menuitem);
        },
        archiveGroup: function(menuitem) {
            return QuickFoxNotes.group.readGroup(menuitem);
        },
        archiveContent: function(menuitem) {
            return  menuitem.value;
        }
    },
    //Important locations path
    path: function (location) {        //Desk, Progs, ProfD, https://developer.mozilla.org/en/Code_snippets/File_I%2F%2FO
        var file = qfnServices.dirsvc.get(location, Components.interfaces.nsIFile);
        file.append("e4TfQ");

        return file.path.substr(0,file.path.length - 5);
    },
    //Save to file
    saveToFile: function(path, data, title, unique) {        //if no title provided, path assumed to have title! Return true if operation is successful
        //Create file
        var file = qfnServices.lFile;
        try {
            file.initWithPath(path);
            if (title) file.append(title);
            if (unique) file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0o666);
        }
        catch(e) {
            return false;
        }
        //Save file
        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
                       createInstance(Components.interfaces.nsIFileOutputStream);
        try {foStream.init(file, 0x02 | 0x08 | 0x20, 0o666, 0);}
        catch(e) {return false;}
        var converter = qfnServices.converter;
        converter.init(foStream, "UTF-8", 0, 0);
        converter.writeString(data.replace(/\n/g, String.fromCharCode(13, 10)));
        converter.close(); // this closes foStream

        return file;
    },
    //Send a key combination to the editor
    sendKey: function (type, keycode, ctrl, alt, shift) {    //type: keypress, keydown, keyup
        var event = document.createEvent("KeyboardEvent");
        event.initKeyEvent(type, true, true, window, ctrl, alt, shift, false, keycode, keycode);

        QuickFoxNotes.getEditor().inputField.dispatchEvent(event);
    },
    //Is QFN opened in Window mode
    isWindowMode: function (){
        return (qfnServices.prefs.getIntPref("openedIn") == 1);
    },
    //Is QFN opened in Tab mode
    isTabMode: function (){
        return (qfnServices.prefs.getIntPref("openedIn") == 2);
    },
    //Is QFN opened in Application-content mode
    isAppContMode: function (){
        return (qfnServices.prefs.getIntPref("openedIn") == 4);
    },
    //Get clipboard text
    getClipboard: function () {
        var clip = qfnServices.clipboard;
        if (!clip) return "";
        var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
        if (!trans) return "";
        trans.addDataFlavor("text/unicode");
        clip.getData(trans, clip.kGlobalClipboard);

        var str       = new Object();
        var strLength = new Object();

        trans.getTransferData("text/unicode", str, strLength);
        if (str) str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
        return str.data.substring(0, strLength.value / 2);
    },
    //Insert a text at cursor position
    insertTextAtCursorPoint: function (txt) {
        QuickFoxNotes.insertTextAtCursorPoint(txt);
    },
    //Login Manager
    login: {
        hostname: "chrome://qfnotes/content/editor.xul?",

        getPassword: function (id, username) {    //id: simplenote, ...
           var logins = qfnServices.loginManager.findLogins({}, this.hostname + id, this.hostname + id, null);

           // Find user from returned array of nsILoginInfo objects
            for (var i = 0; i < logins.length; i++) {
                if (logins[i].username == username) {
                    password = logins[i].password;

                    return password
                }
            }
            return "";
        },
        getPassword2: function(id, username) { //id: simplenote, ...
            var logins = qfnServices.loginManager.findLogins({}, this.hostname + id, this.hostname + id, null);

            if(!username && logins.length) {
                return {
                    username: logins[0].username,
                    password: logins[0].password
                }
            }

            for (var i = 0; i < logins.length; i++) {
                if (logins[i].username == username) {
                    return {
                        username: logins[i].username,
                        password: logins[i].password
                    }
                }
            }
            return null;
        },

        setPassword: function (id, username, password) {    //This function overwrites the old login info with same username
            var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
                              Components.interfaces.nsILoginInfo, "init");

            var loginInfo = new nsLoginInfo(this.hostname + id, this.hostname + id, null,
                                   username, password, 'uname', 'pword');

            try {
                qfnServices.loginManager.addLogin(loginInfo);
            }
            catch(e) { //Login already exists
                var oldLoginInfo = new nsLoginInfo(this.hostname + id, this.hostname + id, null,
                                   username, this.getPassword(id, username), 'uname', 'pword');
                qfnServices.loginManager.modifyLogin(oldLoginInfo, loginInfo);
            }
        }
    },
    //Use qfnServices without loading it
    useService: function(id) {
        return qfnServices[id];
    }
}
