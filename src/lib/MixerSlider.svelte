<script>
  export let vu = { f1: 0, f2: 0 };
  export let volume = 100;
  export let isMuted = false;

  // --- THE FIX: Apply a logarithmic curve to the linear VU values ---
  $: leftWidth = Math.min(Math.pow(vu?.f1 || 0, 0.25) * 100, 100);
  $: rightWidth = Math.min(Math.pow(vu?.f2 || 0, 0.25) * 100, 100);

  $: meterGradient = isMuted
    ? 'linear-gradient(to right, #007acc, #00d0ff)' // Muted Blue
    : 'linear-gradient(to right, #22c55e, #39FF14)'; // Active Green
    
  $: meterShadow = isMuted
    ? '0 0 6px 2px rgba(0, 208, 255, 0.6)' // Blue glow
    : '0 0 6px 2px rgba(57, 255, 20, 0.6)'; // Green glow
</script>

<div class="slider-wrapper">
  <div
    class="vu-meter-bar left-channel"
    style="width: {leftWidth}%; background: {meterGradient}; box-shadow: {meterShadow};"
  ></div>
  <div
    class="vu-meter-bar right-channel"
    style="width: {rightWidth}%; background: {meterGradient}; box-shadow: {meterShadow};"
  ></div>

  <input
    type="range"
    min="0"
    max="100"
    class="fader"
    bind:value={volume}
    on:input 
  />
</div>

<style>
  .slider-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    flex-grow: 1;
    height: 8px;
  }

  .vu-meter-bar {
    position: absolute;
    left: 0;
    transition: width 0.05s linear;
  }

  .left-channel {
    top: 0;
    height: 3px;
    border-radius: 3px;
  }
  .right-channel {
    bottom: 0;
    height: 3px;
    border-radius: 3px;
  }

  .fader {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 8px;
    background: transparent;
    outline: none;
    position: relative;
    z-index: 2;
    cursor: pointer;
  }

  .fader::-webkit-slider-runnable-track {
    width: 100%;
    height: 8px;
    background: rgba(16, 16, 20, 0.7);
    border-radius: 5px;
    border: 1px solid #4a4a4e;
  }

  .fader::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    background: #e5e7eb;
    border-radius: 50%;
    cursor: pointer;
    margin-top: -8px;
    border: 2px solid #1f1f23;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
  }

  .fader::-moz-range-track {
    width: 100%;
    height: 8px;
    background: rgba(16, 16, 20, 0.7);
    border-radius: 5px;
    border: 1px solid #4a4a4e;
  }

  .fader::-moz-range-thumb {
    width: 22px;
    height: 22px;
    background: #e5e7eb;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid #1f1f23;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
  }
</style>