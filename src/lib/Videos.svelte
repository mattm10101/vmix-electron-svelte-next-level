<script>
  import { derived } from 'svelte/store';
  import { inputs, playingInputs, inputMappings, programInput, previewInput, showModal } from './stores.js';
  // UPDATED: We now control all refreshes manually for stability
  import { fetchAllInputs, sendCommand } from './vmix.js';
  import ListTransportControls from './ListTransportControls.svelte';

  let throttleTimer = null;

  const targetInputName = derived(inputMappings, ($mappings) => $mappings.videos);
  const videoInput = derived(
    [inputs, targetInputName],
    ([$inputs, $targetInputName]) => {
      if (!$targetInputName) return null;
      return $inputs.find((i) => i.shortTitle === $targetInputName);
    }
  );

  $: isPlaying = $videoInput && $playingInputs.has($videoInput.id);
  $: isMuted = $videoInput?.muted;
  $: vmixSelectedIndex = $videoInput?.selectedIndex ? $videoInput.selectedIndex - 1 : -1;

  $: isInPreview = $videoInput && $previewInput === $videoInput.id;
  $: isInProgram = $videoInput && $programInput === $videoInput.id;
  
  // --- UPDATED with the stable refresh pattern ---
  function handleTrackClick(clickedIndex) {
    if (!$videoInput || isInProgram) return;

    const itemNumber = clickedIndex + 1;

    if (isInPreview) {
      sendCommand(`FUNCTION SelectIndex Input=${$videoInput.key}&Value=${itemNumber}`);
      setTimeout(() => fetchAllInputs(), 100);
    } else {
      sendCommand(`FUNCTION SelectIndex Input=${$videoInput.key}&Value=${itemNumber}`);
      setTimeout(() => {
        sendCommand(`FUNCTION PreviewInput Input=${$videoInput.key}`);
        setTimeout(() => fetchAllInputs(), 100);
      }, 50);
    }
  }

  // --- UPDATED to prevent race conditions ---
  function handleTrackDoubleClick(clickedIndex) {
    if (!$videoInput || !isInProgram) return;

    const itemNumber = clickedIndex + 1;
    const trackName = $videoInput.list[clickedIndex]?.name || 'this item';

    showModal(`You are interrupting a live video. Jump to and play "${trackName}"?`, () => {
      sendCommand(`FUNCTION SelectIndex Input=${$videoInput.key}&Value=${itemNumber}`);
      sendCommand(`FUNCTION Play Input=${$videoInput.key}`);
      setTimeout(() => fetchAllInputs(), 100);
    });
  }
  
  function handlePreview() {
    if (!$videoInput) return;
    sendCommand(`FUNCTION PreviewInput Input=${$videoInput.key}`);
    setTimeout(() => fetchAllInputs(), 100);
  }

  function handleTake() {
    if (!$videoInput) return;
    sendCommand('FUNCTION Cut');
  }

  function handleTransition(funcName) {
    sendCommand(funcName);
  }
  
  function handleTransportCommand(event) {
    if (!$videoInput) return;
    const command = event.detail;
    sendCommand(`FUNCTION ${command} Input=${$videoInput.key}`);
    setTimeout(() => fetchAllInputs(), 100);
  }

  // UPDATED with the immutable fix for stability
  function handleVolumeChange(event) {
    if (!$videoInput) return;
    const uiVolume = event.target.value;

    inputs.update((allInputs) =>
      allInputs.map(input =>
        input.id === $videoInput.id ? { ...input, volume: uiVolume } : input
      )
    );

    if (throttleTimer) return;
    throttleTimer = setTimeout(() => { throttleTimer = null; }, 50);
    sendCommand(`FUNCTION SetVolume Input=${$videoInput.key}&Value=${uiVolume}`);
  }
</script>

<div class="videos-container">
  {#if $videoInput}
    <div class="status-display"
      class:program={isInProgram}
      class:preview={isInPreview}
    >
      {#if isInProgram}
        Videos Input is Active
      {:else if isInPreview}
        Videos Input in Preview
      {:else}
        Videos Input not Loaded
      {/if}
    </div>
    
    <div class="controls-wrapper">
      <ListTransportControls
        listInput={$videoInput}
        {isPlaying}
        on:command={handleTransportCommand}
      />
      <button
        class="control-btn mute-btn"
        class:muted={isMuted}
        on:click={() => { sendCommand(`FUNCTION Audio Input=${$videoInput.key}`); setTimeout(() => fetchAllInputs(), 100); }}
        title="Toggle Mute"
      >
        {#if isMuted}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 4.06c0-1.336-1.306-2.32-2.434-1.636L3.216 9H1.5A1.5 1.5 0 0 0 0 10.5v3A1.5 1.5 0 0 0 1.5 15H3.22l7.849 5.86a1.5 1.5 0 0 0 2.434-.937A1.5 1.5 0 0 0 13.5 19.5v-15a1.5 1.5 0 0 0 0-.44Z"/><path d="M19.5 12c0 .414.336.75.75.75h.001a.75.75 0 0 0 0-1.5h-.001a.75.75 0 0 0-.75.75Zm-2.25.75a.75.75 0 0 1-.75-.75c0-.414.336-.75.75-.75h.001a.75.75 0 0 1 0 1.5h-.001ZM15 12.75a.75.75 0 0 0 0-1.5h-.001a.75.75 0 0 0 0 1.5h.001Z"/></svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 4.06c0-1.336-1.306-2.32-2.434-1.636L3.216 9H1.5A1.5 1.5 0 0 0 0 10.5v3A1.5 1.5 0 0 0 1.5 15H3.22l7.849 5.86a1.5 1.5 0 0 0 2.434-.937A1.5 1.5 0 0 0 13.5 19.5v-15a1.5 1.5 0 0 0 0-.44ZM17 7.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0V8.25A.75.75 0 0 1 17 7.5ZM20.5 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Z"/></svg>
        {/if}
      </button>
    </div>

    <div class="prod-controls-wrapper">
      <button class="prod-btn" on:click={() => handleTransition('FUNCTION Stinger1')}>Stinger 1</button>
      <button class="prod-btn" on:click={() => handleTransition('FUNCTION Merge')}>Merge</button>
      <button class="prod-btn" on:click={() => handleTransition('FUNCTION Fade')}>Fade</button>
      <button class="prod-btn" on:click={() => handleTransition('FUNCTION Cut')}>Cut</button>
    </div>

    <div class="fader-container">
      <input type="range" min="0" max="100" class="fader" value={$videoInput.volume ?? 100} on:input={handleVolumeChange}/>
      <div class="fader-value">{Math.round($videoInput.volume ?? 100)}</div>
    </div>

    <div class="track-list">
      {#if $videoInput.list.length > 0}
        {#each $videoInput.list as track, i (track.id)}
          {@const isProgramTrack = isInProgram && vmixSelectedIndex === i}
          {@const isPreviewTrack = isInPreview && vmixSelectedIndex === i}
          <button
            class="track-item"
            class:program={isProgramTrack}
            class:preview={isPreviewTrack}
            on:click={() => handleTrackClick(i)}
            on:dblclick={() => handleTrackDoubleClick(i)}
            title={track.name}
          >
            <span class="track-index">{i + 1}</span>
            <span class="track-name">{track.name}</span>
          </button>
        {/each}
      {:else}
        <div class="placeholder">Track list is empty.</div>
      {/if}
    </div>

    <div class="source-display">
      SOURCE: {$targetInputName}
    </div>

  {:else}
    <div class="placeholder">
      Video input not found. Check name in Options panel.
    </div>
  {/if}
</div>

<style>
  .videos-container { height: 100%; display: flex; flex-direction: column; padding: 15px; }
  .status-display, .controls-wrapper, .prod-controls-wrapper, .fader-container { margin-bottom: 12px; }
  .source-display { margin-top: 12px; }
  .status-display { background-color: #1f1f23; border-radius: 5px; padding: 0 10px; border: 1px solid #4a4a4e; color: #eee; font-weight: bold; height: 40px; font-size: 1.25em; display: flex; align-items: center; justify-content: center; width: 100%; flex-shrink: 0; transition: all 0.2s ease-in-out; }
  .status-display.preview { background-color: #dd6b20; border-color: #ed8936; color: white; }
  .status-display.program { background-color: #2f855a; border-color: #38a169; color: white; }
  .controls-wrapper { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; flex-shrink: 0; }
  .controls-wrapper > :global(.button-row) { grid-column: 1 / 5; }
  .control-btn { height: 45px; background: #3f3f46; border: 1px solid #555; color: #ccc; border-radius: 5px; cursor: pointer; transition: all 0.2s; font-size: 1.5em; display: flex; align-items: center; justify-content: center; padding: 5px; }
  .control-btn:hover { background-color: #555; }
  .mute-btn.muted { background-color: #c53030; color: white; }
  .control-btn svg { width: 24px; height: 24px; }
  .prod-controls-wrapper { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; flex-shrink: 0; }
  .prod-btn { height: 35px; background-color: #3f3f46; border: 1px solid #555; color: #eee; border-radius: 5px; cursor: pointer; transition: all 0.2s; font-weight: bold; font-size: 0.9em; }
  .prod-btn:hover { background-color: #555; }
  .fader-container { display: flex; align-items: center; gap: 15px; flex-shrink: 0; }
  .fader { flex-grow: 1; -webkit-appearance: none; appearance: none; width: 100%; height: 8px; background: #4a4a4e; border-radius: 5px; outline: none; opacity: 0.7; transition: opacity 0.2s; }
  .fader:hover { opacity: 1; }
  .fader::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; background: #14ffec; border-radius: 50%; cursor: pointer; }
  .fader::-moz-range-thumb { width: 20px; height: 20px; background: #14ffec; border-radius: 50%; cursor: pointer; }
  .fader-value { font-weight: bold; color: #14ffec; min-width: 30px; text-align: right; }
  .track-list { overflow-y: auto; display: flex; flex-direction: column; gap: 5px; border-radius: 5px; background: #1f1f23; padding: 5px; flex-grow: 1; min-height: 0; }
  .track-item { display: flex; align-items: center; gap: 10px; text-align: left; width: 100%; padding: 8px 10px; border-radius: 3px; background: #2a2a2e; border: 2px solid transparent; color: #ccc; transition: all 0.2s; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
  .track-item:hover { background: #3f3f46; }
  .track-item.preview { background-color: #dd6b20; color: white; font-weight: bold; }
  .track-item.program { background-color: #2f855a; color: white; font-weight: bold; }
  .track-index { color: #888; }
  .preview .track-index, .program .track-index { color: white; }
  .source-display { font-family: 'Courier New', Courier, monospace; font-size: 0.75em; color: #888; text-align: center; flex-shrink: 0; padding-top: 10px; border-top: 1px solid #3a3a3e; }
  .placeholder { color: #888; text-align: center; margin: auto; }
</style>