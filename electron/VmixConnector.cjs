// electron/VmixConnector.cjs

const net = require('net')

class VmixConnector {
  constructor(host, port, mainWindow) {
    this.host = host
    this.port = port
    this.mainWindow = mainWindow
    this.client = new net.Socket()
    this.isConnected = false
    this.buffer = Buffer.alloc(0)
    this.pendingQueries = new Map()

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
      if (crlfIndex === -1) break

      const line = this.buffer.slice(0, crlfIndex).toString('utf8')
      const parts = line.split(' ')
      const command = parts[0]
      const status = parts[1]

      if (command === 'XML') {
        const dataLength = parseInt(status, 10)
        const totalLength = crlfIndex + 2 + dataLength

        if (this.buffer.length >= totalLength) {
          const xmlData = this.buffer
            .slice(crlfIndex + 2, totalLength)
            .toString('utf8')
          if (this.pendingQueries.has('XML')) {
            this.pendingQueries.get('XML').resolve(xmlData)
            this.pendingQueries.delete('XML')
          }
          this.buffer = this.buffer.slice(totalLength)
          continue
        } else {
          break
        }
      } else if (command === 'XMLTEXT' && this.pendingQueries.has('XMLTEXT')) {
        const responseValue = parts.slice(2).join(' ')
        this.pendingQueries.get('XMLTEXT').resolve(responseValue)
        this.pendingQueries.delete('XMLTEXT')
      } else if (command === 'ACTS' || command === 'TALLY') {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send('from-vmix', line)
        }
      }

      this.buffer = this.buffer.slice(crlfIndex + 2)
    }
  }

  sendCommand(command) {
    if (this.isConnected) {
      this.client.write(command + '\r\n')
    } else {
      console.error('Cannot send command, vMix is not connected.')
    }
  }

  _createPendingQuery(key, timeout = 3000) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) return reject(new Error('vMix not connected'))
      if (this.pendingQueries.has(key)) {
        return reject(new Error(`A ${key} query is already in progress.`))
      }

      const timer = setTimeout(() => {
        if (this.pendingQueries.has(key)) {
          this.pendingQueries.get(key).reject(new Error(`${key} query timeout`))
          this.pendingQueries.delete(key)
        }
      }, timeout)

      this.pendingQueries.set(key, { resolve, reject, timer })
    })
  }

  queryXml() {
    const promise = this._createPendingQuery('XML')
    this.sendCommand('XML')
    return promise
  }

  queryXpath(xpath) {
    const promise = this._createPendingQuery('XMLTEXT')
    this.sendCommand(`XMLTEXT ${xpath}`)
    return promise
  }

  handleClose() {
    console.log('vMix TCP connection closed. Reconnecting in 5 seconds...')
    this.isConnected = false
    for (const [key, query] of this.pendingQueries.entries()) {
      query.reject(new Error('vMix disconnected'))
    }
    this.pendingQueries.clear()
    setTimeout(() => this.connect(), 5000)
  }
}

module.exports = VmixConnector