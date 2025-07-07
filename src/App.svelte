<script>
  import { onMount, setContext } from 'svelte'
  import { writable } from 'svelte/store'
  import Transitions from './lib/Transitions.svelte'
  import InputButton from './lib/InputButton.svelte'
  import CommandLog from './lib/CommandLog.svelte'

  // Create writable stores for our app's state
  const inputs = writable(
    Array(8)
      .fill(null)
      .map((_, i) => ({
        id: i + 1,
        name: `Input ${i + 1}`,
        tally: 0, // 0=off, 1=program, 2=preview
      }))
  )

  const logMessages = writable([])

  // Provide the log store to the CommandLog component
  setContext('log', logMessages)

  function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString()
    logMessages.update((msgs) => [...msgs, { timestamp, message, type }])
  }

  function sendCommand(command) {
    window.electronAPI.send(command)
    addLog(`SENT: ${command}`, 'sent')
  }

  async function fetchAllInputNames() {
    addLog('Fetching all input names...', 'info')
    const currentInputs = $inputs
    const updatedInputs = await Promise.all(
      currentInputs.map(async (input) => {
        try {
          const name = await window.electronAPI.getInputName(input.id)
          return { ...input, name: name || `Input ${input.id}` }
        } catch (e) {
          addLog(e.message, 'error')
          return input
        }
      })
    )
    inputs.set(updatedInputs)
    addLog('Finished fetching names.', 'info')
  }

  onMount(() => {
    fetchAllInputNames()

    window.electronAPI.receive((message) => {
      if (message.startsWith('TALLY OK')) {
        const tallyString = message.substring(9)
        inputs.update((currentInputs) => {
          return currentInputs.map((input, i) => ({
            ...input,
            tally: parseInt(tallyString[i] || '0', 10),
          }))
        })
      }
      addLog(`RECV: ${message}`, 'received')
    })
  })
</script>

<main class="app-layout">
  <div class="transitions-area">
    <Transitions
      on:command={(e) => sendCommand(e.detail)}
      on:refresh={fetchAllInputNames}
    />
  </div>

  <div class="inputs-area">
    <div class="input-grid">
      {#each $inputs as input (input.id)}
        <InputButton
          id={input.id}
          name={input.name}
          tally={input.tally}
          on:command={(e) => sendCommand(e.detail)}
        />
      {/each}
    </div>
  </div>

  <div class="log-area">
    <CommandLog />
  </div>
</main>

<style>
  .app-layout {
    display: grid;
    grid-template-columns: 220px 1fr;
    grid-template-rows: 1fr auto;
    grid-template-areas:
      'transitions inputs'
      'log         inputs';
    gap: 20px;
    height: calc(100vh - 40px); /* Full viewport height minus body padding */
  }

  .transitions-area {
    grid-area: transitions;
    display: flex;
    flex-direction: column;
  }

  .inputs-area {
    grid-area: inputs;
    display: flex; /* Use flexbox to make the grid fill the height */
  }

  .log-area {
    grid-area: log;
    min-height: 200px; /* Give the log a minimum height */
  }

  .input-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    grid-auto-rows: minmax(90px, 1fr);
    gap: 15px;
    width: 100%;
  }
</style>
