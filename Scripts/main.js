const RubyLSP = require("./RubyLSP")

var langserver = null;

exports.activate = function() {
  // Do work when the extension is activated
  langserver = new RubyLSP();
}

exports.deactivate = function() {
  // Clean up state before the extension is deactivated
  if (langserver) {
    langserver.deactivate();
    langserver = null;
  }
}

