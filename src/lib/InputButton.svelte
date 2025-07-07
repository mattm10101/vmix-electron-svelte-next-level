<script>
  import { createEventDispatcher } from 'svelte'

  export let id
  export let name
  export let tally

  const dispatch = createEventDispatcher()

  $: tallyClass = tally === 1 ? 'program' : tally === 2 ? 'preview' : ''
</script>

<button
  class="input-btn {tallyClass}"
  on:click={() => dispatch('command', `FUNCTION PreviewInput Input=${id}`)}
>
  <span class="input-number">{id}</span>
  <span class="input-name">{name}</span>
</button>

<style>
  .input-btn {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 5px;
    line-height: 1.2;
    word-break: break-word;
    height: 100%;
    min-height: 80px;
    border: 2px solid #555;
    background-color: #2d2d2d;
    color: var(--text-color);
    transition: all 0.2s ease-out;
  }

  /* All hover effects have been removed. */

  .program {
    background-color: #28a745;
    border-color: #57ff7d;
  }
  .preview {
    background-color: #fd7e14;
    border-color: #ffaa60;
  }

  .input-number {
    font-size: 2em;
    font-weight: bold;
  }
  .input-name {
    font-size: 0.8em;
    margin-top: 5px;
    color: #ccc;
  }
  .program .input-name,
  .preview .input-name {
    color: white;
  }
</style>
