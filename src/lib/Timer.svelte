<script>
  import { derived, get } from 'svelte/store';
  import { inputs, inputMappings, vuLevels } from './stores.js';
  import { sendCommand } from './vmix.js';

  let setTimeValue = '00:10:00';

  // --- UPDATED: Reordered array for vertical alignment ---
  const adjustSeconds = [-1, -2, -5, -10, 1, 2, 5, 10];

  const targetInputName = derived(inputMappings, ($mappings) => $mappings.timer1);
  
  const timerInput = derived(
    [inputs, targetInputName],
    ([$inputs, $targetInputName]) => {
      if (!$targetInputName) return null;
      return $inputs.find((i) => i.shortTitle === $targetInputName);
    }
  );

  $: realtimeData = $timerInput ? $vuLevels.inputs[$timerInput.key] : null;
  $: timeDisplay = realtimeData?.timerText || '00:00:00';

  function handlePlay() {
    if (!$timerInput) return;
    sendCommand(`FUNCTION StartCountdown Input=${$timerInput.key}`);
  }

  function handlePause() {
    if (!$timerInput) return;
    sendCommand(`FUNCTION PauseCountdown Input=${$timerInput.key}`);
  }

  function handleZero() {
    if (!$timerInput) return;
    sendCommand(`FUNCTION StopCountdown Input=${$timerInput.key}`);
  }

  function handleSetTime() {
    if (!$timerInput) return;
    sendCommand(`FUNCTION SetCountdown Input=${$timerInput.key}&Value=${setTimeValue}`);
  }

  function handleAdjustSeconds(seconds) {
    if (!$timerInput) return;
    sendCommand(`FUNCTION AdjustCountdown Input=${$timerInput.key}&Value=${seconds}`);
  }
</script>

<div class="timer-container">
  {#if $timerInput}
    <div class="time-setter">
      <input 
        id="set-time-input" 
        type="text" 
        bind:value={setTimeValue}
        maxlength="8"
        placeholder="hh:mm:ss"
      />
      <button class="set-btn" on:click={handleSetTime}>Set</button>
    </div>

    <div class="adjust-grid">
      {#each adjustSeconds as seconds}
        <button class="grid-btn" class:adjust-plus={seconds > 0} class:adjust-minus={seconds < 0} on:click={() => handleAdjustSeconds(seconds)}>
          {seconds > 0 ? `+${seconds}` : seconds}s
        </button>
      {/each}
    </div>

    <div class="display">
      {timeDisplay}
    </div>

    <div class="controls">
      <button class="control-btn pause-btn" on:click={handlePause} title="Pause">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
      </button>
      <button class="control-btn play-btn" on:click={handlePlay} title="Play">▶</button>
      <button class="control-btn zero-btn" on:click={handleZero} title="Stop and Zero Timer">
        0
      </button>
    </div>

  {:else}
    <div class="placeholder">
      Timer input "{get(targetInputName)}" not found.
    </div>
  {/if}
</div>

<style>
  .timer-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    padding: 15px;
    box-sizing: border-box;
    overflow-y: auto;
  }
  .display {
    font-family: 'Courier New', Courier, monospace;
    font-size: 1.8em;
    color: white;
    font-weight: bold;
    background-color: #1a1a1a;
    padding: 5px 15px;
    border-radius: 5px;
    border: 1px solid #4a4a4e;
    width: 100%;
    text-align: center;
    flex-shrink: 0;
  }
  .controls {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    width: 100%;
    flex-shrink: 0;
  }
  .control-btn {
    height: 40px;
    background: #2d2d2d;
    border: 1px solid #555;
    color: #ccc;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1.5em;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .play-btn:hover { background-color: #16a34a; color: white; }
  .pause-btn:hover { background-color: #f39c12; color: white; }
  .zero-btn:hover { background-color: #c53030; color: white; }
  
  .pause-btn svg { width: 18px; height: 18px; }
  .zero-btn { font-size: 1.1em; font-weight: bold; }
  
  .time-setter { width: 100%; display: flex; gap: 8px; flex-shrink: 0; }
  .time-setter input { flex-grow: 1; background: #1f1f23; border: 1px solid #555; color: #eee; border-radius: 3px; padding: 6px 8px; font-family: 'Courier New', Courier, monospace; font-size: 1em; text-align: center; }
  .time-setter input:focus { outline: none; border-color: var(--color-accent, #14ffec); }
  .set-btn { background: #3f3f46; border: 1px solid #555; color: #eee; font-weight: bold; border-radius: 3px; padding: 0 15px; cursor: pointer; transition: all 0.2s; }
  .set-btn:hover { background: #00d0ff; color: #1f1f23; }
  
  .adjust-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    width: 100%;
    flex-shrink: 0;
  }
  .grid-btn {
    height: 35px;
    background: #2d2d2d;
    border: 1px solid #555;
    color: #ccc;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-weight: bold;
    font-size: 0.8em;
  }
  .grid-btn:hover {
    background-color: #4a4a4e;
  }
  .adjust-plus:hover {
    background-color: #16a34a; /* Green */
    color: white;
  }
  .adjust-minus:hover {
    background-color: #c53030; /* Red */
    color: white;
  }

  .placeholder {
    color: #888;
    text-align: center;
    padding: 10px;
    margin: auto;
  }
</style>