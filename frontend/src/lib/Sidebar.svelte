<script lang="ts">
  import dayjs from "dayjs";
  import WorkspaceSelector from "./WorkspaceSelector.svelte";
  import DateSelector, { type DateRange } from "./DateSelector.svelte";

  /** @bind */
  export let selectedWorkspaces: Set<string> = new Set();

  /** @bind */
  export let selectedRange: DateRange;
</script>

<div class="sidebar">
  <h2>DateTimePicker lol</h2>
  <DateSelector bind:selectedRange />
  <h2>Workspaces</h2>
  <WorkspaceSelector bind:selectedWorkspaces />
</div>
