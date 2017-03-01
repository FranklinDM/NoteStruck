define("network/dropbox", function(requirejs, module) {
    const _sendReq = requirejs("network/basics")._sendReq;
    const get = requirejs("prefs/get");

    const cmky = requirejs("storage/access")(0)[0];
    const cmst = requirejs("storage/access")(0)[1];
    //Generating a unique name for each profile
    const token_name = "dropbox_" + qfnServices.dirsvc.get("ProfD", Components.interfaces.nsIFile).leafName;

    var oauth_token_secret = "";
    var oauth_token = "";

    function percentEncode(s) {
        if (!s)
            return "";

        if (s instanceof Array) {
            var e = [];
            for (var i = 0; i < s.length; i++) {
                e.push(percentEncode(s[i]));
            }
            return e;
        }
        s = encodeURIComponent(s);

        return s
            .replace(/\!/g, "%21")
            .replace(/\*/g, "%2A")
            .replace(/\'/g, "%27")
            .replace(/\(/g, "%28")
            .replace(/\)/g, "%29");
    }

    function timestamp () {
        return Math.round(((new Date()).getTime()-Date.UTC(1970,0,1))/1000);
    }

    function oauth_nonce (length) {
        var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
        var result = "";
        for (var i = 0; i < length; ++i) {
            var rnum = Math.floor(Math.random() * chars.length);
            result += chars.substring(rnum, rnum+1);
        }
        return result;
    }

    function hmac_sha1(message, keystring) {
        var keyObject = Components.classes["@mozilla.org/security/keyobjectfactory;1"]
            .getService(Components.interfaces.nsIKeyObjectFactory)
            .keyFromString(Components.interfaces.nsIKeyObject.HMAC, keystring);

        var hasher = Components.classes["@mozilla.org/security/hmac;1"]
            .createInstance(Components.interfaces.nsICryptoHMAC);
        hasher.init(hasher.SHA1, keyObject);

        var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
            .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
        converter.charset = "UTF-8";

        var data = converter.convertToByteArray(message, {});
        hasher.update(data, data.length);

        return percentEncode(btoa(hasher.finish(false)));
    }

    var createURL = function(url, params, method) {
        params.sort();
        //Generating URL
        _url = url;
        params.forEach(function (elem, index){
            _url += (index ? "&" : "?") + elem.replace(/(^[^=]*=)([\s\S]*)/, function (entire, part1, part2) {
                return part1 + percentEncode(part2);
            });
        })

        var hash = function (){
            var dUrl = url.split("://");
            const base = dUrl[0];
            var ext = dUrl[1].split("/");
            ext.forEach(function(elem, index){ext[index] = percentEncode(elem)});
            dUrl = base + "://" + ext.join("/");

            var hashstring = method + "&" + percentEncode(dUrl) + "&";
            params.forEach(function (elem, index){
                hashstring += percentEncode((index ? "&" : "") + percentEncode(elem.split("=")).join("="));
            })

            return hmac_sha1(hashstring, cmst + "&" + oauth_token_secret);
        }();

        return _url + "&oauth_signature=" + hash;
    }

    var dropbox = {
        getToken: function (fun, parameters, errFun, force) {
            try {oauth_token = get.c(token_name)}catch(e){}    //Token might not be defined
            if (oauth_token && !force){
                oauth_token_secret = QuickFoxNotes.api.login.getPassword("dropbox", token_name);
                if (oauth_token_secret){
                    fun.apply(dropbox, [oauth_token].concat(parameters));
                    return;
                }
            }

            oauth_token_secret = "";

            const method = "POST";
            const url = createURL("https://api.dropbox.com/1/oauth/request_token",
               ["oauth_version=1.0",
                "oauth_consumer_key=" + cmky,
                "oauth_timestamp=" + timestamp(),
                "oauth_nonce=" + oauth_nonce(6),
                "oauth_signature_method=HMAC-SHA1"], method);

            _sendReq (dropbox, url, method, [], null, function(req){
                try {
                    var temp = req.responseText.match(/(.*)=(.*)&(.*)=(.*)/);
                    oauth_token = temp[4];
                    oauth_token_secret = temp[2];

                    var user_url = "https://www.dropbox.com/1/oauth/authorize?oauth_token=" + oauth_token;
                    QuickFoxNotes.openLink(user_url);

                    alert(get.sb("network17"));

                    const method = "POST";
                    const url = createURL("https://api.dropbox.com/1/oauth/access_token",
                       ["oauth_version=1.0",
                        "oauth_consumer_key=" + cmky,
                        "oauth_token=" + oauth_token,
                        "oauth_timestamp=" + timestamp(),
                        "oauth_nonce=" + oauth_nonce(6),
                        "oauth_signature_method=HMAC-SHA1"], method);

                    _sendReq (dropbox, url, method, [], null, function(req){
                        temp = req.responseText.match(/(.*)=(.*)&(.*)=(.*)&(.*)=(.*)/);
                        oauth_token_secret = temp[2];
                        oauth_token = temp[4];

                        requirejs("prefs/set").c(token_name, oauth_token);
                        QuickFoxNotes.api.login.setPassword("dropbox", token_name, oauth_token_secret);

                        fun.apply(dropbox, [oauth_token].concat(parameters));
                    }, [], errFun);
                }
                catch(e) {
                    errFun.apply(dropbox, [req.responseText]);
                }
            });
        },
        getList: function (path, fun, parameters, errFun) {
            if (!path)
                path = "/";

            const method = "GET";
            const url = createURL("https://api.dropbox.com/1/metadata/dropbox" + path,
               ["list=true",
                "include_deleted=false",

                "oauth_version=1.0",
                "oauth_consumer_key=" + cmky,
                "oauth_token=" + oauth_token,
                "oauth_timestamp=" + timestamp(),
                "oauth_nonce=" + oauth_nonce(6),
                "oauth_signature_method=HMAC-SHA1"], method);


            _sendReq(dropbox, url, method, [], null, function(req){
                try {
                    const obj = JSON.parse(req.responseText);
                    var rPath = obj.path
                    var files = [], folders = [];
                    obj.contents.forEach(function(elem){
                        (elem.is_dir ? folders : files)["push"]({
                            path: elem.path,
                            name: elem.path.match(/[^\/]*$/)[0],
                            is_dir: elem.is_dir
                        })
                    })
                }
                catch(e) {
                    errFun.apply(dropbox, [req.responseText]);
                }
                fun.apply(dropbox, [files, folders].concat(parameters));
            }, [], errFun);
        },
        //Get working URL for files, folders and parent of a URL
        getContents: function (path, fun, parameters, errFun) {
            const method = "GET";
            const url = createURL("https://api-content.dropbox.com/1/files/dropbox" + path,
               ["oauth_version=1.0",
                "oauth_consumer_key=" + cmky,
                "oauth_token=" + oauth_token,
                "oauth_timestamp=" + timestamp(),
                "oauth_nonce=" + oauth_nonce(6),
                "oauth_signature_method=HMAC-SHA1"], method);

            _sendReq(dropbox, url, method, [], null, function(req){
                fun.apply(dropbox, [req.responseText.replace(/(\r\n|\n|\r)/gm, "\n")].concat(parameters));
            }, [], errFun);
        },
        createFile: function (path, name, data, overwrite, fun, parameters, errFun) {
            const method = "PUT";

            const url = createURL("https://api-content.dropbox.com/1/files_put/dropbox" + (path ? path : "") + (overwrite ? "" : "/" + name.replace(/[\*\\\/\?\:\"\<\>\|]/g, "_")),
               ["overwrite=" + overwrite,

                "oauth_version=1.0",
                "oauth_consumer_key=" + cmky,
                "oauth_token=" + oauth_token,
                "oauth_timestamp=" + timestamp(),
                "oauth_nonce=" + oauth_nonce(6),
                "oauth_signature_method=HMAC-SHA1"], method);

            _sendReq(dropbox, url, method, [], data, function(req){
                fun.apply(dropbox, parameters);
            }, [], errFun);
        },
        createFolder: function (path, name, fun, parameters, errFun) {
            const method = "POST";

            const url = createURL("https://api.dropbox.com/1/fileops/create_folder",
               ["root=dropbox",
                "path=" + (path ? path : "") + "/" + name.replace(/[\*\\\/\?\:\"\<\>\|]/g, "_"),

                "oauth_version=1.0",
                "oauth_consumer_key=" + cmky,
                "oauth_token=" + oauth_token,
                "oauth_timestamp=" + timestamp(),
                "oauth_nonce=" + oauth_nonce(6),
                "oauth_signature_method=HMAC-SHA1"], method);

            _sendReq(dropbox, url, method, [], null, function(req){
                const path = JSON.parse(req.responseText).path;

                fun.apply(dropbox, [path].concat(parameters));
            }, [], errFun);
        },
        deleteFile: function (path, fun, parameters, errFun) {
            const method = "POST";

            const url = createURL("https://api.dropbox.com/1/fileops/delete",
               ["root=dropbox",
                "path=" + path,

                "oauth_version=1.0",
                "oauth_consumer_key=" + cmky,
                "oauth_token=" + oauth_token,
                "oauth_timestamp=" + timestamp(),
                "oauth_nonce=" + oauth_nonce(6),
                "oauth_signature_method=HMAC-SHA1"], method);

            _sendReq(dropbox, url, method, [], null, function(req){
                fun.apply(dropbox, parameters);
            }, [], errFun);

        }
    }

    return dropbox;
});
