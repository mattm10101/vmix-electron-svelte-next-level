<script>
  import { onMount } from 'svelte'
  import { panelStates, selectedPanelIds } from './stores.js'

  export let id
  export let title

  $: state = $panelStates[id]
  const titleId = `panel-title-${id}`

  let panelElement
  let initialDragPositions = new Map()

  onMount(() => {
    let isDragging = false
    let isResizing = false
    let startMouseX, startMouseY

    function onMouseDown(e) {
      const resizeHandle = e.target.closest('.resize-handle')
      const header = e.target.closest('.panel-header')

      if (resizeHandle) {
        e.stopPropagation()
        isResizing = true
      } else if (header && !e.target.closest('.panel-control')) {
        isDragging = true
        startMouseX = e.clientX
        startMouseY = e.clientY

        if (!$selectedPanelIds.has(id)) {
          selectedPanelIds.set(new Set([id]))
        }

        initialDragPositions.clear()
        $selectedPanelIds.forEach((panelId) => {
          initialDragPositions.set(panelId, { ...$panelStates[panelId] })
        })
      } else {
        return
      }

      bringToFront()
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp, { once: true })
    }

    function onMouseMove(e) {
      if (isDragging) {
        const dx = e.clientX - startMouseX
        const dy = e.clientY - startMouseY

        panelStates.update((allStates) => {
          $selectedPanelIds.forEach((panelId) => {
            const initialPos = initialDragPositions.get(panelId)
            if (initialPos && allStates[panelId]) {
              allStates[panelId].x = Math.max(0, initialPos.x + dx)
              allStates[panelId].y = Math.max(0, initialPos.y + dy)
            }
          })
          return allStates
        })
      } else if (isResizing) {
        updateStore({
          width: Math.max(200, e.clientX - state.x),
          height: Math.max(150, e.clientY - state.y),
        })
      }
    }

    function onMouseUp() {
      isDragging = false
      isResizing = false
      document.removeEventListener('mousemove', onMouseMove)
    }

    panelElement.addEventListener('mousedown', onMouseDown)

    return () => {
      panelElement.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  })

  function updateStore(partialState) {
    panelStates.update((allStates) => {
      if (allStates[id]) {
        allStates[id] = { ...allStates[id], ...partialState }
      }
      return allStates
    })
  }

  function bringToFront() {
    const maxZ = Math.max(
      0,
      ...Object.values($panelStates).map((p) => p.z || 0)
    )

    panelStates.update((allStates) => {
      $selectedPanelIds.forEach((panelId) => {
        if (allStates[panelId]) {
          allStates[panelId].z = maxZ + 1
        }
      })
      return allStates
    })
  }

  function handleResizeKeydown(e) {
    const step = 10
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
    if (!keys.includes(e.key)) return

    e.preventDefault()
    let { width, height } = state
    if (e.key === 'ArrowRight') width += step
    if (e.key === 'ArrowLeft') width -= step
    if (e.key === 'ArrowDown') height += step
    if (e.key === 'ArrowUp') height -= step

    updateStore({
      width: Math.max(200, width),
      height: Math.max(150, height),
    })
  }

  function toggleMinimized() {
    updateStore({ min: !state.min })
  }
</script>

<div
  class="panel"
  class:minimized={state?.min}
  class:selected={$selectedPanelIds.has(id)}
  bind:this={panelElement}
  style="left: {state?.x}px; top: {state?.y}px; width: {state?.width}px; height: {state?.height}px; z-index: {state?.z};"
  role="dialog"
  aria-labelledby={titleId}
  tabindex="-1"
>
  <div class="panel-header">
    <span class="panel-title" id={titleId}>{title}</span>
    <div class="panel-controls">
      <slot name="header-controls"></slot>
      <button
        class="panel-control"
        on:click|stopPropagation={toggleMinimized}
        aria-label="Toggle panel minimization">{state?.min ? '⧄' : '—'}</button
      >
    </div>
  </div>
  <div class="panel-content">
    <slot></slot>
  </div>
  <button
    class="resize-handle"
    on:keydown={handleResizeKeydown}
    aria-label="Resize panel"
  ></button>
</div>

<style>
  .panel {
    position: absolute;
    display: flex;
    flex-direction: column;
    background-color: #2a2a2e;
    border: 1px solid #4a4a4e;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    outline: none;
  }
  .panel.minimized {
    height: 41px !important;
  }
  .panel.selected {
    border-color: #00d0ff;
    box-shadow: 0 0 15px rgba(0, 208, 255, 0.6);
  }
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #1f1f23;
    color: #14ffec;
    padding: 8px 15px;
    cursor: move;
    font-weight: bold;
    border-bottom: 1px solid #4a4a4e;
  }
  .panel-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .panel-control {
    background: none;
    border: none;
    color: #14ffec;
    cursor: pointer;
    font-size: 1.2em;
    padding: 0 5px;
  }
  .panel-content {
    flex-grow: 1;
    padding: 15px;
    overflow-y: auto;
  }
  .resize-handle {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    position: absolute;
    bottom: 0;
    right: 0;
    width: 15px;
    height: 15px;
    cursor: se-resize;
    outline: none;
    background: repeating-linear-gradient(
      -45deg,
      #4a4a4e,
      #4a4a4e 2px,
      transparent 2px,
      transparent 4px
    );
  }
  .resize-handle:focus {
    background: repeating-linear-gradient(
      -45deg,
      #14ffec,
      #14ffec 2px,
      transparent 2px,
      transparent 4px
    );
  }
</style>
