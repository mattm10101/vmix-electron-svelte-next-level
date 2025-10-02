<script>
  import { tick } from 'svelte';
  import { derived } from 'svelte/store';
  import { inputs, playingInputs, inputMappings } from './stores.js';
  import { sendCommand } from './vmix.js';
  import ListTrackList from './ListTrackList.svelte';
  import ListTransportControls from './ListTransportControls.svelte';

  // --- NEW: Local state for UI-cued item ---
  let cuedByUI = -1;

  // --- Reactive State ---
  const targetInputName = derived(inputMappings, ($mappings) => $mappings.music);
  const musicInput = derived(
    [inputs, targetInputName],
    ([$inputs, $targetInputName]) => {
      if (!$targetInputName) return null;
      return $inputs.find((i) => i.shortTitle === $targetInputName);
    }
  );

  $: isPlaying = $musicInput && $playingInputs.has($musicInput.id);
  $: isMuted = $musicInput?.muted;
  $: vmixSelectedIndex = $musicInput?.selectedIndex ? $musicInput.selectedIndex - 1 : -1;
  $: nowPlayingName = (() => {
    // If the UI has cued an item, but vMix hasn't updated yet, show "Paused".
    if (cuedByUI !== -1 && cuedByUI !== vmixSelectedIndex) return "Paused";
    
    if (!$musicInput || !$musicInput.list?.[vmixSelectedIndex]) return 'Paused';
    return $musicInput.list[vmixSelectedIndex].name;
  })();

  // --- Scrolling Text Logic ---
  let wrapperElement, textElement, needsScrolling = false, isAnimationPaused = false;
  $: {
    if (isPlaying && nowPlayingName) {
      tick().then(() => {
        if (wrapperElement && textElement) {
          const textWidth = textElement.offsetWidth;
          const wrapperWidth = wrapperElement.offsetWidth;
          needsScrolling = textWidth > wrapperWidth;
          if (needsScrolling) {
            const scrollDistance = textWidth - wrapperWidth;
            textElement.style.setProperty('--scroll-distance', `-${scrollDistance}px`);
          }
        }
      });
    } else {
      needsScrolling = false;
      isAnimationPaused = false;
    }
  }
  function toggleAnimation() {
    if (needsScrolling) isAnimationPaused = !isAnimationPaused;
  }
  
  // --- NEW: Main logic for click-to-select, click-again-to-play ---
  function handleTrackClick(event) {
    if (!$musicInput) return;
    const clickedIndex = event.detail;

    if (cuedByUI === clickedIndex) {
      // --- SECOND CLICK: Play the cued item ---
      // The item is already selected in vMix from the first click, so we just send "Play".
      // The "Play" command acts on the currently selected index.
      sendCommand(`FUNCTION Play Input=${$musicInput.key}`);
      cuedByUI = -1; // Reset the UI cue
    } else {
      // --- FIRST CLICK: Select the item (cue it) ---
      const itemNumber = clickedIndex + 1;
      sendCommand(`FUNCTION SelectIndex Input=${$musicInput.key}&Value=${itemNumber}`);
      cuedByUI = clickedIndex;

      // OPTIMISTIC UPDATE: To fix the "Now Playing" title getting stuck,
      // we'll update our local store immediately. The listener will eventually
      // send the same data, but this makes the UI feel instant.
      inputs.update(all => {
          const myInput = all.find(i => i.id === $musicInput.id);
          if (myInput) {
              myInput.selectedIndex = itemNumber;
          }
          return all;
      });
    }
  }

  function handleTransportCommand(event) {
    if (!$musicInput) return;
    const command = event.detail;
    sendCommand(`FUNCTION ${command} Input=${$musicInput.key}`);
    // When using transport, clear the UI cue
    cuedByUI = -1;
  }
</script>

<div class="music-container">
  {#if $musicInput}
    <button
      type="button"
      class="now-playing-container"
      title={isPlaying ? nowPlayingName : 'Click to toggle scroll'}
      on:click={toggleAnimation}
    >
      <div class="now-playing-text-wrapper" bind:this={wrapperElement}>
        <span
          class="now-playing-text"
          class:scrolling={needsScrolling && !isAnimationPaused}
          bind:this={textElement}
        >
          {isPlaying ? nowPlayingName : 'Paused'}
        </span>
      </div>
    </button>
    
    <div class="controls-wrapper">
      <ListTransportControls
        listInput={$musicInput}
        {isPlaying}
        on:command={handleTransportCommand}
      />
      <button
        class="control-btn mute-btn"
        class:muted={isMuted}
        on:click={() => sendCommand(`FUNCTION Audio Input=${$musicInput.key}`)}
        title="Toggle Mute"
      >
        {#if isMuted}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 4.06c0-1.336-1.306-2.32-2.434-1.636L3.216 9H1.5A1.5 1.5 0 0 0 0 10.5v3A1.5 1.5 0 0 0 1.5 15H3.22l7.849 5.86a1.5 1.5 0 0 0 2.434-.937A1.5 1.5 0 0 0 13.5 19.5v-15a1.5 1.5 0 0 0 0-.44Z"/><path d="M19.5 12c0 .414.336.75.75.75h.001a.75.75 0 0 0 0-1.5h-.001a.75.75 0 0 0-.75.75Zm-2.25.75a.75.75 0 0 1-.75-.75c0-.414.336-.75.75-.75h.001a.75.75 0 0 1 0 1.5h-.001ZM15 12.75a.75.75 0 0 0 0-1.5h-.001a.75.75 0 0 0 0 1.5h.001Z"/></svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 4.06c0-1.336-1.306-2.32-2.434-1.636L3.216 9H1.5A1.5 1.5 0 0 0 0 10.5v3A1.5 1.5 0 0 0 1.5 15H3.22l7.849 5.86a1.5 1.5 0 0 0 2.434-.937A1.5 1.5 0 0 0 13.5 19.5v-15a1.5 1.5 0 0 0 0-.44ZM17 7.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0V8.25A.75.75 0 0 1 17 7.5ZM20.5 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Z"/></svg>
        {/if}
      </button>
    </div>

    <div class="track-list-outer-wrapper">
      <ListTrackList
        listInput={$musicInput}
        {isPlaying}
        cuedIndex={cuedByUI}
        listType="music"
        on:trackClick={handleTrackClick}
      />
    </div>

    <div class="source-display">
      SOURCE: {$targetInputName}
    </div>

  {:else}
    <div class="placeholder">
      Music input not found. Check name in Options panel.
    </div>
  {/if}
</div>

<style>
  @keyframes pause-scroll-fade { 0%, 35% { transform: translateX(0); opacity: 1; } 91% { transform: translateX(var(--scroll-distance)); opacity: 1; } 100% { transform: translateX(var(--scroll-distance)); opacity: 0; } }
  .music-container { height: 100%; display: flex; flex-direction: column; gap: 12px; }
  .track-list-outer-wrapper { flex-grow: 1; min-height: 0; }
  .now-playing-container { background-color: #1f1f23; border-radius: 5px; padding: 0 10px; overflow: hidden; border: 1px solid #4a4a4e; color: #14ffec; font-weight: bold; height: 40px; font-size: 1.25em; display: flex; align-items: center; cursor: pointer; text-align: left; width: 100%; flex-shrink: 0; }
  .now-playing-text-wrapper { width: 100%; overflow: hidden; }
  .now-playing-text { display: inline-block; white-space: nowrap; text-align: left; --scroll-distance: 0px; }
  .now-playing-text.scrolling { animation: pause-scroll-fade 5.625s linear infinite; }
  .controls-wrapper { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; flex-shrink: 0; }
  .controls-wrapper > :global(.button-row) { grid-column: 1 / 5; }
  .control-btn { height: 45px; background: #3f3f46; border: 1px solid #555; color: #ccc; border-radius: 5px; cursor: pointer; transition: all 0.2s; font-size: 1.5em; display: flex; align-items: center; justify-content: center; padding: 5px; }
  .control-btn:hover { background-color: #555; }
  .mute-btn.muted { background-color: #c53030; color: white; }
  .control-btn svg { width: 24px; height: 24px; }
  .source-display { font-family: 'Courier New', Courier, monospace; font-size: 0.75em; color: #888; text-align: center; padding-top: 10px; border-top: 1px solid #3a3a3e; flex-shrink: 0; }
  .placeholder { color: #888; text-align: center; margin: auto 0; }
</style>