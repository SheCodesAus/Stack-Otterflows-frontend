import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate, useParams } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";
import "./ConnectionSharePage.css";

export default function PodSharePage() {
  const navigate = useNavigate();
  const { podId } = useParams();

  const [inviteUrl, setInviteUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [podName, setPodName] = useState("");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadPodQr = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setFeedback("");

      const response = await authFetch(`pods/${podId}/qr/`, {
        method: "POST",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Could not load this pod QR.");
      }

      setInviteUrl(data.invite_url || "");
      setExpiresAt(data.expires_at || "");
      setPodName(data.pod_name || "this pod");
    } catch (err) {
      setError(err.message || "Could not load this pod QR.");
    } finally {
      setLoading(false);
    }
  }, [podId]);

  useEffect(() => {
    loadPodQr();
  }, [loadPodQr]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setFeedback("Link copied.");
    } catch {
      setFeedback("Could not copy the link.");
    }
  }

  async function handleShare() {
    if (!inviteUrl) return;

    try {
      setSharing(true);
      setFeedback("");

      if (navigator.share && window.isSecureContext) {
        await navigator.share({
          title: `Join ${podName} on PodFlow`,
          text: `Scan this QR code or open this link to join ${podName} on PodFlow.`,
          url: inviteUrl,
        });
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        setFeedback("Sharing is not available here, so the link was copied instead.");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        setFeedback("Could not open the share menu.");
      }
    } finally {
      setSharing(false);
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
    <section className="page-shell connection-share-page">
      <section className="connection-share-card">
        <div className="connection-share-card__top">
          <button
            type="button"
            className="btn secondary"
            onClick={() => navigate(`/pods/${podId}`)}
          >
            Back
          </button>
        </div>

        <header className="connection-share-card__header">
          <h1>Invite People to This Pod</h1>
          <p>Scan this QR code to join {podName} on PodFlow.</p>
        </header>

        {loading ? (
          <div className="connections-state-card">
            <p>Loading pod QR...</p>
          </div>
        ) : null}

        {error ? (
          <div className="connections-state-card connections-state-card--error">
            <p>{error}</p>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="connection-share-card__qrWrap">
              <div className="connection-share-card__qrBox">
                <QRCodeSVG
                  value={inviteUrl}
                  size={280}
                  includeMargin
                  title="PodFlow pod invite QR code"
                />
              </div>
            </div>

            <div className="connection-share-card__meta">
              <p className="connection-share-card__hint">
                Scanning this gives someone an invite they can accept to join this pod.
              </p>

              <div className="connection-share-card__linkbox">
                <span>{inviteUrl}</span>
              </div>

              <div className="connection-share-card__actions">
                <button
                  type="button"
                  className="btn primary"
                  onClick={handleShare}
                  disabled={sharing}
                >
                  {sharing ? "Opening..." : "Share Link"}
                </button>

                <button
                  type="button"
                  className="btn secondary"
                  onClick={handleCopy}
                >
                  Copy Link
                </button>

                <button
                  type="button"
                  className="btn secondary"
                  onClick={loadPodQr}
                >
                  Refresh QR
                </button>
              </div>

              {expiresLabel ? (
                <p className="connection-share-card__expiry">
                  QR code expires {expiresLabel}
                </p>
              ) : null}

              {feedback ? (
                <div className="connections-feedback-card">
                  <p>{feedback}</p>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </section>
    </section>
  );
}