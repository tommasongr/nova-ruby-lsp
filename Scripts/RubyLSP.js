module.exports = class RubyLSP {
  constructor() {
    // Observe the configuration setting for the server's location, and restart the server on change
    nova.config.observe("tommasonegri.rubylsp.languageServerPath", function(path) {
      this.start(path)
    }, this)
  }

  deactivate() {
    this.stop()
  }

  async start(path) {
    if (this.languageClient) {
      this.languageClient.stop()
      nova.subscriptions.remove(this.languageClient)
    }

    // Use the default server path
    if (!path) {
      path = await defaultPath()
    }

    if (!nova.fs.access(path, nova.fs.X_OK)) {
      if (nova.inDevMode()) {
        console.error("Ruby LSP not found", path)
      } else {
        console.error("Ruby LSP not found")
      }
    }

    // Create the client
    var serverOptions = {
      path: path
    }
    var clientOptions = {
      // The set of document syntaxes for which the server is valid
      syntaxes: ["ruby"],
      initializationOptions: {
        enabledFeatures: {
          documentSymbols: true,
          foldingRanges: true,
          selectionRanges: true,
          semanticHighlighting: true,
          formatting: true,
          diagnostics: true,
          codeActions: true
        },
      },
    }
    var client = new LanguageClient("ruby-lsp-langserver", "Ruby Language Server", serverOptions, clientOptions)

    try {
      // Start the client
      client.start()

      // Add the client to the subscriptions to be cleaned up
      nova.subscriptions.add(client)
      this.languageClient = client
    }
    catch (err) {
      // If the .start() method throws, it's likely because the path to the language server is invalid

      if (nova.inDevMode()) console.error(err)
    }
  }

  stop() {
    if (this.languageClient) {
      this.languageClient.stop()
      nova.subscriptions.remove(this.languageClient)
      this.languageClient = null
    }
  }
}

defaultPath = async () => {
  return new Promise((resolve, reject) => {
    const process = new Process("/usr/bin/env", {
      cwd: nova.workspace.path,
      args: ["which", "ruby-lsp"],
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    })
    let str = ""
    let err = ""
    let strings = []

    process.onStdout((output) => {
      str += output
    })

    process.onStderr((error) => {
      err += error
    })

    process.onDidExit((status) => {
      if (status == 1){ return reject("") }
      if (str.length == 0) { return reject("") }

      // Split each line of the output in the strings array
      strings = str.match(/[^\r\n]+/g)

      if (status == 0 && strings.length == 1) {
        resolve(strings[0])
      } else {
        reject("")
      }
    })

    process.start()
  })
}
