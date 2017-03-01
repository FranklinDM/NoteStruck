define("network/googleDocs", function(requirejs, module) {
    var token;
    const _sendReq = requirejs("network/basics")._sendReq;
    const _makeDoc = requirejs("network/basics")._makeDoc;

    var googleDocs = {
        getToken: function(username, password, fun, parameters, errFun, force) {
            if (token && !force) {
                fun.apply(googleDocs, [token].concat(parameters));
                return;
            }
            //http://code.google.com/apis/accounts/docs/AuthForInstalledApps.html
            var doc = "accountType=HOSTED_OR_GOOGLE" +
                "&Email=" + username +
                "&Passwd=" + password +
                "&source=InBasic-QuickFoxNotes" +
                "&scope=https://docs.google.com/feeds/%20https://spreadsheets.google.com/feeds/%20https://docs.googleusercontent.com/" + //Allow to read and write files
                "&service=writely"     //http://code.google.com/apis/gdata/faq.html#clientlogin

            _sendReq(googleDocs, "https://www.google.com/accounts/ClientLogin", "POST",
                [['Content-Type', 'application/x-www-form-urlencoded']], doc, function(req){
                    try {
                        var Auth = req.responseText.match(/Auth=(.*)/)[1];
                        token = Auth;
                        fun.apply(googleDocs, [token].concat(parameters));
                    }
                    catch(e){
                        errFun(req)
                    }
                }, parameters, errFun);
        },
        //Create or overwrite
        createFile: function (token, url, overwrite, hidden, name, data, fun, parameters, errFun) {
            if (!overwrite)
                url = url.replace("default", "upload/create-session/default");

            //Convert string to bytes array
            var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                                      .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
            converter.charset = "UTF-8";
            var istream = converter.convertToInputStream(data ? data : "no content!");
            var bstream = Components.classes["@mozilla.org/binaryinputstream;1"].
                          createInstance(Components.interfaces.nsIBinaryInputStream);
            bstream.setInputStream(istream);
            var bytes = bstream.readBytes(bstream.available());

            var docArray =
                ["entry@http://www.w3.org/2005/Atom",[    //Add namespace to all sub elements too
                 ["category@http://www.w3.org/2005/Atom", ""],
                 ["title@http://www.w3.org/2005/Atom", name]
                ]];
            if (hidden)
                docArray[1][docArray[1].length] = ["category@http://www.w3.org/2005/Atom", ""];

            var doc = document.implementation.createDocument("", "", null);
            _makeDoc(doc, doc, docArray);

            var entry = doc.getElementsByTagName("entry")[0];
            entry.setAttribute("xmlns:docs", "http://schemas.google.com/docs/2007");
            var category1 = doc.getElementsByTagName("category")[0];
            category1.setAttribute("scheme", "http://schemas.google.com/g/2005#kind");
            category1.setAttribute("term", "http://schemas.google.com/docs/2007#document");

            if (hidden) {
                var category2 = doc.getElementsByTagName("category")[1];
                category2.setAttribute("scheme", "http://schemas.google.com/g/2005/labels");
                category2.setAttribute("term", "http://schemas.google.com/g/2005/labels#hidden");
                category2.setAttribute("label", "hidden");
            }

            docArray =
                [["GData-Version", "3.0"],
                 ["Authorization", "GoogleLogin auth=" + token],
                 ["Content-Length", doc.length],
                 ["Content-Type", "application/atom+xml"],
                 ["X-Upload-Content-Type", "text/plain"],
                 ["X-Upload-Content-Length", bytes.length]
                ];

            if (overwrite)
                docArray[docArray.length] = ["If-Match", "*"];
            _sendReq(googleDocs, url, overwrite ? "PUT" : "POST",
                docArray, doc, function(req){
                    try {
                        const header = req.getAllResponseHeaders();
                        var location = header.match(/Location: (.*)/);
                        if (!location)
                            throw {
                                name: "UserException",
                                message: "Could not create the file (Resumable link is not available)"
                            };

                        location = location[1] //+ "?convert=false";
                        //
                        docArray =
                            [
                             ["Content-Length", bytes.length],
                             ["Content-Type", "text/plain"],
                             ["Content-Range", "bytes 0-" + (bytes.length - 1) + "/" + bytes.length]
                            ];

                        _sendReq(googleDocs, location, "PUT",
                            docArray, bytes, function(req){

                            if (!req.responseXML) {
                              errFun(req);
                              return;
                            }
                            var entry = req.responseXML.documentElement;
                            var content = entry.getElementsByTagName("content")[0];
                            if (!content) {
                              errFun(req);
                              return;
                            }
                            var contentURL = content.getAttribute("src");
                            var urls = entry.getElementsByTagName("link");
                            var editURL, resumableURL;
                            for (var j = 0; j < urls.length; j++){
                                if (urls[j].getAttribute("rel") == "edit")
                                    editURL = urls[j].getAttribute("href");
                                if (/resumable-edit-media/.test(urls[j].getAttribute("rel")))
                                    resumableURL = urls[j].getAttribute("href");
                            }

                            fun.apply(googleDocs, [
                                {
                                    contentURL: contentURL,
                                    editURL: editURL,
                                    resumableURL: resumableURL
                                }].concat(parameters));

                        }, parameters, function(){alert("EEEEEror")}, true);    //Send as binary

                    }
                    catch(e) {
                        alert("netwrok>createFile\n\n" + e.message);
                    }
                 }, parameters);
        },
        getList: function (token, url, fun, parameters, files, folders) {    //rec_url, files and folders are only used by this function for recursive fetches
            if (!url)
                url = "https://docs.google.com/feeds/default/private/full/folder:root/contents";
                //url = "https://docs.google.com/feeds/default/private/full";


            _sendReq(googleDocs, url, "GET",
                [["GData-Version", "3.0"],
                 ["Authorization", "GoogleLogin auth=" + token]], null, function(req, files, folders){
                     if (!files)
                        var files = [];
                     if (!folders)
                        var folders = [];

                     var entry = req.responseXML.documentElement.getElementsByTagName("entry");

                     for (var i = 0; i < entry.length; i++) {
                        var title = entry[i].getElementsByTagName("title")[0].textContent;
                        var id = entry[i].getElementsByTagName("id")[0].textContent;
                        var content = entry[i].getElementsByTagName("content")[0];
                        var contentURL = content.getAttribute("src");
                        var type = content.getAttribute("type");
                        //Skip hidden items in home folder
                        if (/folder:root/.test(url)) {
                            var skip = false;
                            var category = entry[i].getElementsByTagName("category");
                            for (var j = 0; j < category.length; j++){
                                if (/labels#hidden/.test(category[j].getAttribute("term")))
                                    skip = true
                            }
                            if (skip)
                                continue;
                        }

                        var urls = entry[i].getElementsByTagName("link");
                        var editURL;
                        for (var j = 0; j < urls.length; j++){
                            if (urls[j].getAttribute("rel") == "edit") {
                                editURL = urls[j].getAttribute("href");
                            }
                            if (/resumable-edit-media/.test(urls[j].getAttribute("rel"))) {
                                resumableURL = urls[j].getAttribute("href");
                            }
                        }

                        if (/id\/folder/.test(id))
                            folders.push({
                                title: title,
                                id: id,
                                contentURL: contentURL,
                                type: type,
                                editURL: editURL
                             });
                        else
                            files.push({
                                title: title,
                                id: id,
                                contentURL: contentURL,
                                type: type,
                                editURL: editURL,
                                resumableURL: resumableURL
                             });
                     }
                     //Is the feed complete?
                     var link = req.responseXML.documentElement.getElementsByTagName("link");
                     for (var i = 0; i < link.length; i++) {
                        var nURL = link[i].getAttribute("href");
                        if (/start-key/.test(nURL) && nURL != url) {
                            return googleDocs.getList(token, nURL, fun, parameters, files, folders);
                        }
                     }
                     function compare(a, b){return a.title.toLowerCase() > b.title.toLowerCase()}

                     fun.apply(googleDocs, [files.sort(compare), folders.sort(compare)].concat(parameters));
                 }, [files, folders].concat(parameters));
        },
        createFolder: function (token, hidden, url, title, fun, parameters) {    //url is contentURL
            if (!url)
                url = "https://docs.google.com/feeds/default/private/full";

            var docArray =
                ["entry@http://www.w3.org/2005/Atom",[    //Add namespace to all sub elements too
                 ["category@http://www.w3.org/2005/Atom", ""],
                 ["title@http://www.w3.org/2005/Atom", title]
                ]];
            if (hidden)
                docArray[1][docArray[1].length] = ["category@http://www.w3.org/2005/Atom", ""];

            var doc = document.implementation.createDocument("", "", null);
            _makeDoc(doc, doc, docArray);
            var category1 = doc.getElementsByTagName("category")[0];
            category1.setAttribute("scheme", "http://schemas.google.com/g/2005#kind");
            category1.setAttribute("term", "http://schemas.google.com/docs/2007#folder");
            if (hidden) {
                var category2 = doc.getElementsByTagName("category")[1];
                category2.setAttribute("scheme", "http://schemas.google.com/g/2005/labels");
                category2.setAttribute("term", "http://schemas.google.com/g/2005/labels#hidden");
                category2.setAttribute("label", "hidden");
            }

            _sendReq(googleDocs, url, "POST",
             [["GData-Version", "3.0"],
              ["Authorization", "GoogleLogin auth=" + token],
              ["Content-Length", doc.length],
              ["Content-Type", "application/atom+xml"]
             ], doc, function(req){
                const contentURL = req.responseXML.documentElement.getElementsByTagName("content")[0].getAttribute("src");
                fun.apply(googleDocs, [contentURL].concat(parameters));
             }, parameters);
        },
        readFile: function (token, url, fun, parameters) {    //url is contentURL
            _sendReq(googleDocs, url + "&exportFormat=txt&format=txt", "GET",
             [["GData-Version", "3.0"],
              ["Authorization", "GoogleLogin auth=" + token]], null, function(req){
                fun.apply(googleDocs, [req.responseText.replace(new RegExp(String.fromCharCode(13, 10), 'g'), '\n')].concat(parameters));
              }, parameters);
        },
        deleteFile: function (token, url, fun, parameters) {    //url is editURL
            _sendReq(googleDocs, url.replace(/folder.*\/contents\//, ""), "DELETE",
             [["GData-Version", "3.0"],
              ["If-Match", "*"],
              ["Authorization", "GoogleLogin auth=" + token]], null, function(req){
                fun.apply(googleDocs, parameters);
              }, parameters);
        },
        rename: function (token, url, new_name, fun, parameters) {    //url is editURL
            var doc = document.implementation.createDocument("", "", null);
            network._makeDoc(doc, doc,
                ["entry@http://www.w3.org/2005/Atom",[    //Add namespace to all sub elements too
                 ["category@http://www.w3.org/2005/Atom", ""],
                 ["title@http://www.w3.org/2005/Atom", new_name]
                ]]
            );
            var entry = doc.getElementsByTagName("entry")[0];
            entry.setAttribute("xmlns:docs", "http://schemas.google.com/docs/2007");
            var category = doc.getElementsByTagName("category")[0];
            category.setAttribute("scheme", "http://schemas.google.com/g/2005#kind");
            category.setAttribute("term", "http://schemas.google.com/docs/2007#document");

            var serializer = new XMLSerializer();
            doc = serializer.serializeToString(doc);

            _sendReq(googleDocs, url, "PUT",
             [["GData-Version", "3.0"],
              ["Content-Type", "application/atom+xml"],
              ["Content-Length", doc.length],
              ["If-Match", "*"],
              ["Authorization", "GoogleLogin auth=" + token]], doc, function(req){
                            alert(req.responseText);
                //fun.apply(googleDocs, parameters);
              }, parameters);
        }
    }

    return googleDocs;
});
