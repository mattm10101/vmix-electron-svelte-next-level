<script>
  import { onMount } from 'svelte'
  import {
    panelStates,
    inputs,
    logMessages,
    programInput,
    previewInput,
  } from './lib/stores.js'
  import {
    sendCommand,
    fetchAllInputNames,
    initializeVmixListener,
  } from './lib/vmix.js'

  import Panel from './lib/Panel.svelte'
  import Transitions from './lib/Transitions.svelte'
  import InputButton from './lib/InputButton.svelte'
  import CommandLog from './lib/CommandLog.svelte'

  onMount(() => {
    const savedStates = localStorage.getItem('panelStates')
    if (savedStates) {
      try {
        panelStates.set(JSON.parse(savedStates))
      } catch {
        console.error('Could not parse panel states from localStorage.')
      }
    }

    const unsubscribe = panelStates.subscribe((states) => {
      localStorage.setItem('panelStates', JSON.stringify(states))
    })

    initializeVmixListener()
    fetchAllInputNames(50)

    return () => unsubscribe()
  })
</script>

<main
  class="h-full w-full bg-lab-metal font-sci text-neon-teal relative overflow-hidden"
>
  <Panel
    id="transitions"
    title="Transitions"
    defaultState={{ x: 20, y: 20, width: 220, height: 200, z: 1, min: false }}
  >
    <Transitions on:command={(e) => sendCommand(e.detail)} />
  </Panel>

  <Panel
    id="inputs"
    title="Inputs"
    defaultState={{ x: 260, y: 20, width: 700, height: 600, z: 1, min: false }}
  >
    <div slot="header-controls">
      <button
        class="panel-control"
        on:click={() => fetchAllInputNames(50)}
        title="Refresh Inputs"
      >
        ⟳
      </button>
    </div>

    {#if $inputs.length > 0}
      <div class="input-grid">
        {#each $inputs as input (input.id)}
          <InputButton
            id={input.id}
            name={input.name}
            isProgram={input.id === $programInput}
            isPreview={input.id === $previewInput}
            on:command={(e) => sendCommand(e.detail)}
          />
        {/each}
      </div>
    {:else}
      <div class="placeholder">
        <p>No inputs found in vMix.</p>
        <p class="subtext">
          Add inputs in vMix, then click the refresh icon in this panel's
          header.
        </p>
      </div>
    {/if}
  </Panel>

  <Panel
    id="log"
    title="Command Log"
    defaultState={{ x: 20, y: 240, width: 220, height: 380, z: 1, min: false }}
  >
    <CommandLog messages={$logMessages} />
  </Panel>
</main>

<style>
  .input-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    grid-auto-rows: 90px;
    gap: 10px;
    height: 100%;
  }

  .placeholder {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    text-align: center;
    color: #888;
  }
  .placeholder .subtext {
    font-size: 0.9em;
    margin-top: 8px;
    color: #666;
  }
</style>
