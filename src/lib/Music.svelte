<script>
  import { onMount } from 'svelte'
  import { inputs, playingInputs } from './stores.js'
  import { sendCommand, queryVmixXpath } from './vmix.js'

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
  let nowPlayingName = 'Paused'

  async function updateNowPlayingDisplay() {
    if (!musicInput) return
    const indexXpath = `vmix/inputs/input[@shortTitle='${MUSIC_INPUT_NAME}']/@selectedIndex`
    const selectedIndexResult = await queryVmixXpath(indexXpath)
    if (selectedIndexResult === null) return

    const currentSelectedIndex = parseInt(selectedIndexResult, 10)

    const titleXpath = `vmix/inputs/input[@shortTitle='${MUSIC_INPUT_NAME}']/list/item[${currentSelectedIndex}]`
    const titleResult = await queryVmixXpath(titleXpath)

    if (titleResult !== null) {
      nowPlayingName = $playingInputs.has(musicInput.id)
        ? titleResult
        : 'Paused'
    }
  }

  // NEW: Exposing the refresh function so the parent component can call it.
  export function refresh() {
    updateNowPlayingDisplay()
  }

  onMount(() => {
    setTimeout(updateNowPlayingDisplay, 500)
  })

  function selectTrack(trackIndex) {
    const inputName = musicInput.shortTitle
    const itemNumber = trackIndex + 1
    sendCommand(`FUNCTION SelectIndex Input=${inputName}&Value=${itemNumber}`)

    inputs.update((allInputs) => {
      const targetInput = allInputs.find((i) => i.id === musicInput.id)
      if (targetInput) {
        targetInput.selectedIndex = itemNumber
      }
      return allInputs
    })
  }

  async function handleFlashClick(command) {
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

    await new Promise((resolve) => setTimeout(resolve, 50))
    await refreshSelectedIndex()
  }

  // This function is now only used by handleFlashClick
  async function refreshSelectedIndex() {
    if (!musicInput) return
    const xpath = `vmix/inputs/input[@shortTitle='${MUSIC_INPUT_NAME}']/@selectedIndex`
    const newIndex = await queryVmixXpath(xpath)

    if (newIndex !== null) {
      inputs.update((allInputs) => {
        const targetInput = allInputs.find((i) => i.id === musicInput.id)
        if (targetInput) {
          targetInput.selectedIndex = parseInt(newIndex, 10)
        }
        return allInputs
      })
    }
  }
</script>

<div class="music-container">
  {#if musicInput}
    <div class="now-playing-container" title={nowPlayingName}>
      <span class="now-playing-text">{nowPlayingName}</span>
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
      <button
        class="control-btn mute-btn"
        class:muted={musicInput.muted}
        on:click={() =>
          sendCommand(`FUNCTION Audio Input=${musicInput.shortTitle}`)}
        title="Toggle Mute"
        aria-label="Toggle Mute"
      >
        {#if musicInput.muted}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M13.5 4.06c0-1.336-1.306-2.32-2.434-1.636L3.216 9H1.5A1.5 1.5 0 0 0 0 10.5v3A1.5 1.5 0 0 0 1.5 15H3.22l7.849 5.86a1.5 1.5 0 0 0 2.434-.937A1.5 1.5 0 0 0 13.5 19.5v-15a1.5 1.5 0 0 0 0-.44Z"
            />
            <path
              d="M19.5 12c0 .414.336.75.75.75h.001a.75.75 0 0 0 0-1.5h-.001a.75.75 0 0 0-.75.75Zm-2.25.75a.75.75 0 0 1-.75-.75c0-.414.336-.75.75-.75h.001a.75.75 0 0 1 0 1.5h-.001ZM15 12.75a.75.75 0 0 0 0-1.5h-.001a.75.75 0 0 0 0 1.5h.001Z"
            />
          </svg>
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M13.5 4.06c0-1.336-1.306-2.32-2.434-1.636L3.216 9H1.5A1.5 1.5 0 0 0 0 10.5v3A1.5 1.5 0 0 0 1.5 15H3.22l7.849 5.86a1.5 1.5 0 0 0 2.434-.937A1.5 1.5 0 0 0 13.5 19.5v-15a1.5 1.5 0 0 0 0-.44ZM17 7.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0V8.25A.75.75 0 0 1 17 7.5ZM20.5 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Z"
            />
          </svg>
        {/if}
      </button>
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
            on:click={() => selectTrack(i)}
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
    text-overflow: ellipsis;
    border: 1px solid #4a4a4e;
    text-align: center;
    color: #14ffec;
    font-weight: bold;
    height: 300px;
    font-size: 1.5em;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .now-playing-text {
    display: inline-block;
  }
  .button-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
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
    padding: 5px;
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
  .mute-btn svg {
    width: 28px;
    height: 28px;
  }
  .mute-btn.muted {
    background-color: #c53030;
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
