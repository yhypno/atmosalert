export type Health = {
  status: string;
  service: string;
  version: string;
  environment: string;
  model_ready: boolean;
};

export async function getHealth(signal?: AbortSignal): Promise<Health> {
  const response = await fetch("/v1/health", {
    signal: signal ?? AbortSignal.timeout(8000),
  });
  if (!response.ok)
    throw new Error("The weather service is currently unreachable.");
  const data = await response.json();
  if (typeof data.model_ready !== "boolean")
    throw new Error("The weather service returned an unexpected response.");
  return data;
}

export async function requestNowcast(
  region: { west: number; south: number; east: number; north: number },
  horizon: number,
  hazard: string,
  signal: AbortSignal,
) {
  const response = await fetch("/v1/nowcasts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      region,
      horizons_hours: [horizon],
      event_types: [hazard],
    }),
  });
  if (response.status === 503)
    throw new Error(
      "Live forecasts are not available yet. The forecasting model is not connected.",
    );
  if (!response.ok)
    throw new Error(
      "The forecast service could not complete this request. Please try again.",
    );
  // Live grid schema is not implemented by the current backend. Never display
  // demo values as a substitute for a successful but unsupported live response.
  await response.json();
  return "The service responded, but live map rendering is not available in this prototype yet.";
}
