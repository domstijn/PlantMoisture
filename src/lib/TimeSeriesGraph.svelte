<script>
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { tweened } from "svelte/motion";
    import { cubicOut, cubicInOut, quintInOut } from "svelte/easing";
    import { interpolatePath } from "d3-interpolate-path";

    export let data = []; // Array of { time: Date, value: number }
    export let hoursSpan;
    export let width_ = 800;
    export let height_ = 350;
    export let padding = 30;

    export let y0Value = undefined;

    // multiplier for resizing in small windows
    import { browser } from '$app/environment';

	let multiplier = 1;

	if (browser) {
		const mediaQuery_1 = window.matchMedia("(max-width: 850px)");
        const mediaQuery_2 = window.matchMedia("(max-width: 600px)");

		const updateMultiplier = () => {
			multiplier = mediaQuery_1.matches ? 0.65 : 1;
            multiplier = mediaQuery_2.matches ? 0.4 : multiplier;

		};

		updateMultiplier();
		mediaQuery_1.addEventListener('change', updateMultiplier);
        mediaQuery_2.addEventListener("change", updateMultiplier);
	}

    $: height = height_ * multiplier
    $: width = width_ * multiplier

    
    // -----------------------

    const MAXVALUE = 135;
    const pathTween = tweened("", {
        duration: 300,
        easing: quintInOut,
        interpolate: interpolatePath,
    });

    // change hours to show on graph...
    let selectedHours = 48; // Default value
    const availableHours = [24, 48, 168];

    function cycleHours() {
        const currentIndex = availableHours.indexOf(selectedHours);
        const nextIndex = (currentIndex + 1) % availableHours.length;
        selectedHours = availableHours[nextIndex];
        updateData();
    }

    async function updateData() {
        await goto(`?hours=${selectedHours}`, {
            keepfocus: true,
            noscroll: true,
        });
    }

    $: if (data.length > 0 && hoursSpan !== undefined) {
        // Find the earliest and latest times
        const minTime = Math.min(...data.map((d) => d.time.getTime()));
        const maxTime = Math.max(...data.map((d) => d.time.getTime()));

        const allValues = data.map((item) => item.value);
        let vUpper_ = Math.max(...allValues) * 1.0125; // Add a little buffer
        let vLower_ = Math.min(...allValues) * 0.9875; // Add a little buffer

        let data_ = data.map((item) => ({
            time: item.time,
            value: (item.value / MAXVALUE) * 100,
        }));

        let vUpper = (vUpper_ / MAXVALUE) * 100;
        let vLower = (vLower_ / MAXVALUE) * 100;

        // Calculate scales
        timeScale = (t) =>
            padding +
            (width - 2 * padding) *
                ((t.getTime() - minTime) / (maxTime - minTime));
        valueScale = (v) =>
            height -
            padding -
            (height - 2 * padding) * ((v - vLower) / (vUpper - vLower));

        // Generate the path data for the line
        pathTween.set(
            data_
                .sort((a, b) => a.time - b.time)
                .map(
                    (d, i) =>
                        `${i === 0 ? "M" : "L"} ${timeScale(d.time)},${valueScale(d.value)}`
                )
                .join(" ")
        );

        // Generate x-axis labels based on the existing datetime values
        const numLabels = 5;
        const firstTime = data_[0].time;
        const lastTime = data_[data_.length - 1].time;

        const timeDifference = lastTime.getTime() - firstTime.getTime();

        xAxisLabels = Array.from({ length: numLabels }, (_, i) => {
            const fraction = i / (numLabels - 1); // Get a fraction between 0 and 1
            const labelTime = new Date(
                firstTime.getTime() + timeDifference * fraction
            );

            const month = String(labelTime.getMonth() + 1); // Month is 0-indexed
            const date = String(labelTime.getDate()).padStart(2, "0");
            const hours = String(labelTime.getHours()).padStart(2, "0");
            const minutes = String(labelTime.getMinutes()).padStart(2, "0");

            return {
                x: padding + (width - 2 * padding) * fraction,
                label: `${month}/${date} - ${hours}:${minutes}`,
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
            y:
                height -
                padding -
                (height - 2 * padding) * (i / (numYTicks - 1)),
            label: value,
        }));

        // Calculate the y-coordinate for the horizontal line
        y0Position = y0Value !== undefined ? valueScale(y0Value) : undefined;
    }

    let timeScale = () => 0;
    let valueScale = () => 0;
    let xAxisLabels = [];
    let yAxisLabels = [];
    let y0Position = undefined;
    let lengthTicks = 4;
</script>

<div class="container">
    <div class="svg">
        <svg {width} {height}>
            {#if $pathTween}
                <path
                    d={$pathTween}
                    fill="none"
                    stroke="steelblue"
                    stroke-width="1.5"
                    opacity="0.85"
                />

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
    </div>
    <div class="button">
        <button class="tiny-button" on:click={cycleHours}
            >{selectedHours} hours</button
        >
    </div>
</div>

<style>
    svg {
        /* border: 1px solid #ccc; */
        font-family: var(--font-family-primary);
        font-size: 0.8em;
        max-width: 100%; /* allow it to shrink with the window */
    }

    text {
        fill: var(--text-color);
    }

    div.container {
        display: flex;
        justify-content: center;
        flex-direction: column;
    }

    div.container > div {
        justify-content: center;
        margin-left: auto;
        margin-right: auto;
    }

    .tiny-button {
        padding: 1px 3px;
        font-size: 8px;
        border: 0px solid #aaa;
        border-radius: 2px;
        background-color: var(--bg-color-gray-inv);
        color: var(--text-color);
        cursor: pointer;

        margin-left: auto;
        margin-right: auto;
    }

    
</style>


<!-- /* Responsive changes for smaller screens */
    @media (max-height: 700px), (max-width: 600px) {
        svg {
            /* width: 90%; or some smaller size */
            width: 100;

        }
    
    }
 -->