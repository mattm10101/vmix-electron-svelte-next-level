<script>
  import { get } from 'svelte/store';
  import { l3Inputs, overlay1ActiveInput, inputMappings } from './stores.js';
  export let onCommand = (detail) => {};

  function toggleOverlay(inputId) {
    const currentlyActiveId = get(overlay1ActiveInput);
    if (currentlyActiveId === inputId) {
      onCommand(`FUNCTION OverlayInput1Out`);
    } else {
      onCommand(`FUNCTION OverlayInput1In Input=${inputId}`);
    }
  }

  $: l3Prefix = $inputMappings.lowerThirds || 'L3 - ';
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
        {l3.title.replace(l3Prefix, '')}
      </button>
    {/each}
  {:else}
    <div class="no-l3s-message">No inputs matching the L3 prefix found.</div>
  {/if}
</div>

<style>
  .l3-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    overflow-y: auto;
    padding: 15px;
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
    flex-shrink: 0;
  }
  .l3-btn:hover:not(.active) {
    border-color: #888;
    background-color: #3f3f46;
  }
  .l3-btn.active {
    background: linear-gradient(to bottom, #1abd79, #179a63);
    color: white;
    font-weight: bold;
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.9);
    filter: drop-shadow(0 0 2px #67ffc7) drop-shadow(0 0 6px #67ffc7);
    border-color: transparent;
  }
  .no-l3s-message {
    color: #888;
    text-align: center;
    margin-top: 10px;
  }
</style>