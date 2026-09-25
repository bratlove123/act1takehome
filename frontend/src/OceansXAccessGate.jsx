import { useState } from "react";
import { unlockOceansX } from "./oceansxAccess";

/**
 * Full-page gate: user must enter OCEANS_X_ACCESS_KEY (verified server-side).
 */
export default function OceansXAccessGate({ onUnlocked }) {
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await unlockOceansX(accessKey.trim());
      onUnlocked();
    } catch (err) {
      setError(err.message || "Invalid access key");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-xl border border-slate-700/80 bg-slate-800/60 p-6 shadow-xl"
      >
        <div>
          <h2 className="text-lg font-semibold text-white">Oceans-X access required</h2>
          <p className="mt-1 text-xs text-slate-400">
            Enter the portal access key to continue. This is checked on the server and is not
            the MPA API key.
          </p>
        </div>

        <div>
          <label
            htmlFor="oceansx-access-key"
            className="mb-1 block text-xs font-medium text-slate-400"
          >
            Access key
          </label>
          <input
            id="oceansx-access-key"
            type="password"
            autoComplete="current-password"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            placeholder="Enter access key"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || !accessKey.trim()}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Verifying…" : "Unlock portal"}
        </button>
      </form>
    </div>
  );
}
