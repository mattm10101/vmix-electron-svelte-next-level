<script>
  import { tick } from 'svelte';
  import { derived } from 'svelte/store';
  import { inputs, playingInputs, inputMappings } from './stores.js';
  import { sendCommandAndRefresh, sendCommand } from './vmix.js';
  import ListTrackList from './ListTrackList.svelte';
  import ListTransportControls from './ListTransportControls.svelte';

  let uiCuedIndex = -1;
  let throttleTimer = null;

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
    if (!$musicInput || !$musicInput.list?.[vmixSelectedIndex]) return '';
    return $musicInput.list[vmixSelectedIndex].name;
  })();

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
  
  function handleTrackClick(event) {
    if (!$musicInput) return;
    const clickedIndex = event.detail;

    if (isPlaying) {
      uiCuedIndex = clickedIndex;
    } else {
      uiCuedIndex = clickedIndex;
      const itemNumber = clickedIndex + 1;
      sendCommandAndRefresh(`FUNCTION SelectIndex Input=${$musicInput.key}&Value=${itemNumber}`);
    }
  }

  function handleTrackDoubleClick(event) {
    if (!$musicInput) return;
    const clickedIndex = event.detail;
    const itemNumber = clickedIndex + 1;
    sendCommandAndRefresh(`FUNCTION SelectIndex Input=${$musicInput.key}&Value=${itemNumber}`);
    setTimeout(() => {
      sendCommandAndRefresh(`FUNCTION Play Input=${$musicInput.key}`);
    }, 50);
    uiCuedIndex = -1;
  }

  function handleTransportCommand(event) {
    if (!$musicInput) return;
    const command = event.detail;

    if (command === 'PlayPause') {
      if (isPlaying) {
        sendCommandAndRefresh(`FUNCTION PlayPause Input=${$musicInput.key}`);
      } else {
        if (uiCuedIndex !== -1) {
          const itemNumber = uiCuedIndex + 1;
          sendCommandAndRefresh(`FUNCTION SelectIndex Input=${$musicInput.key}&Value=${itemNumber}`);
          setTimeout(() => {
            sendCommandAndRefresh(`FUNCTION Play Input=${$musicInput.key}`);
          }, 50);
        } else {
          sendCommandAndRefresh(`FUNCTION PlayPause Input=${$musicInput.key}`);
        }
      }
    } else {
      sendCommandAndRefresh(`FUNCTION ${command} Input=${$musicInput.key}`);
    }
    
    uiCuedIndex = -1;
  }

  function handleVolumeChange(event) {
    if (!$musicInput) return;
    const uiVolume = event.target.value;

    inputs.update((allInputs) =>
      allInputs.map(input =>
        input.id === $musicInput.id ? { ...input, volume: uiVolume } : input
      )
    );

    if (throttleTimer) return;

    throttleTimer = setTimeout(() => {
      throttleTimer = null;
    }, 50);

    sendCommand(`FUNCTION SetVolume Input=${$musicInput.key}&Value=${uiVolume}`);
  }
</script>

<div class="music-container">
  {#if $musicInput}
    <button
      type="button"
      class="now-playing-container"
      title={isPlaying ? nowPlayingName : 'Paused'}
      on:click={toggleAnimation}
    >
      <div class="now-playing-text-wrapper" bind:this={wrapperElement}>
        <span
          class="now-playing-text"
          class:scrolling={isPlaying && needsScrolling && !isAnimationPaused}
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
        on:click={() => sendCommandAndRefresh(`FUNCTION Audio Input=${$musicInput.key}`)}
        title="Toggle Mute"
      >
        {#if isMuted}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 4.06c0-1.336-1.306-2.32-2.434-1.636L3.216 9H1.5A1.5 1.5 0 0 0 0 10.5v3A1.5 1.5 0 0 0 1.5 15H3.22l7.849 5.86a1.5 1.5 0 0 0 2.434-.937A1.5 1.5 0 0 0 13.5 19.5v-15a1.5 1.5 0 0 0 0-.44Z"/><path d="M19.5 12c0 .414.336.75.75.75h.001a.75.75 0 0 0 0-1.5h-.001a.75.75 0 0 0-.75.75Zm-2.25.75a.75.75 0 0 1-.75-.75c0-.414.336-.75.75-.75h.001a.75.75 0 0 1 0 1.5h-.001ZM15 12.75a.75.75 0 0 0 0-1.5h-.001a.75.75 0 0 0 0 1.5h.001Z"/></svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 4.06c0-1.336-1.306-2.32-2.434-1.636L3.216 9H1.5A1.5 1.5 0 0 0 0 10.5v3A1.5 1.5 0 0 0 1.5 15H3.22l7.849 5.86a1.5 1.5 0 0 0 2.434-.937A1.5 1.5 0 0 0 13.5 19.5v-15a1.5 1.5 0 0 0 0-.44ZM17 7.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0V8.25A.75.75 0 0 1 17 7.5ZM20.5 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Z"/></svg>
        {/if}
      </button>
    </div>

    <div class="fader-container">
      <input
        type="range"
        min="0"
        max="100"
        class="fader"
        value={$musicInput.volume ?? 100}
        on:input={handleVolumeChange}
      />
      <div class="fader-value">{Math.round($musicInput.volume ?? 100)}</div>
    </div>

    <ListTrackList
      class="track-list-scroller"
      listInput={$musicInput}
      {isPlaying}
      uiCuedIndex={uiCuedIndex}
      listType="music"
      on:trackClick={handleTrackClick}
      on:trackDblClick={handleTrackDoubleClick}
    />

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
  .music-container { height: 100%; display: flex; flex-direction: column; padding: 15px; }
  .now-playing-container { margin-bottom: 12px; }
  .controls-wrapper { margin-bottom: 12px; }
  .fader-container { margin-bottom: 12px; }
  .source-display { margin-top: 12px; }
  :global(.track-list-scroller) { flex-grow: 1; min-height: 0; }
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
  .fader-container { display: flex; align-items: center; gap: 15px; flex-shrink: 0; }
  .fader { flex-grow: 1; -webkit-appearance: none; appearance: none; width: 100%; height: 8px; background: #4a4a4e; border-radius: 5px; outline: none; opacity: 0.7; transition: opacity 0.2s; }
  .fader:hover { opacity: 1; }
  .fader::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; background: #14ffec; border-radius: 50%; cursor: pointer; }
  .fader::-moz-range-thumb { width: 20px; height: 20px; background: #14ffec; border-radius: 50%; cursor: pointer; }
  .fader-value { font-weight: bold; color: #14ffec; min-width: 30px; text-align: right; }
  .source-display { font-family: 'Courier New', Courier, monospace; font-size: 0.75em; color: #888; text-align: center; flex-shrink: 0; padding-top: 10px; border-top: 1px solid #3a3a3e; }
  .placeholder { color: #888; text-align: center; margin: auto 0; }
</style>