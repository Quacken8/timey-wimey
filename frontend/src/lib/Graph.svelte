<script lang="ts">
  import {
    Chart,
    TimeScale,
    type TimeScaleProps,
    HistogramSeries,
    type Reference,
  } from "svelte-lightweight-charts";
  import type { DateRange } from "./DateSelector.svelte";
  import type { HistogramData, IChartApi, Time } from "lightweight-charts";
  import { get } from "http";
  import { getHistogramData, getSummary } from "./backendAsker";
  export let timeRange: DateRange;
  export let workspaces: string[] = [];

  let data: HistogramData<Time>[] = [];

  let chart: IChartApi | null;
  $: if (chart && timeRange) {
    getHistogramData(
      timeRange.from.toDate(),
      timeRange.to.toDate(),
      workspaces
    ).then((histogramData) => {
      data = histogramData;
    });

    chart.timeScale().setVisibleRange({
      from: timeRange.from.unix() as Time,
      to: timeRange.to.unix() as Time,
    });
  }
</script>

<Chart width={800} height={600} ref={(ref) => (chart = ref)}>
  <HistogramSeries {data} />
  <TimeScale />
</Chart>
