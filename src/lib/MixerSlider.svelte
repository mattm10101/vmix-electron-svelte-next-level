<script>
  export let level = 0; // VU level, 0-100 (will be used in next step)
  export let volume = 100; // Slider position, 0-100
  export let isProgram = false;

  $: meterWidth = Math.min(level, volume);

  $: meterGradient = isProgram
    ? 'linear-gradient(to right, #39FF14, #b2ffad)' // Pure Neon Green
    : 'linear-gradient(to right, #00d0ff, #a7eeff)'; // Theme blue
</script>

<div class="slider-wrapper">
  <div
    class="vu-meter-bar"
    style="width: {meterWidth}%; background: {meterGradient};"
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
  }

  .vu-meter-bar {
    position: absolute;
    left: 0;
    height: 8px;
    border-radius: 5px;
    transition: width 0.05s linear;
    box-shadow: 0 0 6px 2px rgba(0, 208, 255, 0.75);
  }

  :global(.program-slider) .vu-meter-bar {
    box-shadow: 0 0 6px 2px rgba(57, 255, 20, 0.75);
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