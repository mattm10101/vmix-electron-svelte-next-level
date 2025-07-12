<script>
  import { tick } from 'svelte'

  export let presets = []
  export let onSnapshot = () => {}
  export let onApply = (detail) => {}
  export let onDelete = (detail) => {}
  export let onRename = (detail) => {}

  let renamingId = null
  let editInput

  function runApply(presetLayout) {
    if (renamingId === null) {
      onApply(presetLayout)
    }
  }

  async function startEditing(preset) {
    renamingId = preset.id
    await tick()
    editInput?.focus()
    editInput?.select()
  }

  function handleNameChange(id, newName) {
    onRename({ id, newName })
  }

  function commitEdit() {
    renamingId = null
  }
</script>

<div class="presets-container">
  <button class="snapshot-btn" on:click={onSnapshot}> Snapshot </button>
  <hr />
  <div class="presets-list">
    {#each presets as preset (preset.id)}
      <div class="preset-row">
        {#if renamingId === preset.id}
          <input
            type="text"
            class="rename-input"
            value={preset.name}
            bind:this={editInput}
            on:input={(e) => handleNameChange(preset.id, e.target.value)}
            on:blur={commitEdit}
            on:keydown={(e) => e.key === 'Enter' && commitEdit()}
          />
        {:else}
          <button
            class="preset-btn"
            on:click={() => runApply(preset.layout)}
            on:dblclick={() => startEditing(preset)}
          >
            {preset.name}
          </button>
        {/if}
        <button class="delete-btn" on:click={() => onDelete(preset.id)}
          >X</button
        >
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
  .delete-btn:hover {
    background-color: #c53030;
    color: white;
  }
</style>
