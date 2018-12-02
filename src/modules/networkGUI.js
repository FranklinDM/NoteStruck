var EXPORTED_SYMBOLS = ["toolbar", "treeView", "neworkGUI"];

Components.utils.import("resource://qfn/qfnServices.js");
var QuickFoxNotes, window, document, requirejs;
function _(aID) {
  return document.getElementById(aID);
}

toolbar = {
    getElem: function (row) {
        var elem = treeView.tData;
        for (var i = 1; i < treeView.view[row].length; i++)
            elem = elem[treeView.view[row][i]];
        if (elem.constructor == Array)    //If element is folder
            elem = elem[0];
        return elem;
    },
    updateToolbar: function() {
        var netbar = _("network-toolbar");
        var tree = _("network-tree");

        function doAtt(arr) {    //[refresh, delete, paste to QFN, newFile, newFolder]
            for (var i = 0; i < arr.length; i++)
                netbar.childNodes[i].setAttribute("disabled", !arr[i]);
        }

        var row = tree.currentIndex;
        if (row == -1){
            doAtt([false, false, false, false, false, false, false, false, false]);
            return;
        }
        var level = treeView.getLevel(row);

        var service = neworkGUI.pathToArray(this.getElem(row).path)[0];

        //canUnlink
        var canUnlink = (level == 0 && service != "local") ? true : false
        //canDelete
        var canDelete = false;
        if(service == "googleDocs")
            canDelete = true;
        //Check file status
        var canFile = true;
        if(service == "sugarsync" && level < 2)
            canFile = false;
        //Overwrite
        var canOverwrite = false;
        if(service == "simplenote" || service == "local" || service == "googleDocs" || service == "dropbox")
            canOverwrite = true;
        //Backup
        var canBackup = false;
        if(service == "googleDocs" || service == "dropbox")
            canBackup = true;
        if (service == "local" && level > 0)
            canBackup = true;
        //Check folder status
        if (treeView.isContainer(row)){
            var canFolder = false;
            switch (service) {
                case "simplenote":
                    canFolder = false;
                    break;
                case "sugarsync":
                    canFolder = (level > 1) ? true : false;
                    break;
                case "googleDocs":
                case "dropbox":
                case "local":
                    canFolder = true;
            }
            //Set Attributes in Folder mode
            doAtt([canUnlink, true, canFolder, false, false, canFile, false, canDelete, canBackup]);
        }
        else//Set Attributes in File mode
            doAtt([canUnlink, true, false, true, true, canFile, canOverwrite, true, canBackup]);
    },
    doRefresh: function(){
        neworkGUI.fprint(3);

        var tree = _("network-tree");
        var row = tree.currentIndex;

        if (!treeView.isContainer(row)) {
            row = treeView.getParentIndex(row);
            tree.currentIndex = row;
        }

        isOpen = treeView.isContainerOpen(row);

        var root = treeView.tData;
        for (var i = 1; i < treeView.view[row].length; i++)
            root = root[treeView.view[row][i]];
        root.splice(1, root.length - 1);
        treeView.toggleOpenState(row);
        if (isOpen) treeView.toggleOpenState(row);
    },
    doCollapse: function () {
        var tree = _("network-tree");
        var row = tree.currentIndex;

        if (!treeView.isContainer(row)) {
            row = treeView.getParentIndex(row);
            tree.currentIndex = row;
        }

        isOpen = treeView.isContainerOpen(row);

        var root = treeView.tData;
        for (var i = 1; i < treeView.view[row].length; i++)
            root = root[treeView.view[row][i]];
        root.splice(1, root.length - 1);

        if (isOpen) treeView.toggleOpenState(row);
    },
    doUnlink: function() {
        var tree = _("network-tree");
        var row = tree.currentIndex;

        elem = this.getElem(row);
        var service = neworkGUI.pathToArray(elem.path)[0];

        neworkGUI.activeServices.splice (service,1);
        if (service != "dropbox")
            qfnServices.prefs.setCharPref(service + "_username", "");
        else
            qfnServices.prefs.setCharPref(service + "_token", "");

        this.doCollapse();
    },
    doRead: function() {
        neworkGUI.fprint(4);

        var tree = _("network-tree");
        var row = tree.currentIndex;

        elem = this.getElem(row);
        var service = neworkGUI.pathToArray(elem.path)[0];
        var token = neworkGUI.token[service];

        neworkGUI.initialize(service, function(){
            var token = neworkGUI.token[service];
            switch (service) {
                case "googleDocs":
                    requirejs("network/" + service).readFile (token, elem.contentURL, function(content){neworkGUI.fprint(1); QuickFoxNotes.api.insertTextAtCursorPoint(content)}, [], function(e){neworkGUI.error(e.responseText)});
                    break;
                case "simplenote":
                    requirejs("network/" + service).getContent (token, elem.key, function(content){neworkGUI.fprint(1); QuickFoxNotes.api.insertTextAtCursorPoint(content)}, [], function(e){neworkGUI.error(e)});
                    break;
                case "sugarsync":
                    requirejs("network/" + service).readFile (token, elem.url, function(content){neworkGUI.fprint(1); QuickFoxNotes.api.insertTextAtCursorPoint(content)}, [], function(e){neworkGUI.error(e.responseText)});
                    break;
                case "local":
                    requirejs("network/" + service).readFile(elem.url, function(){neworkGUI.fprint(1);}, [], function(e){neworkGUI.error(e)});
                    break;
                case "dropbox":
                    requirejs("network/" + service).getContents(elem.url, function(content){neworkGUI.fprint(1); QuickFoxNotes.api.insertTextAtCursorPoint(content)}, [], function(e){neworkGUI.error(e)});
                    break;
            }
        });
    },
    doReadNew: function (){
        var tree = _("network-tree");
        var row = tree.currentIndex;

        elem = this.getElem(row);

        QuickFoxNotes.group.write(QuickFoxNotes.addSingleTab()._tab, elem.name);
        this.doRead();
    },
    doDelete: function() {
        neworkGUI.fprint(2);

        var tree = _("network-tree");

        var row = tree.currentIndex;
        var elem = this.getElem(row);
        var service = neworkGUI.pathToArray(elem.path)[0];

        var token = neworkGUI.token[service];
        //Move to top
        parentRow = treeView.getParentIndex(row);
        tree.currentIndex = parentRow;

        //Confirm
        if (!window.confirm(QuickFoxNotes.stringsBundle.getString('network16')))    //0 is cancel
            return;

        neworkGUI.initialize(service, function(){
            var token = neworkGUI.token[service];
            switch (service) {
                case "googleDocs":
                    requirejs("network/" + service).deleteFile (token, elem.editURL, function(){toolbar.doRefresh();}, [], function(e){neworkGUI.error(e.responseText)});
                    break;
                case "simplenote":
                    requirejs("network/" + service).kill (token, elem.key, function(){toolbar.doRefresh();}, [], function(e){neworkGUI.error(e)});
                    break;
                case "sugarsync":
                    requirejs("network/" + service).kill(token, elem.url, function(){toolbar.doRefresh();}, [], function(e){neworkGUI.error(e.responseText)});
                    break;
                case "local":
                    requirejs("network/" + service).kill(elem.url, treeView.isContainer(row), function(){toolbar.doRefresh();}, [], function(e){neworkGUI.error(e)});
                    break;
                case "dropbox":
                    requirejs("network/" + service).deleteFile (elem.url, function(){toolbar.doRefresh();}, [], function(e){neworkGUI.error(e)});
                    break;
            }
        });
    },
    doNewFile: function() {
        neworkGUI.fprint(5);

        var tree = _("network-tree");
        var row = tree.currentIndex;

        //If file, go to top folder
        if (!treeView.isContainer(row)) {
            row = treeView.getParentIndex(row);
            tree.currentIndex = row;
        }

        var elem = this.getElem(row);
        var service = neworkGUI.pathToArray(elem.path)[0];

        var token = neworkGUI.token[service];

        title = QuickFoxNotes.api.get.noteTitle();
        content = QuickFoxNotes.api.get.noteContent();

        neworkGUI.initialize(service, function(){
            var token = neworkGUI.token[service];
            switch (service) {
                case "googleDocs":
                    var url = elem.contentURL ? elem.contentURL : "https://docs.google.com/feeds/default/private/full";

                    var hidden = treeView.getLevel(row) == 0 ? false : true;    //Do not hide notes inside root
                    requirejs("network/" + service).createFile (token, url, false, hidden, title, content.replace(/\n/g, String.fromCharCode(13, 10)), function(){toolbar.doRefresh()}, [], function(e){neworkGUI.error(e.responseText)});
                    break;
                case "simplenote":
                    requirejs("network/" + service).write (token, "", content, function(){toolbar.doRefresh()}, [], function(e){neworkGUI.error(e.responseText)});
                    break;
                case "sugarsync":
                    requirejs("network/" + service).createFile (token, elem.url, title + ".txt", content.replace(/\n/g, String.fromCharCode(13, 10)), function(){toolbar.doRefresh()}, [], function(e){neworkGUI.error(e.responseText)});
                    break;
                case "local":
                    requirejs("network/" + service).writeFile(elem.url, title, content.replace(/\n/g, String.fromCharCode(13, 10)), false, function(){toolbar.doRefresh()}, [], function(e){neworkGUI.error(e)});
                    break;
                case "dropbox":
                    requirejs("network/" + service).createFile (elem.url, title + ".txt", content.replace(/\n/g, String.fromCharCode(13, 10)), false, function(){toolbar.doRefresh()}, [], function(e){neworkGUI.error(e.responseText)});
                    break;
            }
        });
    },
    doOverwrite: function() {
        neworkGUI.fprint(5);

        var tree = _("network-tree");
        var row = tree.currentIndex;

        var elem = this.getElem(row);
        var service = neworkGUI.pathToArray(elem.path)[0];

        var token = neworkGUI.token[service];

        title = QuickFoxNotes.api.get.noteTitle();
        content = QuickFoxNotes.api.get.noteContent();
        //This service is only available for simplenote
        neworkGUI.initialize(service, function(){
            var token = neworkGUI.token[service];
            switch (service) {
                case "sugarsync":
                    break;
                case "googleDocs":
                    var url = elem.resumableURL ? elem.resumableURL : "https://docs.google.com/feeds/default/private/full";

                    var hidden = treeView.getLevel(row) == 1 ? false : true;    //Do not hide notes inside root

                    requirejs("network/" + service).createFile (token, url, true, hidden, title, content.replace(/\n/g, String.fromCharCode(13, 10)), function(){toolbar.doRefresh()}, [], function(e){neworkGUI.error(e.responseText)});
                    break;
                case "local":
                    requirejs("network/" + service).writeFile(elem.url, title, content.replace(/\n/g, String.fromCharCode(13, 10)), true, function(){neworkGUI.fprint(1);}, [], function(e){neworkGUI.error(e)});
                    break;
                case "simplenote":
                    requirejs("network/" + service).write (token, elem.key, content, function(){toolbar.doRefresh();}, [], function(e){neworkGUI.error(e.responseText)});
                    break;
                case "dropbox":
                    requirejs("network/" + service).createFile (elem.url, title + ".txt", content, true, function(){toolbar.doRefresh()}, [], function(e){neworkGUI.error(e.responseText)});
                    break;
            }
        });
    },
    doFolder: function() {
        neworkGUI.fprint(6);
        //Ask for Folder name; if empty use note's title
        var check = {value: false};
        var input = {value: ""};
        var result = qfnServices.prompts.prompt(
            null,
            QuickFoxNotes.stringsBundle.getString('network8'), QuickFoxNotes.stringsBundle.getString('network9'),
            input, null, check);

        if(!result) {
            neworkGUI.fprint(7);
            return;
        }

        var tree = _("network-tree");
        var row = tree.currentIndex;
        var elem = this.getElem(row);
        var service = neworkGUI.pathToArray(elem.path)[0];
        var token = neworkGUI.token[service];

        title = input.value ? input.value : QuickFoxNotes.api.get.noteTitle();

        neworkGUI.initialize(service, function(){
            var token = neworkGUI.token[service];
            switch (service) {
                case "googleDocs":
                    var hidden = treeView.getLevel(row) == 0 ? false : true;    //Do not hide notes inside root
                    requirejs("network/" + service).createFolder (token, hidden, elem.contentURL, title, function(){toolbar.doRefresh()}, []);
                    break;
                case "simplenote":
                    break;
                case "sugarsync":
                    requirejs("network/" + service).createFolder (token, elem.url, title, function(){toolbar.doRefresh()}, [], function(e){neworkGUI.error(e.responseText)});
                    break;
                case "local":
                    requirejs("network/" + service).createFolder(elem.url, title, function(){toolbar.doRefresh()}, [], function(e){neworkGUI.error(e)});
                    break;
                case "dropbox":
                    requirejs("network/" + service).createFolder(elem.url, title, function(){toolbar.doRefresh()}, [], function(e){neworkGUI.error(e)});
                    break;
            }
        });
    },
    doBackup: function() {
        neworkGUI.fprint(6);
        var tree = _("network-tree");
        var row = tree.currentIndex;
        var elem = this.getElem(row);
        var service = neworkGUI.pathToArray(elem.path)[0];

        //If file, go to top folder
        while (!treeView.isContainer(row)) {
            row = treeView.getParentIndex(row);
            tree.currentIndex = row;
            elem = this.getElem(row);
        }

        neworkGUI.initialize(service, function(){
            var token = neworkGUI.token[service];
            var title = "QuickFox Notes (" + requirejs('misc/time')() + ")";

            function mBackup(notebookGuid_or_url) {
                var data = [];
                const tab = QuickFoxNotes.api.list.tab();
                for (var i = 0; i < tab.length; i++) {
                    var d = QuickFoxNotes.api.get.noteContent(i+1);
                    var group = QuickFoxNotes.api.get.noteGroup(tab[i]);
                    var t = (group ? group + "/" : "") + QuickFoxNotes.api.get.noteTitle(tab[i]);
                    data.push({content: d, title: t});
                }
                const menuitem = QuickFoxNotes.api.list.archive();
                for (var i = 0; i < menuitem.length; i++) {
                    var group = QuickFoxNotes.api.get.archiveGroup(menuitem[i]);
                    var t = "[Archive] " + (group ? group + "/" : "") + QuickFoxNotes.api.get.archiveTitle(menuitem[i]);
                    var d = QuickFoxNotes.api.get.archiveContent(menuitem[i]);
                    data.push({content: d, title: t});
                }

                //Save notes
                const tIndex = data.length;
                function addOne () {
                    var tData = data.shift();
                    neworkGUI.fprint(5, "[" + (tIndex - data.length) + "/" + (tIndex) + "] ");

                    function con () {
                        if (data.length)
                            addOne();
                        else
                            toolbar.doRefresh();
                    }

                    switch (service) {
                        case "googleDocs":
                            requirejs("network/" + service).createFile (token, notebookGuid_or_url, false, true, tData.title, tData.content.replace(/\n/g, String.fromCharCode(13, 10)), function(){
                                return con();
                            }, [], function(e){neworkGUI.error(e.responseText)});
                            break;
                        case "local":
                            requirejs("network/" + service).writeFile(notebookGuid_or_url, tData.title, tData.content.replace(/\n/g, String.fromCharCode(13, 10)), false, function(){
                                return con();
                            }, [], function(e){neworkGUI.error(e)});
                            break;
                        case "dropbox":
                            requirejs("network/" + service).createFile (notebookGuid_or_url, tData.title + ".txt", tData.content.replace(/\n/g, String.fromCharCode(13, 10)), false, function(){
                                return con();
                            }, [], function(e){neworkGUI.error(e)});
                            break;
                    }
                };
                addOne();
            }

            //Create Folder
            switch (service) {
                case "googleDocs":
                    var hidden = treeView.getLevel(row) == 0 ? false : true;    //Do not hide notes inside root
                    requirejs("network/" + service).createFolder (token, hidden, elem.contentURL, title, function(contentURL){
                        mBackup(contentURL);
                    }, []);
                    break;
                case "local":
                    requirejs("network/" + service).createFolder(elem.url, title, function(path){
                        mBackup(path);
                    }, [], function(e){neworkGUI.error(e)});
                    break;
                case "dropbox":
                    requirejs("network/" + service).createFolder(elem.url, title, function(path){
                        mBackup(path);
                    }, [], function(e){neworkGUI.error(e)});
                    break;
            }
        });
    }
}

var treeView = {
    bolInit: false,
    window: null,

    init: function(win, force){
        if (this.bolInit && !force)
            return;

        window = win;
        document = window.document;
        QuickFoxNotes = window.QuickFoxNotes;
        requirejs = window.requirejs;

        treeView.initTree();
        document.getElementById("network-tree").view = treeView;

        neworkGUI.activeServices = [];
        neworkGUI.token = [];

        toolbar.updateToolbar();

        this.bolInit = true;
    },

    /*
    [parentNode, childNode1, childNode2, ...];    //Folder example
    node = {name: "name", ...}

    var tData = [
        {name: "root"},        //Root element
        {name: "e1"},        //example of a file
        {name: "e2"},
        [{name: "e3"},         //example of a folder [...]
            {name: "e31"},
            {name: "e32"},
            [{name: "e33"},
                {name: "e331"}]
        ]
    ]
    */
    tData: [    //[name, elements...]
        {name: "database"},        //first element is mandatory
        [{name: "Local Disk",
          path: "service://local"}
        ]
/*        [{name: "Google Docs",
          path: "service://googleDocs"}
        ],
        [{name: "Simplenote",
          path: "service://simplenote"}
        ],
        [{name: "Dropbox",
          path: "service://dropbox"}
        ],
        [{name: "Sugarsync",
          path: "service://sugarsync"}
        ]*/
    ],

    /* Tree functions */
    treeBox: null,
    selection: null,

    initTree: function() {
        this.view = [];
        for (var i = 1; i < this.tData.length; i++)
            this.view.push([this.tData[i].constructor == Array ? this.tData[i][0].name : this.tData[i].name, i]);
    },
    get rowCount() {
        return this.view.length;
    },
    setTree: function(treeBox) {
        this.treeBox = treeBox;
    },
    getCellText: function(row, column) {
        return this.view[row][0];
    },
    isContainer: function(row) {
        var elem = this.tData;
        for (var i = 1; i < this.view[row].length; i++)
            elem = elem[this.view[row][i]];

        return elem.constructor == Array;
    },
    isContainerOpen: function(row) {
        if (row == this.view.length - 1)
            return false;

        return (this.view[row + 1].length > this.view[row].length) && (this.view[row + 1][this.view[row].length - 1] == this.view[row][this.view[row].length - 1]);
    },
    isContainerEmpty: function(row) {
        var elem = this.tData;
        for (var i = 1; i < this.view[row].length; i++)
            elem = elem[this.view[row][i]];

        return elem.length == 1;
    },
    isSeparator: function(row) {
        return false;
    },
    isSorted: function() {
        return false;
    },
    isEditable: function(row, column) {
        return false;
    },
    getParentIndex: function(row) {
        for (var i = row - 1; i >= 0; i--)
            if (this.view[i].length < this.view[row].length)
                return i;
        return -1;
    },
    getLevel: function(row) {
        return this.view[row].length - 2;
    },
    hasNextSibling: function(row, after) {
        var root = this.tData;
        for (var i = 1; i < this.view[row].length - 1; i++)
            root = root[this.view[row][i]];

        return root.length - 2 >  this.view[row][this.view[row].length - 1];
    },
    toggleOpenState: function(row) {
        var isOpen = this.isContainerOpen(row);

        if (isOpen || !this.isContainerEmpty(row))
            this._toggleOpenState(row);
        else {
            var elem = this.tData;
            for (var i = 1; i < this.view[row].length; i++)
                elem = elem[this.view[row][i]];

            neworkGUI.getList(elem, function(row){
                this._toggleOpenState(row);
                toolbar.updateToolbar();
            }, [row]);
        }
    },
    _toggleOpenState: function(row) {
        var isOpen = this.isContainerOpen(row);

        var count = 0;
        if (isOpen){    //Close it!
            while (
                this.isContainerOpen(row) &&
                ((this.view[row + 1].length > this.view[row].length) && (this.view[row + 1][this.view[row].length - 1] == this.view[row][this.view[row].length - 1]))
            ) {
                this.view.splice(row + 1, 1);
                count += 1;
            }
            this.treeBox.rowCountChanged(row + 1, -count);
        }
        else {    //Open it!
            var elem = this.tData;
            for (var i = 1; i < this.view[row].length; i++)
                elem = elem[this.view[row][i]];

            for (var i = 1; i < elem.length; i++) {
                this.view.splice(row + i, 0, []);
                this.view[row + i] = this.view[row].concat(i);
                this.view[row + i][0] = elem[i].constructor == Array ? elem[i][0].name : elem[i].name;

                count += 1;
            }
            this.treeBox.rowCountChanged(row + 1, +count);
        }
        this.treeBox.invalidateRow(row);
    },

    getImageSrc: function(row, column) {},
    getProgressMode : function(row,column) {},
    getCellValue: function(row, column) {},
    cycleHeader: function(col, elem) {},
    selectionChanged: function() {},
    cycleCell: function(row, column) {},
    performAction: function(action) {},
    performActionOnCell: function(action, index, column) {},
    getRowProperties: function(row, prop) {},
    getCellProperties: function(row, column, prop) {    //For root, use network icon
		if (!Components)
			return;
		if (this.getLevel(row) == 0)
			prop.AppendElement(qfnServices.atomService.getAtom("server"));
		else {
			var extension = function (path) {
				var _ret = /\.([^\/\\\.\~]*)~{0,1}$/.exec(path);
				if (!_ret)
					return;

				return _ret[1].toLowerCase();
			}(this.view[row][0]);
			if (!extension)
				return;
			prop.AppendElement(qfnServices.atomService.getAtom(extension));
		}
    },
    getColumnProperties: function(column, element, prop) {}
};

var neworkGUI = {
    activeServices: [],    //List of all active services
    token: [],

    pathToArray: function(path) {
        path = path.replace(/^.*\:\/\//, "");

        return path.split("/");
    },
    initialize: function(service, callback) {
        if (this.activeServices.indexOf(service) == -1) {
            if (service == "local" || service == "dropbox") {
                requirejs("network/" + service).getToken(function(){
                    if (callback)
                        callback.apply(neworkGUI);
                }, []);
                return;
            }
            //Get login info
            var username = qfnServices.prefs.getCharPref(service + "_username");
            var password = "";

            //Try to retrieve password
            if (username)
                password = QuickFoxNotes.api.login.getPassword(service, username);

            if (!(username && password)) {
                if (!username) {    //Try to find a user
                    var obj = QuickFoxNotes.api.login.getPassword2(service, "");
                    if (obj){
                        username = obj.username;
                        password = obj.password;
                    }
                }

                var _username = {value: username};
                var _password = {value: password};
                var check = {value: false};
                var result = qfnServices.prompts.promptUsernameAndPassword(null,
                                service,
                                QuickFoxNotes.stringsBundle.getString('network14') + " " + service,
                                _username, _password,
                                QuickFoxNotes.stringsBundle.getString('network15'), check);

                if (!result || !_username.value || !_password.value) {
                    this.fprint(7);
                    return false;
                }

                if (_username.value && !(username && password && !check.value))
                    qfnServices.prefs.setCharPref(service + "_username", _username.value);

                if (_username.value && _password.value && check.value)
                    QuickFoxNotes.api.login.setPassword(service, _username.value, _password.value);

                username = _username.value;
                password = _password.value;
            }
            requirejs("network/" + service).getToken(username, password, function(token){
                neworkGUI.token[service] = token;
                neworkGUI.activeServices.push(service);
                if (callback)
                    callback.apply(neworkGUI);
            }, [], function(e){
                qfnServices.prefs.setCharPref(service + "_username", "");
                neworkGUI.error(e.responseText);
            }, true);
        }
        else
            callback.apply(this);
    },
    getList: function(element, fun, params) {
        var path = element[0].path;
        this.fprint(0, path);
        if (!path)
            return this.error("neworkGUI.getList; Empty path is not supported!");

        aPath = this.pathToArray(path);
        var service = aPath[0];    //root aPath is the service

        //Add new items
        this.initialize(service, function(){
            var token = neworkGUI.token[service];
            switch(service){
                case "googleDocs":
                    var url = (aPath.length == 1) ? null : element[0].contentURL;
                    requirejs("network/" + service).getList(token, url, function(files, folders, rootPath){
                        for (var i in folders)
                            element.splice(element.length, 0,
                                [{
                                    name: folders[i].title,
                                    path: rootPath + "/" + folders[i].title,
                                    id: folders[i].id,
                                    editURL: folders[i].editURL,
                                    contentURL: folders[i].contentURL
                                }]
                            );
                        for (var i in files)
                            element.splice(element.length, 0,
                                {
                                    name: files[i].title,
                                    path: rootPath + "/" + files[i].title,
                                    id: files[i].id,
                                    editURL: files[i].editURL,
                                    contentURL: files[i].contentURL,
                                    resumableURL: files[i].resumableURL
                                }
                            );
                        neworkGUI.fprint(1);
                        if (fun) fun.apply(treeView, params);
                    }, [path]);
                    break;
                case "sugarsync":
                    if (aPath.length == 1) {    //Get list of computers
                        requirejs("network/" + service).getWorkspaces(token, function(PCs, rootPath){
                            for (i in PCs)
                                element.splice(element.length, 0,
                                    [{
                                        name: PCs[i].name,
                                        path: rootPath + "/" + PCs[i].name,
                                        url: PCs[i].url
                                    }]
                                );
                            neworkGUI.fprint(1);
                            if (fun) fun.apply(treeView, params);
                        }, [path]);
                    }
                    else {
                        //Add files and folders
                        requirejs("network/" + service).getContents(token, element[0].url, function(folderURL, fileURL, parentURL, rootPath){
                            //Add Files
                            requirejs("network/" + service).getList(token, fileURL, "file", function(list, rootPath, folderURL){
                                for (j in list)
                                    element.splice(element.length, 0,
                                        {
                                            name: list[j].name,
                                            path: rootPath + "/" + list[j].name,
                                            url: list[j].url
                                        }
                                    );
                                //Add Folders
                                requirejs("network/" + service).getList(token, folderURL, "collection", function(list, rootPath){
                                    for (j in list)
                                        element.splice(element.length, 0,
                                            [{
                                                name: list[j].name,
                                                path: rootPath + "/" + list[j].name,
                                                url: list[j].url
                                            }]
                                        );
                                        neworkGUI.fprint(1);
                                        if(fun) fun.apply(treeView, params);
                                }, [rootPath]);
                            }, [rootPath, folderURL]);
                        }, [path]);
                    }
                    break;
                case "simplenote":
                    requirejs("network/" + service).getList(token, function(IDs, rootPath) {
                        try {
                            neworkGUI.simplenoteStack = IDs.length;
                            var len = IDs.length;
                            for (var i in IDs) {
                                var key = IDs[i].key;
                                requirejs("network/" + service).getContent(token, key, function(content, key, rootPath, len){
                                    if (!content)
                                        return;

                                    element.splice(element.length, 0,
                                        {
                                            name: content.match(/.*/)[0],
                                            path: rootPath + "/" + content.match(/.*/)[0].replace("/", "_"),
                                            content: content,
                                            key: key
                                        }
                                    );
                                    neworkGUI.simplenoteStack -= 1;
                                    if(!neworkGUI.simplenoteStack && fun) {
                                        neworkGUI.fprint(1);
                                        fun.apply(treeView, params);
                                    }
                                    neworkGUI.fprint(0, path + " [" + ((len - neworkGUI.simplenoteStack) /len  * 100).toFixed(1) + "%]");

                                }, [key, rootPath, len], function (req){
                                    if (req.status == 401) {
                                        //Clear login info (User invalid);
                                        qfnServices.prefs.setCharPref(service + "_username", "");
                                        neworkGUI.activeServices.splice(neworkGUI.activeServices.indexOf(service), 1);
                                        return neworkGUI.error (8);
                                    }
                                    else if (req.status == 404) {
                                        //Note does not exist, do not retry
                                        return neworkGUI.error (9);
                                    }
                                    else {
                                        //Retry
                                        return neworkGUI.error (10);
                                    }
                                });
                            }
                        }
                        catch (e) {
                            return neworkGUI.error (e.message);
                        }
                    }, [path], function(req){
                        if (req.status == 401) {
                            neworkGUI.activeServices.splice(neworkGUI.activeServices.indexOf(service), 1);
                            return neworkGUI.error (8);
                        }
                        else {
                            //Retry
                            return neworkGUI.error (10);
                        }
                    });
                    break;
                case "local":
                    var url = (aPath.length == 1) ? "/qfn_shortcuts" : element[0].url;

                    requirejs("network/" + service).list(url, function(drives, rootPath){
                        for (i in drives){
                            var item = {
                                name: drives[i].name,
                                path: rootPath + "/" + drives[i].name,
                                url: drives[i].path
                            }
                            element.splice(element.length, 0, drives[i].isFolder ? [item] : item);
                        }
                        neworkGUI.fprint(1);
                        if (fun) fun.apply(treeView, params);
                    }, [path], function(e){neworkGUI.error(e)});
                    break;
                case "dropbox":
                    var url = (aPath.length == 1) ? null : element[0].url;
                    requirejs("network/" + service).getList(url, function(folders, files, rootPath){
                        for (j in files)
                            element.splice(element.length, 0,
                                [{
                                    name: files[j].name,
                                    url: files[j].path,
                                    path: rootPath + "/" + files[j].name
                                }]
                            );

                        for (j in folders)
                            element.splice(element.length, 0,
                                {
                                    name: folders[j].name,
                                    url: folders[j].path,
                                    path: rootPath + "/" + folders[j].name
                                }
                            );

                        neworkGUI.fprint(1);
                        if(fun) fun.apply(treeView, params);
                    }, [path], function(e){neworkGUI.error(e)});
                    break;
                default:
                    return this.error("This service is not supported!");
            }
        });
    },
    fprint: function(msg_index, msg) {
        var statusbar = QuickFoxNotes.api.statusNotification;

        if (typeof(msg_index) != "number") {
            statusbar.show(msg_index);
            return;
        }
        switch(msg_index) {
            case 0:
                statusbar.show(QuickFoxNotes.stringsBundle.getString('network2') + " " + msg + "...");
                break;
            case 1:
                statusbar.show(QuickFoxNotes.stringsBundle.getString('network1'));
                break;
            case 2:
                statusbar.show(QuickFoxNotes.stringsBundle.getString('network3') + "...");
                break;
            case 3:
                statusbar.show(QuickFoxNotes.stringsBundle.getString('network4') + "...");
                break;
            case 4:
                statusbar.show(QuickFoxNotes.stringsBundle.getString('network5') + "...");
                break;
            case 5:
                statusbar.show((msg ? msg : "") + QuickFoxNotes.stringsBundle.getString('network6') + "...");
                break;
            case 6:
                statusbar.show(QuickFoxNotes.stringsBundle.getString('network7') + "...");
                break;
            case 7:
                statusbar.show(QuickFoxNotes.stringsBundle.getString('network10'));
                break;
            case 8:
                statusbar.show(QuickFoxNotes.stringsBundle.getString('network11'));
                break;
            case 9:
                statusbar.show(QuickFoxNotes.stringsBundle.getString('network12'));
                break;
            case 10:
                statusbar.show(QuickFoxNotes.stringsBundle.getString('network13'));
                break;
        }
    },
    error: function(msg) {
        window.alert("Error:\n\nneworkGUI:\n\n" + msg);
    }
}
