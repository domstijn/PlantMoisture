<script>
    export let plantColor = "#33cf1b"; // default green color
    export let potColor = "#785513"; // default terracotta color
    export let meanValue = 0; // default value
    export let datetime = "2023-10-01 12:00"; // default datetime
    export let meanValueHoursAgo = 0; // default value

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
                    ></span
                >
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
</div>

<style>
    .wrapper {
        display: grid;
        place-content: center;
        height: 100vh; /* Full viewport height */
    }

    .title {
        /* background: red; */
        margin-left: auto;
        margin-right: auto;
        margin-bottom: 20vh;
        font-family: "Montserrat", sans-serif;
        font-style: oblique;
        font-weight: 700;
        font-size: 1.35rem;
        /* color: rgb(11, 11, 11); */
    }

    .plant-in-pot {
        /* background: blue; */
        margin-left: auto;
        margin-right: auto;
        max-width: fit-content;
        padding: 5px;
        margin-bottom: 10vh;
    }

    .plant {
        margin-left: auto;
        margin-right: auto;
        width: 100px; /* Adjust this value to change the width of the plant */
        height: 160px; /* Adjust this value to change the height of the plant */
        background-color: var(--plant-color);
        border-radius: 10px 10px 0px 0px; /* Rounded edges for the plant */
    }

    .pot {
        margin-left: auto;
        margin-right: auto;
        width: 120px; /* Adjust this value to change the width of the pot */
        height: 80px; /* Adjust this value to change the height of the pot */
        background-color: var(--pot-color);
        border-radius: 0 0 10px 10px; /* Rounded edges for the pot */
    }

    .rim {
        margin-left: auto;
        margin-right: auto;
        height: 5px;
        width: 130px;
        background: orange;
        border-radius: 2px;
    }

    .info {
        /* background: white; */
        width: fit-content;
        margin-left: auto;
        margin-right: auto;
        padding: 10px;
        font-family: "Inter", sans-serif;
        font-weight: 550;
        font-size: 0.75rem;

        /* show detailed info in typical format */
        display: flex;
    }
    
    .light {
        font-weight: 200;
        font-size: 0.5rem;
        color: var(--text-info-color);

    }

    .time {
        margin-top: 2rem;
        font-weight: 200;
        font-size: 0.5rem;
        color: var(--text-info-color);
    }
</style>
