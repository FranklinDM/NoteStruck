/*
http://ftp.iasi.roedu.net/mirrors/eclipse.org/orion/jsdoc/symbols/orion.textview.TextView.html#getTopPixel
resource:///modules/source-editor-orion.jsm
*/

define("app/orion", function(requirejs, module) {
    Components.utils.import("resource:///modules/source-editor.jsm");

    QuickFoxNotes.getEditor = function (index) {    //Overwrite getEditor function to support orion
        var _panel;
        if (!index)
            _panel = QuickFoxNotes.tabpanels.selectedPanel;
        else
            _panel = QuickFoxNotes.tabpanels.childNodes[index];

        if (_panel.getElementsByClassName('qfn-orion').length)
            return _panel.getElementsByClassName('qfn-orion')[0].textbox;
        else
            return _panel.getElementsByClassName("notepad")[0];
    };

    return function (parent, cont) {
        var stack = {   //Stack store all commands executed before editor is loaded
            buffer: [],

            add: function (fun, args) {
                this.buffer.push([fun, args])
            },

            run: function () {
                this.buffer.forEach(function(item){
                    me[item[0]].apply(me, item[1])
                });
                me.saveMe = false;
            }
        }

        var _editor = new SourceEditor();

        config = {
            mode: SourceEditor.MODES.JAVASCRIPT,
            showLineNumbers: true,
            placeholderText: cont
        };

        _editor.init(parent, config, function () {
            stack.run();
        });

        var me = {
            get value() {
                if (!_editor._view)
                    return "";
                return _editor.getText();
            },
            set value(val) {
                _editor.setText(val);
            },

            get parentNode() {
                return parent;
            },

            setSelectionRange: function (start, end) {
                if (_editor._view)
                    _editor.setSelection(Math.min(start, end), Math.max(start, end));
                else
                    stack.add("setSelectionRange", arguments);
            },
            get selectionStart () {
                if (_editor._view)
                    return _editor.getSelection().start;
                else
                    return 0;
            },
            set selectionStart (val) {
                if (_editor._view)
                    _editor.setSelection(val, _editor.getSelection().end);
                else
                    stack.add("selectionStart", arguments);
            },
            get selectionEnd () {
                if (_editor._view)
                    return _editor.getSelection().end;
                else
                    return 0;
            },
            set selectionEnd (val) {
                if (_editor._view)
                    _editor.setSelection(_editor.getSelection().start, val);
                else
                    stack.add("selectionEnd", arguments);
            },

            focus: function() {
                _editor.focus();
            },

            editor: {
                selection: {
                    toString: function() {
                        if (!_editor._view)
                            return "";
                        return _editor.getText(me.selectionStart, me.selectionEnd);
                    }
                },
                selectionController: {
                    getSelection: function(){
                        return me.editor.selection.toString();
                    },
                    scrollSelectionIntoView: function () {
                        /////////////
                    },
                    setDisplaySelection: function () {
                        /////////////
                    }
                },
                copy: function() {
                    _editor._view.invokeAction('copy');
                },
                cut: function() {
                    _editor._view.invokeAction('copy');
                },
                paste: function() {
                    _editor._view.invokeAction('paste');
                },
                canCopy: function() {
                    return true; ////////////////
                },
                canCut: function () {
                    return true; ////////////////
                },

                transactionManager: {
                    clear: function() {
                        _editor._undoStack.index = 0;
                    }
                },

                setSpellcheckUserOverride: function () {
                    /////////////////
                }
            },

            inputField: {
                get scrollTop(){
                    return _editor._view.getTopPixel();
                },
                set scrollTop(val){
                    _editor._view.setTopPixel(val);
                },
                dispatchEvent: function(){/***************/}
            },

            style: {
                get fontFamily () {/***************/},
                set fontFamily (val) {/***************/},
                setProperty: function() {/***************/},

                get fontSize() {return null},
                set fontSize(val) {/***************/}
            },

            controllers: Components.classes["@mozilla.org/xul/xul-controllers;1"]
                            .createInstance(Components.interfaces.nsIControllers),

            spellCheckerUI: {
                overMisspelling: function () {return false},
                addSuggestionsToMenu: function(){},
                initFromEvent: function() {}
            },

            setAttribute: function (name, value) {
                if (!_editor._view) {
                    stack.add("setAttribute", arguments);
                    return;
                }

                switch (name) {
                    case "value":
                        me.value = value;
                        break;
                    case "wrap":
                        break;
                    case "readonly":
                        _editor._view.readonly = true;
                        break;
                    default:
                        //////////////////////////
                }
            },
            getAttribute: function (name, value) {
                switch (name) {
                    case "readonly":
                        return _editor._view.readonly;
                        break;
                    default:
                        //////////////////
                }
            },
            removeAttribute: function (name, value) {
                switch (name) {
                    case "readonly":
                        _editor._view.readonly = false;
                        break;
                    default:
                        //////////////////
                }
            },

            addEventListener: function (type, listener, aWantsUntrusted) {
                if (!_editor._view) {
                    stack.add("addEventListener", arguments);
                    return;
                }
                //http://orion.eclipse.org/jsdoc/symbols/orion.textview.TextView.html#event:onModify
                if (type == "input")
                    _editor._view.addEventListener("ModelChanged", true, listener, aWantsUntrusted);
                else if (type == "select")
                    _editor._view.addEventListener("Selection", true, listener, aWantsUntrusted);
                else
                    parent.addEventListener(type, listener, aWantsUntrusted);
            }
        }
        return me;
    }
});
