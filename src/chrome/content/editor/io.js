/*
* QuickFox Notes by Amin E (InBasic)
* eMail: inb.cor@gmail.com
*
* Source Code License: Mozilla Public License, version 1.1
*/
QuickFoxNotes.io = {
    ioTitle: 0,
    ioDescription: 1,
    
    accessType: null,    //0 is Bookmarks, 1 is local file

    initialize: function () {
        this.accessType = qfnServices.prefs.getIntPref("repositoryType");
        var confirm = -1;
        while (confirm == -1) 
            confirm = this[this.accessType ? "sqlite" : "bookmark"].initialize();
            //confirm = this[this.accessType ? "local" : "bookmark"].initialize();

        if (!confirm)
            confirm = this.bookmark.initialize();

    },
    getList: function () {
        return this.accessType ? this.sqlite.getIndices() : this.bookmark.getBookmarkIDs();
    },
    getTabsList: function () {
        return this.accessType ? this.sqlite.getTabsIndices() : this.bookmark.getTabsBookmarkIDs();
    },
    getArchiveList: function () {
        return this.accessType ? this.sqlite.getArchiveIndices() : this.bookmark.getArchiveBookmarkIDs();
    },
    getTitles: function () {
        return this[this.accessType ? "sqlite" : "bookmark"].readTitles();
    },
    getTabsTitles: function () {
        return this[this.accessType ? "sqlite" : "bookmark"].readTabsTitles();
    },
    getArchiveTitles: function () {
        return this[this.accessType ? "sqlite" : "bookmark"].readArchiveTitles();
    },
    read: function (type, ID) {
        return this[this.accessType ? "sqlite" : "bookmark"].read(type, ID);
    },
    write: function (type, ID, data) {
        return this[this.accessType ? "sqlite" : "bookmark"].write(type, ID, data);
    },
    getItemIndex: function (ID) {
        return this[this.accessType ? "sqlite" : "bookmark"].getItemIndex(ID);
    },
    moveItem: function (ID, newLocation) {
        return this[this.accessType ? "sqlite" : "bookmark"].moveItem(ID, newLocation);
    },
    remove: function (IDs) {
        return this[this.accessType ? "sqlite" : "bookmark"].remove(IDs);
    },
    release: function () {    //This function will release the database without need to re-initiating it again! (So Dropbox can replace file although Firefox is open)
        if (this.accessType == 1)
            this.sqlite.releaseDatabase();
    },
    clean: function () {
        if (this.accessType == 1)
            this.sqlite.clean();
    },
    //Soft switch to local mode
    softSwitch: {
        toLocal: function() {
            qfnServices.prefs.setCharPref("lFolderName", "");    //Reset Directory
            qfnServices.prefs.setCharPref("sqlitePath", "");    //Reset sqlite data storage
            qfnServices.prefs.setIntPref("repositoryType", 1);
            var confirm = -1;
            while (confirm == -1)
                confirm = QuickFoxNotes.io.sqlite.initialize();    //If true continue; if false, stop; if -1 retry
                
            alert(QuickFoxNotes.stringsBundle.getString(confirm ? 'io12' : 'io13'));
        },
        toBookmark: function () {
            qfnServices.prefs.setIntPref("repositoryType", 0);
            alert(QuickFoxNotes.stringsBundle.getString('io12'));
        }
    },
    //Call this method to force QFN clear old repository and mark all notes as new!
    ioSwitch: function () {
        try{
            this.bookmark.initialize();
            var confirm = -1;
            while (confirm == -1)
                confirm = this.sqlite.initialize();    //If true continue; if false, stop; if -1 retry
                //confirm = this.local.initialize();    //If true continue; if false, stop; if -1 retry
            if (!confirm)
                return;
                
            if (window.confirm(QuickFoxNotes.stringsBundle.getString('io3') + " \"" + 
                          (this.accessType == 0 ? QuickFoxNotes.stringsBundle.getString('io11') : QuickFoxNotes.stringsBundle.getString('io10')) +"\"\n" +
                           QuickFoxNotes.stringsBundle.getString('io4') + "\n\n" +
                           QuickFoxNotes.stringsBundle.getString('io5') + " " +
                           QuickFoxNotes.stringsBundle.getString('io6') + "\n\n" +
                           QuickFoxNotes.stringsBundle.getString('io7'))) {
                //Clear old data
                if (this.accessType == 0) {    //New repository would be local
                    this.sqlite.remove(this.sqlite.getIndices());
                    //Clear local folder
                    //this.local.remove(this.local.getFilesIndex());
                    //this.local.files = [];
                }
                else {    //New repository would be bookmark
                    this.bookmark.remove(this.bookmark.getBookmarkIDs());
                }
                //Mark all notes as not saved
                var tab = QuickFoxNotes.tabs.getElementsByTagName("panelTab");
                for (var i = 1; i < QuickFoxNotes.currentNumberOfPanels; i++) {    //First note is dummy
                    tab[i].saveMe = true;
                    QuickFoxNotes.getEditor(i).saveMe = true;
                    tab[i].bookmarkId = null;
                }
                
                QuickFoxNotes.arc.data.forEach(function(obj){
                    obj.value; //Load all notes in archive first
                    obj.saveMe = true;
                    obj.bookmarkId = null;
                });

                qfnServices.prefs.setIntPref("repositoryType", this.accessType ? 0 : 1);
                QuickFoxNotes.io.initialize.call(QuickFoxNotes.io);
                
                QuickFoxNotes.savePanels();
                QuickFoxNotes.renderTabs();    //The new repository has a different title!
                alert(QuickFoxNotes.stringsBundle.getString('io8'));
            }
        } catch (e) {
            alert(QuickFoxNotes.stringsBundle.getString('io9') + "\n\n" + e.lineNumber + " : "+ e.message);
        }
    },
    /**Change the bookmarks folder*/
    changeBookmarksFolder: function () {
        var check = {value: false};
        var input = {value: qfnServices.prefs.getComplexValue("FolderName", Components.interfaces.nsISupportsString).data};
        var result = qfnServices.prompts.prompt(null, QuickFoxNotes.stringsBundle.getString('changeRepositoryTitle'), QuickFoxNotes.stringsBundle.getString('changeRepository'), input, null, check);
    
        if (result && input.value && !(/\/*$/.exec(input.value)[0]) ) {    //input.value should be non empty and also not terminate with '/'
            var str = qfnServices.str;
            str.data = input.value;
            qfnServices.prefs.setComplexValue("FolderName", Components.interfaces.nsISupportsString, str); 
            alert(QuickFoxNotes.stringsBundle.getString('repositorySuccess'));
        }
        else if (result)
            alert(QuickFoxNotes.stringsBundle.getString('repositoryWarning'));
    }
}
/**Bookmarks I/O service*/
QuickFoxNotes.io.bookmark = {

    rootID: null,

    initialize: function () {
        this.rootID = this.locateRoot();
        
        return true;
    },
    locateRoot: function () {
        function getChildFolder (parentID, name) {
            try {
                for (var i = 0; ; i++) {
                    var childFolderID = qfnServices.bmsvc.getIdForItemAt(parentID, i);
                    var title = qfnServices.bmsvc.getItemTitle(childFolderID);
                    if (name == title && qfnServices.bmsvc.getItemType(childFolderID) == qfnServices.bmsvc.TYPE_FOLDER)
                        break;
                }
            }
            catch (e) {    //Rich to the end but folder not found; Create it!
                childFolderID = qfnServices.bmsvc.createFolder(parentID, name, qfnServices.bmsvc.DEFAULT_INDEX);
            }
            return childFolderID;
        }
        
        var rootFolderName = qfnServices.prefs.getComplexValue("FolderName", Components.interfaces.nsISupportsString).data;
        var arrFolders = rootFolderName.split("/");    //The folderName accept subfolders seperated by '/'
        var rootID = qfnServices.bmsvc[qfnServices.prefs.getCharPref("RootName")];
        
        for (var i = 0; i < arrFolders.length; i++) {
            rootID = getChildFolder.call (this, rootID, arrFolders[i]);    
        }
        return rootID;
    },
    getBookmarkIDs: function () {
        this._initDB();
        var temp = QuickFoxNotes.io.sqlite._select.call(this, 'SELECT id FROM moz_bookmarks WHERE parent = ?1;', this.rootID);
        var arr = [];
        for (var index in temp)
            arr.push(parseInt(temp[index]['id']));
        return arr;
    },
    getTabsBookmarkIDs: function () {
        this._initDB();
        var temp = QuickFoxNotes.io.sqlite._select.call(this, "SELECT id FROM moz_bookmarks WHERE parent = ?1 AND title not like '[sb] %';", this.rootID);
        var arr = [];
        for (var index in temp)
            arr.push(parseInt(temp[index]['id']));
        return arr;
    },
    getArchiveBookmarkIDs: function () {
        this._initDB();
        var temp = QuickFoxNotes.io.sqlite._select.call(this, "SELECT id FROM moz_bookmarks WHERE parent = ?1 AND title like '[sb] %';", this.rootID);
        var arr = [];
        for (var index in temp)
            arr.push(parseInt(temp[index]['id']));
        return arr;
    },
    getItemIndex: function (bookmarkID) {
        return qfnServices.bmsvc.getItemIndex (bookmarkID);
    },
    moveItem: function (bookmarkID, newLocation) {
        try {
            qfnServices.bmsvc.moveItem(bookmarkID, this.rootID, newLocation);    //Change position of bookmark in bookmark folder
        }catch (e) {qfnServices.jsDump.logStringMessage("QuickFox Notes: [e][io.moveItem][id:" + bookmarkID + "][e:" + e.message + "]");}
    },
    /**Read all titles*/
    readTitles: function() {
        this._initDB();
        var temp = QuickFoxNotes.io.sqlite._select.call(this, 'SELECT title FROM moz_bookmarks WHERE parent = ?1;', this.rootID);
        var arr = [];
        for (var index in temp)
            arr.push(temp[index]['title']);
        return arr;
    },
    readTabsTitles: function() {
        this._initDB();
        var temp = QuickFoxNotes.io.sqlite._select.call(this, "SELECT title FROM moz_bookmarks WHERE parent = ?1 AND title not like '[sb] %';", this.rootID);
        var arr = [];
        for (var index in temp)
            arr.push(temp[index]['title']);
        return arr;
    },
    readArchiveTitles: function() {
        this._initDB();
        var temp = QuickFoxNotes.io.sqlite._select.call(this, "SELECT title FROM moz_bookmarks WHERE parent = ?1 AND title like '[sb] %';", this.rootID);
        var arr = [];
        for (var index in temp)
            arr.push(temp[index]['title']);
        return arr;
    },
    read: function (type, bookmarkID) {
        if (type == QuickFoxNotes.io.ioDescription) {
            var description = "";
            try {    //Sometime when there is no text in the bookmark's description, error happens
                description = qfnServices.annotationService.getItemAnnotation(bookmarkID, "bookmarkProperties/description");
            } catch (e) {qfnServices.jsDump.logStringMessage("QuickFox Notes: [e][io.read(); io.ioDescription][id:" + bookmarkID + "][e:" + e.message + "]");}
            return description;
        }
        if (type == QuickFoxNotes.io.ioTitle)
            return qfnServices.bmsvc.getItemTitle(bookmarkID);
    },
    write: function (type, bookmarkID, data) {    //if bookmarkID == null and type == ioTitle; then new bookmark will be created
        if (type == QuickFoxNotes.io.ioDescription) {
            qfnServices.annotationService.setItemAnnotation(bookmarkID, "bookmarkProperties/description", data, 0, qfnServices.annotationService.EXPIRE_NEVER);
        }
        if (type == QuickFoxNotes.io.ioTitle) {
            if (bookmarkID)
                qfnServices.bmsvc.setItemTitle(bookmarkID, data);
            else {    //Create new bookmark
                var uri = qfnServices.ioSvc.newURI("chrome://qfnotes/content/openEditor.xul?random=" + Math.floor( Math.random() * 1000001 ), null, null);    //Prevent duplicate bookmarks
                return qfnServices.bmsvc.insertBookmark(this.rootID, uri, qfnServices.bmsvc.DEFAULT_INDEX, data);
            }
        }
        return null;
    },
    remove: function (arrBookmarkIDs) {
        for (var i = 0; i < arrBookmarkIDs.length; i++) {
            try {
                qfnServices.bmsvc.removeItem(arrBookmarkIDs[i]);
            } catch(e) {qfnServices.jsDump.logStringMessage("QuickFox Notes: [e][io.remove()][e:" + e.message + "]");}
        }
        return this;    
    },
    /**Bookmarks as sql database*/
    storageService: null,
    mDBConn: null,
    isInited: false,
    
    _initDB: function () {
        if (this.isInited)
            return;
        //Places is already loaded so do not reopen it!
        this.storageService = Components.classes["@mozilla.org/storage/service;1"].getService(Components.interfaces.mozIStorageService);
        this.mDBConn = Components.classes["@mozilla.org/browser/nav-history-service;1"].
            getService(Components.interfaces.nsPIPlacesDatabase).DBConnection;
            
        this.isInited = true;
    }
};
/**Local file I/O service; Combined mode*/
QuickFoxNotes.io.sqlite = {    //This script is modified version of http://codesnippets.joyent.com/posts/show/1030#related
    /**Internal functions*/
    storageService: null,
    mDBConn: null,
    _initService: function() {
        var db;    //Read file; First try to resolve it as a relative path
        if (qfnServices.prefs.getBoolPref("relativePath"))
            db = qfnServices.prefs.getComplexValue("sqlitePath", Components.interfaces.nsIRelativeFilePref).file;  
        else 
            db = qfnServices.prefs.getComplexValue("sqlitePath", Components.interfaces.nsILocalFile);
        
        this.storageService = Components.classes["@mozilla.org/storage/service;1"].getService(Components.interfaces.mozIStorageService);
        try {
            this.mDBConn = (this.storageService).openDatabase(db);
        }
        catch(e) {
            alert ("QuickFox could not locate its repository!\nAddress: " + db.path + "\n\nIf this is not a valid address go to \"Options -> Change Repository\" to change the address.\n\nIf the address is correct, then the database might be corrupted. Try to repair it with an SQLITE editor");
        }
        //Create Database if it doesnt exist
        this._cmd('CREATE TABLE IF NOT EXISTS quickfox (id INTEGER PRIMARY KEY AUTOINCREMENT, iOrder INTEGER, title TEXT, body TEXT);');
    },
    _select: function(sql,param) {
        if (this.storageService == undefined)
            this._initService();
        
        var ourTransaction = false;
        if ((this.mDBConn).transactionInProgress){
            ourTransaction = true;
            (this.mDBConn).beginTransactionAs((this.mDBConn).TRANSACTION_DEFERRED);
        }
        var statement = (this.mDBConn).createStatement(sql);
            if (param){
                for (var m=1, arg=null; arg=arguments[m]; m++) {
                    statement.bindUTF8StringParameter(m-1, arg);
                }
        }
        try{
            var dataset = [];
            while (statement.executeStep()){
                var row = [];
                for(var i=0,k=statement.columnCount; i<k; i++){
                    row[statement.getColumnName(i)] = statement.getUTF8String(i);
                }
                dataset.push(row);
            }
            // return dataset;
        }
        finally {
            statement.reset();
            statement.finalize();
        }
        if (ourTransaction){
            (this.mDBConn).commitTransaction();
        }
        
        return dataset;
    },
    _cmd: function(sql,param) {
        if (this.storageService == undefined)
            this._initService();
        
        var ourTransaction = false;
        if ((this.mDBConn).transactionInProgress){
            ourTransaction = true;
            (this.mDBConn).beginTransactionAs((this.mDBConn).TRANSACTION_DEFERRED);
        }
        var statement = (this.mDBConn).createStatement(sql);
        if (param){
            for (var m=1, arg=null; arg=arguments[m]; m++) {
                statement.bindUTF8StringParameter(m-1, arg);
            }
        }
        try{
            statement.execute();
        }
        finally {
            statement.reset();
            statement.finalize();
        }
        if (ourTransaction){
            (this.mDBConn).commitTransaction();
        }
    },
    /**End of Internal functions*/
    /**Initialize SQLITE data storage*/
    initialize: function () {
        var path = qfnServices.prefs.getComplexValue("sqlitePath", Components.interfaces.nsISupportsString).data;
        if (!path) {
            var nsIFilePicker = Components.interfaces.nsIFilePicker;
            var fp = qfnServices.filepicker;
            fp.init(window, QuickFoxNotes.stringsBundle.getString('io1'), nsIFilePicker.modeGetFolder);
            var res = fp.show();
            if (res == nsIFilePicker.returnOK){
                var file = Components.classes["@mozilla.org/file/local;1"].
                           createInstance(Components.interfaces.nsILocalFile);
                file.initWithPath(fp.file.path);
                file.append("qfn.sqlite");
                //Store in pref
                if (qfnServices.prefs.getBoolPref("relativePath")) {
                    var relFile = Components.classes["@mozilla.org/pref-relativefile;1"].
                                  createInstance(Components.interfaces.nsIRelativeFilePref);
                    relFile.relativeToKey = "ProfD"; // or any other string listed above
                    relFile.file = file;             // |file| is nsILocalFile
                    qfnServices.prefs.setComplexValue("sqlitePath", 
                         Components.interfaces.nsIRelativeFilePref, relFile);
                }
                else
                    qfnServices.prefs.setComplexValue("sqlitePath", Components.interfaces.nsILocalFile, file);                
            }
            else {
                var userAnswer = 1;
                if (!window.confirm(QuickFoxNotes.stringsBundle.getString('io2'))) {
                    qfnServices.prefs.setIntPref("repositoryType", 0);
                    userAnswer = 0;
                }
                
                return (userAnswer ? -1 : false);    //This is only used in ioSwitch
            }
        }
        return true;
    },
    releaseDatabase: function () {
        if (this.mDBConn.mozIStorageConnection.asyncClose) {
            this.mDBConn.mozIStorageConnection.asyncClose({
                complete: function() {}
            });
            this.storageService = null;
        }
    },
    /**Clean up*/
    clean: function () {
        this._cmd('VACUUM');
    },
    /**Get free index for location; new item located in thje end of list*/
    _freeIndex: function () {
        try {
            var arrData = this._select('SELECT iOrder FROM quickfox ORDER BY iOrder');
            return parseInt(arrData[arrData.length - 1]['iOrder']) + 1;    //String instead of number
        }
        catch(e) {    //Return one on empty repository
            return 1;
        }    
    },
    /**Get All available indices*/
    getIndices: function () {
        try {
            var arrData = this._select('SELECT id FROM quickfox ORDER BY iOrder');
        }
        catch (e) {    //Return empty on empty repository
            return [];
        }
        var indices = []
        for (var i = 0; i < arrData.length; i++) {
            indices[i] = parseInt(arrData[i]['id']);
        }
        return indices;
    },
    getTabsIndices: function () {
        try {
            var arrData = this._select("SELECT id FROM quickfox WHERE title not like '[sb] %' ORDER BY iOrder");
        }
        catch (e) {    //Return empty on empty repository
            return [];
        }
        var indices = []
        for (var i = 0; i < arrData.length; i++) {
            indices[i] = parseInt(arrData[i]['id']);
        }
        return indices;
    },
    getArchiveIndices: function () {
        try {
            var arrData = this._select("SELECT id FROM quickfox WHERE title like '[sb] %' ORDER BY iOrder");
        }
        catch (e) {    //Return empty on empty repository
            return [];
        }
        var indices = []
        for (var i = 0; i < arrData.length; i++) {
            indices[i] = parseInt(arrData[i]['id']);
        }
        return indices;
    },
    /**Read all titles*/
    readTitles: function() {
        var temp = this._select('SELECT title FROM quickfox ORDER BY iOrder');
        var arr = [];
        for (var index in temp)
            arr.push(temp[index]['title']);
        return arr;
    },
	readTabsTitles: function () {
        var temp = this._select("SELECT title FROM quickfox WHERE title not like '[sb] %' ORDER BY iOrder");
        var arr = [];
        for (var index in temp)
            arr.push(temp[index]['title']);
        return arr;
	},
	readArchiveTitles: function () {
        var temp = this._select("SELECT title FROM quickfox WHERE title like '[sb] %' ORDER BY iOrder");
        var arr = [];
        for (var index in temp)
            arr.push(temp[index]['title']);
        return arr;
	},
    /**Read*/
    read: function (type, ID) {
        var key;
        var rt;
        
        if (type == QuickFoxNotes.io.ioDescription)
            rt = this._select('SELECT body FROM quickfox WHERE id = ?1;', ID)[0]["body"];
        else
            rt = this._select('SELECT title FROM quickfox WHERE id = ?1;', ID)[0]["title"];

        if (!rt)    //If content is NULL
            return "";
        return rt.replace (/&39;/g, "'").replace (/&34;/g, '"');
    },
    /**Write*/
    write: function (type, ID, data) {    //if ID == null and type == ioTitle; then new bookmark will be created
        data = data.replace (/\'/g, "&39;").replace (/\"/g, "&34;");
    
        if (type == QuickFoxNotes.io.ioDescription) {
            if (data)
                this._cmd('UPDATE quickfox SET body=?1 WHERE id = ?2;', data, ID);
            else
                this._cmd('UPDATE quickfox SET body=NULL WHERE id = ?1;', ID);
        }
        if (type == QuickFoxNotes.io.ioTitle) {
            if (ID)
                this._cmd('UPDATE quickfox SET title = ?1 WHERE id = ?2;', data ? data : "?", ID);    //No empty title is allowed
            else {    //Add new Note
                var newIndex = this._freeIndex();
                this._cmd('INSERT INTO quickfox(iOrder, title, body) VALUES(?1, ?2, "");', newIndex, data);
                return parseInt(this._select('SELECT id FROM quickfox WHERE iOrder = ?1;', newIndex)[0]['id']);
            }
        }
        return null;
    },
    /**Get item index*/
    getItemIndex: function (ID) {
        try {
            var temp = this._select('SELECT iOrder FROM quickfox WHERE id=?1;',ID);
            return parseInt(temp[0]['iOrder']);
        }
        catch(e) {
            return -1;
        }
    },
    /**Change index of item to locate into new location*/
    moveItem: function (ID, newLocation) {
        if (!newLocation)
            newLocation = 1;
    
        var oldLocation = this.getItemIndex(ID);
        
        if (oldLocation < newLocation) {
            newLocation -= 1;    //Who knows why!
            this._cmd('UPDATE quickfox SET iOrder = iOrder - 1 WHERE iOrder >= ?1 AND iOrder <= ?2;', (oldLocation + 1), newLocation);
        }
        else {
            this._cmd('UPDATE quickfox SET iOrder = iOrder + 1 WHERE iOrder >= ?1 AND iOrder <= ?2;', newLocation, (oldLocation - 1));
        }
        this._cmd('UPDATE quickfox SET iOrder = ?1 WHERE id = ?2;', newLocation, ID);
    },
    /**Remove series of Notes*/
    remove: function (IDs) {
        if (!IDs.length)
            return;
            
        var data = "id = ?1";
        for (var i = 1; i < IDs.length; i++) {
            data += (" OR id = ?" + (i+1));
        }
        this._cmd.apply(this, ['DELETE FROM quickfox WHERE ' + data].concat(IDs));
        
        return this;
    }
};
