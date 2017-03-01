define("network/sugarsync", function(requirejs, module) {
    const _sendReq = requirejs("network/basics")._sendReq;
    const _makeDoc = requirejs("network/basics")._makeDoc;

    var sugarsync = {
        getToken: function(username, password, fun, parameters, errFun) {
            var doc = document.implementation.createDocument("", "", null);
            _makeDoc(doc, doc,
                ["authRequest", [
                    ["username", username],
                    ["password", password],
                    ["accessKeyId", "MTM4NDY2NDEzMDc1NDc1NzY4MDA"],
                    ["privateAccessKey", "MGQ4ZGUyNTdhNjlkNDk0Yjg5MmMyOGFiOGUzZTc2YTY"]
                ]]
            );
            _sendReq(sugarsync, "https://api.sugarsync.com/authorization", "POST", [], doc, function(req){
                try {
                    var token = req.getAllResponseHeaders().match(/Location: (.*)/m)[1];

                    fun.apply(sugarsync, [token].concat(parameters));
                }
                catch(e) {
                    errFun(req);
                }
            }, [], errFun);
        },
        //Get list of availble PCs
        getWorkspaces: function (token, fun, parameters) {
            _sendReq(sugarsync, "https://api.sugarsync.com/user", "GET", [["Authorization", token]], null, function(req){
                var workspaces = req.responseXML.documentElement.getElementsByTagName("workspaces")[0].textContent;
                _sendReq(sugarsync, workspaces, "GET", [["Authorization", token]], null, function(req){
                    var PCs = [];
                    var collection = req.responseXML.documentElement.getElementsByTagName("collection");
                    for (var i = 0; i < collection.length; i++){
                        PCs.push(
                        {
                            url: collection[i].getElementsByTagName("ref")[0].textContent,
                            name: collection[i].getElementsByTagName("displayName")[0].textContent
                        });
                    }
                    fun.apply(sugarsync, [PCs].concat(parameters));
                }, []);
            }, []);
        },
        //Get list of Folders within a URL
        getList: function (token, url, type, fun, parameters) {    //types: "collection" and "file"
            //Get Folders
            _sendReq(sugarsync, url, "GET", [["Authorization", token]], null, function(req){
                var list = [];
                var collection = req.responseXML.documentElement.getElementsByTagName(type);
                for (var i = 0; i < collection.length; i++){
                    list.push(
                    {
                        url: collection[i].getElementsByTagName("ref")[0].textContent,
                        name: collection[i].getElementsByTagName("displayName")[0].textContent
                    });
                }
                fun.apply(sugarsync, [list].concat(parameters));
            }, []);
        },
        //Get working URL for files, folders and parent of a URL
        getContents: function (token, url, fun, parameters) {
            _sendReq(sugarsync, url, "GET", [["Authorization", token]], null, function(req){
                var contents = req.responseXML.documentElement.getElementsByTagName("contents")[0].textContent;
                var files = req.responseXML.documentElement.getElementsByTagName("files")[0].textContent;
                var parent;    //Not all folders have parent!
                try{    //There is no parent url when listing workspaces
                    parent = req.responseXML.documentElement.getElementsByTagName("parent")[0].textContent;
                } catch(e){}
                fun.apply(sugarsync, [contents, files, parent].concat(parameters));
            }, []);
        },
        createFile: function (token, url, name, data, fun, parameters, errFun) {
            var doc = document.implementation.createDocument("", "", null);
            _makeDoc(doc, doc,
                ["file",[
                 ["displayName", name],
                 ["mediaType", "text/plain"],
                 ["token", token]
                ]]
            );

            _sendReq(sugarsync, url, "POST", [["Authorization", token]], doc, function(req){
                var url = req.getAllResponseHeaders().match(/Location: (.*)/m)[1] + "/data";

                _sendReq (sugarsync, url, "PUT", [
                 ["Authorization", token],
                 ["Content-Length", data.length],
                 ["Mime-Type", "text/plain"]
                ], data, function(req){
                    fun.apply(sugarsync, parameters);
                }, [], errFun);
            }, []);
        },
        readFile: function (token, url, fun, parameters) {
            _sendReq(sugarsync, url, "GET", [["Authorization", token]], null, function(req){
                var fileURL = req.responseXML.documentElement.getElementsByTagName("fileData")[0].textContent;
                _sendReq(sugarsync, fileURL, "GET", [["Authorization", token]], null, function(req){
                    fun.apply(sugarsync, [req.responseText.replace(/(\r\n|\n|\r)/gm, "\n")].concat(parameters));
                }, []);


            }, []);
        },
        createFolder: function (token, url, name, fun, parameters) {
            var doc = document.implementation.createDocument("", "", null);
            _makeDoc(doc, doc,
                ["folder",[
                 ["displayName", name],
                 ["token", token]
                ]]
            );

            _sendReq(sugarsync, url, "POST", [["Authorization", token]], doc, function(req){
                var url = req.getAllResponseHeaders().match(/Location: (.*)/m)[1] + "/data";

                fun.apply(sugarsync, [url].concat(parameters));
            }, []);
        },
        kill: function(token, url, fun, parameters) {
            _sendReq(sugarsync, url, "DELETE", [["Authorization", token]], null, function(req){
                fun.apply(sugarsync, parameters);
            }, []);
        },
        rename: function (token, url, new_name, type, fun, parameters) {    //type= file or folder
            var doc = document.implementation.createDocument("", "", null);
            network._makeDoc(doc, doc,
                [type,[
                 ["displayName", new_name],
                 ["token", token]
                ]]
            );
            _sendReq(sugarsync, url, "PUT", [["Authorization", token]], doc, function(req){
                fun.apply(sugarsync, parameters);
            }, []);
        }
    }

    return sugarsync;
});
