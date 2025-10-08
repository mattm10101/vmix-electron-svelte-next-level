<script>
  import { masterVolume } from './stores.js';
  import { sendCommand } from './vmix.js';
  import MixerSlider from './MixerSlider.svelte';
  import MasterAudioButton from './MasterAudioButton.svelte';

  export let isMuted = false;
  export let volume = 85;
  export let level = 0;

  let isFolded = false;
  let debounceTimer;

  function toggleFold() {
    isFolded = !isFolded;
  }

  $: if (volume || volume === 0) {
    handleVolumeChange(volume);
  }

  function handleVolumeChange(newVolume) {
    masterVolume.set(newVolume);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      sendCommand(`FUNCTION SetMasterVolume Value=${newVolume}`);
    }, 100);
  }
</script>

<div class="master-section-container">
  <button
    class="section-header"
    class:flashing={isMuted && isFolded}
    on:click={toggleFold}
    aria-expanded={!isFolded}
  >
    <span>Master Audio</span>
    <svg class="chevron" class:folded={isFolded} viewBox="0 0 16 16">
      <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
    </svg>
  </button>

  {#if !isFolded}
    <div class="collapsible-content">
      <MasterAudioButton {isMuted} />

      <div class="master-slider-wrapper">
        <MixerSlider {level} bind:volume={volume} />
        <div class="fader-value">{Math.round(volume)}</div>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes red-flash {
    0%, 100% { background-color: #c53030; box-shadow: 0 0 8px #ef4444; }
    50% { background-color: #5d1b1b; box-shadow: none; }
  }
  .master-section-container {
    border: 1px solid #4a4a4e;
    background-color: #1f1f23;
    border-radius: 6px;
  }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 10px 15px;
    font-weight: bold;
    color: var(--color-accent, #14ffec);
    background-color: transparent;
    border: none;
    cursor: pointer;
    font-size: 1.1em;
  }
  .section-header.flashing {
    color: white;
    animation: red-flash 1.5s infinite;
    border-radius: 5px;
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
  .collapsible-content {
    padding: 15px;
    padding-top: 5px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  .master-slider-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .fader-value {
    font-weight: bold;
    color: var(--color-neon-teal, #14ffec);
    min-width: 30px;
    text-align: right;
    font-family: 'Courier New', Courier, monospace;
  }
</style>