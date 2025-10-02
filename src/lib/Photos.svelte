<script>
  import { derived, get } from 'svelte/store'
  import { inputs, playingInputs } from './stores.js'
  import { sendCommand } from './vmix.js'

  const PHOTOS_PREFIX = 'PHOTOS - '

  let duration = 5
  let transition = 0

  const transitions = [
    { name: 'Fade', value: 0 },
    { name: 'Wipe', value: 1 },
    { name: 'Slide', value: 2 },
    { name: 'Fly', value: 3 },
    { name: 'CubeZoom', value: 4 },
    { name: 'FlyRotate', value: 5 },
    { name: 'Cube', value: 6 },
    { name: 'Zoom', value: 7 },
  ]

  const photosInput = derived(inputs, ($inputs) =>
    $inputs.find((i) => i.title.startsWith(PHOTOS_PREFIX))
  )

  const isPlaying = derived(
    [photosInput, playingInputs],
    ([$photosInput, $playingInputs]) => {
      if (!$photosInput) return false
      return $playingInputs.has($photosInput.id)
    }
  )

  function setDuration() {
    const input = get(photosInput)
    if (input) {
      const durationMs = Math.max(1, duration) * 1000
      // FIXED: Using the input's title as the identifier.
      sendCommand(
        `FUNCTION SetInput Input=${encodeURIComponent(input.title)}&Image.Duration=${durationMs}`
      )
    }
  }

  function setTransition() {
    const input = get(photosInput)
    if (input) {
      // FIXED: Using the input's title as the identifier.
      sendCommand(
        `FUNCTION SetInput Input=${encodeURIComponent(input.title)}&Image.Transition=${transition}`
      )
    }
  }

  function handleTransport(command) {
    const input = get(photosInput)
    if (input) {
      sendCommand(`FUNCTION ${command} Input=${input.key}`)
    }
  }
</script>

<div class="photos-container">
  {#if $photosInput}
    <div class="settings-row">
      <div class="setting-item">
        <label for="duration">Duration (s)</label>
        <input
          type="number"
          id="duration"
          min="1"
          bind:value={duration}
          on:change={setDuration}
        />
      </div>
      <div class="setting-item">
        <label for="transition">Transition</label>
        <select
          id="transition"
          bind:value={transition}
          on:change={setTransition}
        >
          {#each transitions as t}
            <option value={t.value}>{t.name}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="button-row">
      <button
        class="control-btn"
        on:click={() => handleTransport('Restart')}
        title="Restart"
        aria-label="Restart">⟲</button
      >
      <button
        class="control-btn"
        on:click={() => handleTransport('PreviousItem')}
        title="Previous">«</button
      >
      <button
        class="control-btn play-btn"
        class:playing={$isPlaying}
        on:click={() => handleTransport('PlayPause')}
        title="Play/Pause"
        aria-label="Play/Pause"
      >
        {#if $isPlaying}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        {:else}
          ▶
        {/if}
      </button>
      <button
        class="control-btn"
        on:click={() => handleTransport('NextItem')}
        title="Next">»</button
      >
    </div>
  {:else}
    <div class="placeholder">No input named "PHOTOS - ..." found.</div>
  {/if}
</div>

<style>
  .photos-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 15px;
  }
  .settings-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .setting-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .setting-item label {
    font-size: 0.8em;
    font-weight: bold;
    color: #999;
  }
  .setting-item input,
  .setting-item select {
    width: 100%;
    background: #1f1f23;
    border: 1px solid #555;
    color: #eee;
    border-radius: 5px;
    padding: 8px;
    font-family: inherit;
    font-size: 1em;
  }
  .setting-item input:focus,
  .setting-item select:focus {
    outline: none;
    border-color: #14ffec;
  }
  .button-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .control-btn {
    height: 45px;
    background: #3f3f46;
    border: 1px solid #555;
    color: #ccc;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1.5em;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
  }
  .control-btn:hover {
    background-color: #555;
  }
  .play-btn.playing {
    background-color: #16a34a;
    color: white;
    border-color: #22c55e;
    box-shadow:
      0 0 8px #22c55e,
      0 0 15px #16a34a;
  }
  .control-btn svg {
    width: 24px;
    height: 24px;
  }
  .placeholder {
    color: #888;
    text-align: center;
    margin: auto 0;
  }
</style>
