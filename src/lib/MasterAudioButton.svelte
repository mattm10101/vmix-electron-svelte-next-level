<script>
  import { sendCommand } from './vmix.js'
  import { isMasterAudioMuted } from './stores.js'
</script>

<button
  class="audio-button"
  class:blinking={$isMasterAudioMuted}
  on:click={() => sendCommand('FUNCTION MasterAudio')}
>
  Master Audio
</button>

<style>
  @keyframes blink-animation {
    0% {
      background-color: #c53030;
    }
    50% {
      background-color: #5d1b1b;
    }
    100% {
      background-color: #c53030;
    }
  }

  .audio-button {
    width: 100%;
    height: 100%;
    padding: 10px 15px;
    border-radius: 5px;
    border: 1px solid #555;
    background-color: #3f3f46;
    color: #eee;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .audio-button:hover {
    border-color: #aaa;
  }

  .blinking {
    border-color: #f56565;
    color: white;
    animation: blink-animation 1.5s infinite;
  }
</style>
