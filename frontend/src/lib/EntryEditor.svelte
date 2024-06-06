<script lang="ts">
  import InsertModal from "./InsertModal.svelte";
  import RemoveModal from "./RemoveModal.svelte";

  let openInsert: () => void;
  let openRemove: () => void;
</script>

<div>
  <button on:click={openInsert}> Insert an entry... </button>
  <button on:click={openRemove}> Remove entries... </button>
</div>
<InsertModal bind:open={openInsert} />
<RemoveModal bind:open={openRemove} />

<style>
  div {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
  button {
    flex-shrink: 1;
  }
</style>
