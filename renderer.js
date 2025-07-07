import './src/app.css';

window.addEventListener('DOMContentLoaded', () => {
  // Panel elements
  const panels = {
    transitions: document.getElementById('transitionsPanel'),
    inputs:      document.getElementById('inputsPanel'),
    log:         document.getElementById('logPanel'),
  };

  // Toggle minimize/restore
  const toggles = {
    transitions: document.getElementById('toggleTransitions'),
    inputs:      document.getElementById('toggleInputs'),
    log:         document.getElementById('toggleLog'),
  };
  Object.keys(toggles).forEach(key => {
    toggles[key].onclick = () => {
      const p = panels[key];
      const isMin = p.classList.toggle('minimized');
      toggles[key].textContent = isMin ? '↕' : '—';
    };
  });

  // Draggable with bounds clamp
  let drag = { el: null, xOff: 0, yOff: 0 };
  document.querySelectorAll('.panel-header').forEach(h => {
    h.addEventListener('mousedown', e => {
      drag.el = h.parentElement;
      drag.xOff = e.clientX - drag.el.offsetLeft;
      drag.yOff = e.clientY - drag.el.offsetTop;
      drag.el.style.zIndex = 1000;
    });
  });
  document.addEventListener('mousemove', e => {
    if (!drag.el) return;
    let nx = e.clientX - drag.xOff;
    let ny = e.clientY - drag.yOff;
    const pw = drag.el.offsetWidth, ph = drag.el.offsetHeight;
    nx = Math.max(0, Math.min(nx, window.innerWidth - pw - 10));
    ny = Math.max(0, Math.min(ny, window.innerHeight - ph - 10));
    drag.el.style.left = `${nx}px`;
    drag.el.style.top  = `${ny}px`;
  });
  document.addEventListener('mouseup', () => {
    if (drag.el) {
      drag.el.style.zIndex = '';
      drag.el = null;
    }
  });

  // Logging utility
  const logCont = document.getElementById('logContainer');
  function log(msg, type='info') {
    const ts = new Date().toLocaleTimeString();
    const color =
      type==='sent' ? '#14ffec' :
      type==='received' ? '#00d0ff' :
      '#ff14ec';
    const e = document.createElement('div');
    e.innerHTML = `<span style="color:#555">[${ts}]</span> <span style="color:${color}">${msg}</span>`;
    logCont.append(e);
    logCont.scrollTop = logCont.scrollHeight;
  }

  // Send vMix commands
  function send(cmd) {
    window.electronAPI.send(cmd);
    log(`SENT: ${cmd}`, 'sent');
  }
  document.getElementById('fadeButton')   .onclick = () => send('FUNCTION Fade');
  document.getElementById('cutButton')    .onclick = () => send('FUNCTION Cut');
  document.getElementById('mergeButton')  .onclick = () => send('FUNCTION Merge');
  document.getElementById('stinger1Button').onclick = () => send('FUNCTION Stinger1');

  // Dynamic Inputs
  const inputContainer = document.getElementById('inputPanelContent');
  let inputButtons = [];
  async function refreshInputs() {
    inputContainer.innerHTML = '';
    inputButtons = [];
    for (let i = 1; i <= 50; i++) {
      try {
        const title = await window.electronAPI.getInputName(i);
        const btn   = document.createElement('button');
        btn.className = 'input-btn';
        btn.onclick   = () => send(`FUNCTION PreviewInput Input=${i}`);

        const num  = document.createElement('span');
        num.className = 'number';
        num.textContent = i;

        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = title;

        btn.append(num, name);
        inputContainer.append(btn);
        inputButtons.push(btn);
      } catch {
        break;
      }
    }
    log(`Discovered ${inputButtons.length} inputs`, 'info');
  }

  // Hook up refresh button and initial load
  document.getElementById('refreshInputs').onclick = refreshInputs;
  refreshInputs();

  // Tally updates
  window.electronAPI.receive(data => {
    log(`RECV: ${data}`, 'received');
    if (data.startsWith('TALLY OK')) {
      const tally = data.slice(9).trim();
      inputButtons.forEach((btn, idx) => {
        btn.classList.remove('program','preview');
        if (tally[idx]==='1') btn.classList.add('program');
        if (tally[idx]==='2') btn.classList.add('preview');
      });
    }
  });
});
