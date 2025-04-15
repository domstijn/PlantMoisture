<script>
    import PlantInPot from "$lib/PlantInPot.svelte";

    let { data } = $props();

</script>

<PlantInPot datetime={data.props.lastDatetime} meanValue={data.props.mean}/>