export default async function handler(req, res) {
  res.setHeader("access-control-allow-origin", "*");

  try {
    const bundleId = String(req.query.bundleId || "").trim();
    if (!bundleId) return res.status(400).json({ ok: false, error: "Missing bundleId" });

    const url = `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(bundleId)}`;
    const appleRes = await fetch(url);
    const data = await appleRes.json();
    const item = data.results?.[0] || null;

    return res.status(200).json({
      ok: true,
      found: Boolean(item),
      apple: item ? {
        trackName: item.trackName || "",
        version: item.version || "",
        bundleId: item.bundleId || "",
        primaryGenreName: item.primaryGenreName || "",
        averageUserRating: item.averageUserRating ?? 0,
        userRatingCount: item.userRatingCount ?? 0,
        artworkUrl512: item.artworkUrl512 || "",
        screenshotUrls: item.screenshotUrls || [],
        ipadScreenshotUrls: item.ipadScreenshotUrls || [],
        supportedDevices: item.supportedDevices || [],
        trackViewUrl: item.trackViewUrl || ""
      } : null
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
