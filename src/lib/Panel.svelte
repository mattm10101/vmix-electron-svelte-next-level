<script>
  import { onMount } from 'svelte'
  import { panelStates, selectedPanelIds } from './stores.js'

  export let id
  export let title
  export let defaultState

  $: state = $panelStates[id]
  const titleId = `panel-title-${id}`

  let panelElement
  let initialDragPositions = new Map()

  onMount(() => {
    if (!state && defaultState) {
      panelStates.update((allStates) => {
        allStates[id] = { ...defaultState, title: title }
        return allStates
      })
    }

    function onMouseDown(e) {
      const resizeHandle = e.target.closest('.resize-handle')
      const header = e.target.closest('.panel-header')
      const control = e.target.closest('.panel-control')

      if (control) return // Ignore clicks on controls like minimize

      bringToFront()

      if (resizeHandle) {
        isResizing = true
      } else if (header) {
        document.body.classList.add('no-select')
        isDragging = true
        startMouseX = e.clientX
        startMouseY = e.clientY

        // If the clicked panel is not part of the current selection,
        // make it the only selected panel.
        if (!$selectedPanelIds.has(id)) {
          selectedPanelIds.set(new Set([id]))
        }

        initialDragPositions.clear()
        // Store the initial position of every selected panel
        $selectedPanelIds.forEach((panelId) => {
          initialDragPositions.set(panelId, { ...$panelStates[panelId] })
        })
      } else {
        return
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp, { once: true })
    }

    let isDragging = false
    let isResizing = false
    let startMouseX, startMouseY

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
        panelStates.update((allStates) => {
          if (allStates[id]) {
            allStates[id].width = Math.max(200, e.clientX - state.x)
            allStates[id].height = Math.max(150, e.clientY - state.y)
          }
          return allStates
        })
      }
    }

    function onMouseUp() {
      if (isDragging) {
        document.body.classList.remove('no-select')
      }
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

  function bringToFront() {
    const maxZ = Math.max(
      0,
      ...Object.values($panelStates).map((p) => p.z || 0)
    )
    panelStates.update((allStates) => {
      if (allStates[id]) {
        allStates[id].z = maxZ + 1
      }
      return allStates
    })
  }

  function toggleMinimized() {
    panelStates.update((allStates) => {
      if (allStates[id]) {
        allStates[id].min = !allStates[id].min
      }
      return allStates
    })
  }
</script>

<div
  class="panel"
  class:minimized={state?.min}
  class:selected={$selectedPanelIds.has(id)}
  bind:this={panelElement}
  style="left: {state?.x ?? 0}px; top: {state?.y ??
    0}px; width: {state?.width ?? 200}px; height: {state?.height ??
    150}px; z-index: {state?.z ?? 1};"
  role="dialog"
  aria-labelledby={titleId}
>
  <div class="panel-header">
    <span class="panel-title" id={titleId}>{title}</span>
    <div class="panel-controls">
      <slot name="header-controls" />
      <button
        class="panel-control"
        on:click|stopPropagation={toggleMinimized}
        aria-label="Toggle panel minimization"
      >
        {state?.min ? '⧄' : '—'}
      </button>
    </div>
  </div>
  <div class="panel-content">
    <slot />
  </div>
  <div class="resize-handle"></div>
</div>

<style>
  .panel {
    position: absolute;
    display: flex;
    flex-direction: column;
    background-color: var(--color-panel, #2a2a2e);
    border: 1px solid #4a4a4e;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }
  .panel.minimized {
    height: 41px !important;
    overflow: hidden;
  }
  .panel.selected {
    border-color: var(--color-accent-blue, #00d0ff);
    box-shadow: 0 0 15px rgba(0, 208, 255, 0.6);
  }
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--color-header, #1f1f23);
    color: var(--color-accent, #14ffec);
    padding: 8px 15px;
    cursor: move;
    font-weight: bold;
    border-bottom: 1px solid #4a4a4e;
    flex-shrink: 0;
  }
  .panel-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .panel-control {
    background: none;
    border: none;
    color: var(--color-accent, #14ffec);
    cursor: pointer;
    font-size: 1.2em;
    padding: 0 5px;
  }
  .panel-content {
    flex-grow: 1;
    padding: 15px;
    overflow: auto;
    background-color: #2a2a2e;
  }
  .resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 15px;
    height: 15px;
    cursor: se-resize;
    z-index: 10;
    background: repeating-linear-gradient(
      -45deg,
      #4a4a4e,
      #4a4a4e 2px,
      transparent 2px,
      transparent 4px
    );
  }
</style>
