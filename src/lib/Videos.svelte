<script>
  import { onMount, tick } from 'svelte'
  import { inputs, playingInputs } from './stores.js'
  import { sendCommand, queryVmixXpath } from './vmix.js'

  const VIDEOS_INPUT_NAME = 'LIST - VIDEOS'

  // Reactive state derived from stores
  $: videoInput = $inputs.find((i) => i.shortTitle === VIDEOS_INPUT_NAME)
  $: isPlaying = videoInput && $playingInputs.has(videoInput.id)
  $: isMuted = videoInput?.muted
  $: trackList = videoInput?.list || []
  $: vmixSelectedIndex = videoInput?.selectedIndex
    ? videoInput.selectedIndex - 1
    : -1
  $: nowPlayingName = (() => {
    if (!videoInput || !trackList[vmixSelectedIndex]) return 'Paused'
    return trackList[vmixSelectedIndex].name
  })()

  // --- Animation Logic & State ---
  let isRestartFlashing = false
  let isPrevFlashing = false
  let isNextFlashing = false
  let wrapperElement
  let textElement
  let needsScrolling = false
  let isAnimationPaused = false

  $: {
    if (isPlaying && nowPlayingName) {
      tick().then(() => {
        if (wrapperElement && textElement) {
          const textWidth = textElement.offsetWidth
          const wrapperWidth = wrapperElement.offsetWidth
          needsScrolling = textWidth > wrapperWidth

          if (needsScrolling) {
            const scrollDistance = textWidth - wrapperWidth
            textElement.style.setProperty(
              '--scroll-distance',
              `-${scrollDistance}px`
            )
          }
        }
      })
    } else {
      needsScrolling = false
      isAnimationPaused = false
    }
  }

  function toggleAnimation() {
    if (needsScrolling) {
      isAnimationPaused = !isAnimationPaused
    }
  }

  async function refreshSelectedIndex() {
    if (!videoInput) return
    const xpath = `vmix/inputs/input[@shortTitle='${VIDEOS_INPUT_NAME}']/@selectedIndex`
    const newIndex = await queryVmixXpath(xpath)

    if (newIndex !== null) {
      inputs.update((allInputs) => {
        const targetInput = allInputs.find((i) => i.id === videoInput.id)
        if (targetInput) {
          targetInput.selectedIndex = parseInt(newIndex, 10)
        }
        return allInputs
      })
    }
  }

  function selectTrack(trackIndex) {
    const inputName = videoInput.shortTitle
    const itemNumber = trackIndex + 1
    sendCommand(`FUNCTION SelectIndex Input=${inputName}&Value=${itemNumber}`)

    inputs.update((allInputs) => {
      const targetInput = allInputs.find((i) => i.id === videoInput.id)
      if (targetInput) {
        targetInput.selectedIndex = itemNumber
      }
      return allInputs
    })
  }

  async function handleFlashClick(command) {
    sendCommand(`FUNCTION ${command} Input=${videoInput.shortTitle}`)

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
</script>

<div class="videos-container">
  {#if videoInput}
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
              <span class="play-indicator">▶</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <button
      type="button"
      class="now-playing-container"
      title={isPlaying ? nowPlayingName : 'Click to toggle scroll'}
      on:click={toggleAnimation}
    >
      <div class="now-playing-text-wrapper" bind:this={wrapperElement}>
        <span
          class="now-playing-text"
          class:scrolling={needsScrolling && !isAnimationPaused}
          bind:this={textElement}
        >
          {isPlaying ? nowPlayingName : 'Paused'}
        </span>
      </div>
    </button>

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
          sendCommand(`FUNCTION PlayPause Input=${videoInput.shortTitle}`)}
        title="Play/Pause"
        aria-label="Play/Pause"
      >
        {#if isPlaying}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        {:else}
          ▶
        {/if}
      </button>
      <button
        class="control-btn"
        class:flashing={isNextFlashing}
        on:click={() => handleFlashClick('NextItem')}
        title="Next">»</button
      >
    </div>
  {:else}
    <div class="placeholder">Input "LIST - VIDEOS" not found.</div>
  {/if}
</div>

<style>
  @keyframes pause-scroll-fade {
    0%,
    35% {
      transform: translateX(0);
      opacity: 1;
    }
    91% {
      transform: translateX(var(--scroll-distance));
      opacity: 1;
    }
    100% {
      transform: translateX(var(--scroll-distance));
      opacity: 0;
    }
  }

  .videos-container {
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
    border: 1px solid #4a4a4e;
    color: #14ffec;
    font-weight: bold;
    height: 40px;
    font-size: 1.25em;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    cursor: pointer;
    text-align: left;
    width: 100%;
    flex-shrink: 0;
  }
  .now-playing-text-wrapper {
    width: 100%;
    overflow: hidden;
  }
  .now-playing-text {
    display: inline-block;
    white-space: nowrap;
    text-align: left;
    --scroll-distance: 0px;
  }
  .now-playing-text.scrolling {
    animation: pause-scroll-fade 5.625s linear infinite;
  }
  .button-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    flex-shrink: 0;
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
    border-color: #22c55e;
    box-shadow:
      0 0 8px #22c55e,
      0 0 15px #16a34a;
  }
  .control-btn svg {
    width: 24px;
    height: 24px;
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
