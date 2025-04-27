<script>
    import TimeSeriesGraph from "$lib/TimeSeriesGraph.svelte"; // Adjust the path

    export let plantColor = "#33cf1b"; // default green color
    export let potColor = "#785513"; // default terracotta color
    export let meanValue = 0; // default value
    export let datetime = "2023-10-01 12:00"; // default datetime
    export let meanValueHoursAgo = 0; // default value
    export let timeSeriesData = [];
    export let hoursSpan = null;

    $: initdate = new Date(datetime);
    $: adjdate = new Date(initdate.getTime()); // In dev-mode this is UTC, in prod this is the local time

    $: formattedDate = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(adjdate);

    $: if (meanValue > 110) {
        plantColor = "blue"; // blue
    } else if (meanValue > 90) {
        plantColor = "#33cf1b"; // green
    } else if (meanValue > 50) {
        plantColor = "#f4c300"; // yellow
    } else {
        plantColor = "#573205"; // brown
    }
</script>

<div class="wrapper">
    <div class="title">Plant in Pot</div>
    <div class="plant-in-pot">
        <div class="plant" style="background: {plantColor};"></div>
        <div class="rim"></div>
        <div class="pot" style="background: {potColor};"></div>
        <div class="info">
            <p>
                <span class="mean"
                    >Moisture-level: &nbsp;<span class="value"
                        >{((meanValue / 135) * 100).toFixed(1)}%</span
                    >
                    <!-- maximum value can be more than 135, like on 22/04/2025 it was 136.6 -->
                </span>
                <span class="extra">
                    {#if meanValueHoursAgo > meanValue}
                        <span class="light">
                            <span class="value"
                                >({(
                                    ((meanValue - meanValueHoursAgo) / 135) *
                                    100
                                ).toFixed(1)}%</span
                            > in 6 hours)
                        </span>
                    {/if}
                    <br />
                    <span class="time"
                        >Last update:&nbsp;{formattedDate}&nbsp;</span
                    >
                </span>
            </p>
        </div>
    </div>
    <div class="TimeSeries">
        <TimeSeriesGraph data={timeSeriesData} {hoursSpan} y0Value={(meanValue / 135) * 100}/>
    </div>
</div>

<style>
.wrapper {
    display: grid;
    place-content: center;
    height: 100vh; /* Full viewport height */
    padding: 20px; /* some breathing room */
    box-sizing: border-box;
}

.title {
    margin: 0 auto 12vh auto; /* less bottom margin */
    font-family: "Montserrat", sans-serif;
    font-style: oblique;
    font-weight: 700;
    font-size: 1.35rem;
    text-align: center;
}

.plant-in-pot {
    margin: 0 auto 2vh auto;
    max-width: fit-content;
    padding: 5px;
}

.plant {
    width: 100px;
    height: 160px;
    background-color: var(--plant-color);
    border-radius: 10px 10px 0 0;
    margin: 0 auto;
}

.pot {
    width: 120px;
    height: 80px;
    background-color: var(--pot-color);
    border-radius: 0 0 10px 10px;
    margin: 0 auto;
}

.rim {
    height: 5px;
    width: 130px;
    background: orange;
    border-radius: 2px;
    margin: 0 auto;
}

.info {
    width: fit-content;
    margin: 10px auto 0 auto;
    padding: 10px;
    font-family: "Inter", sans-serif;
    font-weight: 550;
    font-size: 0.75rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
}

.light, .time {
    font-weight: 200;
    font-size: 0.5rem;
    color: var(--text-info-color);
    text-align: center;
}

/* Responsive changes for smaller screens */
@media (max-height: 700px), (max-width: 600px) {
    .title {
        font-size: 1.1rem;
        margin-bottom: 2vh;
    }

    .plant {
        width: 80px;
        height: 130px;
    }

    .pot {
        width: 100px;
        height: 65px;
    }

    .rim {
        width: 110px;
    }

    .info {
        font-size: 0.65rem;
        padding: 5px;
    }

    .light, .time {
        font-size: 0.45rem;
    }
}

</style>
