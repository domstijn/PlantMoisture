import { supabase } from "$lib/supabaseClient";

// depends is a function and needs to be passed into the load function
// load is automatically called by SvelteKit when the page is loaded
export async function load({ depends }) {
    // this allows us to invalidate based on the key passed in
    // see +page.svelte
    depends("app:moisture-data");

    try {
        // 1. Fetch data with error handling
        const { data, error } = await supabase
            .from("MoistureLevel")
            .select("values, datetime")
            .order("datetime", { ascending: false })
            .limit(10);

        if (error) throw error;
        if (!data || data.length === 0) {
            return {
                status: 404,
                error: new Error("No data found"),
            };
        }

        // 2. Calculate mean (with type safety)
        const values = data.map((item) => Number(item.values));
        const sum = values.reduce((acc, val) => acc + val, 0);
        const mean = sum / values.length;

        // 3. Get most recent datetime (already ordered)
        const lastDatetime = data[0].datetime;

        const { data: oldData, error: errorOld } = await supabase
            .from("MoistureLevel")
            .select("values, datetime")
            .lte(
                "datetime",
                new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // six hour ago
            )
            .order("datetime", { ascending: false })
            .limit(10);

        if (errorOld) throw errorOld;
        if (!oldData || oldData.length === 0) {
            return {
                status: 404,
                error: new Error("No older data found"),
            };
        }

        const oldValues = oldData.map((item) => Number(item.values));
        const sumOld = oldValues.reduce((acc, val) => acc + val, 0);
        const meanHourAgo = sumOld / oldValues.length;

        // --------------------------------------------------
        // fetch data for rendering graph
        // Fetch more data points for the time series graph
        const hourSpan = 24; // hours

        const { data: data_graph, error: error_graph } = await supabase
            .from("MoistureLevel")
            .select("values, datetime")
            .gte(
                "datetime",
                new Date(Date.now() - hourSpan * 60 * 60 * 1000).toISOString() // Fetch data for the last 6 hours
            )
            .order("datetime", { ascending: true }); // Order by time ascending for easier processing;

        // console.log(data_graph);

        if (error_graph) throw error_graph;
        if (!data_graph || data_graph.length === 0) {
            return {
                status: 404,
                error: { message: "No data found for the time series graph" }, // Serialize the error
                timeSeriesData: [],
                vUpper: undefined,
                vLower: undefined,
            };
        }

        // Convert datetime strings to Date objects and values to numbers
        const timeSeriesRawData = data_graph.map(item => ({
            time: new Date(item.datetime),
            value: Number(item.values),
        }));

        // Calculate moving average (approximately every 15 minutes)
        const movingAverageInterval = 15 * 60 * 1000; // 15 minutes in milliseconds
        const averagedData = [];
        let currentBatch = [];
        let batchStartTime = null;

        for (const point of timeSeriesRawData) {
            if (!batchStartTime) {
                batchStartTime = point.time.getTime();
            }

            currentBatch.push(point);

            // Check if it's time to calculate the average for the current batch
            if (point.time.getTime() - batchStartTime >= movingAverageInterval) {
                if (currentBatch.length > 0) {
                    const averageValue = currentBatch.reduce((sum, p) => sum + p.value, 0) / currentBatch.length;
                    const averageTime = new Date(batchStartTime + (point.time.getTime() - batchStartTime) / 2); // Midpoint of the interval
                    averagedData.push({ time: averageTime, value: averageValue });
                }
                currentBatch = [];
                batchStartTime = null;
                // Start the next batch with the current point if it wasn't the last one
                if (timeSeriesRawData.indexOf(point) < timeSeriesRawData.length - 1) {
                    batchStartTime = point.time.getTime();
                    currentBatch.push(point);
                }
            }
        }

        // Handle any remaining data in the last batch
        if (currentBatch.length > 0) {
            const averageValue = currentBatch.reduce((sum, p) => sum + p.value, 0) / currentBatch.length;
            const lastBatchStartTime = batchStartTime !== null ? batchStartTime : timeSeriesRawData[timeSeriesRawData.length - currentBatch.length].time.getTime();
            const averageTime = new Date(lastBatchStartTime + (timeSeriesRawData[timeSeriesRawData.length - 1].time.getTime() - lastBatchStartTime) / 2);
            averagedData.push({ time: averageTime, value: averageValue });
        }

        // Determine upper and lower bounds for the y-axis (you might want to adjust these)
        const allValues = averagedData.map(item => item.value);
        const vUpper = Math.max(...allValues) * 1.0125; // Add a little buffer
        const vLower = Math.min(...allValues) * 0.9875; // Add a little buffer

        // Return formatted data
        return {
            mean: Number(mean.toFixed(2)), // Rounds to 2 decimal places
            lastDatetime: new Date(lastDatetime).toISOString(),
            meanHourAgo: Number(meanHourAgo.toFixed(2)), // Rounds to 2 decimal places
            timeSeriesData: averagedData,
            hoursSpan: hourSpan, // Reflecting the 6 hours of data fetched
        };
    } catch (err) {
        return {
            status: 500,
            error: new Error(err.message),
        };
    }
}
