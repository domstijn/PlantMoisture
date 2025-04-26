<script>
    export let data = []; // Array of { time: Date, value: number }
    export let vUpper;
    export let vLower;
    export let hoursSpan;
    export let width = 400;
    export let height = 200;
    export let padding = 30;

    export let y0Value = undefined;

    const MAXVALUE = 135;
    let y0Position = undefined;

    $: if (
        data.length > 0 &&
        vUpper !== undefined &&
        vLower !== undefined &&
        hoursSpan !== undefined
    ) {
        // Find the earliest and latest times
        const minTime = Math.min(...data.map((d) => d.time.getTime()));
        const maxTime = Math.max(...data.map((d) => d.time.getTime()));

        data = data.map((item) => ({
            time: item.time,
            value: (item.value / MAXVALUE) * 100,
        }));

        vUpper = (vUpper / MAXVALUE) * 100;
        vLower = (vLower / MAXVALUE) * 100;

        // Calculate scales
        timeScale = (t) =>
            padding + (width - 2 * padding) * ((t.getTime() - minTime) / (maxTime - minTime));
        valueScale = (v) =>
            height - padding - (height - 2 * padding) * ((v - vLower) / (vUpper - vLower));

        // Generate the path data for the line
        pathData = data
            .sort((a, b) => a.time - b.time)
            .map(
                (d, i) =>
                    `${i === 0 ? "M" : "L"} ${timeScale(d.time)},${valueScale(d.value)}`
            )
            .join(" ");

        // Generate x-axis labels (simplified for T-hours)
        const now = new Date();
        xAxisLabels = Array.from({ length: 5 }, (_, i) => {
            const time = new Date(
                now.getTime() - hoursSpan * 3600 * 1000 * (i / 4)
            );

            const month = String(time.getMonth())
            const date = String(time.getDate())
            const hours = String(time.getHours()).padStart(2, "0");
            const minutes = String(time.getMinutes()).padStart(2, "0");

            return {
                x: padding + (width - 2 * padding) * (i / 4),
                label: `${month}/${date} - ${hours}:${minutes}`, // `${Math.round(hoursSpan * (i / 4))} hours ago`,
            };
        });


        // Generate y-axis labels (simplified, showing "nice" numbers)
        const numYTicks = 5;
        const niceTicks = [];
        const valueRange = vUpper - vLower; // Calculate valueRange here!
        for (let i = 0; i < numYTicks; i++) {
            const ratio = i / (numYTicks - 1);
            const rawValue = vLower + valueRange * ratio;

            // Round to the nearest "nice" increment (e.g., 5, 10, 25, 50)
            let niceValue;
            if (valueRange <= 20) {
                niceValue = Math.round(rawValue);
            } else if (valueRange <= 50) {
                niceValue = Math.round(rawValue / 5) * 5;
            } else if (valueRange <= 100) {
                niceValue = Math.round(rawValue / 10) * 10;
            } else {
                niceValue = Math.round(rawValue / 25) * 25;
            }
            niceTicks.push(Math.min(niceValue, 100)); // Ensure it doesn't exceed 100 if that's your max
        }

        yAxisLabels = niceTicks.map((value, i) => ({
            y: height - padding - (height - 2 * padding) * (i / (numYTicks - 1)),
            label: value,
        }));

        // Calculate the y-coordinate for the horizontal line
        y0Position = y0Value !== undefined ? valueScale(y0Value) : undefined;
    }

    let timeScale = () => 0;
    let valueScale = () => 0;
    let pathData = "";
    let xAxisLabels = [];
    let yAxisLabels = [];

    let lengthTicks = 4;
</script>

<svg {width} {height}>
    {#if pathData}
        <path d={pathData} fill="none" stroke="steelblue" stroke-width="1.5" opacity="0.95"/>

        {#if y0Position !== undefined}
            <line
                x1={padding}
                y1={y0Position}
                x2={width - padding}
                y2={y0Position}
                stroke="red"
                stroke-dasharray="5,5"
                stroke-width=".5"
                opacity="0.3"
            />
            <text
                x={width - padding + 5}
                opacity="0.7"
                y={y0Position + 3}
                text-anchor="start"
                font-size="0.6em"
                fill="red">{Math.round(y0Value * 10) / 10}%</text
            >
        {/if}

        <!-- x - axis -->
        <!-- <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="black"
            stroke-width="1"
        /> -->
        {#each xAxisLabels as label}
            <text
                x={label.x}
                y={height - padding + 15}
                text-anchor="middle"
                opacity="0.5"
                font-size="0.55em">{label.label}</text
            >
            <line
                x1={label.x}
                y1={height - padding - lengthTicks / 2}
                x2={label.x}
                y2={height - padding + lengthTicks / 2}
                stroke="gray"
                stroke-width="0.5"
                opacity="0.5"
            />
        {/each}

        <!-- y - axis -->
        <!-- <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="black"
            stroke-width="1"
        /> -->
        {#each yAxisLabels as label}
            <text
                x={padding - 5}
                y={label.y + 3}
                text-anchor="end"
                opacity="0.75"
                font-size="0.6em">{label.label}%</text
            >
            <line
                x1={padding - lengthTicks / 2}
                y1={label.y}
                x2={padding + lengthTicks / 2}
                y2={label.y}
                stroke="gray"
                stroke-width="0.5"
                opacity="0.5"
            />
        {/each}
    {:else}
        <text x={width / 2} y={height / 2} text-anchor="middle"
            >No data to display</text
        >
    {/if}
</svg>

<style>
    svg {
        /* border: 1px solid #ccc; */
        font-family: var(--font-family-primary);
        font-size: 0.8em;
    }
</style>
