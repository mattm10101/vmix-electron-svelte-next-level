<script>
  import { onMount, onDestroy } from 'svelte'
  import { get, derived } from 'svelte/store'
  import {
    panelStates,
    inputs,
    logMessages,
    programInput,
    previewInput,
    layoutPresets,
    visibilityOptions,
    marquee,
    selectedPanelIds,
    scriptManager,
  } from './lib/stores.js'
  import {
    sendCommand,
    fetchAllInputs,
    initializeVmixListener,
  } from './lib/vmix.js'
  import Panel from './lib/Panel.svelte'
  import Transitions from './lib/Transitions.svelte'
  import InputButton from './lib/InputButton.svelte'
  import CommandLog from './lib/CommandLog.svelte'
  import MasterAudioButton from './lib/MasterAudioButton.svelte'
  import MasterFader from './lib/MasterFader.svelte'
  import Presets from './lib/Presets.svelte'
  import InputOptions from './lib/InputOptions.svelte'
  import LowerThirds from './lib/LowerThirds.svelte'
  import Music from './lib/Music.svelte'
  import Scripts from './lib/Scripts.svelte'
  import MarqueeBox from './lib/MarqueeBox.svelte'

  // NEW: A variable to hold the Music component instance
  let musicComponent

  const filteredInputs = derived(
    [inputs, visibilityOptions],
    ([$inputs, $opts]) => {
      return $inputs.filter((input) => {
        if (!$opts.showL3s && input.title.startsWith('L3 -')) return false
        // Add other filters as needed
        return true
      })
    }
  )

  onMount(() => {
    initializeVmixListener()
    fetchAllInputs()

    window.addEventListener('mousedown', handleWindowMouseDown)
    return () => {
      window.removeEventListener('mousedown', handleWindowMouseDown)
    }
  })

  function handleWindowMouseDown(e) {
    if (e.target.closest('.panel')) return
    startMarquee(e)
  }

  let startX, startY
  function startMarquee(e) {
    startX = e.clientX
    startY = e.clientY
    selectedPanelIds.set(new Set())
    marquee.set({ visible: true, x: startX, y: startY, width: 0, height: 0 })
    document.body.classList.add('no-select')
    document.addEventListener('mousemove', handleCanvasMouseMove)
    document.addEventListener('mouseup', handleCanvasMouseUp, { once: true })
  }

  function handleCanvasMouseMove(e) {
    const currentX = e.clientX
    const currentY = e.clientY
    const x = Math.min(startX, currentX)
    const y = Math.min(startY, currentY)
    const width = Math.abs(currentX - startX)
    const height = Math.abs(currentY - startY)
    marquee.set({ visible: true, x, y, width, height })
  }

  function handleCanvasMouseUp() {
    document.removeEventListener('mousemove', handleCanvasMouseMove)
    document.body.classList.remove('no-select')
    const marqueeRect = get(marquee)
    if (marqueeRect.width > 0 || marqueeRect.height > 0) {
      const newSelection = new Set()
      const allPanels = get(panelStates)
      for (const id in allPanels) {
        const panelRect = allPanels[id]
        if (
          marqueeRect.x < panelRect.x + panelRect.width &&
          marqueeRect.x + marqueeRect.width > panelRect.x &&
          marqueeRect.y < panelRect.y + panelRect.height &&
          marqueeRect.y + marqueeRect.height > panelRect.y
        ) {
          newSelection.add(id)
        }
      }
      selectedPanelIds.set(newSelection)
    }
    marquee.set({ visible: false, x: 0, y: 0, width: 0, height: 0 })
  }

  function handleSnapshot() {
    const currentLayout = get(panelStates)
    const presetName = `Preset ${get(layoutPresets).length + 1}`
    layoutPresets.update((presets) => [
      ...presets,
      { id: Date.now(), name: presetName, layout: currentLayout },
    ])
  }
  function handleApplyPreset(layout) {
    panelStates.set(layout)
  }
  function handleDeletePreset(idToDelete) {
    layoutPresets.update((presets) =>
      presets.filter((p) => p.id !== idToDelete)
    )
  }
  function handleRenamePreset({ id, newName }) {
    layoutPresets.update((presets) =>
      presets.map((p) => (p.id === id ? { ...p, name: newName } : p))
    )
  }
</script>

<div
  class="h-full w-full bg-lab-metal font-sci text-neon-teal relative overflow-hidden"
>
  <MarqueeBox />

  <Panel
    id="transitions"
    title="Transitions"
    defaultState={{ x: 1050, y: 460, width: 220, height: 160, z: 1 }}
  >
    <Transitions onCommand={sendCommand} />
  </Panel>

  <Panel
    id="audio"
    title="Audio"
    defaultState={{ x: 1050, y: 20, width: 220, height: 160, z: 1 }}
  >
    <div class="audio-controls"><MasterAudioButton /> <MasterFader /></div>
  </Panel>

  <Panel
    id="inputOptions"
    title="Input Options"
    defaultState={{ x: 1050, y: 190, width: 220, height: 260, z: 1 }}
  >
    <InputOptions />
  </Panel>

  <Panel
    id="lowerThirds"
    title="Lower Thirds"
    defaultState={{ x: 1050, y: 630, width: 220, height: 200, z: 1 }}
  >
    <LowerThirds onCommand={sendCommand} />
  </Panel>

  <Panel
    id="music"
    title="Music"
    defaultState={{ x: 1050, y: 840, width: 220, height: 300, z: 1 }}
  >
    <div slot="header-controls">
      <button
        class="panel-control"
        on:click={() => musicComponent?.refresh()}
        title="Refresh Music Player">⟳</button
      >
    </div>
    <Music bind:this={musicComponent} />
  </Panel>

  <Panel
    id="scripts"
    title="Scripts"
    defaultState={{ x: 20, y: 770, width: 400, height: 200, z: 1 }}
  >
    <Scripts onCommand={sendCommand} />
  </Panel>

  <Panel
    id="presets"
    title="Presets"
    defaultState={{ x: 430, y: 770, width: 220, height: 200, z: 1 }}
  >
    <Presets
      presets={$layoutPresets}
      onSnapshot={handleSnapshot}
      onApply={handleApplyPreset}
      onDelete={handleDeletePreset}
      onRename={handleRenamePreset}
    />
  </Panel>

  <Panel
    id="inputs"
    title="Inputs"
    defaultState={{ x: 20, y: 20, width: 1020, height: 740, z: 1 }}
  >
    <div slot="header-controls">
      <button
        class="panel-control"
        on:click={fetchAllInputs}
        title="Refresh Inputs">⟳</button
      >
    </div>
    {#if $inputs.length > 0}
      <div
        class="input-grid"
        class:hide-numbers={!$visibilityOptions.showNumbers}
      >
        {#each $filteredInputs as input (input.id)}
          <InputButton
            id={input.id}
            name={input.title}
            number={input.id}
            isProgram={input.id === $programInput}
            isPreview={$visibilityOptions.showPreviewLed &&
              input.id === $previewInput}
            onCommand={sendCommand}
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
    defaultState={{ x: 20, y: 980, width: 1250, height: 140, z: 1 }}
  >
    <CommandLog messages={$logMessages} />
  </Panel>
</div>

<style>
  :global(.audio-controls) {
    display: flex;
    flex-direction: column;
    gap: 15px;
    height: 100%;
    justify-content: space-around;
  }
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
