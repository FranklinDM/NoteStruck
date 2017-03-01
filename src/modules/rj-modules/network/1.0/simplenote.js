define("network/simplenote", function(requirejs, module) {
    const _sendReq = requirejs("network/basics")._sendReq;
    const _makeDoc = requirejs("network/basics")._makeDoc;

    var username, token;

    var simplenote = {
        getToken: function (uname, password, fun, parameters, errFun, force) {
            if (token && !force) {
                fun.apply(simplenote, [token].concat(parameters));
                return;
            }
            var doc = "?" + btoa("email=" + uname + "&password=" + password);

            _sendReq (simplenote, "https://simple-note.appspot.com/api/login", "POST", [
             ["Content-type", "application/x-www-form-urlencoded"],
             ["Content-length", doc.length],
             ["Connection", "close"]
            ], doc, function(req){
                token = req.responseText;
                if (token) {
                    username = uname;
                    fun.apply(simplenote, [token].concat(parameters));
                }
                else
                    errFun.apply(simplenote, [req]);
            }, [], errFun);
        },

        getList: function (token, fun, parameters, errFun, mark, IDs) {    //mark is used for several request
            var url = "https://simple-note.appspot.com/api2/index?auth=" + token + "&email=" + username + (mark ? "&mark="+mark : "") + "&length=100";

            _sendReq (simplenote, url, "GET", [], null, function(req, IDs){
                if (!IDs)
                    var IDs = [];

                var list = JSON.parse (req.responseText);

                for (var i = 0; i < list.count; i++) {
                    if (list.data[i].deleted == 1)    //Do not get info of deleted note
                        continue;
                    IDs.push({
                        key: list.data[i].key,
                        tags: list.data[i].tags
                    });
                }
                if (list.mark) {
                    simplenote.getList(token, fun, parameters, errFun, list.mark, IDs);
                    return;
                }
                else
                    fun.apply(simplenote, [IDs].concat(parameters));
            }, [IDs], errFun);
        },

        getContent: function (token, key, fun, parameters, errFun) {    //Returns null if the note is deleted
            var url = "https://simple-note.appspot.com/api2/data/" + key + "?auth=" + token + '&email=' + username;

            _sendReq (simplenote, url, "GET", [], null, function(req){
                var list = JSON.parse (req.responseText);
                fun.apply(simplenote, [(list.deleted == 1 ? null : list.content)].concat(parameters));
            }, [], errFun);
        },

        write: function (token, key, data, fun, parameters, errFun) {
            var url = "https://simple-note.appspot.com/api2/data" + (key ? "/" + key : "") + "?auth=" + token + "&email=" + username;
            var doc = JSON.stringify({content:data});

            _sendReq (simplenote, url, "POST", [["Content-Type", "text/plain;charset=UTF-8"]], doc, function(req){
                fun.apply(simplenote, parameters);
            }, [], errFun);
        },
        kill: function (token, key, fun, parameters, errFun) {
            var url = "https://simple-note.appspot.com/api2/data/" + key + "?auth=" + token + "&email=" + username;
            var doc = JSON.stringify({"deleted": 1});

            _sendReq (simplenote, url, "POST", [["Content-Type", "text/plain;charset=UTF-8"]], doc, function(req){
                fun.apply(simplenote, parameters);
            }, [], errFun);
        },
        getTags: function(token, fun, parameters, errFun, mark, IDs) {
            var url = "https://simple-note.appspot.com/api2/tags" + "?auth=" + token + "&email=" + username + (mark ? "&mark="+mark : "") + "&length=100";

            _sendReq (simplenote, url, "GET", [], null, function(req){
                if (!IDs)
                    var IDs = [];

                var list = JSON.parse (req.responseText);
                var tags = list.tags;

                for (var i = 0; i < list.count; i++)
                    IDs.push(tags[i].name);

                if (list.mark) {
                    simplenote.getTags(token, fun, parameters, errFun, list.mark, IDs);
                    return;
                }
                else
                    fun.apply(simplenote, [IDs].concat(parameters));
            }, [], errFun);
        }
    }

    return simplenote;
});
