<script>
  import { onMount, onDestroy } from 'svelte'
  import { listInputs, listStates } from './stores'
  import { sendCommand } from './vmix'

  let pollingInterval
  let expandedLists = {}

  // This function gets the list of items from the Web API
  async function fetchListStates() {
    if (!$listInputs.length || !window.electronAPI) return

    const newStates = {}
    for (const listInput of $listInputs) {
      try {
        const data = await window.electronAPI.getListItems(listInput.id)
        newStates[listInput.id] = {
          ...data,
          name: listInput.name,
          id: listInput.id,
        }
      } catch (error) {
        console.error(`Failed to get items for list ${listInput.id}:`, error)
      }
    }
    listStates.set(newStates)
  }

  onMount(() => {
    fetchListStates()
    // We poll to get the currently selected index
    pollingInterval = setInterval(fetchListStates, 1000)
  })

  onDestroy(() => {
    clearInterval(pollingInterval)
  })

  // ==========================================================
  // THIS IS THE CORRECTED "SMART" FUNCTION
  // It ensures the correct item is selected before toggling Play/Pause.
  // ==========================================================
  function playPauseItem(listData, itemIndex) {
    const encodedName = encodeURIComponent(listData.name)
    const vmixIndex = itemIndex + 1 // vMix uses a 1-based index

    // Always make sure the correct item is selected first.
    if (listData.selectedIndex !== vmixIndex) {
      sendCommand(
        `FUNCTION SelectIndex Input='${encodedName}'&Value=${vmixIndex}`
      )
    }
    // Then, toggle Play/Pause on the list. vMix acts on the selected item.
    sendCommand(`FUNCTION PlayPause Input='${encodedName}'`)
  }

  // Toggles the dropdown visibility
  function toggleList(listId) {
    expandedLists[listId] = !expandedLists[listId]
    expandedLists = expandedLists
  }
</script>

<div class="lists-container">
  {#if $listInputs.length > 0}
    {#each Object.values($listStates) as listData (listData.id)}
      <div class="list-section">
        <button
          class="list-title-btn no-select"
          on:click={() => toggleList(listData.id)}
        >
          <span
            >{listData.name.replace('LIST - ', '').replace('LIST ', '')}</span
          >
          <span class="chevron">{expandedLists[listData.id] ? '▼' : '▶'}</span>
        </button>

        {#if expandedLists[listData.id]}
          <div class="list-items">
            {#each listData.items as item, i (item.id)}
              {@const isPlaying =
                listData.state === 'Running' &&
                listData.selectedIndex === i + 1}
              <div class="list-item-row">
                <span class="item-name no-select">{item.name}</span>
                <button
                  class="play-pause-btn"
                  class:playing={isPlaying}
                  on:click={() => playPauseItem(listData, i)}
                  title="Play/Pause Item"
                >
                  {#if isPlaying}
                    ⏸
                  {:else}
                    ▶
                  {/if}
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  {:else}
    <div class="placeholder">No inputs starting with "LIST" found.</div>
  {/if}
</div>

<style>
  .lists-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    overflow-y: auto;
  }
  .list-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .list-title-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 8px 12px;
    font-weight: bold;
    color: #14ffec;
    background-color: #1f1f23;
    border: 1px solid #4a4a4e;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .list-title-btn:hover {
    background-color: #313136;
  }
  .chevron {
    font-size: 0.8em;
  }
  .list-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 10px;
  }
  .list-item-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .item-name {
    flex-grow: 1;
    color: #eee;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.9em;
  }
  .play-pause-btn {
    background: #3f3f46;
    border: 1px solid #555;
    color: #ccc;
    border-radius: 5px;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1.2em;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .play-pause-btn:hover {
    background-color: #555;
  }
  .play-pause-btn.playing {
    background-color: #16a34a;
    border-color: #22c55e;
    color: white;
    font-size: 1em;
  }
  .placeholder {
    color: #888;
    text-align: center;
    margin-top: 10px;
  }
</style>
