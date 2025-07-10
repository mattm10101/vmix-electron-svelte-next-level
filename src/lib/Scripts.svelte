<script>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  function runScript(scriptNumber) {
    // CORRECTED: Use the 'ScriptStart' function with the 'Value' parameter
    const command = `FUNCTION ScriptStart Value=Script ${scriptNumber}`
    dispatch('command', command)
  }
</script>

<div class="scripts-grid">
  <button on:click={() => runScript(1)}>Script 1</button>
  <button on:click={() => runScript(2)}>Script 2</button>
  <button on:click={() => runScript(3)}>Script 3</button>
  <button on:click={() => runScript(4)}>Script 4</button>
</div>

<style>
  .scripts-grid {
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
