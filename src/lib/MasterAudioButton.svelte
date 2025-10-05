<script>
  import { sendCommand } from './vmix.js';
  export let isMuted = false;
</script>

<button 
  class="audio-button" 
  class:muted={isMuted}
  on:click={() => sendCommand('FUNCTION MasterAudio')}
>
  {#if isMuted}
    MUTED
  {:else}
    MUTE
  {/if}
</button>

<style>
  .audio-button {
    width: 100%;
    padding: 10px 15px;
    border-radius: 5px;
    border: 1px solid #555;
    background-color: #3f3f46;
    color: #eee;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.1em; /* Added for style */
  }
  .audio-button:hover {
    border-color: #aaa;
  }

  .muted {
    background-color: #c53030;
    border-color: #f56565;
    color: white;
  }
</style>