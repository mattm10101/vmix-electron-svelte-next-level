<script>
  import { onMount } from 'svelte'
  import { get, derived } from 'svelte/store'
  import {
    panelStates,
    inputs,
    logMessages,
    programInput,
    previewInput,
    layoutPresets,
    visibilityOptions,
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
  import MasterAudioButton from './lib/MasterAudioButton.svelte'
  import Presets from './lib/Presets.svelte'
  import InputOptions from './lib/InputOptions.svelte'

  const filteredInputs = derived(
    [inputs, visibilityOptions],
    ([$inputs, $opts]) => {
      return $inputs.filter((input) => {
        if (!$opts.showL3s && input.name.startsWith('L3 -')) return false
        if (!$opts.show1Ups && input.name.startsWith('1UP -')) return false
        if (!$opts.show2Ups && input.name.startsWith('2UP -')) return false
        if (!$opts.show3Ups && input.name.startsWith('3UP -')) return false
        if (!$opts.show4Ups && input.name.startsWith('4UP -')) return false
        return true
      })
    }
  )

  onMount(() => {
    initializeVmixListener()
    fetchAllInputNames(50)
  })

  function handleSnapshot() {
    const currentLayout = get(panelStates)
    const presetName = `Preset ${get(layoutPresets).length + 1}`
    layoutPresets.update((presets) => [
      ...presets,
      { id: Date.now(), name: presetName, layout: currentLayout },
    ])
  }

  function handleApplyPreset(event) {
    panelStates.set(event.detail)
  }

  function handleDeletePreset(event) {
    const idToDelete = event.detail
    layoutPresets.update((presets) =>
      presets.filter((p) => p.id !== idToDelete)
    )
  }

  function handleRenamePreset(event) {
    const { id, newName } = event.detail
    layoutPresets.update((presets) =>
      presets.map((p) => (p.id === id ? { ...p, name: newName } : p))
    )
  }
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
    id="audio"
    title="Audio"
    defaultState={{ x: 20, y: 230, width: 220, height: 90, z: 1, min: false }}
  >
    <MasterAudioButton />
  </Panel>

  <Panel
    id="inputOptions"
    title="Input Options"
    defaultState={{ x: 20, y: 330, width: 220, height: 310, z: 1, min: false }}
  >
    <InputOptions />
  </Panel>

  <Panel
    id="presets"
    title="Presets"
    defaultState={{ x: 20, y: 650, width: 220, height: 180, z: 1, min: false }}
  >
    <Presets
      presets={$layoutPresets}
      on:snapshot={handleSnapshot}
      on:apply={handleApplyPreset}
      on:delete={handleDeletePreset}
      on:rename={handleRenamePreset}
    />
  </Panel>

  <Panel
    id="inputs"
    title="Inputs"
    defaultState={{ x: 260, y: 20, width: 700, height: 810, z: 1, min: false }}
  >
    <div slot="header-controls">
      <button
        class="panel-control"
        on:click={() => fetchAllInputNames(50)}
        title="Refresh Inputs">⟳</button
      >
    </div>
    {#if $filteredInputs.length > 0}
      <div
        class="input-grid"
        class:hide-numbers={!$visibilityOptions.showNumbers}
      >
        {#each $filteredInputs as input (input.id)}
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
        <p class="subtext">Add inputs in vMix, then click the refresh icon.</p>
      </div>
    {/if}
  </Panel>

  <Panel
    id="log"
    title="Command Log"
    defaultState={{ x: 980, y: 20, width: 280, height: 810, z: 1, min: false }}
  >
    <CommandLog messages={$logMessages} />
  </Panel>
</main>

<style>
  :global(.placeholder) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    text-align: center;
    color: #888;
  }
  :global(.placeholder .subtext) {
    font-size: 0.9em;
    margin-top: 8px;
    color: #666;
  }
</style>
