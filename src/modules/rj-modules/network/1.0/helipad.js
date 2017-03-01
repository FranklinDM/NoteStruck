define("network/helipad", function(requirejs, module) {
    const _sendReq = requirejs("network/basics")._sendReq;
    const _makeDoc = requirejs("network/basics")._makeDoc;

    var username, password;

    /**http://helipadapp.com/document/public/6313d317*/
    var helicoid = {
        getToken: function (uname, pass, fun, parameters, errFun) {
            username = uname;
            password = pass;

            const url = "http://pad.helicoid.net/authenticate?email=" + username + "&password=" + password;

            _sendReq (helicoid, url, "GET", [
             ["Accept", "application/xml"],
             ["Content-Type", "application/xml"]
            ], null, function(req){
                var authenticated;
                try {
                    authenticated = req.responseXML.getElementsByTagName("authenticated")[0].firstChild.textContent;
                }
                catch(e) {
                    errFun.apply(helicoid, [req]);
                }
                if (authenticated == "true")
                    fun.apply(helicoid, parameters);
                else
                    errFun.apply(helicoid, [req]);
            }, [], errFun);
        },
        listTitles: function(fun, parameters, errFun) {
            var doc = document.implementation.createDocument("", "", null);
            _makeDoc(doc, doc,
                ["request",[
                  ["authentication", [
                    ["email", username],
                    ["password", password],
                  ]]
                ]]
            );

            _sendReq (helicoid, "http://pad.helicoid.net/documents/titles", "POST", [
             ["Accept", "application/xml"],
             ["Content-Type", "application/xml"]
            ], doc, function(req){
                var notes = [];

                try {
                     var entry = req.responseXML.documentElement.getElementsByTagName("document");
                     for (var i = 0; i < entry.length; i++) {
                        notes.push({
                            title: entry[i].getElementsByTagName("title")[0].textContent,
                            id: entry[i].getElementsByTagName("id")[0].textContent
                        })
                     }
                    fun.apply(helicoid, [notes].concat(parameters))
                }
                catch(e) {
                    errFun.apply(helicoid, [req]);
                }
            }, [], errFun);
        },
        getNoteContent: function (id, fun, parameters, errFun) {
            const url = "http://pad.helicoid.net/document/" + id + "/get";

            var doc = document.implementation.createDocument("", "", null);
            _makeDoc(doc, doc,
                ["request",[
                  ["authentication", [
                    ["email", username],
                    ["password", password],
                  ]]
                ]]
            );

            _sendReq (helicoid, url, "POST", [
             ["Accept", "application/xml"],
             ["Content-Type", "application/xml"]
            ], doc, function(req){
                try {
                    const content = req.responseXML.documentElement.getElementsByTagName("source")[0].textContent;
                    fun.apply(helicoid, [content].concat(parameters));
                }
                catch(e) {
                    errFun.apply(helicoid, [req]);
                }
            }, [], errFun);
        },
        createNote: function (id, title, content, fun, parameters, errFun) {
            const url = "http://pad.helicoid.net/document/" + (id ? id + "/update" : "create");

            var doc = document.implementation.createDocument("", "", null);
            _makeDoc(doc, doc,
                ["request", [
                  ["authentication", [
                    ["email", username],
                    ["password", password]
                  ]],
                  ["document", [
                    ["title", title],
                    ["source", content]
                  ]]
                ]]
            );

            _sendReq (helicoid, url, "POST", [
             ["Accept", "application/xml"],
             ["Content-Type", "application/xml"]
            ], doc, function(req){
                fun.apply(helicoid, parameters);
            }, [], errFun);
        },
        deleteFile: function (id, fun, parameters, errFun) {
            const url = "http://pad.helicoid.net/document/" + id + "/destroy";

            var doc = document.implementation.createDocument("", "", null);
            _makeDoc(doc, doc,
                ["request", [
                  ["authentication", [
                    ["email", username],
                    ["password", password]
                  ]]
                ]]
            );

            _sendReq (helicoid, url, "POST", [
             ["Accept", "application/xml"],
             ["Content-Type", "application/xml"]
            ], doc, function(req){
                fun.apply(helicoid, parameters);
            }, [], errFun);
        }
    }

    return helicoid;
});
