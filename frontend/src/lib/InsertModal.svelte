<script lang="ts">
  import { onMount } from "svelte";
  import {
    getWorkspaces,
    insertEntry,
    selectFile,
    selectFolder,
  } from "./backendAsker";
  import dayjs from "dayjs";

  let dialog: HTMLDialogElement;
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
  const fillUpFile = () => {
    selectFile().then((f) => {
      selectedFile = f;
    });
  };
  let selectedFile = "";

  let selectedDate = dayjs().format("YYYY-MM-DDThh:mm");
  $: parsedDate = dayjs(selectedDate);

  let interval = 5;

  let writing: false;
  let focused: false;

  let hash = "";
  let custom = "";

  const undefineEmpty = (x: string) => (x === "" ? undefined : x);
  const insert = () => {
    const entries = [
      {
        key: <const>"current_file",
        value: undefineEmpty(selectedFile),
      },
      {
        key: <const>"custom",
        value: custom,
      },
      {
        key: <const>"interval_minutes",
        value: interval,
      },
      {
        key: <const>"working",
        value: writing ?? false,
      },
      {
        key: <const>"window_focused",
        value: focused ?? false,
      },
      {
        key: <const>"timestamp",
        value: parsedDate.unix(),
      },
      {
        key: <const>"last_commit_hash",
        value: hash,
      },
      {
        key: <const>"workspace",
        value: undefineEmpty(selectedWorkspace),
      },
    ];
    console.log(entries);
    insertEntry(entries);

    dialog.close();
  };
</script>

<dialog bind:this={dialog}>
  <div class="container">
    <h3>Insert</h3>
    <div>
      Date<input type="datetime-local" bind:value={selectedDate} name="date" />
    </div>
    <div>
      Number of minutes <input
        type="number"
        min="0"
        bind:value={interval}
        name="interval"
      />
    </div>
    <div>
      Were you working? <input
        type="checkbox"
        bind:checked={focused}
        name="window_focused"
      />
    </div>
    <div>
      Were you actively writing? <input
        type="checkbox"
        bind:checked={writing}
        name="working"
      />
    </div>
    <div>
      What workspace were you working in
      <span>
        <input
          type="text"
          list="workspaces"
          placeholder="path/to/workspace"
          name="workspace"
          bind:value={selectedWorkspace}
        />
        <datalist id="workspaces">
          {#await workspaces then resolvedWorkspaces}
            {#each resolvedWorkspaces as workspace}
              <option value={workspace} />
            {/each}
          {/await}
        </datalist>
        <button on:click={fillUpWorkspace}>Select</button>
      </span>
    </div>
    <div>
      What file were you working on
      <span>
        <input
          type="text"
          placeholder="path/to/file"
          name="file"
          bind:value={selectedFile}
        />
        <button on:click={fillUpFile}>Select</button>
      </span>
    </div>
    <div>
      Which commit were you working on
      <input type="text" placeholder="hash" bind:value={hash} name="commit" />
    </div>
    <div>
      Any custom entry? <input type="text" bind:value={custom} name="custom" />
    </div>
    <button on:click={insert}>Insert</button>
    <button on:click={() => dialog.close()}>Cancel</button>
  </div>
</dialog>

<style>
  div {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 5px;
  }
  .container {
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
