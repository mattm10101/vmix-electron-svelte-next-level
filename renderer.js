import './src/app.css';

window.addEventListener('DOMContentLoaded', () => {
  const fadeBtn        = document.getElementById('fadeButton');
  const cutBtn         = document.getElementById('cutButton');
  const mergeBtn       = document.getElementById('mergeButton');
  const stingerBtn     = document.getElementById('stinger1Button');
  const refreshBtn     = document.getElementById('refreshInputs');
  const inputContainer = document.getElementById('inputPanelContent');
  const logCont        = document.getElementById('logContainer');

  let inputButtons = [];

  function log(text, type = 'info') {
    const ts = new Date().toLocaleTimeString();
    const color = type === 'sent'
      ? '#14ffec'
      : (type === 'received' ? '#00d0ff' : '#ff14ec');
    const entry = document.createElement('div');
    entry.innerHTML = `<span style="color:#555">[${ts}]</span> <span style="color:${color}">${text}</span>`;
    logCont.append(entry);
    logCont.scrollTop = logCont.scrollHeight;
  }

  function send(cmd) {
    window.electronAPI.send(cmd);
    log(`SENT: ${cmd}`, 'sent');
  }

  // Transition handlers
  fadeBtn.onclick    = () => send('FUNCTION Fade');
  cutBtn.onclick     = () => send('FUNCTION Cut');
  mergeBtn.onclick   = () => send('FUNCTION Merge');
  stingerBtn.onclick = () => send('FUNCTION Stinger1');

  // Populate inputs dynamically
  async function refreshInputs() {
    inputContainer.innerHTML = '';
    inputButtons = [];

    for (let i = 1; i <= 50; i++) {
      try {
        const title = await window.electronAPI.getInputName(i);
        const btn = document.createElement('button');
        btn.className = 'input-btn';
        btn.dataset.i = i;

        const num = document.createElement('span');
        num.className = 'number';
        num.textContent = i;

        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = title;

        btn.append(num, name);
        btn.onclick = () => send(`FUNCTION PreviewInput Input=${i}`);
        inputContainer.append(btn);
        inputButtons.push(btn);
      } catch {
        break;
      }
    }

    log(`Discovered ${inputButtons.length} inputs`, 'info');
  }

  // Handle tally updates
  window.electronAPI.receive(data => {
    log(`RECV: ${data}`, 'received');
    if (data.startsWith('TALLY OK')) {
      const tally = data.slice(9).trim();
      inputButtons.forEach((btn, idx) => {
        btn.classList.remove('program', 'preview');
        if (tally[idx] === '1') btn.classList.add('program');
        if (tally[idx] === '2') btn.classList.add('preview');
      });
    }
  });

  // Wire refresh
  refreshBtn.onclick = refreshInputs;

  // Kick off
  refreshInputs();
});
