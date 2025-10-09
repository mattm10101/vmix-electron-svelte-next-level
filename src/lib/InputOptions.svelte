<script>
  import { visibilityOptions } from './stores.js'

  function toggle(key) {
    visibilityOptions.update((opts) => ({ ...opts, [key]: !opts[key] }))
  }
</script>

<div class="options-container">
  <button on:click={() => toggle('showNumbers')}>
    {$visibilityOptions.showNumbers ? 'Hide' : 'Show'} Numbers
  </button>
  <button on:click={() => toggle('showPreviewLed')}>
    {$visibilityOptions.showPreviewLed ? 'Hide' : 'Show'} Preview LED
  </button>
  <button on:click={() => toggle('autoFitInputText')}>
    {$visibilityOptions.autoFitInputText ? 'Disable' : 'Enable'} Auto-fit Text
  </button>
  <hr />
  <button on:click={() => toggle('showL3s')}>
    {$visibilityOptions.showL3s ? 'Hide' : 'Show'} L3s
  </button>
  </div>

<style>
  /* Styles are unchanged */
  .options-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  hr {
    border-color: #3c3c3c;
    width: 100%;
    margin: 0;
  }
  button {
    width: 100%;
    padding: 10px 15px;
    border-radius: 5px;
    border: 1px solid #555;
    background-color: #2d2d2d;
    color: #eee;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  button:hover {
    background-color: #3f3f46;
  }
</style>