define("network/evernote", function(requirejs, module) {
    const _sendReq = requirejs("network/basics")._sendReq;
    const _makeDoc = requirejs("network/basics")._makeDoc;
    const server = "http://quickfoxnotes.inbasic.net/";

    var token, shardId;

    var evernote = {
        getToken: function (username, password, fun, parameters, errFun, force) {
            if (token && !force) {
                fun.apply(evernote, [token].concat(parameters));
                return;
            }

            var doc = "task=getToken&username=" + username + "&password=" + btoa(password);
            _sendReq (evernote, server + "evernote/evernote.php", "POST", [
             ["Content-type", "application/x-www-form-urlencoded"],
             ["Content-length", doc.length],
             ["Connection", "close"]
            ], doc, function(req){
                try {
                    var list = JSON.parse (req.responseText);
                    shardId = list.shardId;
                    token = list.token;

                    fun.apply(evernote, [token].concat(parameters))
                }
                catch(e) {
                    errFun.apply(evernote, [req]);
                }
            }, [], errFun);
        },
        listNotebooks: function (token, fun, parameters, errFun) {
            var doc = "task=listNotebooks&token=" + token + "&shardId=" + shardId;
            _sendReq (evernote, server + "evernote/evernote.php", "POST", [
             ["Content-type", "application/x-www-form-urlencoded"],
             ["Content-length", doc.length],
             ["Connection", "close"]
            ], doc, function(req){
                try {
                    var notebooks = JSON.parse (req.responseText);

                    fun.apply(evernote, [notebooks].concat(parameters))
                }
                catch(e) {
                    errFun.apply(evernote, [req]);
                }
            }, [], errFun);
        },
        findNotes: function (token, notebookGuid, fun, parameters, errFun) {
            var doc = "task=findNotes&token=" + token + "&shardId=" + shardId + "&notebookGuid=" + notebookGuid;

            _sendReq (evernote, server + "evernote/evernote.php", "POST", [
             ["Content-type", "application/x-www-form-urlencoded"],
             ["Content-length", doc.length],
             ["Connection", "close"]
            ], doc, function(req){
                try {
                    var notes = JSON.parse (req.responseText);

                    fun.apply(evernote, [notes].concat(parameters))
                }
                catch(e) {
                    errFun.apply(evernote, [req]);
                }
            }, [], errFun);
        },
        getNoteContent: function (token, guid, fun, parameters, errFun) {
            var doc = "task=getNoteContent&token=" + token + "&shardId=" + shardId + "&guid=" + guid;

            _sendReq (evernote, server + "evernote/evernote.php", "POST", [
             ["Content-type", "application/x-www-form-urlencoded"],
             ["Content-length", doc.length],
             ["Connection", "close"]
            ], doc, function(req){
                fun.apply(evernote, [req.responseText].concat(parameters))
            }, [], errFun);
        },
        createNote: function (token, notebookGuid, name, cont, fun, parameters, errFun) {
            function removeHTMLSpecialChars (text) {
                return text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
            }
            name = encodeURIComponent(name);
            cont = removeHTMLSpecialChars(cont);
            //cont = "<p>" + cont.split("\n").join("</p>\n<p>") + "</p>";
            cont = "<pre>" + cont + "</pre>";
            cont = encodeURIComponent(cont);

            var doc = "task=createNote&token=" + token + "&shardId=" + shardId + "&notebookGuid=" + notebookGuid + "&title=" + name + "&content=" + cont;

            _sendReq (evernote, server + "evernote/evernote.php", "POST", [
             ["Content-type", "application/x-www-form-urlencoded"],
             ["Content-length", doc.length],
             ["Connection", "close"]
            ], doc, function(req){
                fun.apply(evernote, [req.responseText].concat(parameters))    //responseText is guid
            }, [], errFun);
        },
        createNotebook: function (token, name, fun, parameters, errFun) {
            name = encodeURIComponent(name);
            var doc = "task=createNotebook&token=" + token + "&shardId=" + shardId + "&name=" + name;

            _sendReq (evernote, server + "evernote/evernote.php", "POST", [
             ["Content-type", "application/x-www-form-urlencoded"],
             ["Content-length", doc.length],
             ["Connection", "close"]
            ], doc, function(req){
                fun.apply(evernote, [req.responseText].concat(parameters))    //responseText is guid
            }, [], errFun);
        },
        deleteNote: function (token, guid, fun, parameters, errFun) {
            var doc = "task=deleteNote&token=" + token + "&shardId=" + shardId + "&guid=" + guid;

            _sendReq (evernote, server + "evernote/evernote.php", "POST", [
             ["Content-type", "application/x-www-form-urlencoded"],
             ["Content-length", doc.length],
             ["Connection", "close"]
            ], doc, function(req){
                fun.apply(evernote, parameters);
            }, [], errFun);
        },
        deleteNotebook: function (token, notebookGuid, fun, parameters, errFun) {
            var doc = "task=deleteNotebook&token=" + token + "&shardId=" + shardId + "&notebookGuid=" + notebookGuid;

            _sendReq (evernote, server + "evernote/evernote.php", "POST", [
             ["Content-type", "application/x-www-form-urlencoded"],
             ["Content-length", doc.length],
             ["Connection", "close"]
            ], doc, function(req){
                fun.apply(evernote, parameters);
            }, [], errFun);
        },
    }

    return evernote;
});
