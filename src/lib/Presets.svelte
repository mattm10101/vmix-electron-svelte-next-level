<script>
  import { tick } from 'svelte'
  import { showModal } from './stores.js'

  export let presets = []
  export let onSnapshot = () => {}
  export let onApply = (detail) => {}
  export let onDelete = (detail) => {}
  export let onRename = (detail) => {}

  let renamingId = null
  let editInput
  let tempName = ''

  function confirmDelete(id) {
    showModal('Are you sure you want to delete this preset?', () => {
      onDelete(id)
    })
  }

  async function startEditing(preset) {
    renamingId = preset.id
    tempName = preset.name
    await tick()
    editInput?.focus()
    editInput?.select()
  }

  function commitEdit() {
    if (renamingId !== null) {
      onRename({ id: renamingId, newName: tempName })
    }
    renamingId = null
  }
</script>

<div class="presets-container">
  <div class="top-buttons">
    <button class="snapshot-btn" on:click={onSnapshot}> Snapshot </button>
  </div>
  <hr />
  <div class="presets-list">
    {#if presets.length > 0}
      {#each presets as preset, i (i)}
        <div class="preset-row">
          {#if preset}
            {#if renamingId === preset.id}
              <input
                type="text"
                class="rename-input"
                bind:this={editInput}
                bind:value={tempName}
                on:blur={commitEdit}
                on:keydown={(e) => e.key === 'Enter' && commitEdit()}
              />
            {:else}
              <button
                class="preset-btn"
                on:click={() => onApply(preset.layout)}
                on:dblclick={() => startEditing(preset)}
                title="Click to apply, double-click to rename"
              >
                {preset.name}
              </button>
            {/if}
            <button
              class="delete-btn"
              on:click={() => confirmDelete(preset.id)}
              title="Delete Preset">X</button
            >
          {:else}
            <span class="empty-slot">Slot {i + 1} is empty</span>
            <button class="delete-btn" disabled>X</button>
          {/if}
        </div>
      {/each}
    {:else}
      <div class="no-presets-message">No snapshots taken yet.</div>
    {/if}
  </div>
</div>

<style>
  .presets-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    padding: 15px;
    box-sizing: border-box;
  }
  .top-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
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
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }
  .snapshot-btn {
    border: 1px solid #14ffec;
    background-color: #1f1f23;
    color: #14ffec;
  }
  .snapshot-btn:hover {
    background-color: #14ffec;
    color: #1f1f23;
  }
  /* REMOVED the unused .default-btn styles that were here */
  .presets-list {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
  }
  .preset-row {
    display: flex;
    gap: 5px;
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    font-size: 1em;
  }
  .rename-input:focus {
    outline: none;
  }
  .delete-btn {
    background: #3f3f46;
    border: 1px solid #555;
    color: #ccc;
    border-radius: 5px;
    width: 35px;
    height: 35px;
    flex-shrink: 0;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .delete-btn:hover:not(:disabled) {
    background-color: #c53030;
    color: white;
  }
  .delete-btn:disabled {
      opacity: 0.2;
      cursor: not-allowed;
  }
  .no-presets-message {
    color: #888;
    text-align: center;
    margin-top: 10px;
  }
  .empty-slot {
    flex-grow: 1;
    text-align: left;
    padding: 8px;
    color: #666;
    font-style: italic;
    border: 1px solid transparent;
  }
</style>