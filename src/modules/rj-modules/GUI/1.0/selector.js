define("GUI/selector", function(requirejs, module){
    const get = requirejs("prefs/get");
    const set = requirejs("prefs/set");

    var colorpickerText = document.createElement("colorpicker");
    var colorpickerTab = document.createElement("colorpicker");

    return {
        initialize: function () {
            _("gui-selector-fontsize").value = get.c("FontSize") + " px";
            _("gui-selector-fontsize").setAttribute("tooltiptext", get.c("FontSize") + " px");

            _("gui-selector-tabWidth").value = get.c("TabWidth") + " px";
            _("gui-selector-tabWidth").setAttribute("tooltiptext", get.c("TabWidth") + " px");

            _("gui-selector-textcolor").appendChild(colorpickerText);
            _("gui-selector-backgroundcolor").appendChild(colorpickerTab);

            colorpickerTab.addEventListener("select", function(){
                requirejs('GUI/selector').changeBackgroundColor(this.color);
            }, false);
            colorpickerText.addEventListener("select", function(){
                requirejs('GUI/selector').changeTextColor(this.color);
            }, false);
        },
        onpopupshown: function() {
            colorpickerText.color = get.c("TextColor");
            colorpickerTab.color = get.c("TabColor");
        },
        /**Changing font size of notes*/
        changeFontSize: function (positive) {
            var fontSize = QuickFoxNotes.changeFontSize(positive);

            _("gui-selector-fontsize").value = fontSize + " px";
            _("gui-selector-fontsize").setAttribute("tooltiptext", fontSize + " px");
        },
        /**Changing tab's width*/
        changeTabWidth: function (positive) {
            var tabWidth = parseInt(get.c("TabWidth"));
            var label = _("gui-selector-tabWidth");

            if(positive)
                tabWidth += 1;
            else
                tabWidth -= 1;
            if(tabWidth < 30)
                tabWidth = 30;

            label.value = tabWidth + " px";
            label.setAttribute("tooltiptext", tabWidth + " px");
            set.c("TabWidth", tabWidth);

            for (var i = 0; i < QuickFoxNotes.currentNumberOfPanels; i++) {
                QuickFoxNotes.tabs.getElementsByTagName("panelTab")[i].style.minWidth = tabWidth + "px";
            }
        },
        /**Changing tab's text color*/
        changeTextColor: function (color) {
            set.c("TextColor", color);
            for (var i = 0; i < QuickFoxNotes.currentNumberOfPanels; i++)
                QuickFoxNotes.getEditor(i).style.setProperty("color", color, "important");
        },
        /**Changing tab's background color*/
        changeBackgroundColor: function (color) {
            set.c("TabColor", color);
            QuickFoxNotes.tabpanels.style.setProperty("background-color", color, "important");
        }
    }
});
