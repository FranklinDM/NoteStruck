Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
const Ci = Components.interfaces;

// Implements nsIAutoCompleteResult
function qfnAutoCompleteResult(searchString, searchResult,
                                  defaultIndex, errorDescription,
                                  results) {
  this._searchString = searchString;
  this._searchResult = searchResult;
  this._defaultIndex = defaultIndex;
  this._errorDescription = errorDescription;
  this._results = results;
}

qfnAutoCompleteResult.prototype = {
  _searchString: "",
  _searchResult: 0,
  _defaultIndex: 0,
  _errorDescription: "",
  _results: [],

  get searchString() {return this._searchString;},

  get searchResult() {return this._searchResult;},

  get defaultIndex() {return this._defaultIndex;},

  get errorDescription() {return this._errorDescription;},

  get matchCount() {return this._results.length;},

  getValueAt: function(index) {return this._results[index];},
  
  getCommentAt: function(index) {return null;},

  /**
   * Get the style hint for the result at the given index
   */
  getStyleAt: function(index) {
    if (index == 0)
      return "suggestfirst";  // category label on first line of results

    return "suggesthint";   // category label on any other line of results
  },

  getImageAt : function (index) {return "";},
  
  getLabelAt: function(index) { return this._results[index]; },

  removeValueAt: function(index, removeFromDb) {this._results.splice(index, 1);},

  QueryInterface: function(aIID) {
    if (!aIID.equals(Ci.nsIAutoCompleteResult) && !aIID.equals(Ci.nsISupports))
        throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};

// Implements nsIAutoCompleteSearch
function qfnAutoCompleteSearch() {}

qfnAutoCompleteSearch.prototype = {
    classID: Components.ID("85f1547c-92b6-438a-9d16-bc5b538459fa"),
    classDescription: "QuickFox Notes autoComplete JS Component",
    contractID: "@mozilla.org/autocomplete/search;1?name=qfn-autocomplete",

    startSearch: function(searchString, searchParam, result, listener) {
        if (searchParam.length > 0) {
            var searchResults = JSON.parse(searchParam);
            var results = [];
            for (i=0; i<searchResults.length; i++) {
                if (searchResults[i].indexOf(searchString) == 0)
                    results.push(searchResults[i]);
            }
            var newResult = new qfnAutoCompleteResult(searchString, Ci.nsIAutoCompleteResult.RESULT_SUCCESS, 0, "", results);
            listener.onSearchResult(this, newResult);
        }
    },

    stopSearch: function() {},
    
    QueryInterface: function(aIID) {
        if (!aIID.equals(Ci.nsIAutoCompleteSearch) && !aIID.equals(Ci.nsISupports))
            throw Components.results.NS_ERROR_NO_INTERFACE;
        return this;
    }
};

if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([qfnAutoCompleteSearch]);
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([qfnAutoCompleteSearch]);

