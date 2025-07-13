<script>
  import { gridOptions } from './stores.js'
</script>

{#if $gridOptions.show}
  <div
    class="background-grid"
    style="--grid-size: {$gridOptions.snapSize}px;"
  ></div>
{/if}

<style>
  .background-grid {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* Use the --grid-size variable from the style attribute */
    background-size: var(--grid-size) var(--grid-size);
    background-image: radial-gradient(circle, #3a3a3e 1px, transparent 1px);
    z-index: 0;
    opacity: 0.5;
  }
</style>
