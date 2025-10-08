<script>
  import MixerSlider from './MixerSlider.svelte';
  import { sendCommand } from './vmix.js';
  import { inputs } from './stores.js';
  export let audioInputs = [];
  export let vuInputLevels = {};
  
  let isFolded = false;
  let throttleTimers = new Map();

  function toggleFold() {
    isFolded = !isFolded;
  }

  function handleVolumeChange(input, event) {
    const newVolume = event.target.value;
    inputs.update(currentInputs => 
      currentInputs.map(i => i.id === input.id ? { ...i, volume: newVolume } : i)
    );
    
    if (throttleTimers.has(input.id)) {
      return;
    }

    sendCommand(`FUNCTION SetVolume Input=${input.key}&Value=${newVolume}`);

    const timerId = setTimeout(() => {
      throttleTimers.delete(input.id);
    }, 50);

    throttleTimers.set(input.id, timerId);
  }
</script>

<div class="mixer-container">
  <button class="section-header" on:click={toggleFold} aria-expanded={!isFolded}>
    <span>Inputs</span>
    <svg class="chevron" class:folded={isFolded} viewBox="0 0 16 16">
      <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
    </svg>
  </button>

  {#if !isFolded}
    <div class="collapsible-content">
      {#each audioInputs as input (input.id)}
        {@const vu = vuInputLevels[input.key]}

        <div class="mixer-row">
          <button 
            class="mute-btn" 
            class:muted={input.muted} 
            title="Toggle Mute"
            on:click={() => sendCommand(`FUNCTION Audio Input=${input.key}`)}
          >
            {#if input.muted}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 4.06c0-1.336-1.306-2.32-2.434-1.636L3.216 9H1.5A1.5 1.5 0 0 0 0 10.5v3A1.5 1.5 0 0 0 1.5 15H3.22l7.849 5.86a1.5 1.5 0 0 0 2.434-.937A1.5 1.5 0 0 0 13.5 19.5v-15a1.5 1.5 0 0 0 0-.44Z"/><path d="M19.5 12c0 .414.336.75.75.75h.001a.75.75 0 0 0 0-1.5h-.001a.75.75 0 0 0-.75.75Zm-2.25.75a.75.75 0 0 1-.75-.75c0-.414.336-.75.75-.75h.001a.75.75 0 0 1 0 1.5h-.001ZM15 12.75a.75.75 0 0 0 0-1.5h-.001a.75.75 0 0 0 0 1.5h.001Z"/></svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 4.06c0-1.336-1.306-2.32-2.434-1.636L3.216 9H1.5A1.5 1.5 0 0 0 0 10.5v3A1.5 1.5 0 0 0 1.5 15H3.22l7.849 5.86a1.5 1.5 0 0 0 2.434-.937A1.5 1.5 0 0 0 13.5 19.5v-15a1.5 1.5 0 0 0 0-.44ZM17 7.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0V8.25A.75.75 0 0 1 17 7.5ZM20.5 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Z"/></svg>
            {/if}
          </button>

          <div class="slider-details">
            <span class="input-name">{input.shortTitle}</span>
            <MixerSlider 
              {vu}
              volume={input.volume}
              isMuted={input.muted}
              on:input={(e) => handleVolumeChange(input, e)}
            />
          </div>
          <div class="fader-value">{Math.round(input.volume)}</div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .mixer-container {
    border: 1px solid #4a4a4e;
    background-color: #1f1f23;
    border-radius: 6px;
  }
  .collapsible-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 15px;
    padding-top: 5px;
  }
  .mixer-row {
    display: grid;
    grid-template-columns: 32px 1fr 30px;
    align-items: center;
    gap: 10px;
  }
  .mute-btn {
    height: 32px;
    width: 32px;
    background: #3f3f46;
    border: 1px solid #555;
    color: #ccc;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mute-btn:hover { background-color: #555; }
  .mute-btn.muted { background-color: #c53030; color: white; }
  .mute-btn svg { width: 20px; height: 20px; }
  .slider-details { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; }
  .input-name { font-size: 0.8em; color: #aaa; margin-bottom: 2px; }
  .fader-value { font-weight: bold; color: var(--color-neon-teal, #14ffec); text-align: right; font-family: 'Courier New', Courier, monospace; }

  /* Styles for collapsible header */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 10px 15px;
    font-weight: bold;
    color: #ccc;
    background-color: transparent;
    border: none;
    cursor: pointer;
    font-size: 1.1em;
  }
  .chevron {
    width: 12px;
    height: 12px;
    fill: currentColor;
    transition: transform 0.2s ease-in-out;
  }
  .chevron.folded {
    transform: rotate(-90deg);
  }
</style>