<script>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
</script>

<div class="grid-container">
  <button on:click={() => dispatch('command', 'FUNCTION Stinger1')}
    >Stinger 1</button
  >
  <button on:click={() => dispatch('command', 'FUNCTION Fade')}>Fade</button>
  <button on:click={() => dispatch('command', 'FUNCTION Merge')}>Merge</button>
  <button on:click={() => dispatch('command', 'FUNCTION Cut')}>Cut</button>
</div>

<style>
  .grid-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    height: 100%;
  }
  button {
    width: 100%;
    height: 100%;
    padding: 10px 15px;
    border-radius: 5px;
    border: 1px solid #555;
    background-color: #2d2d2d;
    color: #eee;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  button:hover {
    background-color: #3f3f46;
  }
</style>
