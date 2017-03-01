define("app/todo", function(requirejs, module){
    const me = QuickFoxNotes;

    const get = requirejs("prefs/get");
    const set = requirejs("prefs/set");

    var arr = [],    //Array of textboxes containing task lists
        tabs = [];   //Array of tabs containing task lists
    const mRegExp = /[\u2610\u2611\u2612]\s/gi;

    /**Begin of element Creation*/
    var findBoundaries = function () {
        const str = me.getEditor().value;
        const selStart = me.getEditor().selectionStart;
        const selEnd = me.getEditor().selectionEnd;

        return {
            start: selStart - /.*$/.exec(str.substring(0, selStart))[0].length,    //Corrected selection start
            end: selEnd + /^.*/.exec(str.substring(selEnd))[0].length    //Corrected selected end
        }
    };
    var getLine = function () {
        const b = findBoundaries();
        return me.getEditor().value.substring(b.start, b.end);
    }
    function doCMD (e){
        const textbox = me.getEditor();
        const boundary = findBoundaries();
        const line = getLine();

        const r = /^(\s*)([\u2610\u2611\u2612]*)(\s)/.exec(line);

        const spaces = r ? r[1] : "";
        const isItTask = r ? (r[2].length ? true : false) : false;
        const isPostSpace = r ? (r[3].length ? true : false) : false;

        me.insertTextAtCursorPoint(
            e.originalTarget.getAttribute("value") + (isPostSpace ? "" : " "),
            textbox,
            boundary.start + spaces.length,
            boundary.start + spaces.length + (isItTask ? 1 : 0)
        );
        textbox.setSelectionRange (
            boundary.start + spaces.length + 2,
            boundary.start + spaces.length + 2
        );
    };

    var _vbox = document.createElement("vbox");
    var t1 = document.createElement("toolbarbutton"),
        t2 = t1.cloneNode(false),
        t3 = t1.cloneNode(false),
        t4 = t1.cloneNode(false);
    t1.setAttribute("label", "\u2610...");
    t1.setAttribute("value", "\u2610");
    t2.setAttribute("label", "\u2611...");
    t2.setAttribute("value", "\u2611");
    t3.setAttribute("label", "\u2612...");
    t3.setAttribute("value", "\u2612");
    t4.setAttribute("label", "...");
    t4.setAttribute("value", "...");

    _vbox.appendChild(t1);
    _vbox.appendChild(t2);
    _vbox.appendChild(t3);
    _vbox.appendChild(t4);
    /**End of element Creation*/

    //Update task numbers in toolbar
    function update() {
        var total = 0;

        arr.forEach(function(t, index) {
            if (!("value" in t))    //It happens when an application has been archived
                return;

            const test = t.value.match( /[\u2610]\s/gi)    //Each task start with number:
            const num = test ? test.length : 0;

            total += num
        });
        set.i("counter", 0);    //Reset
        set.i("counter", total);
    }

    return function () {
        var index = 0;
        var textbox;
        var vbox;    //This will contain all elements. Need to be uninstalled

        return {
            insertSample: function (textbox) {
                //Inset a sample task
                if (!mRegExp.test(textbox.value)) {
                    textbox.value = textbox.value + "\n\n"
                        + get.sb("toDoList1")
                        + "\n\u2610 " + get.sb("toDoList2") + " [" + get.sb("toDoList3") + "]"
                        + "\n\u2611 " + get.sb("toDoList2") + " [" + get.sb("toDoList4") + " (" + get.sb("toDoList6") + ")]"
                        + "\n\u2612 " + get.sb("toDoList2") + " [" + get.sb("toDoList5") + " (" + get.sb("toDoList6") + ")]";
                    textbox.saveMe = true;
                }
            },
            install: function (tab, tbox){
                textbox = tbox;

                tab.setAttribute("todo", true);
                textbox.todo = this;
                index = arr.length;
                arr[index] = textbox;
                tabs[index] = tab;

                vbox = _vbox.cloneNode(true);
                vbox.childNodes[0].addEventListener("command", doCMD, false);
                vbox.childNodes[1].addEventListener("command", doCMD, false);
                vbox.childNodes[2].addEventListener("command", doCMD, false);
                vbox.childNodes[3].addEventListener("command", this.list, false);
                textbox.parentNode.appendChild(vbox);

                this.update();
            },
            update: update,
            uninstall: function () {
                arr.splice(index, 1);    //Remove counts
                tabs.splice(index, 1);    //Remove counts
                vbox.parentNode.removeChild(vbox);
                update();
            },
            list: function () {
              var completed = [], deleted = [], uncompleted = [];

              arr.forEach(function(t, index) {
                  if (!("value" in t))    //It happens when an application has been archived
                      return;

                  var test = t.value.match(/[\u2610]\s(.*)/gi);
                  if (test) {
                    for (var i=0; i < test.length; i++) {
                      uncompleted.push ("[" + me.api.get.noteTitle(tabs[index]) + "] " + test[i].substr(2));
                    }
                  }
                  test = t.value.match(/[\u2611]\s(.*)/gi);
                  if (test) {
                    for (var i=0; i < test.length; i++) {
                      completed.push ("[" + me.api.get.noteTitle(tabs[index]) + "] " + test[i].substr(2));
                    }
                  }
                  test = t.value.match(/[\u2612]\s(.*)/gi);
                  if (test) {
                    for (var i=0; i < test.length; i++) {
                      deleted.push ("[" + me.api.get.noteTitle(tabs[index]) + "] " + test[i].substr(2));
                    }
                  }
              });
              var txt = "";
              txt += get.sb("toDoList3") + "\n";
              for (var i=0; i< uncompleted.length; i++) {
                txt += "\t" + uncompleted[i] + "\n";
              }
              txt += "\n" + get.sb("toDoList4") + "\n";
              for (var i=0; i< completed.length; i++) {
                txt += "\t" + completed[i] + "\n";
              }
              txt += "\n" + get.sb("toDoList5") + "\n";
              for (var i=0; i< deleted.length; i++) {
                txt += "\t" + deleted[i] + "\n";
              }
              alert(txt);
            }
        }
    }
})
