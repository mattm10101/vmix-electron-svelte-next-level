<script>
  import { masterVolume } from './stores.js'
  import { sendCommand } from './vmix.js'

  let debounceTimer

  function handleVolumeChange(event) {
    const newVolume = event.target.value
    masterVolume.set(newVolume)

    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      sendCommand(`FUNCTION SetMasterVolume Value=${newVolume}`)
    }, 100)
  }
</script>

<div class="fader-container">
  <input
    type="range"
    min="0"
    max="100"
    class="fader"
    value={$masterVolume}
    on:input={handleVolumeChange}
  />
  <div class="fader-value">{$masterVolume}</div>
</div>

<style>
  .fader-container {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  .fader {
    flex-grow: 1;
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 8px;
    background: #4a4a4e;
    border-radius: 5px;
    outline: none;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  .fader:hover {
    opacity: 1;
  }
  .fader::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #14ffec;
    border-radius: 50%;
    cursor: pointer;
  }
  .fader::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #14ffec;
    border-radius: 50%;
    cursor: pointer;
  }
  .fader-value {
    font-weight: bold;
    color: #14ffec;
    min-width: 30px;
    text-align: right;
  }
</style>
