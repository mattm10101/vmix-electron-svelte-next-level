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
  @keyframes red-flash {
    0%, 100% { background-color: #c53030; border-color: #f56565; box-shadow: 0 0 8px #ef4444; }
    50% { background-color: #5d1b1b; border-color: #c53030; box-shadow: none; }
  }

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
    letter-spacing: 0.1em;
  }
  .audio-button:hover {
    border-color: #aaa;
  }

  .muted {
    color: white;
    animation: red-flash 1.5s infinite;
  }
</style>