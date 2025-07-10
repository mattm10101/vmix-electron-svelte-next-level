const net = require('net')

class VmixConnector {
  constructor(host, port, mainWindow) {
    this.host = host
    this.port = port
    this.mainWindow = mainWindow
    this.client = new net.Socket()
    this.isConnected = false
    this.xmlTextPromise = { resolve: null, reject: null }

    this.client.on('data', (data) => this.handleData(data))
    this.client.on('close', () => this.handleClose())
    this.client.on('error', (err) =>
      console.error('vMix TCP Error:', err.message)
    )
  }

  connect() {
    console.log('Attempting to connect to vMix...')
    this.client.connect(this.port, this.host, () => {
      console.log('vMix TCP Connected')
      this.isConnected = true
      this.sendCommand('SUBSCRIBE ACTS')
    })
  }

  handleData(data) {
    const messages = data
      .toString('utf8')
      .split('\r\n')
      .filter((msg) => msg)
    for (const message of messages) {
      if (this.xmlTextPromise.resolve && message.startsWith('XMLTEXT ')) {
        if (message.startsWith('XMLTEXT OK ')) {
          this.xmlTextPromise.resolve(message.substring(11))
        } else {
          this.xmlTextPromise.reject(new Error(message))
        }
        this.xmlTextPromise = { resolve: null, reject: null }
      } else {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send('from-vmix', message)
        }
      }
    }
  }

  handleClose() {
    console.log('vMix TCP connection closed. Reconnecting in 5 seconds...')
    this.isConnected = false
    setTimeout(() => this.connect(), 5000)
  }

  sendCommand(command) {
    if (this.isConnected) {
      this.client.write(command + '\r\n')
    } else {
      console.error('Cannot send command, vMix is not connected.')
    }
  }

  queryXmlText(xpath) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) return reject(new Error('vMix not connected'))
      if (this.xmlTextPromise.resolve)
        return reject(new Error('A request is already in progress'))

      this.xmlTextPromise = { resolve, reject }
      this.sendCommand(`XMLTEXT ${xpath}`)

      setTimeout(() => {
        if (this.xmlTextPromise.reject) {
          this.xmlTextPromise.reject(new Error(`Timeout for xpath: ${xpath}`))
          this.xmlTextPromise = { resolve: null, reject: null }
        }
      }, 1500)
    })
  }
}

module.exports = VmixConnector
