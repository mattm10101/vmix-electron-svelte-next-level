<script>
  import { createEventDispatcher } from 'svelte';

  export let listInput = null;
  export let isPlaying = false;
  export let listType = 'media';
  export let uiCuedIndex = -1;
  
  // This prop allows the parent to pass down a class for layout control
  export let className = '';

  const dispatch = createEventDispatcher();

  $: trackList = listInput?.list || [];
  $: vmixSelectedIndex = listInput?.selectedIndex ? listInput.selectedIndex - 1 : -1;

  function handleClick(trackIndex) {
    dispatch('trackClick', trackIndex);
  }

  function handleDoubleClick(trackIndex) {
    dispatch('trackDblClick', trackIndex);
  }
</script>

<div class="track-list {className}" role="list">
  {#if trackList.length > 0}
    {#each trackList as track, i (track.id)}
      {@const isVmixSelected = vmixSelectedIndex === i}
      {@const isActivelyPlaying = isVmixSelected && isPlaying}
      {@const isPausedSelected = isVmixSelected && !isPlaying}
      {@const isUiCued = uiCuedIndex === i}
      <button
        class="track-item"
        class:playing={isActivelyPlaying}
        class:paused={isPausedSelected}
        class:cued={isUiCued && !isVmixSelected}
        on:click={() => handleClick(i)}
        on:dblclick={() => handleDoubleClick(i)}
        title={track.name}
      >
        <span class="track-index">{i + 1}</span>
        <span class="track-name">{track.name}</span>
        {#if isActivelyPlaying}
          <span class="play-indicator">{listType === 'music' ? '♪' : '▶'}</span>
        {/if}
      </button>
    {/each}
  {:else}
     <div class="placeholder">Track list is empty.</div>
  {/if}
</div>

<style>
  /* This is now the style for the root, scrolling element */
  .track-list {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 5px;
    border-radius: 5px;
    background: #1f1f23;
    padding: 5px;
    height: 100%; /* Fill its parent */
  }

  .track-item { display: flex; align-items: center; gap: 10px; text-align: left; width: 100%; padding: 8px 10px; border-radius: 3px; background: #2a2a2e; border: 2px solid transparent; color: #ccc; transition: all 0.2s; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
  .track-item:hover { background: #3f3f46; }
  .track-item.cued { border-color: #00d0ff; }
  .track-item.paused { background-color: #2b6cb0; color: white; font-weight: bold; border-color: #3182ce; }
  .track-item.playing { background-color: #2f855a; color: white; font-weight: bold; border-color: #38a169; }
  .track-index { color: #888; font-size: 0.8em; }
  .playing .track-index, .paused .track-index { color: white; }
  .play-indicator { margin-left: auto; font-size: 1.2em; color: white; }
  .placeholder { color: #888; text-align: center; margin: auto; }
</style>