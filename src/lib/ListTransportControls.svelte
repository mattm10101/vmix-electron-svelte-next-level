<script>
  import { createEventDispatcher } from 'svelte';

  /** The full vMix input object for this list */
  export let listInput = null;
  /** A boolean indicating if the list is currently playing */
  export let isPlaying = false;

  const dispatch = createEventDispatcher();

  let isRestartFlashing = false;
  let isPrevFlashing = false;
  let isNextFlashing = false;

  // This function simply dispatches the specific vMix command (e.g., 'Restart', 'PlayPause')
  // to the parent component. The parent will be responsible for sending it.
  function handleTransportClick(command) {
    if (!listInput) return;

    dispatch('command', command);

    // Handle the local button "flashing" animation
    if (command === 'Restart') {
      isRestartFlashing = true;
      setTimeout(() => (isRestartFlashing = false), 300);
    } else if (command === 'PreviousItem') {
      isPrevFlashing = true;
      setTimeout(() => (isPrevFlashing = false), 300);
    } else if (command === 'NextItem') {
      isNextFlashing = true;
      setTimeout(() => (isNextFlashing = false), 300);
    }
  }
</script>

<div class="button-row">
  <button class="control-btn" class:flashing={isRestartFlashing} on:click={() => handleTransportClick('Restart')} title="Restart">⟲</button>
  <button class="control-btn" class:flashing={isPrevFlashing} on:click={() => handleTransportClick('PreviousItem')} title="Previous">«</button>
  <button class="control-btn play-btn" class:playing={isPlaying} on:click={() => handleTransportClick('PlayPause')} title="Play/Pause">
    {#if isPlaying}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
    {:else}▶{/if}
  </button>
  <button class="control-btn" class:flashing={isNextFlashing} on:click={() => handleTransportClick('NextItem')} title="Next">»</button>
</div>

<style>
  .button-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    flex-shrink: 0;
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
  .control-btn.flashing {
    border-color: #00d0ff;
    box-shadow: 0 0 12px 2px #00d0ff;
  }
  .play-btn.playing {
    background-color: #16a34a;
    color: white;
    border-color: #22c55e;
    box-shadow: 0 0 8px #22c55e, 0 0 15px #16a34a;
  }
  .control-btn svg {
    width: 24px;
    height: 24px;
  }
</style>