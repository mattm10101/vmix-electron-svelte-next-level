<script>
  import { createEventDispatcher } from 'svelte'
  import { l3Inputs, overlay1ActiveInput } from './stores.js'

  const dispatch = createEventDispatcher()

  function toggleOverlay(inputId) {
    dispatch('command', `FUNCTION OverlayInput1 Input=${inputId}`)
  }
</script>

<div class="l3-container">
  {#if $l3Inputs.length > 0}
    {#each $l3Inputs as l3 (l3.id)}
      <button
        class="l3-btn"
        class:blinking={$overlay1ActiveInput === l3.id}
        on:click={() => toggleOverlay(l3.id)}
      >
        {l3.name.replace('L3 - ', '')}
      </button>
    {/each}
  {:else}
    <div class="no-l3s-message">No "L3 - " inputs found.</div>
  {/if}
</div>

<style>
  @keyframes blink-animation {
    0% {
      background-color: #c53030;
    }
    50% {
      background-color: #5d1b1b;
    }
    100% {
      background-color: #c53030;
    }
  }

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
    border: 1px solid #555;
    background-color: #2d2d2d;
    color: #eee;
    cursor: pointer;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background-color 0.2s;
  }
  .l3-btn:hover {
    background-color: #3f3f46;
  }
  .l3-btn.blinking {
    border-color: #f56565;
    color: white;
    animation: blink-animation 1.5s infinite;
  }
  .no-l3s-message {
    color: #888;
    text-align: center;
    margin-top: 10px;
  }
</style>
