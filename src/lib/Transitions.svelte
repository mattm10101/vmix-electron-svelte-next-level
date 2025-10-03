<script>
  export let onCommand = (detail) => {};
</script>

<div class="grid-container">
  <button on:click={() => onCommand('FUNCTION Stinger1')}>Stinger 1</button>
  <button on:click={() => onCommand('FUNCTION Fade')}>Fade</button>
  <button on:click={() => onCommand('FUNCTION Merge')}>Merge</button>
  <button on:click={() => onCommand('FUNCTION Cut')}>Cut</button>
</div>

<style>
  .grid-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    height: 100%;
    /* UPDATED: Added padding for breathing room */
    padding: 15px;
    box-sizing: border-box; /* Ensures padding is included in the height calculation */
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