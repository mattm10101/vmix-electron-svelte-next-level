// renderer.js

window.addEventListener('DOMContentLoaded', async () => { // Make listener async for initial fetch
    // --- Element Selectors ---
    const logContainer = document.getElementById('logContainer');
    const inputGrid = document.querySelector('.input-grid');

    // Control buttons
    const fadeButton = document.getElementById('fadeButton');
    const cutButton = document.getElementById('cutButton');
    const mergeButton = document.getElementById('mergeButton');
    const stinger1Button = document.getElementById('stinger1Button');
    const refreshNamesButton = document.getElementById('refreshNamesButton');

    const inputButtons = [];

    // --- Create Input Buttons ---
    for (let i = 1; i <= 8; i++) {
        const btn = document.createElement('button');
        btn.id = `input-${i}`;
        btn.classList.add('input-btn');
        btn.dataset.inputNumber = i;
        
        const numberSpan = document.createElement('span');
        numberSpan.className = 'input-number';
        numberSpan.textContent = i;
        btn.appendChild(numberSpan);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'input-name';
        nameSpan.textContent = '...';
        btn.appendChild(nameSpan);

        inputGrid.appendChild(btn);
        inputButtons.push(btn);
    }

    /**
     * Sends a command to vMix via the main process and logs it.
     * @param {string} command The command to send.
     */
    function sendCommand(command) {
        window.electronAPI.send(command);
        logMessage(`SENT: ${command}`, 'sent');
    }

    /**
     * Appends a formatted message to the on-screen log.
     * @param {string} message The message content to log.
     * @param {string} type The type of message ('sent', 'received', or 'info').
     */
    function logMessage(message, type = 'info') {
        const now = new Date();
        const timestamp = now.toLocaleTimeString();
        const color = type === 'sent' ? '#569cd6' : (type === 'received' ? '#4ec9b0' : '#ce9178');
        
        const logEntry = document.createElement('div');
        logEntry.innerHTML = `<span style="color: #6a6a6a;">[${timestamp}]</span> <span style="color: ${color};">${message.trim()}</span>`;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    /**
     * Fetches the name for each input individually using XMLTEXT.
     */
    async function fetchAndApplyInputNames() {
        logMessage('Fetching input names from vMix API...', 'info');
        // Sequentially fetch the name for each button to avoid race conditions
        for (const button of inputButtons) {
            try {
                const inputNumber = button.dataset.inputNumber;
                // Use the new, simpler API function
                const title = await window.electronAPI.getInputName(inputNumber);
                if (title) {
                    button.querySelector('.input-name').textContent = title;
                } else {
                    button.querySelector('.input-name').textContent = `Input ${inputNumber}`;
                }
            } catch (error) {
                console.error(error);
                logMessage(`Error for input ${button.dataset.inputNumber}: ${error.message}`, 'error');
                button.querySelector('.input-name').textContent = `Input ${button.dataset.inputNumber}`;
            }
        }
        logMessage('Finished updating input names.', 'info');
    }

    /**
     * Parses the TALLY string and updates the button colors.
     * @param {string} tallyString The string of 0s, 1s, and 2s from vMix.
     */
    function updateTallyState(tallyString) {
        for (let i = 0; i < inputButtons.length; i++) {
            const btn = inputButtons[i];
            const state = tallyString[i];
            btn.classList.remove('program', 'preview');

            if (state === '1') {
                btn.classList.add('program');
            } else if (state === '2') {
                btn.classList.add('preview');
            }
        }
    }

    // --- Event Listeners ---
    fadeButton.addEventListener('click', () => sendCommand('FUNCTION Fade'));
    cutButton.addEventListener('click', () => sendCommand('FUNCTION Cut'));
    mergeButton.addEventListener('click', () => sendCommand('FUNCTION Merge'));
    stinger1Button.addEventListener('click', () => sendCommand('FUNCTION Stinger1'));
    refreshNamesButton.addEventListener('click', fetchAndApplyInputNames);

    inputButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const inputNumber = btn.dataset.inputNumber;
            sendCommand(`FUNCTION PreviewInput Input=${inputNumber}`);
        });
    });

    // --- Data Receiver ---
    window.electronAPI.receive((data) => {
        const messages = data.split('\r\n').filter(msg => msg.trim() !== '');
        messages.forEach(msg => {
            logMessage(`RECV: ${msg}`, 'received');
            if (msg.startsWith('TALLY OK')) {
                const tallyString = msg.substring(9);
                updateTallyState(tallyString);
            }
        });
    });

    // --- Initial Load ---
    await fetchAndApplyInputNames(); // Fetch names on startup
});
