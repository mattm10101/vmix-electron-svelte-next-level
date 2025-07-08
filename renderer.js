import '/src/app.css'

window.addEventListener('DOMContentLoaded', () => {
  // 1) Panels & Toggles
  const panels = {
    transitions: document.getElementById('transitionsPanel'),
    inputs: document.getElementById('inputsPanel'),
    log: document.getElementById('logPanel'),
  }
  const toggles = {
    transitions: document.getElementById('toggleTransitions'),
    inputs: document.getElementById('toggleInputs'),
    log: document.getElementById('toggleLog'),
  }
  for (let key of Object.keys(toggles)) {
    const btn = toggles[key],
      pnl = panels[key]
    if (!btn) {
      console.warn(
        `renderer.js: missing toggle button #toggle${
          key[0].toUpperCase() + key.slice(1)
        }`
      )
      continue
    }
    if (!pnl) {
      console.warn(`renderer.js: missing panel #${key}Panel`)
      continue
    }
    btn.onclick = () => {
      const isMin = pnl.classList.toggle('minimized')
      btn.textContent = isMin ? '↕' : '—'
    }
  }

  // 2) Drag & Bound
  let drag = { el: null, xOff: 0, yOff: 0 }
  document.querySelectorAll('.panel-header').forEach((h) => {
    h.addEventListener('mousedown', (e) => {
      drag.el = h.parentElement
      drag.xOff = e.clientX - drag.el.offsetLeft
      drag.yOff = e.clientY - drag.el.offsetTop
      drag.el.style.zIndex = 1000
    })
  })
  document.addEventListener('mousemove', (e) => {
    if (!drag.el) return
    let nx = e.clientX - drag.xOff,
      ny = e.clientY - drag.yOff
    const pw = drag.el.offsetWidth,
      ph = drag.el.offsetHeight
    nx = Math.max(0, Math.min(nx, window.innerWidth - pw - 10))
    ny = Math.max(0, Math.min(ny, window.innerHeight - ph - 10))
    drag.el.style.left = `${nx}px`
    drag.el.style.top = `${ny}px`
  })
  document.addEventListener('mouseup', () => {
    if (drag.el) {
      drag.el.style.zIndex = ''
      drag.el = null
    }
  })

  // 3) Logging
  const logCont = document.getElementById('logContainer')
  if (!logCont) {
    console.error('renderer.js: missing #logContainer')
    return
  }
  function log(msg, type = 'info') {
    const ts = new Date().toLocaleTimeString()
    const col =
      type === 'sent' ? '#14ffec' : type === 'received' ? '#00d0ff' : '#ff14ec'
    const div = document.createElement('div')
    div.innerHTML = `<span style="color:#555">[${ts}]</span> <span style="color:${col}">${msg}</span>`
    logCont.append(div)
    logCont.scrollTop = logCont.scrollHeight
  }

  // 4) Send helpers & Transitions
  function send(cmd) {
    window.electronAPI.send(cmd)
    log(`SENT: ${cmd}`, 'sent')
  }
  ;['fadeButton', 'cutButton', 'mergeButton', 'stinger1Button'].forEach(
    (id) => {
      const b = document.getElementById(id)
      if (!b) return console.warn(`renderer.js: missing #${id}`)
      const cmd = {
        fadeButton: 'FUNCTION Fade',
        cutButton: 'FUNCTION Cut',
        mergeButton: 'FUNCTION Merge',
        stinger1Button: 'FUNCTION Stinger1',
      }[id]
      b.onclick = () => send(cmd)
    }
  )

  // 5) Inputs + Refresh
  const inputContainer = document.getElementById('inputPanelContent')
  if (!inputContainer) {
    console.error('renderer.js: missing #inputPanelContent')
    return
  }
  let inputButtons = []
  async function refreshInputs() {
    inputContainer.innerHTML = ''
    inputButtons = []
    for (let i = 1; i <= 50; i++) {
      try {
        const title = await window.electronAPI.getInputName(i)
        const btn = document.createElement('button')
        btn.className = 'input-btn'
        btn.onclick = () => send(`FUNCTION PreviewInput Input=${i}`)
        btn.innerHTML = `
          <span class="number">${i}</span>
          <span class="name">${title}</span>
        `
        inputContainer.append(btn)
        inputButtons.push(btn)
      } catch {
        break
      }
    }
    log(`Discovered ${inputButtons.length} inputs`, 'info')
  }
  const refreshBtn = document.getElementById('refreshInputs')
  if (!refreshBtn) {
    console.warn('renderer.js: missing #refreshInputs')
  } else {
    refreshBtn.onclick = refreshInputs
  }
  refreshInputs()

  // 6) Tally updates
  window.electronAPI.receive((data) => {
    log(`RECV: ${data}`, 'received')
    if (data.startsWith('TALLY OK')) {
      const t = data.slice(9).trim()
      inputButtons.forEach((btn, i) => {
        btn.classList.remove('program', 'preview')
        if (t[i] === '1') btn.classList.add('program')
        if (t[i] === '2') btn.classList.add('preview')
      })
    }
  })
})
