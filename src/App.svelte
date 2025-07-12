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
    marquee,
    selectedPanelIds,
    scriptManager,
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
  import MasterFader from './lib/MasterFader.svelte'
  import Presets from './lib/Presets.svelte'
  import InputOptions from './lib/InputOptions.svelte'
  import LowerThirds from './lib/LowerThirds.svelte'
  import Scripts from './lib/Scripts.svelte'
  import MarqueeBox from './lib/MarqueeBox.svelte'

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

    function handleWindowMouseDown(e) {
      if (e.target.closest('.panel')) {
        return
      }
      startMarquee(e)
    }

    window.addEventListener('mousedown', handleWindowMouseDown)

    return () => {
      window.removeEventListener('mousedown', handleWindowMouseDown)
    }
  })

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

  function handleCanvasMouseUp(e) {
    document.removeEventListener('mousemove', handleCanvasMouseMove)
    document.body.classList.remove('no-select')

    const newSelection = new Set()
    const marqueeRect = get(marquee)
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

<div
  class="h-full w-full bg-lab-metal font-sci text-neon-teal relative overflow-hidden"
>
  <MarqueeBox />

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
    defaultState={{ x: 20, y: 230, width: 220, height: 140, z: 1, min: false }}
  >
    <div class="audio-controls">
      <MasterAudioButton />
      <MasterFader />
    </div>
  </Panel>

  <Panel
    id="inputOptions"
    title="Input Options"
    defaultState={{ x: 20, y: 380, width: 220, height: 360, z: 1, min: false }}
  >
    <InputOptions />
  </Panel>

  <Panel
    id="lowerThirds"
    title="Lower Thirds"
    defaultState={{ x: 20, y: 750, width: 220, height: 180, z: 1, min: false }}
  >
    <LowerThirds on:command={(e) => sendCommand(e.detail)} />
  </Panel>

  <Panel
    id="scripts"
    title="Scripts"
    defaultState={{ x: 20, y: 940, width: 220, height: 250, z: 1, min: false }}
  >
    <Scripts on:command={(e) => sendCommand(e.detail)} />
  </Panel>

  <Panel
    id="presets"
    title="Presets"
    defaultState={{ x: 20, y: 1200, width: 220, height: 180, z: 1, min: false }}
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
    defaultState={{ x: 260, y: 20, width: 700, height: 1460, z: 1, min: false }}
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
            isPreview={$visibilityOptions.showPreviewLed &&
              input.id === $previewInput}
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
    defaultState={{
      x: 980,
      y: 20,
      width: 280,
      height: 1460,
      z: 1,
      min: false,
    }}
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
