// renderer.js

window.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const logContainer = document.getElementById('logContainer');
    const inputGrid = document.querySelector('.input-grid');

    // Transition buttons
    const fadeButton = document.getElementById('fadeButton');
    const cutButton = document.getElementById('cutButton');
    const mergeButton = document.getElementById('mergeButton');
    const stinger1Button = document.getElementById('stinger1Button');

    const inputButtons = [];

    // --- Create Input Buttons ---
    for (let i = 1; i <= 8; i++) {
        const btn = document.createElement('button');
        btn.id = `input-${i}`;
        btn.textContent = `Input ${i}`;
        btn.classList.add('input-btn');
        btn.dataset.inputNumber = i; // Store the input number
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
     * @param {string} type The type of message ('sent' or 'received') for styling.
     */
    function logMessage(message, type = 'info') {
        const now = new Date();
        const timestamp = now.toLocaleTimeString();
        const color = type === 'sent' ? '#569cd6' : '#4ec9b0'; // Blue for sent, Teal for received
        
        const logEntry = document.createElement('div');
        logEntry.innerHTML = `<span style="color: #6a6a6a;">[${timestamp}]</span> <span style="color: ${color};">${message.trim()}</span>`;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    /**
     * Parses the TALLY string and updates the button colors.
     * @param {string} tallyString The string of 0s, 1s, and 2s from vMix.
     */
    function updateTallyState(tallyString) {
        for (let i = 0; i < inputButtons.length; i++) {
            const btn = inputButtons[i];
            const state = tallyString[i]; // Get the state for this button's input

            // Reset classes
            btn.classList.remove('program', 'preview');

            if (state === '1') { // Program (Active)
                btn.classList.add('program');
            } else if (state === '2') { // Preview
                btn.classList.add('preview');
            }
        }
    }

    // --- Event Listeners ---

    // Transition Button Listeners
    fadeButton.addEventListener('click', () => sendCommand('FUNCTION Fade'));
    cutButton.addEventListener('click', () => sendCommand('FUNCTION Cut'));
    mergeButton.addEventListener('click', () => sendCommand('FUNCTION Merge'));
    stinger1Button.addEventListener('click', () => sendCommand('FUNCTION Stinger1'));

    // Input Button Listeners
    inputButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const inputNumber = btn.dataset.inputNumber;
            // When an input button is clicked, set it to Preview
            sendCommand(`FUNCTION PreviewInput Input=${inputNumber}`);
        });
    });

    // --- Data Receiver ---
    window.electronAPI.receive((data) => {
        const messages = data.split('\r\n').filter(msg => msg.trim() !== '');
        messages.forEach(msg => {
            logMessage(`RECV: ${msg}`, 'received');

            // Check if the message is a TALLY update
            if (msg.startsWith('TALLY OK')) {
                const tallyString = msg.substring(9); // Get the part after "TALLY OK "
                updateTallyState(tallyString);
            }
        });
    });
});
