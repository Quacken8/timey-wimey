<script lang="ts">
  import WorkspaceSelector from "./WorkspaceSelector.svelte";
  import DateSelector, { type DateRange } from "./DateSelector.svelte";

  /** @bind */
  export let selectedWorkspaces: Set<string> = new Set();

  /** @bind */
  export let selectedRange: DateRange;
</script>

<div class="sidebar">
  <DateSelector bind:selectedRange />

  <WorkspaceSelector bind:selectedWorkspaces />
</div>
