define("misc/highlight", function(requirejs, module){
    function setSelectionRange(textbox, start, end) {
        //Get selection object
        selection = textbox.editor.selectionController.getSelection(1);
        var range = document.createRange();

        //Find one node to get the parent from it
        node = selection.focusNode;
        if (node.localName == "div")	//If node is already the parent ("div")
            node = node.childNodes[0];

        //Text are allocated in different text nodes, sweep over them to find approperiate node
        //Start position
        var count = 0;
        var myNode;
        for (var i = 0; i < node.parentNode.childNodes.length; i++) {
            myNode = node.parentNode.childNodes[i];
            count += (('length' in myNode) ? myNode.length : 1);	//Enter is a <br /> element so no length is defined for it
            if (count > start)
                break;
        }
        range.setStart(myNode, start - (count - myNode.length));

        //End position
        for (var j = i; j < node.parentNode.childNodes.length && count < end; j++) {
            myNode = node.parentNode.childNodes[j];
            count += (('length' in myNode) ? myNode.length : 1);
             if (count >= end)
                 break;
        }
        range.setEnd(myNode, end - (count - myNode.length));

        selection.addRange(range)

        //Make selection visible
        textbox.editor.selectionController.setDisplaySelection(2);
    }
    return {
        setSelectionRange: setSelectionRange,
        search: function(textbox, searchfor) {
            if (!searchfor)
                return;
            var matchedIndex = [];
            start = 0;
            do {
                index = textbox.value.toLowerCase().indexOf(searchfor.toLowerCase(), start);
                if (index == -1)
                    break;
                matchedIndex.push(index);
                start = index + 1;
            } while(true)

            for (var i = 0; i < matchedIndex.length; i++)
                setSelectionRange(textbox, matchedIndex[i], matchedIndex[i]+searchfor.length);

            QuickFoxNotes.api.statusNotification.show(matchedIndex.length + ' ' +  requirejs("prefs/get").sb("of") + ' "' + searchfor + '"');
        }
    }

});
