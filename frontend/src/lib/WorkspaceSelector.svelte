<script lang="ts">
  import { onMount } from "svelte";
  import { getWorkspaces } from "./backendAsker";

  /** @bind */
  export let selectedWorkspaces: Set<string> = new Set();

  let workspaces: Promise<string[]>;
  onMount(() => (workspaces = getWorkspaces()));
</script>

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
