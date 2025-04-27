import { supabase } from "$lib/supabaseClient";

// depends is a function and needs to be passed into the load function
// load is automatically called by SvelteKit when the page is loaded
export async function load({ depends, url }) {
    // this allows us to invalidate based on the key passed in
    // see +page.svelte
    depends("app:moisture-data");

    const hoursParam = url.searchParams.get("hours");
    const numberOfHours = hoursParam ? parseInt(hoursParam, 10) : 48; // Default to 24

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
        const hourSpan = numberOfHours; // hours

        const startDate = new Date(
            Date.now() - hourSpan * 60 * 60 * 1000
        ).toISOString();

        // const { data: data_graph, error: error_graph } = await supabase
        //     .from("MoistureLevel")
        //     .select("values, datetime")
        //     .gte(
        //         "datetime",
        //         new Date(Date.now() - hourSpan * 60 * 60 * 1000).toISOString() // Fetch data for the last 6 hours
        //     )
        //     .order("datetime", { ascending: true }); // Order by time ascending for easier processing;

        // Map the frontend interval string to a PostgreSQL compatible interval
        // Determine a sensible aggregation interval based on the hourSpan
        let postgresInterval;
        if (hourSpan <= 24) {
            // For up to 1 day, aggregate every 15 minutes
            postgresInterval = " 15 minutes";
        } else if (hourSpan <= 72) {
            // For up to 3 days, aggregate hourly
            postgresInterval = "1 hour";
        } else if (hourSpan <= 168) {
            // For up to 7 days, aggregate every 6 hours
            postgresInterval = "3 hours";
        } else {
            // For longer periods, aggregate daily
            postgresInterval = "day";
        }

        const { data: data_graph, error: error_graph } = await supabase.rpc("get_aggregated_moisture", {
            start_date: startDate,
            postgres_interval: postgresInterval,
        });

        if (error_graph) {
            console.error("Error calling RPC:", error_graph);
            return { error: { message: error_graph.message }, timeSeriesData: [] };
        }

        const aggregatedData = data_graph
            ? data_graph.map((item) => ({
                  time: new Date(item.agg_datetime),
                  value: item.agg_values,
              }))
            : [];

        // // Calculate moving average (approximately every 15 minutes)
        // const minutesToAverage = (hourSpan * 60) / 100;
        // const movingAverageInterval = minutesToAverage * 60 * 1000; // 15 minutes in milliseconds
        // const averagedData = [];
        // let currentBatch = [];
        // let batchStartTime = null;

        // for (const point of timeSeriesRawData) {
        //     if (!batchStartTime) {
        //         batchStartTime = point.time.getTime();
        //     }

        //     currentBatch.push(point);

        //     // Check if it's time to calculate the average for the current batch
        //     if (
        //         point.time.getTime() - batchStartTime >=
        //         movingAverageInterval
        //     ) {
        //         if (currentBatch.length > 0) {
        //             const averageValue =
        //                 currentBatch.reduce((sum, p) => sum + p.value, 0) /
        //                 currentBatch.length;
        //             const averageTime = new Date(
        //                 batchStartTime +
        //                     (point.time.getTime() - batchStartTime) / 2
        //             ); // Midpoint of the interval
        //             averagedData.push({
        //                 time: averageTime,
        //                 value: averageValue,
        //             });
        //         }
        //         currentBatch = [];
        //         batchStartTime = null;
        //         // Start the next batch with the current point if it wasn't the last one
        //         if (
        //             timeSeriesRawData.indexOf(point) <
        //             timeSeriesRawData.length - 1
        //         ) {
        //             batchStartTime = point.time.getTime();
        //             currentBatch.push(point);
        //         }
        //     }
        // }

        // // Handle any remaining data in the last batch
        // if (currentBatch.length > 0) {
        //     const averageValue =
        //         currentBatch.reduce((sum, p) => sum + p.value, 0) /
        //         currentBatch.length;
        //     const lastBatchStartTime =
        //         batchStartTime !== null
        //             ? batchStartTime
        //             : timeSeriesRawData[
        //                   timeSeriesRawData.length - currentBatch.length
        //               ].time.getTime();
        //     const averageTime = new Date(
        //         lastBatchStartTime +
        //             (timeSeriesRawData[
        //                 timeSeriesRawData.length - 1
        //             ].time.getTime() -
        //                 lastBatchStartTime) /
        //                 2
        //     );
        //     averagedData.push({ time: averageTime, value: averageValue });
        // }

        // Return formatted data
        return {
            mean: Number(mean.toFixed(2)), // Rounds to 2 decimal places
            lastDatetime: new Date(lastDatetime).toISOString(),
            meanHourAgo: Number(meanHourAgo.toFixed(2)), // Rounds to 2 decimal places
            timeSeriesData: aggregatedData,
            hoursSpan: hourSpan, // Reflecting the 6 hours of data fetched
        };
    } catch (err) {
        console.error("Unexpected error fetching aggregated data:", err);
        return {
            status: 500,
            error: { message: err.message },
        };
    }
}
