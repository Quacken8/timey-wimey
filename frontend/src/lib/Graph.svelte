<script lang="ts">
  import {
    Chart,
    TimeScale,
    HistogramSeries,
    PriceScale,
  } from "svelte-lightweight-charts";
  import type { DateRange } from "./DateSelector.svelte";
  import type {
    IChartApi,
    ITimeScaleApi,
    Time,
    UTCTimestamp,
    HistogramData as GayAssHistogramData,
  } from "lightweight-charts";
  import { getHistogramData, getSummary } from "./backendAsker";
  import type { HistogramData } from "@extension/src/ui/histogramBinner";
  export let selectedRange: DateRange;
  export let selectedWorkspaces: Set<string> = new Set();
  export let width = 0;

  let data: Promise<HistogramData> = new Promise(() => {});
  let workingData: GayAssHistogramData<Time>[] = [];
  let focusedData: GayAssHistogramData<Time>[] = [];

  $: data, updateData();
  const updateData = async () => {
    await data.then((data) => {
      if (data !== undefined && data.length > 0) {
        workingData = data.map((d) => ({
          time: utc(d.time),
          value: d.workingMinutes / 60,
        }));
        focusedData = data.map((d) => ({
          time: utc(d.time),
          value: d.focusedMinutes / 60,
        }));
      }
    });
  };

  let chart: IChartApi | null;
  $: if (selectedRange) {
    data = getHistogramData(
      selectedRange.from.toDate(),
      selectedRange.to.toDate(),
      Array.from(selectedWorkspaces)
    );
  }

  let timescale: ITimeScaleApi<Time> | null;
  $: if (timescale && selectedRange) {
    timescale.setVisibleRange({
      from: selectedRange.from.unix() as Time,
      to: selectedRange.to.unix() as Time,
    });
  }

  const utc = (x: number) => x as UTCTimestamp; // TS more like BS
</script>

<h2>Graph</h2>
{#if focusedData.length > 0 && workingData.length > 0}
  <Chart height={600} width={width * 0.9} ref={(ref) => (chart = ref)}>
    <HistogramSeries title="Focused" data={focusedData} reactive color="red" />
    <HistogramSeries title="Working" data={workingData} reactive color="blue" />
    <TimeScale ref={(ref) => (timescale = ref)} barSpacing={10} />
    <PriceScale id="hours" />
  </Chart>
{:else}
  <p>No data</p>
{/if}
