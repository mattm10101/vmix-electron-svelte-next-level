<script>
  import { inputs, playingInputs } from './stores.js'
  import { sendCommand } from './vmix.js'

  const MUSIC_INPUT_NAME = 'LIST - MUSIC'

  // Reactive state derived from stores
  $: musicInput = $inputs.find((i) => i.shortTitle === MUSIC_INPUT_NAME)
  $: isPlaying = musicInput && $playingInputs.has(musicInput.id)
  $: trackList = musicInput?.list || []
  $: vmixSelectedIndex = musicInput?.selectedIndex
    ? musicInput.selectedIndex - 1
    : -1

  let isRestartFlashing = false
  let isPrevFlashing = false
  let isNextFlashing = false

  /**
   * FINAL LOGIC: A single click on a track now selects it and immediately
   * sends the Play command. This ensures the clicked track always plays.
   */
  function playTrack(trackIndex) {
    const inputName = musicInput.shortTitle
    const itemNumber = trackIndex + 1

    // 1. Tell vMix to select the index.
    sendCommand(`FUNCTION SelectIndex Input=${inputName} Value=${itemNumber}`)

    // 2. After a short delay to ensure SelectIndex is processed, send Play.
    setTimeout(() => {
      sendCommand(`FUNCTION Play Input=${inputName}`)
    }, 50) // 50ms is a safe delay

    // 3. Optimistically update our UI so the selection moves instantly.
    inputs.update((allInputs) => {
      const targetInput = allInputs.find((i) => i.id === musicInput.id)
      if (targetInput) {
        targetInput.selectedIndex = itemNumber
      }
      return allInputs
    })
  }

  // Handles the flash effect for the control buttons
  function handleFlashClick(command) {
    sendCommand(`FUNCTION ${command} Input=${musicInput.shortTitle}`)

    if (command === 'Restart') {
      isRestartFlashing = true
      setTimeout(() => (isRestartFlashing = false), 300)
    } else if (command === 'PreviousItem') {
      isPrevFlashing = true
      setTimeout(() => (isPrevFlashing = false), 300)
    } else if (command === 'NextItem') {
      isNextFlashing = true
      setTimeout(() => (isNextFlashing = false), 300)
    }
  }

  // Find the name of the track that vMix reports as selected.
  $: nowPlayingName = (() => {
    if (!musicInput || !trackList[vmixSelectedIndex]) return 'Paused'
    return trackList[vmixSelectedIndex].name
  })()
</script>

<div class="music-container">
  {#if musicInput}
    <div
      class="now-playing-container"
      title={isPlaying ? nowPlayingName : 'Paused'}
    >
      <div class="now-playing-text-wrapper">
        <span
          class="now-playing-text"
          class:scrolling={isPlaying && nowPlayingName.length > 20}
        >
          {isPlaying ? nowPlayingName : 'Paused'}
        </span>
      </div>
    </div>

    <div class="button-row">
      <button
        class="control-btn"
        class:flashing={isRestartFlashing}
        on:click={() => handleFlashClick('Restart')}
        title="Restart"
        aria-label="Restart">⟲</button
      >
      <button
        class="control-btn"
        class:flashing={isPrevFlashing}
        on:click={() => handleFlashClick('PreviousItem')}
        title="Previous">«</button
      >
      <button
        class="control-btn play-btn"
        class:playing={isPlaying}
        on:click={() =>
          sendCommand(`FUNCTION PlayPause Input=${musicInput.shortTitle}`)}
        title="Play/Pause"
        aria-label="Play/Pause"
        >{#if isPlaying}⏸{:else}▶{/if}</button
      >
      <button
        class="control-btn"
        class:flashing={isNextFlashing}
        on:click={() => handleFlashClick('NextItem')}
        title="Next">»</button
      >
    </div>

    <div class="track-list-container">
      <div class="track-list">
        {#each trackList as track, i (track.id)}
          {@const isSelected = vmixSelectedIndex === i}
          {@const isPlayingTrack = isSelected && isPlaying}
          <button
            class="track-item"
            class:cued={isSelected}
            class:playing={isPlayingTrack}
            on:click={() => playTrack(i)}
            title={track.name}
          >
            <span class="track-index">{i + 1}</span>
            <span class="track-name">{track.name}</span>
            {#if isPlayingTrack}
              <span class="play-indicator">♪</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {:else}
    <div class="placeholder">Input "LIST - MUSIC" not found.</div>
  {/if}
</div>

<style>
  @keyframes scroll-text {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(-100%);
    }
  }
  .music-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .now-playing-container {
    background-color: #1f1f23;
    border-radius: 5px;
    padding: 0 10px;
    overflow: hidden;
    white-space: nowrap;
    border: 1px solid #4a4a4e;
    text-align: center;
    color: #14ffec;
    font-weight: bold;
    height: 80px;
    font-size: 1.5em;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .now-playing-text-wrapper {
    width: 100%;
    overflow: hidden;
  }
  .now-playing-text {
    display: inline-block;
  }
  .now-playing-text.scrolling {
    animation: scroll-text 15s linear infinite;
  }
  .button-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .control-btn {
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
  }
  .control-btn.flashing {
    border-color: #00d0ff;
    box-shadow: 0 0 12px 2px #00d0ff;
  }
  .play-btn.playing {
    background-color: #16a34a;
    color: white;
  }
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
  .track-item.cued {
    border-color: #00d0ff;
  }
  .track-item.playing {
    box-shadow: inset 0 0 0 99px #16a34a;
    color: white;
    font-weight: bold;
  }
  .track-index {
    color: #888;
    font-size: 0.8em;
  }
  .playing .track-index {
    color: white;
  }
  .play-indicator {
    margin-left: auto;
    font-size: 1.2em;
    color: white;
  }
  .placeholder {
    color: #888;
    text-align: center;
    margin: auto 0;
  }
</style>
