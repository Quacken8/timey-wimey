<script lang="ts">
  import { onMount } from "svelte";
  import { getWorkspaces } from "./backendAsker";

  /** @bind */
  export let selectedWorkspaces: Set<string> = new Set();

  let workspaces: Promise<string[]> = new Promise(() => {});
  onMount(() => {
    workspaces = getWorkspaces();
    workspaces.then((ws) => {
      selectedWorkspaces = new Set(ws);
    });
  });

  const invertSelection = () => {
    const newSet: Set<string> = new Set();
    workspaces
      .then((ws) => {
        ws.forEach((workspace) => {
          if (!selectedWorkspaces.has(workspace)) {
            newSet.add(workspace);
          }
        });
      })
      .then(() => {
        selectedWorkspaces = newSet;
      });
  };
</script>

<h2>Workspaces</h2>
<button on:click={invertSelection}> Invert selection </button>

<ul>
  {#await workspaces}
    <li>Loading...</li>
  {:then ws}
    {#each ws as workspace}
      <li>
        <input
          type="checkbox"
          checked={selectedWorkspaces.has(workspace)}
          on:change={() => {
            if (selectedWorkspaces.has(workspace)) {
              selectedWorkspaces.delete(workspace);
            } else {
              selectedWorkspaces.add(workspace);
            }
            selectedWorkspaces = new Set(selectedWorkspaces);
          }}
        />
        {workspace}
      </li>
    {/each}
  {:catch error}
    <li>Error: {error.message}</li>
  {/await}
</ul>

<style>
  ul {
    text-wrap: nowrap;
    overflow: hidden;
  }
</style>
