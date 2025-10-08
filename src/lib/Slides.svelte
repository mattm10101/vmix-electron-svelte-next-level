<script>
  import { derived, get } from 'svelte/store';
  import { inputs, playingInputs, inputMappings, programInput, previewInput } from './stores.js';
  import { sendCommand, fetchAllInputs } from './vmix.js';

  // --- Local state for the jump input ---
  let jumpValue = '';
  let jumpInput;

  // --- State for transition controls ---
  let transitionDuration = 2;
  let effect = 'Fade';
  let effectDuration = 500;

  // --- Options for the dropdowns ---
  const durationOptions = [0, 1, 2, 3, 5, 10, 20, 30, 60];
  const effectDurationOptions = [250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000];
  const effectOptions = [
    'Fade', 'Zoom', 'Wipe', 'Slide', 'Fly', 'CrossZoom', 'FlyRotate', 'Cube', 'CubeZoom',
    'VerticalWipe', 'VerticalSlide', 'Merge', 'WipeReverse', 'SlideReverse', 
    'VerticalWipeReverse', 'VerticalSlideReverse', 'BarnDoor', 'RollerDoor', 'Cut'
  ];

  // --- Derived Stores ---
  const targetInputName = derived(inputMappings, ($mappings) => $mappings.slides);
  const slidesInput = derived(
    [inputs, targetInputName],
    ([$inputs, $targetInputName]) => {
      if (!$targetInputName) return null;
      return $inputs.find((i) => i.shortTitle === $targetInputName);
    }
  );
  const isPlaying = derived(
    [slidesInput, playingInputs],
    ([$slidesInput, $playingInputs]) => {
      if (!$slidesInput) return false;
      return $playingInputs.has($slidesInput.id);
    }
  );
  $: isInPreview = $slidesInput && $previewInput === $slidesInput.id;
  $: isInProgram = $slidesInput && $programInput === $slidesInput.id;

  // --- vMix Command Functions ---
  function handleTransport(command) {
    const input = get(slidesInput);
    if (input) {
      sendCommand(`FUNCTION ${command} Input=${input.key}`);
    }
  }

  function handleTransition(transitionType) {
    sendCommand(`FUNCTION ${transitionType}`);
  }
  
  function sendToPreview() {
    const input = get(slidesInput);
    if (input) {
      sendCommand(`FUNCTION PreviewInput Input=${input.key}`);
    }
  }

  function handleJumpToSlide(event) {
    if (event.key !== 'Enter') return;
    const input = get(slidesInput);
    const slideNumber = parseInt(jumpValue, 10);
    if (input && !isNaN(slideNumber) && slideNumber > 0) {
      sendCommand(`FUNCTION SelectIndex Input=${input.key}&Value=${slideNumber}`);
      jumpValue = '';
      jumpInput.blur();
      setTimeout(() => fetchAllInputs(), 100);
    }
  }

  function setTransitionDuration() {
    const input = get(slidesInput);
    if (input) {
      sendCommand(`FUNCTION SetPictureTransition Input=${input.key}&Value=${transitionDuration}`);
    }
  }

  function setPictureEffect() {
    const input = get(slidesInput);
    if (input) {
      sendCommand(`FUNCTION SetPictureEffect Input=${input.key}&Value=${effect}`);
    }
  }

  function setPictureEffectDuration() {
    const input = get(slidesInput);
    if (input) {
      sendCommand(`FUNCTION SetPictureEffectDuration Input=${input.key}&Value=${effectDuration}`);
    }
  }
</script>

<div class="slides-container">
  {#if $slidesInput}
    <button
      class="status-display"
      class:program={isInProgram}
      class:preview={isInPreview}
      class:is-clickable={!!$slidesInput}
      on:click={sendToPreview}
      title="Click to send Slides to Preview"
      disabled={!$slidesInput}
    >
      {#if isInProgram}
        Input is Active
      {:else if isInPreview}
        Input in Preview
      {:else}
        Input not Loaded
      {/if}
    </button>
  
    <div class="button-row">
      <button class="control-btn" on:click={() => handleTransport('Restart')} title="Restart">⟲</button>
      <button class="control-btn" on:click={() => handleTransport('PreviousItem')} title="Previous">«</button>
      <button class="control-btn play-btn" class:playing={$isPlaying} on:click={() => handleTransport('PlayPause')} title="Play/Pause">
        {#if $isPlaying}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        {:else}
           ▶
        {/if}
      </button>
      <button class="control-btn" on:click={() => handleTransport('NextItem')} title="Next">»</button>
    </div>

    <div class="prod-btn-row">
      <button class="prod-btn" on:click={() => handleTransition('Stinger1')}>Stinger 1</button>
      <button class="prod-btn" on:click={() => handleTransition('Merge')}>Merge</button>
      <button class="prod-btn" on:click={() => handleTransition('Fade')}>Fade</button>
      <button class="prod-btn" on:click={() => handleTransition('Cut')}>Cut</button>
    </div>

    <div class="settings-row">
      <div class="setting-item">
        <label for="slide-transition-duration">Transition (s)</label>
        <select id="slide-transition-duration" bind:value={transitionDuration} on:change={setTransitionDuration}>
          {#each durationOptions as dur}
            <option value={dur}>{dur}</option>
          {/each}
        </select>
      </div>
      <div class="setting-item">
        <label for="slide-effect">Effect</label>
        <select id="slide-effect" bind:value={effect} on:change={setPictureEffect}>
          {#each effectOptions as eff}
            <option value={eff}>{eff}</option>
          {/each}
        </select>
      </div>
      <div class="setting-item">
        <label for="slide-effect-duration">Effect Dur. (ms)</label>
        <select id="slide-effect-duration" bind:value={effectDuration} on:change={setPictureEffectDuration}>
          {#each effectDurationOptions as dur}
            <option value={dur}>{dur}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="jump-row">
      <label for="jump-input">Jump to slide</label>
      <input 
        type="text" 
        id="jump-input" 
        class="jump-input"
        bind:this={jumpInput}
        bind:value={jumpValue}
        on:keydown={handleJumpToSlide}
        placeholder={$slidesInput.selectedIndex || '#'}
      >
    </div>

    <div class="source-display">
      SOURCE: {$slidesInput?.shortTitle || 'Not Found'}
    </div>

  {:else}
    <div class="placeholder">Input "{get(inputMappings).slides}" not found.</div>
  {/if}
</div>

<style>
  .slides-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 15px;
  }

  .status-display {
    background-color: #1f1f23;
    border-radius: 5px;
    padding: 0 10px;
    border: 1px solid #4a4a4e;
    color: #eee;
    font-weight: bold;
    height: 35px;
    font-size: 1.1em;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    flex-shrink: 0;
    transition: all 0.2s ease-in-out;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    text-align: center;
  }
  .status-display.preview {
    background-color: #f39c12;
    border-color: #d35400;
    color: white;
  }
  .status-display.program {
    background-color: #27ae60;
    border-color: #229954;
    color: white;
  }
  .status-display.is-clickable {
    cursor: pointer;
  }
  .status-display.is-clickable:hover {
    border-color: var(--color-accent, #14ffec);
    box-shadow: 0 0 8px 2px rgba(20, 255, 236, 0.4);
  }
  .status-display:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .button-row, .prod-btn-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    flex-shrink: 0;
  }
  
  .control-btn {
    height: 40px;
    background: #3f3f46;
    border: 1px solid #555;
    color: #ccc;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1.5em;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
  }
  .control-btn:hover { background-color: #555; }
  .play-btn.playing {
    background-color: #2f855a;
    border-color: #38a169;
    color: white;
  }
  .control-btn svg {
    width: 22px;
    height: 22px;
  }
  
  .prod-btn {
    height: 30px;
    background-color: #3f3f46;
    border: 1px solid #555;
    color: #eee;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: bold;
    font-size: 0.8em;
  }
  .prod-btn:hover { background-color: #555; }

  .settings-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    flex-shrink: 0;
  }
  .setting-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .setting-item label {
    font-size: 0.75em;
    color: #999;
    font-weight: bold;
    text-align: center;
  }
  .setting-item select {
    width: 100%;
    background: #1f1f23;
    border: 1px solid #555;
    color: #eee;
    border-radius: 5px;
    padding: 6px;
    font-family: inherit;
    font-size: 0.9em;
  }
  .setting-item select:focus {
    outline: none;
    border-color: #14ffec;
  }
  
  .jump-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #1f1f23;
    padding: 8px;
    border-radius: 5px;
  }
  .jump-row label {
    font-size: 0.9em;
    color: #999;
    font-weight: bold;
  }
  .jump-input {
    width: 60px;
    height: 30px;
    background-color: #151518;
    border: 1px solid #4a4a4e;
    color: #eee;
    border-radius: 4px;
    text-align: center;
    font-size: 1.1em;
    font-family: inherit;
  }
  .jump-input:focus {
    outline: none;
    border-color: var(--color-accent, #14ffec);
  }

  .source-display {
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.75em;
    color: #888;
    text-align: center;
    flex-shrink: 0;
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid #3a3a3e;
  }

  .placeholder {
    color: #888;
    text-align: center;
    margin: auto 0;
  }
</style>

