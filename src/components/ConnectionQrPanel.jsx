import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { authFetch } from "../api/auth-fetch";

export default function ConnectionQrPanel() {
  const [inviteUrl, setInviteUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    loadQrInvite();
  }, []);

  async function loadQrInvite() {
    try {
      setLoading(true);
      setError("");
      setFeedback("");

      const response = await authFetch("connection-invites/qr/", {
        method: "POST",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to load QR invite.");
      }

      setInviteUrl(data.invite_url || "");
      setExpiresAt(data.expires_at || "");
    } catch (err) {
      setError(err.message || "Failed to load QR invite.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      if (!inviteUrl) return;
      setCopying(true);
      await navigator.clipboard.writeText(inviteUrl);
      setFeedback("Invite link copied.");
    } catch {
      setFeedback("Could not copy the invite link.");
    } finally {
      setCopying(false);
    }
  }

  const expiresLabel = expiresAt
    ? new Date(expiresAt).toLocaleString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  return (
    <section className="connections-panel connection-qr-panel">
      <div className="connections-panel__header">
        <div>
          <h2>Show your QR</h2>
          <p className="connections-panel__subtext">
            Let someone scan this to send you a connection invite.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="connections-state-card">
          <p>Loading your QR…</p>
        </div>
      ) : null}

      {error ? (
        <div className="connections-state-card connections-state-card--error">
          <p>{error}</p>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="connection-qr-panel__content">
          <div className="connection-qr-panel__code">
            <QRCodeSVG value={inviteUrl} size={220} includeMargin />
          </div>

          <div className="connection-qr-panel__details">
            <p className="connection-qr-panel__hint">
              Scanning this opens PodFlow and creates a normal pending connection invite.
            </p>

            <div className="connection-qr-panel__linkbox">
              <span>{inviteUrl}</span>
            </div>

            <div className="connection-qr-panel__actions">
              <button
                type="button"
                className="btn secondary"
                onClick={handleCopy}
                disabled={copying}
              >
                {copying ? "Copying..." : "Copy Link"}
              </button>

              <button
                type="button"
                className="btn primary"
                onClick={loadQrInvite}
              >
                Refresh QR
              </button>
            </div>

            {expiresLabel ? (
              <p className="connection-qr-panel__expiry">
                Expires {expiresLabel}
              </p>
            ) : null}

            {feedback ? (
              <div className="connections-feedback-card">
                <p>{feedback}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}