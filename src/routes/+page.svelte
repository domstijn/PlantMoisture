<script>
    import PlantInPot from "$lib/PlantInPot.svelte";

    let { data } = $props();
</script>

<PlantInPot datetime={data.props.lastDatetime} meanValue={data.props.mean} />

<style>
    :global(html, body) {
        margin: 0;
        padding: 0;
        height: 100%;
        background-color: beige;
    }
    
</style>
