<script>
  import { get } from 'svelte/store';
  import { optionsModalOpen, layoutPresets, panelStates } from './stores.js';

  const presetSlots = Array.from({ length: 9 }, (_, i) => i);

  function closeModal() {
    optionsModalOpen.set(false);
  }

  // REVERTED: Logic is now local to this component again
  function savePreset(index) {
    const currentLayout = get(panelStates);
    const layoutCopy = JSON.parse(JSON.stringify(currentLayout));

    layoutPresets.update(presets => {
      const newPresets = [...presets];
      while (newPresets.length <= index) {
        newPresets.push(null);
      }
      newPresets[index] = {
        id: Date.now() + index,
        name: `Preset ${index + 1}`,
        layout: layoutCopy,
      };
      return newPresets;
    });
  }

  // REVERTED: Logic is now local to this component again
  function deletePreset(index) {
    layoutPresets.update(presets => {
      const newPresets = [...presets];
      if (newPresets.length > index) {
        newPresets[index] = null;
      }
      return newPresets;
    });
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div 
  class="modal-backdrop" 
  on:click|self={closeModal} 
  on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') closeModal() }}
  role="dialog" 
  aria-modal="true" 
  tabindex="-1"
>
  <div class="modal-content">
    <div class="modal-header">
      <h2>Preset Hotkey Management</h2>
      <button class="close-btn" on:click={closeModal} aria-label="Close modal">&times;</button>
    </div>
    
    <div class="preset-list">
      {#each presetSlots as index}
        {@const preset = $layoutPresets[index]}
        <div class="preset-row">
          <span class="slot-number">{index + 1}</span>
          <span class="preset-name">
            {preset?.name || 'Empty Slot'}
          </span>
          <div class="preset-actions">
            <button class="action-btn save-btn" on:click={() => savePreset(index)} title="Save current layout to Slot {index + 1}" aria-label="Save current layout to Slot {index + 1}">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338A2.25 2.25 0 0 0 17.088 3.75H15M12 3.75v9" />
              </svg>
            </button>
            <button class="action-btn delete-btn" on:click={() => deletePreset(index)} title="Clear Slot {index + 1}" disabled={!preset} aria-label="Clear Slot {index + 1}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  .modal-content {
    background-color: #2a2a2e;
    border-radius: 8px;
    border: 1px solid #4a4a4e;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    width: 90%;
    max-width: 450px;
    display: flex;
    flex-direction: column;
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #4a4a4e;
    flex-shrink: 0;
  }
  h2 {
    margin: 0;
    font-size: 1.2em;
    color: var(--color-accent, #14ffec);
  }
  .close-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 2em;
    line-height: 1;
    cursor: pointer;
    padding: 0;
  }
  .close-btn:hover {
    color: white;
  }

  .preset-list {
    display: flex;
    flex-direction: column;
    padding: 10px;
    gap: 5px;
    max-height: 70vh;
    overflow-y: auto;
  }
  .preset-row {
    display: grid;
    grid-template-columns: 20px 1fr auto;
    align-items: center;
    gap: 15px;
    padding: 10px;
    border-radius: 5px;
  }
  .preset-row:nth-child(odd) {
    background-color: rgba(0,0,0,0.2);
  }
  .slot-number {
    font-family: 'Courier New', Courier, monospace;
    color: #888;
    font-size: 0.9em;
  }
  .preset-name {
    color: #eee;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .preset-actions {
    display: flex;
    gap: 8px;
  }
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 5px;
    border: 1px solid #555;
    background-color: #3f3f46;
    color: #eee;
    cursor: pointer;
    transition: all 0.2s;
  }
  .action-btn:hover:not(:disabled) {
    border-color: var(--color-accent, #14ffec);
  }
  .action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .action-btn svg {
    width: 20px;
    height: 20px;
  }
  .save-btn:hover:not(:disabled) {
    background-color: #2f855a;
  }
  .delete-btn:hover:not(:disabled) {
    background-color: #c53030;
  }
</style>