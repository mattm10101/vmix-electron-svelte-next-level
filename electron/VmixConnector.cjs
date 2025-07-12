const net = require('net')

class VmixConnector {
  constructor(host, port, mainWindow) {
    this.host = host
    this.port = port
    this.mainWindow = mainWindow
    this.client = new net.Socket()
    this.isConnected = false
    this.xmlPromise = { resolve: null, reject: null }
    this.buffer = Buffer.alloc(0)

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
    this.buffer = Buffer.concat([this.buffer, data])
    this.processBuffer()
  }

  processBuffer() {
    while (this.buffer.length > 2) {
      const crlfIndex = this.buffer.indexOf('\r\n')
      if (crlfIndex === -1) {
        break
      }

      const header = this.buffer.slice(0, crlfIndex).toString('utf8')
      const parts = header.split(' ')
      const command = parts[0]
      const status = parts[1]

      if (command === 'XML') {
        const dataLength = parseInt(status, 10)
        const totalLength = crlfIndex + 2 + dataLength

        if (this.buffer.length >= totalLength) {
          const xmlData = this.buffer
            .slice(crlfIndex + 2, totalLength)
            .toString('utf8')

          if (this.xmlPromise.resolve) {
            this.xmlPromise.resolve(xmlData)
            this.xmlPromise = { resolve: null, reject: null }
          }

          this.buffer = this.buffer.slice(totalLength)
          continue
        } else {
          break
        }
      } else {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send('from-vmix', header)
        }
        this.buffer = this.buffer.slice(crlfIndex + 2)
        continue
      }
    }
  }

  sendCommand(command) {
    if (this.isConnected) {
      this.client.write(command + '\r\n')
    } else {
      console.error('Cannot send command, vMix is not connected.')
    }
  }

  queryXml() {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) return reject(new Error('vMix not connected'))
      if (this.xmlPromise.resolve) {
        return reject(new Error('An XML query is already in progress.'))
      }

      this.xmlPromise = { resolve, reject }
      this.sendCommand('XML')

      setTimeout(() => {
        if (this.xmlPromise.reject) {
          this.xmlPromise.reject(new Error('XML query timeout'))
          this.xmlPromise = { resolve: null, reject: null }
        }
      }, 3000)
    }) // This was the line with the syntax error.
  }

  handleClose() {
    console.log('vMix TCP connection closed. Reconnecting in 5 seconds...')
    this.isConnected = false
    setTimeout(() => this.connect(), 5000)
  }
}

module.exports = VmixConnector
