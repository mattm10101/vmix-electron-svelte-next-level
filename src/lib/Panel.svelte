<script>
  import { onMount } from 'svelte'
  import { panelStates } from './stores.js'

  export let id
  export let title
  export let defaultState = {
    x: 20,
    y: 20,
    width: 400,
    height: 300,
    z: 1,
    min: false,
  }

  const titleId = `panel-title-${id}`

  let state
  let panelElement
  let headerElement
  let isDragging = false
  let isResizing = false
  let dragOffsetX, dragOffsetY

  const unsubscribe = panelStates.subscribe((states) => {
    state = states[id] || defaultState
  })

  onMount(() => {
    panelStates.update((states) => {
      if (!states[id]) {
        states[id] = defaultState
      }
      return states
    })

    const onMouseMove = (e) => {
      if (isDragging) {
        let newX = e.clientX - dragOffsetX
        let newY = e.clientY - dragOffsetY
        state.x = Math.max(0, Math.min(newX, window.innerWidth - state.width))
        state.y = Math.max(0, Math.min(newY, window.innerHeight - state.height))
        updateState()
      } else if (isResizing) {
        state.width = Math.max(200, e.clientX - state.x)
        state.height = Math.max(150, e.clientY - state.y)
        updateState()
      }
    }

    const onMouseUp = () => {
      isDragging = false
      isResizing = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    headerElement.addEventListener('mousedown', (e) => {
      if (e.target.closest('.panel-control')) return
      isDragging = true
      bringToFront()
      dragOffsetX = e.clientX - state.x
      dragOffsetY = e.clientY - state.y
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    })

    return () => unsubscribe()
  })

  function updateState() {
    panelStates.update((states) => ({ ...states, [id]: state }))
  }

  function bringToFront() {
    panelStates.update((states) => {
      const maxZ = Math.max(0, ...Object.values(states).map((p) => p.z))
      state.z = maxZ + 1
      return { ...states, [id]: state }
    })
  }

  function handleResizeHandle(e) {
    isResizing = true
    bringToFront()
    const onMouseMove = (e) => {
      state.width = Math.max(200, e.clientX - state.x)
      state.height = Math.max(150, e.clientY - state.y)
      updateState()
    }
    const onMouseUp = () => {
      isResizing = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  function handleResizeKeydown(e) {
    const step = 10
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
    if (!keys.includes(e.key)) return

    e.preventDefault()
    if (e.key === 'ArrowRight') state.width += step
    if (e.key === 'ArrowLeft') state.width -= step
    if (e.key === 'ArrowDown') state.height += step
    if (e.key === 'ArrowUp') state.height -= step

    state.width = Math.max(200, state.width)
    state.height = Math.max(150, state.height)
    updateState()
  }

  function toggleMinimized() {
    state.min = !state.min
    updateState()
  }
</script>

<div
  class="panel"
  class:minimized={state.min}
  bind:this={panelElement}
  style="left: {state.x}px; top: {state.y}px; width: {state.width}px; height: {state.height}px; z-index: {state.z};"
  on:mousedown={bringToFront}
  role="dialog"
  aria-labelledby={titleId}
  tabindex="-1"
>
  <div class="panel-header" bind:this={headerElement}>
    <span class="panel-title" id={titleId}>{title}</span>
    <div class="panel-controls">
      <slot name="header-controls"></slot>
      <button
        class="panel-control"
        on:click={toggleMinimized}
        aria-label="Toggle panel minimization">{state.min ? '⧄' : '—'}</button
      >
    </div>
  </div>
  <div class="panel-content">
    <slot></slot>
  </div>
  <button
    class="resize-handle"
    on:mousedown|stopPropagation={handleResizeHandle}
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
