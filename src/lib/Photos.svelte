<script>
  import { derived, get } from 'svelte/store';
  import { inputs, playingInputs, inputMappings } from './stores.js';
  import { sendCommand } from './vmix.js';

  const photosInput = derived(
    [inputs, inputMappings],
    ([$inputs, $mappings]) => {
      if (!$mappings.photos) return null;
      return $inputs.find((i) => i.title.startsWith($mappings.photos));
    }
  );

  const isPlaying = derived(
    [photosInput, playingInputs],
    ([$photosInput, $playingInputs]) => {
      if (!$photosInput) return false;
      return $playingInputs.has($photosInput.id);
    }
  );

  function handleTransport(command) {
    const input = get(photosInput);
    if (input) {
      sendCommand(`FUNCTION ${command} Input=${input.key}`);
    }
  }
</script>

<div class="photos-container">
  {#if $photosInput}
    <div class="button-row">
      <button
        class="control-btn"
        on:click={() => handleTransport('Restart')}
        title="Restart"
        aria-label="Restart">⟲</button
      >
      <button
        class="control-btn"
        on:click={() => handleTransport('PreviousItem')}
        title="Previous">«</button
      >
      <button
        class="control-btn play-btn"
        class:playing={$isPlaying}
        on:click={() => handleTransport('PlayPause')}
        title="Play/Pause"
        aria-label="Play/Pause"
      >
        {#if $isPlaying}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        {:else}
          ▶
        {/if}
      </button>
      <button
        class="control-btn"
        on:click={() => handleTransport('NextItem')}
        title="Next">»</button
      >
    </div>
  {:else}
    <div class="placeholder">No input named "PHOTOS - ..." found.</div>
  {/if}
</div>

<style>
  .photos-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 15px;
    /* UPDATED: Added horizontal padding for breathing room */
    padding: 0 15px;
  }

  .button-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .control-btn {
    height: 45px;
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
  .control-btn:hover {
    background-color: #555;
  }
  .play-btn.playing {
    background-color: #2f855a;
    border-color: #38a169;
    color: white;
    box-shadow: 0 0 8px #38a169, 0 0 15px #2f855a;
  }
  .control-btn svg {
    width: 24px;
    height: 24px;
  }
  .placeholder {
    color: #888;
    text-align: center;
    margin: auto 0;
  }
</style>