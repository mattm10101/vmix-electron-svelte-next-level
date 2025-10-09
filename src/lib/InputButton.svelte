<script>
  import { visibilityOptions } from './stores.js';

  export let id
  export let name
  export let number
  export let isProgram = false
  export let isPreview = false
  export let onCommand = (detail) => {}

  $: tallyClass = isProgram ? 'program' : isPreview ? 'preview' : '';

  // --- NEW: Logic for auto-fitting text ---
  // We define thresholds for what we consider a "long" title
  const LONG_TEXT_THRESHOLD = 20;
  const VERY_LONG_TEXT_THRESHOLD = 35;

  // These reactive variables will apply classes only if the setting is enabled
  $: isLong = $visibilityOptions.autoFitInputText && name.length > LONG_TEXT_THRESHOLD;
  $: isVeryLong = $visibilityOptions.autoFitInputText && name.length > VERY_LONG_TEXT_THRESHOLD;
</script>

<button
  class="input-btn {tallyClass}"
  on:click={() => onCommand(`FUNCTION PreviewInput Input=${id}`)}
>
  <span class="input-number">{number}</span>
  <span 
    class="input-name"
    class:long={isLong}
    class:very-long={isVeryLong}
  >{name}</span>
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
  
  .input-btn:not(.program):not(.preview):hover {
    border-color: #14ffec;
    background-color: #3f3f46;
  }

  .program {
    background-color: #27ae60;
    border-color: #229954;
    color: white;
  }
  
  .preview {
    background-color: #f39c12;
    border-color: #d35400;
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
    font-size: 1.0em;
    margin-top: 5px;
    color: #ccc;
    transition: font-size 0.2s ease-out; /* Smoothly shrink text */
  }
  .program .input-name,
  .preview .input-name {
    color: white;
  }

  /* --- NEW: CSS classes to shrink the font size --- */
  .input-name.long {
    font-size: 0.8em;
  }
  .input-name.very-long {
    font-size: 0.65em;
    line-height: 1.1; /* Tighten up line spacing for very long text */
  }
</style>