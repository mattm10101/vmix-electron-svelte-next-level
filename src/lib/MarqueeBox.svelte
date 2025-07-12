<script>
  import { marquee } from './stores.js'
</script>

{#if $marquee.visible}
  <div
    class="marquee-box"
    style="left: {$marquee.x}px; top: {$marquee.y}px; width: {$marquee.width}px; height: {$marquee.height}px;"
  ></div>
{/if}

<style>
  .marquee-box {
    position: absolute;
    border: 1px solid #14ffec;
    background-color: rgba(20, 255, 236, 0.1);
    z-index: 9998;
  }
</style>
