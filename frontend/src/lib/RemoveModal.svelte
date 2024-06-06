<script lang="ts">
  import dayjs from "dayjs";
  import { onMount } from "svelte";
  import {
    deleteEntries,
    getWorkspaces,
    linesAffected,
    selectFolder,
  } from "./backendAsker";
  let which: "date" | "workspace" = "date";
  let dialog: HTMLDialogElement;
  let confirmaDialog: HTMLDialogElement;

  export const open = () => dialog.showModal();

  let workspaces: Promise<string[]> = new Promise(() => {});
  onMount(() => {
    workspaces = getWorkspaces();
  });

  const fillUpWorkspace = () => {
    selectFolder().then((f) => {
      selectedWorkspace = f;
    });
  };
  let selectedWorkspace = "";

  let selectedDate = dayjs()
    .startOf("month")
    .subtract(2, "month")
    .format("YYYY-MM-DDThh:mm");

  let deletionOptions:
    | {
        date: Date;
      }
    | {
        workspace: string;
      };
  const click = async () => {
    deletionOptions =
      which === "date"
        ? {
            date: dayjs(selectedDate).toDate(),
          }
        : {
            workspace: selectedWorkspace,
          };
    affectedLines = await linesAffected(deletionOptions);
    totalLines = await linesAffected(undefined);
    confirmaDialog.showModal();
  };

  const confirmDialogClick = () => {
    deleteEntries(deletionOptions);
    confirmaDialog.close();
    dialog.close();
  };

  let affectedLines = 0;
  let totalLines = 0;
</script>

<dialog bind:this={dialog}>
  <span>
    <h3>Delete</h3>
    <div>
      <div>
        <input
          value="date"
          checked
          name="date"
          type="radio"
          bind:group={which}
        />
        all older than
      </div>
      <input type="datetime-local" bind:value={selectedDate} />
    </div>
    <div>
      <div>
        <input
          value="workspace"
          name="workspace"
          type="radio"
          bind:group={which}
        />
        all from workspace
      </div>
      <input
        type="text"
        list="workspaces"
        contenteditable="true"
        bind:textContent={selectedWorkspace}
      />
      <datalist id="workspaces">
        {#await workspaces then resolvedWorkspaces}
          {#each resolvedWorkspaces as workspace}
            <option value={workspace} />
          {/each}
        {/await}
      </datalist>
      <button on:click={fillUpWorkspace}>Select workspace</button>
    </div>
    <button on:click={click}>Confirm</button>
    <button on:click={() => dialog.close()}>Close</button>
  </span>
</dialog>

<dialog bind:this={confirmaDialog}>
  <span>
    Are you sure? This will delete {affectedLines} rows, {(
      (100 * affectedLines) /
      totalLines
    ).toFixed(1)} % of the whole database.
    <div>
      <button on:click={confirmDialogClick}>Confirm</button>
      <button on:click={() => confirmaDialog.close()}>Cancel</button>
    </div>
  </span>
</dialog>

<style>
  div {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  span {
    display: flex;
    gap: 5px;
    flex-direction: column;
    align-self: center;
    justify-self: center;
  }
  dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.8);
  }
</style>
