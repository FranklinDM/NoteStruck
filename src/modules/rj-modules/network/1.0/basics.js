define("network/basics", function(requirejs, module) {
    /*
    <file>
        <entry>
            entry 1
        <entry>
        <entry>
            entry 2
        <entry>
    </file>

    var doc = document.implementation.createDocument("", "", null);
    _makeDoc(doc, doc,
        ["file",[
         ["entry", "entry 1"],
         ["entry", "entry 2"]
        ]]
    );
    */
    function _makeDoc (doc, parent, arr) {
        var node
        if (typeof(arr[0]) == "string") {
            if (/@/.test(arr[0]))
                node = doc.createElementNS(arr[0].split("@")[1], arr[0].split("@")[0]);
            else
                node = doc.createElement(arr[0]);
        }
        else {
            for(i in arr)
                _makeDoc(doc, parent, arr[i]);
            return;
        }

        if (typeof(arr[1]) == "string")
            node.textContent = arr[1];
        else
            _makeDoc(doc, node, arr[1]);

        parent.appendChild(node)
        return node;
    }

    return {
        _makeDoc: _makeDoc,

        _sendReq: function (me, url, method, header, doc, fun, parameters, errFun, sendAsBinary) {
            var req = new XMLHttpRequest();
            req.open(method, url, true);
            for (var i in header)
                req.setRequestHeader(header[i][0], header[i][1]);
            req.onreadystatechange = function (aEvt) {
                if (req.readyState == 4) {
                    if(req.status == 200 || req.status == 201 || req.status == 204)
                        fun.apply(me, [req].concat(parameters));
                    else {
                        if (errFun)
                            fun.apply(me, [req]);
                        else
                            alert("Error occured:\n\n" +
                                    "\tStatus: " + req.status +
                                    "\nMessage:\n\n" + req.responseText +
                                    "\nHeader:\n\n" + req.getAllResponseHeaders());
                    }
                }
            };
            req[sendAsBinary ? "sendAsBinary" : "send"](doc);
        },

    }
});
