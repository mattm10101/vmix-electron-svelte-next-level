<script>
  import { get } from 'svelte/store'
  import { l3Inputs, overlay1ActiveInput } from './stores.js'

  export let onCommand = (detail) => {}

  function toggleOverlay(inputId) {
    const currentlyActiveId = get(overlay1ActiveInput)

    if (currentlyActiveId === inputId) {
      onCommand(`FUNCTION OverlayInput1Off Input=${inputId}`)
    } else {
      onCommand(`FUNCTION OverlayInput1 Input=${inputId}`)
    }
  }
</script>

<div class="l3-container">
  {#if $l3Inputs.length > 0}
    {#each $l3Inputs as l3 (l3.id)}
      <button
        class="l3-btn"
        class:active={$overlay1ActiveInput === l3.id}
        on:click={() => toggleOverlay(l3.id)}
        title={l3.title}
      >
        {l3.title.replace('L3 - ', '')}
      </button>
    {/each}
  {:else}
    <div class="no-l3s-message">No "L3 - " inputs found.</div>
  {/if}
</div>

<style>
  .l3-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    overflow-y: auto;
  }
  .l3-btn {
    width: 100%;
    padding: 10px 15px;
    border-radius: 5px;
    border: 2px solid #555;
    background-color: #2d2d2d;
    color: #eee;
    cursor: pointer;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all 0.2s ease-in-out;
  }
  .l3-btn:hover:not(.active) {
    border-color: #888;
    background-color: #3f3f46;
  }

  /* NEW: Advanced styling for the active button to match the image */
  .l3-btn.active {
    /* A darker, richer gradient for better text readability */
    background: linear-gradient(to bottom, #1abd79, #179a63);
    color: white;
    font-weight: bold;

    /* Creates the clean, 2px white inner border */
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.9);

    /* Creates the soft outer neon glow */
    filter: drop-shadow(0 0 2px #67ffc7) drop-shadow(0 0 6px #67ffc7);

    /* Make the original border transparent so it doesn't interfere */
    border-color: transparent;
  }
  .no-l3s-message {
    color: #888;
    text-align: center;
    margin-top: 10px;
  }
</style>
