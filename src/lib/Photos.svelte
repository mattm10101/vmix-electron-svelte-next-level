<script>
  import { derived, get } from 'svelte/store';
  import { inputs, playingInputs, inputMappings, programInput, previewInput } from './stores.js';
  import { sendCommand } from './vmix.js';

  let transitionDuration = 2;
  let effect = 'Fade';
  let effectDuration = 500;

  const durationOptions = [0, 2, 5, 10, 20, 30, 60];
  const effectOptions = ['Fade', 'Cut'];
  const effectDurationOptions = [250, 500, 750, 1000, 1500, 2000];

  const targetInputName = derived(inputMappings, ($mappings) => $mappings.photos);

  const photosInput = derived(
    [inputs, targetInputName],
    ([$inputs, $targetInputName]) => {
      if (!$targetInputName) return null;
      // UPDATED: Now finds by exact shortTitle match, not prefix
      return $inputs.find((i) => i.shortTitle === $targetInputName);
    }
  );

  const isPlaying = derived(
    [photosInput, playingInputs],
    ([$photosInput, $playingInputs]) => {
      if (!$photosInput) return false;
      return $playingInputs.has($photosInput.id);
    }
  );

  $: isInPreview = $photosInput && $previewInput === $photosInput.id;
  $: isInProgram = $photosInput && $programInput === $photosInput.id;

  function handleTransport(command) {
    const input = get(photosInput);
    if (input) {
      sendCommand(`FUNCTION ${command} Input=${input.key}`);
    }
  }

  function handleTransition(funcName) {
    sendCommand(funcName);
  }

  function setTransitionDuration() {
    const input = get(photosInput);
    if (input) {
      sendCommand(`FUNCTION SetPictureTransition Input=${input.key}&Value=${transitionDuration}`);
    }
  }

  function setPictureEffect() {
    const input = get(photosInput);
    if (input) {
      sendCommand(`FUNCTION SetPictureEffect Input=${input.key}&Value=${effect}`);
    }
  }

  function setPictureEffectDuration() {
    const input = get(photosInput);
    if (input) {
      sendCommand(`FUNCTION SetPictureEffectDuration Input=${input.key}&Value=${effectDuration}`);
    }
  }
</script>

<div class="photos-container">
  {#if $photosInput}
    <div
      class="status-display"
      class:program={isInProgram}
      class:preview={isInPreview}
    >
      {#if isInProgram}
        Input is Active
      {:else if isInPreview}
        Input in Preview
      {:else}
        Input not Loaded
      {/if}
    </div>
  
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
      <button class="prod-btn" on:click={() => handleTransition('FUNCTION Stinger1')}>Stinger 1</button>
      <button class="prod-btn" on:click={() => handleTransition('FUNCTION Merge')}>Merge</button>
      <button class="prod-btn" on:click={() => handleTransition('FUNCTION Fade')}>Fade</button>
      <button class="prod-btn" on:click={() => handleTransition('FUNCTION Cut')}>Cut</button>
    </div>

    <div class="settings-row">
      <div class="setting-item">
        <label for="transition-duration">Transition (s)</label>
        <select id="transition-duration" bind:value={transitionDuration} on:change={setTransitionDuration}>
          {#each durationOptions as dur}
            <option value={dur}>{dur}</option>
          {/each}
        </select>
      </div>
      <div class="setting-item">
        <label for="effect">Effect</label>
        <select id="effect" bind:value={effect} on:change={setPictureEffect}>
          {#each effectOptions as eff}
            <option value={eff}>{eff}</option>
          {/each}
        </select>
      </div>
      <div class="setting-item">
        <label for="effect-duration">Effect Dur. (ms)</label>
        <select id="effect-duration" bind:value={effectDuration} on:change={setPictureEffectDuration}>
          {#each effectDurationOptions as dur}
            <option value={dur}>{dur}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="source-display">
      SOURCE: {$photosInput?.shortTitle || 'Not Found'}
    </div>

  {:else}
    <div class="placeholder">Input "{get(inputMappings).photos}" not found.</div>
  {/if}
</div>

<style>
  .photos-container {
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