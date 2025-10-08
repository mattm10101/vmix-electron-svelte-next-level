<script>
  import { onMount } from 'svelte';
  import { get, derived } from 'svelte/store';
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
    gridOptions,
    savedDefaultLayout,
    inputMappings,
    optionsModalOpen,
    isMasterAudioMuted,
    masterVolume,
    audioInputs,
    searchQuery,
    vuLevels,
  } from './lib/stores.js';
  import { defaultLayout } from './lib/defaultLayout.js';
  import {
    sendCommand,
    fetchAllInputs,
    initializeVmixListener,
    addLog,
  } from './lib/vmix.js';
  import Panel from './lib/Panel.svelte';
  import Transitions from './lib/Transitions.svelte';
  import InputButton from './lib/InputButton.svelte';
  import CommandLog from './lib/CommandLog.svelte';
  import MasterSection from './lib/MasterSection.svelte';
  import AudioMixer from './lib/AudioMixer.svelte';
  import Presets from './lib/Presets.svelte';
  import InputOptions from './lib/InputOptions.svelte';
  import LowerThirds from './lib/LowerThirds.svelte';
  import Music from './lib/Music.svelte';
  import Videos from './lib/Videos.svelte';
  import Photos from './lib/Photos.svelte';
  import Slides from './lib/Slides.svelte';
  import Scripts from './lib/Scripts.svelte';
  import MarqueeBox from './lib/MarqueeBox.svelte';
  import Options from './lib/Options.svelte';
  import BackgroundGrid from './lib/BackgroundGrid.svelte';
  import Modal from './lib/Modal.svelte';
  import OptionsModal from './lib/OptionsModal.svelte';

  const filteredInputs = derived(
    [inputs, visibilityOptions, inputMappings, searchQuery],
    ([$inputs, $opts, $mappings, $searchQuery]) => {
      const l3Prefix = $mappings.lowerThirds;
      let tempInputs = $inputs;

      if (!$opts.showL3s && l3Prefix) {
        tempInputs = tempInputs.filter((input) => !input.title.startsWith(l3Prefix));
      }

      if ($searchQuery.trim() !== '') {
        const lowerCaseQuery = $searchQuery.toLowerCase();
        tempInputs = tempInputs.filter(input => 
          input.title.toLowerCase().includes(lowerCaseQuery)
        );
      }

      return tempInputs;
    }
  );

  onMount(() => {
    initializeVmixListener();

    // --- NEW FIX: Wait half a second before the initial fetch ---
    // This gives the backend plenty of time to establish its connection.
    setTimeout(() => {
      addLog('Performing initial state fetch...', 'info');
      fetchAllInputs();
    }, 500);

    window.addEventListener('mousedown', handleWindowMouseDown);

    window.electronAPI.onVuData((data) => {
      vuLevels.set(data);
    });

    window.electronAPI.onTogglePanelVisibility((panelId) => {
      panelStates.update((states) => {
        return {
          ...states,
          [panelId]: {
            ...states[panelId],
            visible: !states[panelId]?.visible,
          },
        };
      });
    });

    window.electronAPI.onOpenOptionsModal(() => {
      optionsModalOpen.set(true);
    });

    return () => window.removeEventListener('mousedown', handleWindowMouseDown);
  });

  $: if ($panelStates) {
    if (Object.keys($panelStates).length > 0) {
      window.electronAPI.updateMenuState($panelStates);
    }
  }

  function handleKeydown(event) {
    const target = event.target;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const key = event.key;
    const shift = event.shiftKey;
    const keyNumber = parseInt(key, 10);
    if (key === '~') {
      event.preventDefault();
      const currentLayout = get(panelStates);
      savedDefaultLayout.set(currentLayout);
      addLog('Current layout saved as new default with hotkey (~).', 'info');
      return;
    }
    if (key === '=' && !shift) {
      event.preventDefault();
      handleSnapshot();
      addLog('Layout snapshot created with hotkey (=).', 'info');
      return;
    }
    if (key === '-' && !shift) {
      event.preventDefault();
      const currentPresets = get(layoutPresets);
      const lastPreset = [...currentPresets].reverse().find((p) => p != null);
      if (lastPreset) {
        handleDeletePreset(lastPreset.id);
        addLog(
          `Deleted last preset "${lastPreset.name}" with hotkey (-).`,
          'info'
        );
      }
      return;
    }
    if (!shift && !isNaN(keyNumber) && keyNumber >= 1 && keyNumber <= 9) {
      event.preventDefault();
      const presets = get(layoutPresets);
      const index = keyNumber - 1;
      const preset = presets[index];
      if (preset) {
        handleApplyPreset(preset.layout);
        addLog(`Applied preset "${preset.name}" with key '${key}'.`, 'info');
      } else {
        addLog(`Preset Slot ${keyNumber} is empty.`, 'info');
      }
      return;
    }
    if (key === '`' && !shift) {
      event.preventDefault();
      applyDefaultLayout();
      return;
    }
  }

  function handleWindowMouseDown(e) {
    if (e.target.closest('.panel')) return;
    window.getSelection()?.removeAllRanges();
    startMarquee(e);
  }
  let startX, startY;
  function startMarquee(e) {
    startX = e.clientX;
    startY = e.clientY;
    selectedPanelIds.set(new Set());
    marquee.set({ visible: true, x: startX, y: startY, width: 0, height: 0 });
    document.body.classList.add('no-select');
    document.addEventListener('mousemove', handleCanvasMouseMove);
    document.addEventListener('mouseup', handleCanvasMouseUp, { once: true });
  }
  function handleCanvasMouseMove(e) {
    const currentX = e.clientX;
    const currentY = e.clientY;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    marquee.set({ visible: true, x, y, width, height });
  }
  function handleCanvasMouseUp() {
    document.removeEventListener('mousemove', handleCanvasMouseMove);
    document.body.classList.remove('no-select');
    const marqueeRect = get(marquee);
    if (marqueeRect.width > 0 || marqueeRect.height > 0) {
      const newSelection = new Set();
      const allPanels = get(panelStates);
      for (const id in allPanels) {
        const panelRect = allPanels[id];
        if (
          panelRect.visible &&
          marqueeRect.x < panelRect.x + panelRect.width &&
          marqueeRect.x + marqueeRect.width > panelRect.x &&
          marqueeRect.y < panelRect.y + panelRect.height &&
          marqueeRect.y + marqueeRect.height > panelRect.y
        ) {
          newSelection.add(id);
        }
      }
      selectedPanelIds.set(newSelection);
    }
    marquee.set({ visible: false, x: 0, y: 0, width: 0, height: 0 });
  }
  function handleSnapshot() {
    const currentLayout = get(panelStates);
    const layoutCopy = JSON.parse(JSON.stringify(currentLayout));
    const presetName = `Preset ${get(layoutPresets).length + 1}`;
    layoutPresets.update((presets) => [
      ...presets,
      { id: Date.now(), name: presetName, layout: layoutCopy },
    ]);
  }
  function handleApplyPreset(layout) {
    panelStates.set(JSON.parse(JSON.stringify(layout)));
  }
  function handleDeletePreset(idToDelete) {
    layoutPresets.update((presets) => presets.filter((p) => p?.id !== idToDelete));
  }
  function handleRenamePreset({ id, newName }) {
    layoutPresets.update((presets) =>
      presets.map((p) => (p?.id === id ? { ...p, name: newName } : p))
    );
  }
  function applyDefaultLayout() {
    const layoutToApply = get(savedDefaultLayout) || defaultLayout;
    handleApplyPreset(layoutToApply);
    addLog('Default layout applied.', 'info');
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="h-full w-full bg-lab-metal font-sci text-neon-teal relative overflow-hidden">
  <Modal />
  {#if $optionsModalOpen}
    <OptionsModal />
  {/if}
  <BackgroundGrid />
  <MarqueeBox />

  {#if $panelStates['transitions']?.visible}
    <Panel id="transitions" title="Transitions" defaultState={{ x: 1050, y: 460, width: 220, height: 160, z: 1 }}>
      <Transitions onCommand={sendCommand} />
    </Panel>
  {/if}

  {#if $panelStates['audio']?.visible}
    <Panel id="audio" title="Audio" defaultState={{ x: 1050, y: 20, width: 320, height: 430, z: 1 }}>
      <div class="audio-panel-layout">
        <MasterSection isMuted={$isMasterAudioMuted} bind:volume={$masterVolume} vu={$vuLevels.master} />
        <hr />
        <AudioMixer audioInputs={$audioInputs} vuInputLevels={$vuLevels.inputs} />
      </div>
    </Panel>
  {/if}

  {#if $panelStates['inputOptions']?.visible}
    <Panel id="inputOptions" title="Input Options" defaultState={{ x: 1050, y: 190, width: 220, height: 260, z: 1 }}>
      <InputOptions />
    </Panel>
  {/if}

  {#if $panelStates['lowerThirds']?.visible}
    <Panel id="lowerThirds" title="Lower Thirds" defaultState={{ x: 1050, y: 630, width: 220, height: 200, z: 1 }}>
      <LowerThirds onCommand={sendCommand} />
    </Panel>
  {/if}

  {#if $panelStates['music']?.visible}
    <Panel id="music" title="Music" defaultState={{ x: 1050, y: 840, width: 220, height: 300, z: 1 }}>
      <Music />
    </Panel>
  {/if}

  {#if $panelStates['videos']?.visible}
    <Panel id="videos" title="Videos" defaultState={{ x: 820, y: 840, width: 220, height: 300, z: 1 }}>
      <Videos />
    </Panel>
  {/if}

  {#if $panelStates['photos']?.visible}
    <Panel id="photos" title="Photos" defaultState={{ x: 610, y: 840, width: 220, height: 120, z: 1 }}>
      <Photos />
    </Panel>
  {/if}

  {#if $panelStates['slides']?.visible}
    <Panel
      id="slides"
      title="Slides"
      defaultState={{ x: 380, y: 840, width: 220, height: 280, z: 1 }}
    >
      <Slides />
    </Panel>
  {/if}

  {#if $panelStates['options']?.visible}
    <Panel id="options" title="Options" defaultState={{ x: 660, y: 770, width: 380, height: 200, z: 1 }}>
      <Options />
    </Panel>
  {/if}

  {#if $panelStates['scripts']?.visible}
    <Panel id="scripts" title="Scripts" defaultState={{ x: 20, y: 770, width: 400, height: 200, z: 1 }}>
      <Scripts onCommand={sendCommand} />
    </Panel>
  {/if}

  {#if $panelStates['presets']?.visible}
    <Panel id="presets" title="Presets" defaultState={{ x: 430, y: 770, width: 220, height: 200, z: 1 }}>
      <Presets presets={$layoutPresets} onSnapshot={handleSnapshot} onApply={handleApplyPreset} onDelete={handleDeletePreset} onRename={handleRenamePreset} />
    </Panel>
  {/if}

  {#if $panelStates['inputs']?.visible}
    <Panel
      id="inputs"
      title="Inputs"
      defaultState={{ x: 20, y: 20, width: 1020, height: 740, z: 1 }}
    >
      <div slot="header-controls" class="input-panel-header">
        <input 
          type="search" 
          class="search-input" 
          placeholder="Filter inputs..."
          bind:value={$searchQuery}
          on:click|stopPropagation
        />
        <button
          class="panel-control"
          on:click={fetchAllInputs}
          title="Refresh Inputs"
          >⟳</button
        >
      </div>
      <div class="inputs-panel-content">
        {#if $inputs.length > 0}
          <div
            class="input-grid"
            class:hide-numbers={!$visibilityOptions.showNumbers}
            style="--grid-gap: 12px;"
          >
            {#each $filteredInputs as input (input.id)}
              <InputButton
                id={input.id}
                name={input.shortTitle}
                number={input.id}
                isProgram={input.id === $programInput}
                isPreview={$visibilityOptions.showPreviewLed && input.id === $previewInput}
                onCommand={sendCommand}
              />
            {/each}
          </div>
        {:else}
          <div class="placeholder">
            <p>No inputs found in vMix.</p>
            <p class="subtext">
              Add inputs in vMix, then click the refresh icon.
            </p>
          </div>
        {/if}
      </div>
    </Panel>
  {/if}

  {#if $panelStates['log']?.visible}
    <Panel
      id="log"
      title="Command Log"
      defaultState={{ x: 20, y: 980, width: 1250, height: 140, z: 1 }}
    >
      <CommandLog messages={$logMessages} />
    </Panel>
  {/if}
</div>

<style>
  .input-panel-header {
    display: flex;
    align-items: center;
    gap: 15px;
    flex-grow: 1;
    margin-right: 10px;
  }

  .search-input {
    width: 100%;
    background-color: var(--color-metal, #1f1f23);
    border: 1px solid #4a4a4e;
    color: #eee;
    border-radius: 5px;
    padding: 4px 8px;
    font-family: inherit;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-accent, #14ffec);
  }

  .inputs-panel-content {
    padding: 15px;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
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

  :global(.audio-panel-layout) {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 15px;
    padding-top: 10px;
    height: 100%;
    box-sizing: border-box;
  }
  :global(.audio-panel-layout hr) {
    border-color: #3c3c3c;
    width: 100%;
    margin: 0;
  }
</style>