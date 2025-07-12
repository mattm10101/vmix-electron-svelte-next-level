<script>
  import { inputs, playingInputs } from './stores'
  import { sendCommand } from './vmix'

  const MUSIC_INPUT_NAME = 'LIST - MUSIC'

  // Reactive variables that will update automatically
  let selectedTrackName = 'None'
  $: musicInput = $inputs.find((i) => i.shortTitle === MUSIC_INPUT_NAME)
  $: isPlaying = musicInput && $playingInputs.has(musicInput.id)
  $: isMuted = musicInput?.muted === 'True'

  // This reactive block finds the selected track's name whenever the input data changes
  $: if (musicInput && musicInput.list?.item) {
    const selectedItem = musicInput.list.item.find((item) => item.selected)
    selectedTrackName = selectedItem ? selectedItem.name : 'None'
  }

  function handleCommand(func) {
    if (!musicInput) return
    const encodedName = encodeURIComponent(musicInput.shortTitle)
    sendCommand(`${func}&Input=${encodedName}`)
  }
</script>

<div class="music-container">
  {#if musicInput}
    <div
      class="now-playing-container"
      title={isPlaying ? selectedTrackName : ''}
    >
      <div class="now-playing-text-wrapper">
        <span
          class="now-playing-text"
          class:scrolling={isPlaying && selectedTrackName.length > 25}
          data-text={isPlaying ? selectedTrackName : ''}
        >
          {isPlaying ? selectedTrackName : 'Paused'}
        </span>
      </div>
    </div>

    <div class="selected-track-container" title={selectedTrackName}>
      <span class="label">Selected:</span>
      <span class="track-name">{selectedTrackName}</span>
    </div>

    <div class="button-row">
      <button
        class="control-btn"
        on:click={() => handleCommand('Restart')}
        title="Restart"
        aria-label="Restart">⟲</button
      >
      <button
        class="control-btn"
        on:click={() => handleCommand('PreviousItem')}
        title="Previous"
        aria-label="Previous Item">«</button
      >
      <button
        class="control-btn play-btn"
        class:playing={isPlaying}
        on:click={() => handleCommand('PlayPause')}
        title="Play/Pause"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {#if isPlaying}⏸{:else}▶{/if}
      </button>
      <button
        class="control-btn"
        on:click={() => handleCommand('NextItem')}
        title="Next"
        aria-label="Next Item">»</button
      >
      <button
        class="control-btn mute-btn"
        class:muted={isMuted}
        on:click={() => handleCommand('AudioBusMute')}
        title="Mute"
        aria-label="Mute Audio"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          ><path
            d="M12 2.75a.75.75 0 0 0-1.5 0v18.5a.75.75 0 0 0 1.5 0V2.75Z"
          /><path
            d="M15.75 6.25a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75v11.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75V6.25Z"
          /><path
            d="M8.25 6.25a.75.75 0 0 0-.75-.75h-.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h.5a.75.75 0 0 0 .75-.75V6.25Z"
          /><path
            d="M19.75 9.25a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75V9.25Z"
          /><path
            d="M4.25 9.25a.75.75 0 0 0-.75-.75h-.5a.75.75 0 0 0-.75.75v5.5c0 .414.336.75.75.75h.5a.75.75 0 0 0 .75-.75V9.25Z"
          /></svg
        >
      </button>
    </div>
  {:else}
    <div class="placeholder">
      Input with shortTitle "LIST - MUSIC" not found.
    </div>
  {/if}
</div>

<style>
  @keyframes scroll-text {
    from {
      transform: translateX(0%);
    }
    to {
      transform: translateX(-50%);
    }
  }
  .music-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start; /* Align items to the top */
    gap: 10px;
  }
  .now-playing-container {
    background-color: #1f1f23;
    border-radius: 5px;
    padding: 5px 0;
    overflow: hidden;
    white-space: nowrap;
    border: 1px solid #4a4a4e;
    text-align: left;
    color: #14ffec;
    font-weight: bold;
    min-height: 28px;
  }
  .now-playing-text-wrapper {
    width: 100%;
    display: inline-block;
  }
  .now-playing-text.scrolling::after {
    content: attr(data-text);
    padding-left: 2em;
  }
  .now-playing-text.scrolling {
    display: inline-block;
    animation: scroll-text 10s linear infinite;
    padding-left: 100%;
  }

  /* New styles for the "Selected" display */
  .selected-track-container {
    text-align: left;
    padding: 2px 8px;
    color: #ccc;
    background: #2a2a2e;
    border-radius: 4px;
    font-size: 0.85em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .selected-track-container .label {
    font-weight: bold;
    color: #888;
    margin-right: 6px;
  }
  .selected-track-container .track-name {
    color: #ddd;
  }

  .button-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-top: auto; /* Pushes the buttons to the bottom */
  }
  .control-btn {
    flex-grow: 1;
    height: 45px;
    background: #3f3f46;
    border: 1px solid #555;
    color: #ccc;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1.5em;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .control-btn:hover {
    background-color: #555;
    border-color: #777;
  }
  .play-btn.playing {
    background-color: #16a34a;
    border-color: #22c55e;
    color: white;
  }
  .mute-btn svg {
    width: 24px;
    height: 24px;
    transition: all 0.2s;
  }
  .mute-btn.muted {
    background-color: #c53030;
    border-color: #f56565;
    color: white;
  }
  .placeholder {
    width: 100%;
    color: #888;
    text-align: center;
    margin: auto 0;
  }
</style>
