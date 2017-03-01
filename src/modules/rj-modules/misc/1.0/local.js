define("misc/local", function(requirejs, module){
    const me = QuickFoxNotes;
    const get = requirejs('prefs/get');

    function _readFile(file, fun) {
        var URL = qfnServices.ioSvc.newFileURI(file);

        qfnServices.ioSvc.newChannel(URL.spec, "", null).asyncOpen({
            _data: "",
            onDataAvailable: function (req, ctx, str, del, n) {
                var ins = Components.classes["@mozilla.org/scriptableinputstream;1"]
                    .createInstance(Components.interfaces.nsIScriptableInputStream)
                ins.init(str)
                this._data += ins.read(ins.available())
            },
            onStartRequest: function () {},
            onStopRequest: function () {
                fun.apply(me, [this._data]);
            }
        }, null)
    }
    function _writeFile(file, txt) {
        //Write data to a file
        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
             createInstance(Components.interfaces.nsIFileOutputStream);

        foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);
        var converter = qfnServices.converter;
        converter.init(foStream, "UTF-8", 0, 0);

        converter.writeString(txt.replace(/\n/g, String.fromCharCode(13, 10)));
        converter.close(); // this closes foStream
    }

    return {
        readFile: _readFile,
        writeFile: _writeFile,

        importText: function (file) {
            if (!file) {
                //showing the dialog
                var nsIFilePicker = Components.interfaces.nsIFilePicker;
                var fp = qfnServices.filepicker;
                fp.init(window, get.sb('selectFileOpen'), nsIFilePicker.modeOpen);

                fp.appendFilter(get.sb('txtFiles'),"*.txt");
                fp.appendFilter(get.sb('allFiles'),"*.*");

                var res = fp.show();
                if (res != nsIFilePicker.returnOK)
                    return;
                var file = fp.file;
            }
            _readFile(file, function(data){
                me.insertTextAtCursorPoint(data.replace(/\r\n/g, '\n'))
            });
        },
        exportText: function(all) {
            const tag = "*************************************************\n";
            //showing the dialog
            var nsIFilePicker = Components.interfaces.nsIFilePicker;
            var fp = qfnServices.filepicker;
            fp.init(window, get.sb('selectFileSave'), nsIFilePicker.modeSave);

            fp.appendFilter(get.sb('txtFiles'),"*.txt");
            fp.appendFilter(get.sb('allFiles'),"*.*");

            var res = fp.show();
            if (res == nsIFilePicker.returnCancel)
                return;
            var file = fp.file;
            if (fp.filterIndex == 0 && !(/\.txt/i.test(file.path))) //Add .txt to the end of the file in txt mode
                file.initWithPath(file.path + ".txt");

            //Read data
            var importNotes = function () {
                var temp = "";

                me.api.list.tab().forEach(function(item, index){
                    temp +=
                        tag +
                        "* " + (me.group.readGroup(item) ? "[" +  me.group.readGroup(item) + "] " : "") + me.group.readLabel(item) + "\n" +
                        tag +
                        me.getEditor(index + 1).value +
                        "\n\n";
                });
                QuickFoxNotes.arc.data.forEach(function(item){
                    temp += tag +
                            "* " + (me.group.readGroup(item) ? "[" +  me.group.readGroup(item) + "] " : "") + me.group.readLabel(item) + "\n" +
                            tag +
                            item.value +
                            "\n\n";
                });

                return temp;
            };

            _writeFile(file, all ? importNotes() : me.getEditor().value);
        }
    }
});
