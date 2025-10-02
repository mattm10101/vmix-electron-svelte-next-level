<script>
  import { gridOptions, panelStates, savedDefaultLayout, inputMappings } from './stores.js'
  import { get } from 'svelte/store'

  function setSnapSize(size) {
    gridOptions.update((opts) => ({ ...opts, snapSize: size }))
  }

  function toggleGrid() {
    gridOptions.update((opts) => ({ ...opts, show: !opts.show }))
  }

  function toggleSnap() {
    gridOptions.update((opts) => ({ ...opts, snapToGrid: !opts.snapToGrid }))
  }

  function toggleResizeSnap() {
    gridOptions.update((opts) => ({ ...opts, snapResize: !opts.snapResize }))
  }

  function saveAsDefault() {
    const currentLayout = get(panelStates)
    savedDefaultLayout.set(currentLayout)
    alert('Current layout saved as default!')
  }
</script>

<div class="options-container">
  <div class="mappings-group">
    <div class="mapping-item">
      <label for="music-map">Music Player</label>
      <input type="text" id="music-map" bind:value={$inputMappings.music} />
    </div>
    <div class="mapping-item">
      <label for="videos-map">Videos Player</label>
      <input type="text" id="videos-map" bind:value={$inputMappings.videos} />
    </div>
    <div class="mapping-item">
      <label for="photos-map">Photos Prefix</label>
      <input type="text" id="photos-map" bind:value={$inputMappings.photos} />
    </div>
    <div class="mapping-item">
      <label for="l3-map">L3s Prefix</label>
      <input type="text" id="l3-map" bind:value={$inputMappings.lowerThirds} />
    </div>
  </div>

  <div class="layout-actions">
    <button class="action-btn save-btn" on:click={saveAsDefault}>Save Layout as Default</button>
  </div>
  
  <div class="option-group">
    <span class="label">Visual Grid</span>
    <button class="toggle-btn" class:active={$gridOptions.show} on:click={toggleGrid}>
      {$gridOptions.show ? 'On' : 'Off'}
    </button>
  </div>
  <div class="option-group">
    <span class="label">Drag Snap</span>
    <button class="toggle-btn" class:active={$gridOptions.snapToGrid} on:click={toggleSnap}>
      {$gridOptions.snapToGrid ? 'On' : 'Off'}
    </button>
  </div>
  <div class="option-group">
    <span class="label">Snap Resize</span>
    <button class="toggle-btn" class:active={$gridOptions.snapResize} on:click={toggleResizeSnap}>
      {$gridOptions.snapResize ? 'On' : 'Off'}
    </button>
  </div>
  <div class="option-group">
    <span class="label">Snap To</span>
    <div class="button-group">
      <button class:active={$gridOptions.snapSize === 2} on:click={() => setSnapSize(2)}>S</button>
      <button class:active={$gridOptions.snapSize === 10} on:click={() => setSnapSize(10)}>M</button>
      <button class:active={$gridOptions.snapSize === 20} on:click={() => setSnapSize(20)}>L</button>
      <button class:active={$gridOptions.snapSize === 40} on:click={() => setSnapSize(40)}>XL</button>
    </div>
  </div>
</div>

<style>
  .options-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 10px;
  }
  /* NEW STYLES for the mapping section */
  .mappings-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    background: #2a2a2e;
    padding: 10px;
    border-radius: 5px;
  }
  .mapping-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .mapping-item label {
    color: #ccc;
    font-size: 0.8em;
  }
  .mapping-item input {
    background: #1f1f23;
    border: 1px solid #555;
    color: #eee;
    border-radius: 3px;
    padding: 6px;
    font-family: inherit;
  }
  .mapping-item input:focus {
    outline: none;
    border-color: #14ffec;
  }
  /* End of new styles */
  .layout-actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .action-btn {
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #555;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }
  .save-btn {
    background-color: #2b6cb0;
    color: white;
  }
  .save-btn:hover {
    background-color: #3182ce;
  }
  .option-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #2a2a2e;
    padding: 10px;
    border-radius: 5px;
  }
  .label {
    font-weight: bold;
    color: #ccc;
  }
  .button-group {
    display: flex;
    gap: 5px;
    background: #1f1f23;
    border-radius: 5px;
    padding: 4px;
  }
  .button-group button,
  .toggle-btn {
    background: #3f3f46;
    border: 1px solid #555;
    color: #eee;
    padding: 6px 12px;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 40px;
    text-align: center;
  }
  .button-group button:hover,
  .toggle-btn:hover {
    background: #555;
  }
  .button-group button.active,
  .toggle-btn.active {
    background-color: #14ffec;
    color: #1f1f23;
    font-weight: bold;
  }
</style>