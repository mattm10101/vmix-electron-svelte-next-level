<script>
  import { gridOptions, inputMappings } from './stores.js';

  function setSnapSize(size) {
    gridOptions.update((opts) => ({ ...opts, snapSize: size }));
  }

  function toggleGrid() {
    gridOptions.update((opts) => ({ ...opts, show: !opts.show }));
  }

  function toggleSnap() {
    gridOptions.update((opts) => ({ ...opts, snapToGrid: !opts.snapToGrid }));
  }

  function toggleResizeSnap() {
    gridOptions.update((opts) => ({ ...opts, snapResize: !opts.snapResize }));
  }
</script>

<div class="options-container">
  <div class="option-item">
    <label for="music-map">Music Player</label>
    <input type="text" id="music-map" bind:value={$inputMappings.music} />
  </div>
  <div class="option-item">
    <label for="videos-map">Videos Player</label>
    <input type="text" id="videos-map" bind:value={$inputMappings.videos} />
  </div>
  <div class="option-item">
    <label for="photos-map">Photos Player</label>
    <input type="text" id="photos-map" bind:value={$inputMappings.photos} />
  </div>
  <!-- NEW: Added Slides Player mapping -->
  <div class="option-item">
    <label for="slides-map">Slides Player</label>
    <input type="text" id="slides-map" bind:value={$inputMappings.slides} />
  </div>
  <div class="option-item">
    <label for="l3-map">L3s Prefix</label>
    <input type="text" id="l3-map" bind:value={$inputMappings.lowerThirds} />
  </div>

  <hr/>

  <div class="option-item">
    <span class="label">Visual Grid</span>
    <button class="toggle-btn" class:active={$gridOptions.show} on:click={toggleGrid}>
      {$gridOptions.show ? 'On' : 'Off'}
    </button>
  </div>
  <div class="option-item">
    <span class="label">Drag Snap</span>
    <button class="toggle-btn" class:active={$gridOptions.snapToGrid} on:click={toggleSnap}>
      {$gridOptions.snapToGrid ? 'On' : 'Off'}
    </button>
  </div>
  <div class="option-item">
    <span class="label">Snap Resize</span>
    <button class="toggle-btn" class:active={$gridOptions.snapResize} on:click={toggleResizeSnap}>
      {$gridOptions.snapResize ? 'On' : 'Off'}
    </button>
  </div>
  <div class="option-item">
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
    overflow-y: auto;
    padding: 15px;
    box-sizing: border-box;
  }
  hr {
    border-color: #3c3c3c;
    width: 100%;
    margin: 5px 0;
  }
  .option-item { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    background: #2a2a2e; 
    padding: 12px; 
    border-radius: 5px;
    flex-shrink: 0;
  }
  .option-item label, .label { 
    color: #ccc; 
    font-weight: bold;
  }
  .option-item input { 
    background: #1f1f23; 
    border: 1px solid #555; 
    color: #eee; 
    border-radius: 3px; 
    padding: 6px 8px; 
    font-family: inherit;
    text-align: right;
    width: 50%;
  }
  .option-item input:focus { outline: none; border-color: #14ffec; }
  .button-group { display: flex; gap: 5px; background: #1f1f23; border-radius: 5px; padding: 4px; }
  .button-group button, .toggle-btn { background: #3f3f46; border: 1px solid #555; color: #eee; padding: 6px 12px; border-radius: 3px; cursor: pointer; transition: all 0.2s; min-width: 40px; text-align: center; }
  .button-group button:hover, .toggle-btn:hover { background: #555; }
  .button-group button.active, .toggle-btn.active { background-color: #14ffec; color: #1f1f23; font-weight: bold; }
</style>
