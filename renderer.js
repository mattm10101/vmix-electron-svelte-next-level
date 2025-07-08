import '/src/app.css'

window.addEventListener('DOMContentLoaded', () => {
  //
  // 1) PANEL TOGGLING
  //
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
  for (let key in toggles) {
    const btn = toggles[key],
      pnl = panels[key]
    if (!btn || !pnl) continue
    btn.onclick = () => {
      const min = pnl.classList.toggle('minimized')
      btn.textContent = min ? '↕' : '—'
    }
  }

  //
  // 2) DRAG & BOUND CLAMP
  //
  let drag = { el: null, xOff: 0, yOff: 0 }
  document.querySelectorAll('.panel-header').forEach((h) => {
    h.onmousedown = (e) => {
      drag.el = h.parentElement
      drag.xOff = e.clientX - drag.el.offsetLeft
      drag.yOff = e.clientY - drag.el.offsetTop
      drag.el.style.zIndex = 1000
    }
  })
  document.onmousemove = (e) => {
    if (!drag.el) return
    let nx = e.clientX - drag.xOff,
      ny = e.clientY - drag.yOff
    const pw = drag.el.offsetWidth,
      ph = drag.el.offsetHeight
    nx = Math.max(0, Math.min(nx, window.innerWidth - pw - 10))
    ny = Math.max(0, Math.min(ny, window.innerHeight - ph - 10))
    drag.el.style.left = `${nx}px`
    drag.el.style.top = `${ny}px`
  }
  document.onmouseup = () => {
    if (drag.el) {
      drag.el.style.zIndex = ''
      drag.el = null
    }
  }

  //
  // 3) LOGGING
  //
  const logCont = document.getElementById('logContainer')
  function log(msg, type = 'info') {
    const ts = new Date().toLocaleTimeString()
    const col =
      type === 'sent' ? '#14ffec' : type === 'received' ? '#00d0ff' : '#ff14ec'
    const div = document.createElement('div')
    div.innerHTML = `<span style="color:#555">[${ts}]</span> <span style="color:${col}">${msg}</span>`
    logCont.append(div)
    logCont.scrollTop = logCont.scrollHeight
  }

  //
  // 4) SEND HELPERS & TRANSITIONS
  //
  function send(cmd) {
    window.electronAPI.send(cmd)
    log(`SENT: ${cmd}`, 'sent')
  }
  ;['fadeButton', 'cutButton', 'mergeButton', 'stinger1Button'].forEach(
    (id) => {
      const b = document.getElementById(id)
      if (!b) return
      const map = {
        fadeButton: 'FUNCTION Fade',
        cutButton: 'FUNCTION Cut',
        mergeButton: 'FUNCTION Merge',
        stinger1Button: 'FUNCTION Stinger1',
      }
      b.onclick = () => send(map[id])
    }
  )

  //
  // 5) INPUT GRID + REFRESH
  //
  const inputContainer = document.getElementById('inputPanelContent')
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
        btn.innerHTML = `<span class="number">${i}</span><span class="name">${title}</span>`
        inputContainer.append(btn)
        inputButtons.push({ btn, title })
      } catch {
        break
      }
    }
    log(`Discovered ${inputButtons.length} inputs`, 'info')
  }
  const refreshBtn = document.getElementById('refreshInputs')
  if (refreshBtn) {
    refreshBtn.onclick = refreshInputs
  } else {
    console.warn('renderer.js: missing #refreshInputs button')
  }
  refreshInputs()

  //
  // 6) HIDE TOGGLES FOR NUMBERS / L3 / LISTS
  //
  let showNumbers = true,
    showL3 = true,
    showLists = true

  const numToggle = document.getElementById('optToggleNumbers')
  if (numToggle)
    numToggle.onclick = () => {
      showNumbers = !showNumbers
      numToggle.textContent = showNumbers ? 'Hide Numbers' : 'Show Numbers'
      inputContainer.classList.toggle('hide-numbers', !showNumbers)
    }

  const l3Toggle = document.getElementById('optToggleL3')
  if (l3Toggle)
    l3Toggle.onclick = () => {
      showL3 = !showL3
      l3Toggle.textContent = showL3 ? 'Hide L3’s' : 'Show L3’s'
      inputButtons.forEach(({ btn, title }) => {
        if (title.startsWith('L3')) btn.style.display = showL3 ? '' : 'none'
      })
    }

  const listToggle = document.getElementById('optToggleLists')
  if (listToggle)
    listToggle.onclick = () => {
      showLists = !showLists
      listToggle.textContent = showLists ? 'Hide Lists' : 'Show Lists'
      inputButtons.forEach(({ btn, title }) => {
        if (/^LIST\s*-/i.test(title))
          btn.style.display = showLists ? '' : 'none'
      })
    }

  //
  // 7) TALLY UPDATES
  //
  window.electronAPI.receive((data) => {
    log(`RECV: ${data}`, 'received')
    if (data.startsWith('TALLY OK')) {
      const t = data.slice(9).trim()
      inputButtons.forEach(({ btn }, i) => {
        btn.classList.remove('program', 'preview')
        if (t[i] === '1') btn.classList.add('program')
        if (t[i] === '2') btn.classList.add('preview')
      })
    }
  })
})
