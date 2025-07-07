<script>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
</script>

<div class="controls-container">
  <button on:click={() => dispatch('command', 'FUNCTION Fade')}>Fade</button>
  <button on:click={() => dispatch('command', 'FUNCTION Cut')}>Cut</button>
  <button on:click={() => dispatch('command', 'FUNCTION Merge')}>Merge</button>
  <button on:click={() => dispatch('command', 'FUNCTION Stinger1')}
    >Stinger 1</button
  >
  <hr />
  <button on:click={() => dispatch('refresh')}>Refresh Names</button>
</div>

<style>
  .controls-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  hr {
    border-color: #3c3c3c;
    width: 100%;
    margin: 0;
  }
  button {
    width: 100%;
    padding: 10px 15px;
    border-radius: 5px;
    border: 1px solid #555;
    background-color: #2d2d2d;
    color: var(--text-color);
    cursor: pointer;
    transition: background-color 0.2s; /* Keep transition for potential future use */
  }
  /* The :hover pseudo-class has been removed */
</style>
