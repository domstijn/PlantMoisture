<script>
    export let plantColor = "#33cf1b"; // default green color
    export let potColor = "#785513"; // default terracotta color
    export let meanValue = 0; // default value
    export let datetime = "2023-10-01 12:00"; // default datetime

    $: initdate = new Date(datetime)
    $: adjdate = new Date(initdate.getTime()); // In dev-mode this is UTC, in prod this is the local time

    $: formattedDate = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
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
            <span class="time"
                >Last update:&nbsp;{formattedDate}&nbsp; - &nbsp;</span
            >
            <span class="mean"
                >Moisture-level: &nbsp;<span class="value"
                    >{((meanValue / 135) * 100).toFixed(2)}%</span
                ></span
            >
        </div>
    </div>
</div>

<style>
    .wrapper {
        display: grid;
        place-content: center;
        height: 100vh; /* Full viewport height */
        background: beige;
    }

    .title {
        /* background: red; */
        margin-left: auto;
        margin-right: auto;
        margin-bottom: 20vh;
        font-family: "Montserrat", sans-serif;
        font-style: oblique;
        font-weight: 700;
        font-size: 1.25rem;
        color: rgb(11, 11, 11);
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
        font-size: 0.65rem;

        /* show detailed info in typical format */
        display: flex;
        color: #6c757d; /* Bootstrap’s muted text color */
    }

    .time {
        font-weight: 200;
        font-size: 0.65rem;
    }
</style>
