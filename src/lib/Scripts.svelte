<script>
  import { tick } from 'svelte'
  import { scriptManager } from './stores.js'

  export let onCommand = (detail) => {}

  let editingId = null
  let tempName = ''
  let editInput
  let showOptions = false

  function runScript(scriptName) {
    if (!scriptName) return
    onCommand(`FUNCTION ScriptStart Value=${scriptName}`)
  }
</script>

<div class="scripts-container">
  {#if $scriptManager.scripts.length > 0}
    {#each $scriptManager.scripts as script (script.id)}
      <button class="operator-btn" on:click={() => runScript(script.name)}>
        {script.name}
      </button>
    {/each}
  {:else}
    <p>No scripts defined.</p>
  {/if}
</div>

<style>
  .scripts-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    height: 100%;
  }
  .operator-btn {
    width: 100%;
    height: 100%;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #555;
    background-color: #2d2d2d;
    color: #eee;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.2s;
    word-break: break-word;
  }
  .operator-btn:hover {
    background-color: #3f3f46;
  }
</style>
