<script>
  import { createEventDispatcher, tick } from 'svelte'
  import { scriptManager } from './stores.js'

  const dispatch = createEventDispatcher()

  let editingId = null
  let tempName = ''
  let editInput
  let showOptions = false

  function runScript(scriptName) {
    if (!scriptName) return
    dispatch('command', `FUNCTION ScriptStart Value=${scriptName}`)
  }

  function stopScript(scriptName) {
    if (!scriptName) return
    dispatch('command', `FUNCTION ScriptStop Value=${scriptName}`)
  }

  function addScript() {
    showOptions = true
    scriptManager.update((sm) => ({
      ...sm,
      scripts: [...sm.scripts, { id: Date.now(), name: '' }],
    }))
  }

  function deleteScript(id) {
    if (confirm('Are you sure you want to delete this script?')) {
      scriptManager.update((sm) => ({
        ...sm,
        scripts: sm.scripts.filter((s) => s.id !== id),
      }))
    }
  }

  function setLayout(cols) {
    scriptManager.update((sm) => ({ ...sm, layout: cols }))
  }

  async function startEditing(script) {
    editingId = script.id
    tempName = script.name
    await tick()
    editInput?.focus()
    editInput?.select()
  }

  function commitEdit() {
    if (editingId !== null) {
      scriptManager.update((sm) => {
        const scripts = sm.scripts.map((s) =>
          s.id === editingId ? { ...s, name: tempName } : s
        )
        return { ...sm, scripts }
      })
    }
    editingId = null
  }
</script>

<div class="scripts-container">
  <div class="toolbar">
    <button class="add-btn" on:click={addScript} title="Add New Script"
      >+</button
    >
    <div class="layout-controls">
      <button
        class="layout-btn"
        class:active={$scriptManager.layout === 1}
        on:click={() => setLayout(1)}>V</button
      >
      <button
        class="layout-btn"
        class:active={$scriptManager.layout === 2}
        on:click={() => setLayout(2)}>H</button
      >
    </div>
    <button
      class="options-btn"
      class:active={showOptions}
      on:click={() => (showOptions = !showOptions)}
    >
      Options
    </button>
  </div>

  <div class="grid-container">
    {#if showOptions}
      <div class="management-list">
        {#each $scriptManager.scripts as script (script.id)}
          <div class="script-item-manage">
            {#if editingId === script.id}
              <input
                type="text"
                class="name-input"
                bind:value={tempName}
                bind:this={editInput}
                on:blur={commitEdit}
                on:keydown={(e) => e.key === 'Enter' && commitEdit()}
              />
            {:else}
              <span class="name-text">{script.name || 'Empty Script'}</span>
            {/if}

            <div class="action-buttons">
              <button
                class="action-btn"
                on:click={() => startEditing(script)}
                title="Edit Name">⚙️</button
              >
              <button
                class="action-btn stop-btn"
                on:click={() => stopScript(script.name)}
                title="Stop Script">⏹️</button
              >
              <button
                class="action-btn delete-btn"
                on:click={() => deleteScript(script.id)}
                title="Delete Script">X</button
              >
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div
        class="operator-grid"
        style="grid-template-columns: repeat({$scriptManager.layout}, 1fr);"
      >
        {#each $scriptManager.scripts as script (script.id)}
          <button class="operator-btn" on:click={() => runScript(script.name)}>
            {script.name}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .scripts-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
  }
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .layout-controls {
    display: flex;
    background-color: #2d2d2d;
    border-radius: 5px;
    overflow: hidden;
    border: 1px solid #555;
  }
  .layout-btn {
    padding: 4px 12px;
    color: #eee;
    background: none;
    border: none;
    cursor: pointer;
    border-right: 1px solid #555;
    font-size: 0.9em;
    font-weight: bold;
  }
  .layout-btn:last-child {
    border-right: none;
  }
  .options-btn {
    padding: 4px 12px;
    color: #eee;
    background: none;
    border: 1px solid #555;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.9em;
  }
  .layout-btn.active,
  .options-btn.active {
    background-color: #14ffec;
    color: #1f1f23;
  }
  .layout-btn:hover:not(.active),
  .options-btn:hover:not(.active) {
    background-color: #3f3f46;
  }
  .add-btn {
    background-color: #2d2d2d;
    border: 1px solid #555;
    color: #eee;
    font-weight: bold;
    width: 30px;
    height: 30px;
    border-radius: 5px;
    cursor: pointer;
  }
  .add-btn:hover {
    background-color: #3f3f46;
  }

  .grid-container {
    flex-grow: 1;
    overflow-y: auto;
  }
  .operator-grid {
    display: grid;
    gap: 10px;
    height: 100%;
  }
  .operator-btn {
    width: 100%;
    height: 100%;
    min-height: 60px;
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

  .management-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .script-item-manage {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .name-text {
    flex-grow: 1;
    background: #2d2d2d;
    border: 1px solid #555;
    padding: 8px;
    border-radius: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .name-input {
    flex-grow: 1;
    height: 38px;
    background: #1f1f23;
    border: 1px solid #14ffec;
    color: white;
    border-radius: 5px;
    padding: 8px;
    box-sizing: border-box;
    font-size: 0.9em;
  }
  .name-input:focus {
    outline: none;
  }
  .action-buttons {
    display: flex;
    gap: 5px;
  }
  .action-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 5px;
    border: 1px solid #555;
    background-color: #3f3f46;
    color: #ccc;
    cursor: pointer;
    font-size: 1.2em;
    font-weight: bold;
    width: 38px;
    height: 38px;
    flex-shrink: 0;
  }
  .action-btn:hover {
    background-color: #555;
  }
  .stop-btn:hover {
    background-color: #c53030;
    color: white;
  }
  .delete-btn:hover {
    background-color: #c53030;
    color: white;
  }
</style>
