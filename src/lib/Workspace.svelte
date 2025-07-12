<script>
  import { panelStates } from './stores.js'

  // This function toggles the 'visible' property for a given panel ID
  function togglePanelVisibility(panelId) {
    panelStates.update((states) => {
      if (states[panelId]) {
        states[panelId].visible = !states[panelId].visible
      }
      return states
    })
  }
</script>

<div class="workspace-controls">
  {#each Object.entries($panelStates) as [id, state] (id)}
    {#if id !== 'workspace'}
      <button
        class="toggle-btn"
        class:active={state.visible}
        on:click={() => togglePanelVisibility(id)}
      >
        {state.title || id}
      </button>
    {/if}
  {/each}
</div>

<style>
  .workspace-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    overflow-y: auto;
  }
  .toggle-btn {
    width: 100%;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #555;
    background-color: #2d2d2d;
    color: #eee;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
  }
  .toggle-btn.active {
    background-color: #14ffec;
    color: #1f1f23;
    border-color: #14ffec;
  }
  .toggle-btn:hover {
    border-color: #14ffec;
  }
</style>
