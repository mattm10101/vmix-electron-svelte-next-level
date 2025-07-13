<script>
  import { onMount } from 'svelte'
  import { modalStore } from './stores.js'

  let cancelButton

  $: if ($modalStore.isOpen) {
    onMount(() => {
      setTimeout(() => {
        cancelButton?.focus()
      }, 0)
    })
  }

  function handleConfirm() {
    if ($modalStore.onConfirm) {
      $modalStore.onConfirm()
    }
    closeModal()
  }

  function closeModal() {
    modalStore.set({ isOpen: false, message: '', onConfirm: () => {} })
  }

  function handleBackdropClick(event) {
    if (event.currentTarget === event.target) {
      closeModal()
    }
  }

  // Handles global 'Escape' key press
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeModal()
    }
  }

  // NEW: Handles 'Enter' key press specifically on the backdrop
  function handleBackdropKeydown(event) {
    if (event.key === 'Enter') {
      closeModal()
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $modalStore.isOpen}
  <div
    class="modal-backdrop"
    on:click={handleBackdropClick}
    on:keydown={handleBackdropKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-message"
    tabindex="-1"
  >
    <div class="modal-content">
      <p class="modal-message" id="modal-message">{$modalStore.message}</p>
      <div class="modal-actions">
        <button
          type="button"
          class="btn cancel-btn"
          on:click={closeModal}
          bind:this={cancelButton}
        >
          Cancel
        </button>
        <button type="button" class="btn confirm-btn" on:click={handleConfirm}>
          Confirm
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  .modal-content {
    background-color: #2a2a2e;
    padding: 25px;
    border-radius: 8px;
    border: 1px solid #4a4a4e;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    width: 90%;
    max-width: 400px;
    text-align: center;
  }
  .modal-message {
    font-size: 1.1em;
    margin-bottom: 20px;
    color: #eee;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
  }
  .btn {
    padding: 10px 20px;
    border-radius: 5px;
    border: 1px solid transparent;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn:focus {
    outline: none;
    border-color: #14ffec;
    box-shadow: 0 0 8px #14ffec;
  }
  .cancel-btn {
    background-color: #4a4a4e;
    color: #eee;
  }
  .cancel-btn:hover {
    background-color: #5a5a5e;
  }
  .confirm-btn {
    background-color: #c53030;
    color: white;
  }
  .confirm-btn:hover {
    background-color: #e53e3e;
  }
</style>
