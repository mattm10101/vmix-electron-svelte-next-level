<script>
  import { createEventDispatcher } from 'svelte'

  export let id
  export let name
  export let isProgram = false
  export let isPreview = false

  const dispatch = createEventDispatcher()

  $: tallyClass = isProgram ? 'program' : isPreview ? 'preview' : ''
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
    text-align: center;
    word-break: break-word;
    height: 100%;
    border: 2px solid #555;
    border-radius: 6px;
    background-color: #2d2d2d;
    color: #eee;
    cursor: pointer;
    transition: all 0.2s ease-out;
  }

  .input-btn:hover {
    border-color: #14ffec;
    background-color: #3f3f46;
  }

  .program {
    background-color: #f44747; /* Red for Program/Active */
    border-color: #ff8a8a;
    color: white;
  }
  .preview {
    background-color: #34d399; /* Green for Preview */
    border-color: #6ee7b7;
    color: white;
  }

  .input-number {
    font-size: 1.75em;
    font-weight: bold;
    color: #14ffec;
  }

  .program .input-number,
  .preview .input-number {
    color: white;
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
