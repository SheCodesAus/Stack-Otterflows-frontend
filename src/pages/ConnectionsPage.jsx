import { useEffect, useMemo, useState } from "react";
import { authFetch } from "../api/auth-fetch";
import getCurrentUser from "../api/getCurrentUser";
import "./ConnectionsPage.css";

function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .toString()
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusTone(status) {
  switch (status) {
    case "PENDING":
      return "pending";
    case "ACCEPTED":
      return "accepted";
    case "DECLINED":
      return "declined";
    case "BLOCKED":
      return "blocked";
    default:
      return "neutral";
  }
}

function formatDateTime(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getOtherUser(connection, currentUserId) {
  const isInviter = connection.inviter === currentUserId;

  if (isInviter) {
    return {
      id: connection.invitee,
      name:
        connection.invitee_display_name ||
        connection.invitee_username ||
        `User #${connection.invitee}`,
      username: connection.invitee_username || "",
    };
  }

  return {
    id: connection.inviter,
    name:
      connection.inviter_display_name ||
      connection.inviter_username ||
      `User #${connection.inviter}`,
    username: connection.inviter_username || "",
  };
}

function StatusChip({ status }) {
  return (
    <span className={`connection-status-chip connection-status-chip--${getStatusTone(status)}`}>
      {formatStatus(status)}
    </span>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="connections-empty-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function ConnectionRow({
  connection,
  currentUserId,
  actingConnectionId,
  onAccept,
  onDecline,
}) {
  const otherUser = getOtherUser(connection, currentUserId);
  const isIncomingInvite =
    connection.status === "PENDING" && connection.invitee === currentUserId;
  const isSentInvite =
    connection.status === "PENDING" && connection.inviter === currentUserId;

  const createdAtLabel = formatDateTime(connection.created_at);
  const respondedAtLabel = formatDateTime(connection.responded_at);
  const isBusy = actingConnectionId === connection.id;

  return (
    <article className="connection-row-card">
      <div className="connection-row-card__main">
        <div className="connection-row-card__top">
          <div className="connection-row-card__identity">
            <h3>{otherUser.name}</h3>

            {otherUser.username ? (
              <p className="connection-row-card__username">@{otherUser.username}</p>
            ) : null}
          </div>

          <StatusChip status={connection.status} />
        </div>

        <div className="connection-row-card__meta">
          {isIncomingInvite ? (
            <span className="connection-row-card__metaItem">Incoming invite</span>
          ) : null}

          {isSentInvite ? (
            <span className="connection-row-card__metaItem">Sent by you</span>
          ) : null}

          {createdAtLabel ? (
            <span className="connection-row-card__metaItem">
              Sent {createdAtLabel}
            </span>
          ) : null}

          {respondedAtLabel ? (
            <span className="connection-row-card__metaItem">
              Responded {respondedAtLabel}
            </span>
          ) : null}
        </div>
      </div>

      {isIncomingInvite ? (
        <div className="connection-row-card__actions">
          <button
            type="button"
            className="btn secondary"
            onClick={() => onDecline(connection.id)}
            disabled={isBusy}
          >
            {isBusy ? "Working..." : "Decline"}
          </button>

          <button
            type="button"
            className="btn primary"
            onClick={() => onAccept(connection.id)}
            disabled={isBusy}
          >
            {isBusy ? "Working..." : "Accept"}
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default function ConnectionsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [inviteeId, setInviteeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [actingConnectionId, setActingConnectionId] = useState(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  async function loadConnections(existingUser = null, showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      if (existingUser) {
        const response = await authFetch("connections/");
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.detail || `Failed to load connections (${response.status})`);
        }

        setConnections(Array.isArray(data) ? data : []);
        return;
      }

      const [userData, response] = await Promise.all([
        getCurrentUser(),
        authFetch("connections/"),
      ]);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || `Failed to load connections (${response.status})`);
      }

      setCurrentUser(userData);
      setConnections(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Something went wrong while loading connections.");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadConnections();
  }, []);

  const incomingInvites = useMemo(() => {
    if (!currentUser) return [];
    return connections.filter(
      (connection) =>
        connection.status === "PENDING" && connection.invitee === currentUser.id
    );
  }, [connections, currentUser]);

  const sentInvites = useMemo(() => {
    if (!currentUser) return [];
    return connections.filter(
      (connection) =>
        connection.status === "PENDING" && connection.inviter === currentUser.id
    );
  }, [connections, currentUser]);

  const acceptedConnections = useMemo(() => {
    return connections.filter((connection) => connection.status === "ACCEPTED");
  }, [connections]);

  const pastInvites = useMemo(() => {
    return connections.filter(
      (connection) =>
        connection.status === "DECLINED" || connection.status === "BLOCKED"
    );
  }, [connections]);

  async function handleInviteSubmit(event) {
    event.preventDefault();

    const cleanedInviteeId = inviteeId.trim();

    if (!cleanedInviteeId) {
      setFeedback("Please enter a user ID.");
      return;
    }

    const numericInviteeId = Number(cleanedInviteeId);

    if (!Number.isInteger(numericInviteeId) || numericInviteeId <= 0) {
      setFeedback("User ID must be a whole number.");
      return;
    }

    try {
      setSubmittingInvite(true);
      setFeedback("");

      const response = await authFetch("connections/", {
        method: "POST",
        body: JSON.stringify({
          invitee: numericInviteeId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || `Failed to send invite (${response.status})`);
      }

      setConnections((prev) => [data, ...prev]);
      setInviteeId("");
      setFeedback("Connection invite sent.");
    } catch (err) {
      setFeedback(err.message || "Could not send the connection invite.");
    } finally {
      setSubmittingInvite(false);
    }
  }

  async function handleAccept(connectionId) {
    try {
      setActingConnectionId(connectionId);
      setFeedback("");

      const response = await authFetch(`connections/${connectionId}/accept/`, {
        method: "POST",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || `Failed to accept invite (${response.status})`);
      }

      setFeedback("Connection accepted.");
      await loadConnections(currentUser, false);
    } catch (err) {
      setFeedback(err.message || "Could not accept the connection invite.");
    } finally {
      setActingConnectionId(null);
    }
  }

  async function handleDecline(connectionId) {
    try {
      setActingConnectionId(connectionId);
      setFeedback("");

      const response = await authFetch(`connections/${connectionId}/decline/`, {
        method: "POST",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || `Failed to decline invite (${response.status})`);
      }

      setFeedback("Connection declined.");
      await loadConnections(currentUser, false);
    } catch (err) {
      setFeedback(err.message || "Could not decline the connection invite.");
    } finally {
      setActingConnectionId(null);
    }
  }

  return (
    <section className="page-shell connections-page">
      <section className="connections-intro-panel">
        <div className="connections-intro">
          <h1>Connections</h1>
          <p>
            Manage your accountability network here. Accept invites, keep track of
            sent requests, and build your circle for goals and pods.
          </p>
        </div>
      </section>

      <section className="connections-stats-panel">
        <div className="connections-stat">
          <span className="connections-stat__label">Incoming invites</span>
          <strong>{loading ? "…" : incomingInvites.length}</strong>
        </div>

        <div className="connections-stat">
          <span className="connections-stat__label">Sent invites</span>
          <strong>{loading ? "…" : sentInvites.length}</strong>
        </div>

        <div className="connections-stat">
          <span className="connections-stat__label">Accepted connections</span>
          <strong>{loading ? "…" : acceptedConnections.length}</strong>
        </div>
      </section>

      <section className="connections-panel">
        <div className="connections-panel__header">
          <div>
            <h2>Invite a connection</h2>
            <p className="connections-panel__subtext">
              For now, invites are sent using a user ID while search is still being built.
            </p>
          </div>
        </div>

        <form className="connections-invite-form" onSubmit={handleInviteSubmit}>
          <div className="connections-field">
            <label htmlFor="inviteeId" className="connections-field__label">
              User ID
            </label>

            <input
              id="inviteeId"
              name="inviteeId"
              type="text"
              inputMode="numeric"
              placeholder="Enter a user ID"
              value={inviteeId}
              onChange={(event) => setInviteeId(event.target.value)}
              className="connections-field__input"
            />
          </div>

          <button
            type="submit"
            className="btn primary connections-invite-form__button"
            disabled={submittingInvite}
          >
            {submittingInvite ? "Sending..." : "Send Invite"}
          </button>
        </form>

        {feedback ? (
          <div className="connections-feedback-card">
            <p>{feedback}</p>
          </div>
        ) : null}
      </section>

      {loading ? (
        <div className="connections-state-card">
          <p>Loading connections...</p>
        </div>
      ) : null}

      {error ? (
        <div className="connections-state-card connections-state-card--error">
          <p>{error}</p>
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <section className="connections-panel">
            <div className="connections-panel__header">
              <div>
                <h2>Incoming invites</h2>
                <p className="connections-panel__subtext">
                  Accept the people you want in your accountability orbit.
                </p>
              </div>
            </div>

            {incomingInvites.length > 0 ? (
              <div className="connections-list">
                {incomingInvites.map((connection) => (
                  <ConnectionRow
                    key={connection.id}
                    connection={connection}
                    currentUserId={currentUser?.id}
                    actingConnectionId={actingConnectionId}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No incoming invites"
                text="When someone invites you to connect, it will appear here."
              />
            )}
          </section>

          <section className="connections-panel">
            <div className="connections-panel__header">
              <div>
                <h2>Sent invites</h2>
                <p className="connections-panel__subtext">
                  These invitations are still waiting for a response.
                </p>
              </div>
            </div>

            {sentInvites.length > 0 ? (
              <div className="connections-list">
                {sentInvites.map((connection) => (
                  <ConnectionRow
                    key={connection.id}
                    connection={connection}
                    currentUserId={currentUser?.id}
                    actingConnectionId={actingConnectionId}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No sent invites"
                text="Send an invite when you’re ready to add a buddy."
              />
            )}
          </section>

          <section className="connections-panel">
            <div className="connections-panel__header">
              <div>
                <h2>Accepted connections</h2>
                <p className="connections-panel__subtext">
                  These are the people you can build accountability with.
                </p>
              </div>
            </div>

            {acceptedConnections.length > 0 ? (
              <div className="connections-list">
                {acceptedConnections.map((connection) => (
                  <ConnectionRow
                    key={connection.id}
                    connection={connection}
                    currentUserId={currentUser?.id}
                    actingConnectionId={actingConnectionId}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No accepted connections yet"
                text="Once an invite is accepted, your connection will appear here."
              />
            )}
          </section>

          {pastInvites.length > 0 ? (
            <section className="connections-panel">
              <div className="connections-panel__header">
                <div>
                  <h2>Past invites</h2>
                  <p className="connections-panel__subtext">
                    A record of invitations that were declined or blocked.
                  </p>
                </div>
              </div>

              <div className="connections-list">
                {pastInvites.map((connection) => (
                  <ConnectionRow
                    key={connection.id}
                    connection={connection}
                    currentUserId={currentUser?.id}
                    actingConnectionId={actingConnectionId}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </section>
  );
}