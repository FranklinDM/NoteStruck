define("network/local", function(requirejs, module) {
    var file;

    var local = {
        getToken: function (fun, parameters, errFun) {
            file = qfnServices.lFile;

            fun.apply(local, ["local_token"].concat(parameters));
        },
        list: function (path, fun, parameters, errFun) {
            if(path == "/" && /WIN/.test(qfnServices.appInfo.OS))
                path = "\\\\.";

            try {
                var drives = [];
                var files = [];

                //Add few items to root element
                if (path == "/qfn_shortcuts") {
                    drives.push({
                        name: "Desktop",
                        path: QuickFoxNotes.api.path("Desk"),
                        isFolder: true
                    });
                    drives.push({
                        name: "Home",
                        path: QuickFoxNotes.api.path("Home"),
                        isFolder: true
                    });
                    drives.push({
                        name: "Root (/)",
                        path: "/",
                        isFolder: true
                    });
                }
                else {
                    file.initWithPath(path);
                    var folderEnum = file.directoryEntries;
                    while (folderEnum.hasMoreElements()) {
                        var f = folderEnum.getNext().
                        QueryInterface(Components.interfaces.nsILocalFile);

                        var path = f.path;
                        var name = f.leafName;
                        var isFolder = false;
                        try{isFolder = f.isDirectory();}catch(e){};
                        if(isFolder)
                            drives.push({
                                name: name,
                                path: path,
                                isFolder: isFolder
                            });
                        else
                            files.push({
                                name: name,
                                path: path,
                                isFolder: isFolder
                            });
                    }
                }
                fun.apply(local, [drives.concat(files)].concat(parameters));
            }
            catch(e){
                errFun.apply(local, [e.message]);
            }
        },
        createFolder: function(path, name, fun, parameters, errFun){
            name = name.replace(/[\*\\\/\?\:\"\<\>\|]/g, "_");    //File name exceptions
            try {
                file.initWithPath(path);
                file.append(name);
                if( !file.exists() || !file.isDirectory() )  // if it doesn't exist, create
                    file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0o777);
                fun.apply(local, [file.path].concat(parameters));
            }
            catch(e){
                errFun.apply(local, [e.message]);
            }
        },
        readFile: function(path, fun, parameters, errFun){
            try {
                file.initWithPath(path);
                requirejs('misc/local').importText(file);

                fun.apply(local, parameters);
            }
            catch(e){
                errFun.apply(local, [e.message]);
            }
        },
        writeFile: function(path, title, content, overwrite, fun, parameters, errFun){
            title = title.replace(/[\*\\\/\?\:\"\<\>\|]/g, "_");    //File name exceptions

            Components.utils.import("resource://gre/modules/NetUtil.jsm");
            Components.utils.import("resource://gre/modules/FileUtils.jsm");

            try {
                file.initWithPath(path);
                if (file.isDirectory())    //When overwrite call this function path is file's path
                    file.append(title + ".txt");

                var i = 1;
                while (file.exists() && !overwrite) {
                    file.initWithPath(path);
                    file.append(title + " (" + i + ").txt");
                    i += 1;
                }

                var ostream = FileUtils.openSafeFileOutputStream(file)

                var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
                                createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
                converter.charset = "UTF-8";
                var istream = converter.convertToInputStream(content);


                NetUtil.asyncCopy(istream, ostream, function(status) {
                    if (!Components.isSuccessCode(status)) {
                        errFun.apply(local, [status]);
                        return;
                    }
                    fun.apply(local, parameters);
                })
            }
            catch(e) {
                errFun.apply(local, [e.message]);
            };
        },
        kill: function(path, isFolder, fun, parameters, errFun){
            try {
                file.initWithPath(path);
                file.remove(isFolder);

                fun.apply(local, parameters);
            }
            catch(e) {
                errFun.apply(local, [e.message]);
            };
        }
    }

    return local;
});
