<script>
  import { createEventDispatcher } from 'svelte';

  export let listInput = null;
  export let isPlaying = false;
  export let listType = 'media';
  
  /** The new prop to track the item the user has cued in the UI */
  export let cuedIndex = -1;

  const dispatch = createEventDispatcher();

  $: trackList = listInput?.list || [];
  $: vmixSelectedIndex = listInput?.selectedIndex ? listInput.selectedIndex - 1 : -1;

  function selectTrack(trackIndex) {
    dispatch('trackClick', trackIndex);
  }
</script>

<div class="track-list-container">
  <div class="track-list">
    {#if trackList.length > 0}
      {#each trackList as track, i (track.id)}
        {@const isVmixSelected = vmixSelectedIndex === i}
        {@const isPlayingTrack = isVmixSelected && isPlaying}
        {@const isCued = cuedIndex === i}
        <button
          class="track-item"
          class:playing={isPlayingTrack}
          class:cued={isCued && !isPlayingTrack}
          on:click={() => selectTrack(i)}
          title={track.name}
        >
          <span class="track-index">{i + 1}</span>
          <span class="track-name">{track.name}</span>
          {#if isPlayingTrack}
            <span class="play-indicator">{listType === 'music' ? '♪' : '▶'}</span>
          {/if}
        </button>
      {/each}
    {:else}
       <div class="placeholder">Track list is empty.</div>
    {/if}
  </div>
</div>

<style>
  .track-list-container {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-height: 0;
  }
  .track-list {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 5px;
    border-radius: 5px;
    background: #1f1f23;
    padding: 5px;
    flex-grow: 1;
  }
  .track-item {
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
    width: 100%;
    padding: 8px 10px;
    border-radius: 3px;
    background: #2a2a2e;
    /* The border is now 2px and transparent by default */
    border: 2px solid transparent;
    color: #ccc;
    transition: all 0.2s;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .track-item:hover {
    background: #3f3f46;
  }
  /* NEW: Style for the cued item (border highlight) */
  .track-item.cued {
    border-color: #00d0ff;
  }
  /* Style for the playing item (background highlight) */
  .track-item.playing {
    box-shadow: inset 0 0 0 99px #16a34a;
    color: white;
    font-weight: bold;
    border-color: #16a34a; /* Match border to background */
  }
  .track-index { color: #888; font-size: 0.8em; }
  .playing .track-index { color: white; }
  .play-indicator { margin-left: auto; font-size: 1.2em; color: white; }
  .placeholder { color: #888; text-align: center; margin: auto 0; }
</style>