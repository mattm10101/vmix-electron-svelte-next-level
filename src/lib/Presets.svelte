<script>
  import { createEventDispatcher, tick } from 'svelte'

  export let presets = []
  const dispatch = createEventDispatcher()

  let renamingId = null
  let tempName = ''
  let renameInput

  async function startRename(preset) {
    renamingId = preset.id
    tempName = preset.name
    await tick()
    renameInput.focus()
  }

  function commitRename() {
    if (renamingId && tempName) {
      dispatch('rename', { id: renamingId, newName: tempName })
    }
    renamingId = null
  }

  function deletePreset(id) {
    if (confirm('Are you sure you want to delete this preset?')) {
      dispatch('delete', id)
    }
  }
</script>

<div class="presets-container">
  <button class="snapshot-btn" on:click={() => dispatch('snapshot')}>
    Snapshot
  </button>
  <hr />
  <div class="presets-list">
    {#each presets as preset, i (preset.id)}
      <div class="preset-row">
        {#if renamingId === preset.id}
          <input
            type="text"
            bind:value={tempName}
            on:blur={commitRename}
            on:keydown={(e) => e.key === 'Enter' && commitRename()}
            class="rename-input"
            bind:this={renameInput}
          />
        {:else}
          <button
            class="preset-btn"
            on:click={() => dispatch('apply', preset.layout)}
            on:dblclick={() => startRename(preset)}
          >
            {preset.name}
          </button>
          <button class="delete-btn" on:click={() => deletePreset(preset.id)}>
            X
          </button>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .presets-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
  }
  hr {
    border-color: #3c3c3c;
    width: 100%;
    margin: 5px 0;
  }
  .snapshot-btn {
    width: 100%;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #14ffec;
    background-color: #1f1f23;
    color: #14ffec;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }
  .snapshot-btn:hover {
    background-color: #14ffec;
    color: #1f1f23;
  }
  .presets-list {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
  }
  .preset-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .preset-btn {
    flex-grow: 1;
    text-align: left;
    padding: 8px;
    border-radius: 5px;
    border: 1px solid #555;
    background-color: #2d2d2d;
    color: #eee;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .preset-btn:hover {
    background-color: #3f3f46;
  }
  .rename-input {
    flex-grow: 1;
    padding: 8px;
    border-radius: 5px;
    border: 1px solid #14ffec;
    background: #1f1f23;
    color: white;
  }
  .delete-btn {
    background: #5d1b1b;
    color: #f5c6c6;
    border: 1px solid #c53030;
    border-radius: 5px;
    width: 35px;
    height: 35px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .delete-btn:hover {
    background: #c53030;
    color: white;
  }
</style>
