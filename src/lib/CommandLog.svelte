<script>
  import { afterUpdate } from 'svelte'

  export let messages = []
  let logContainer

  afterUpdate(() => {
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight
    }
  })

  const colorMap = {
    sent: '#569cd6',
    received: '#4ec9b0',
    info: '#ce9178',
    error: '#f44747',
  }
</script>

<div class="log-container" bind:this={logContainer}>
  {#each messages as { id, timestamp, message, type } (id)}
    <div class="log-entry">
      <span class="timestamp">[{timestamp}]</span>
      <span class="message" style="color: {colorMap[type] || 'white'}">
        {message}
      </span>
    </div>
  {/each}
</div>

<style>
  .log-container {
    height: 100%;
    overflow-y: auto;
    font-family: 'Courier New', Courier, monospace;
    background-color: #1a1a1a;
    border-radius: 3px;
    padding: 10px;
  }
  .timestamp {
    color: #6a6a6a;
    margin-right: 8px;
  }
</style>
