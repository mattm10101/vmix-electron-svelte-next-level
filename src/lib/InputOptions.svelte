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
  <hr />
  <button on:click={() => toggle('showL3s')}>
    {$visibilityOptions.showL3s ? 'Hide' : 'Show'} L3s
  </button>
  <button on:click={() => toggle('show1Ups')}>
    {$visibilityOptions.show1Ups ? 'Hide' : 'Show'} 1UPs
  </button>
  <button on:click={() => toggle('show2Ups')}>
    {$visibilityOptions.show2Ups ? 'Hide' : 'Show'} 2UPs
  </button>
  <button on:click={() => toggle('show3Ups')}>
    {$visibilityOptions.show3Ups ? 'Hide' : 'Show'} 3UPs
  </button>
  <button on:click={() => toggle('show4Ups')}>
    {$visibilityOptions.show4Ups ? 'Hide' : 'Show'} 4UPs
  </button>
</div>

<style>
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
