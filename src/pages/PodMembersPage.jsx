import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";
import "./PodDetailPage.css";
import "./PodMembersPage.css";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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
    case "ACTIVE":
      return "active";
    case "INVITED":
      return "planned";
    case "DECLINED":
    case "REMOVED":
      return "rejected";
    case "LEFT":
      return "inactive";
    default:
      return "inactive";
  }
}

function getRoleTone(role) {
  switch (role) {
    case "OWNER":
      return "approved";
    case "ADMIN":
      return "active";
    case "MEMBER":
      return "inactive";
    default:
      return "inactive";
  }
}

function getDisplayName(member) {
  return (
    member.user_display_name ||
    member.user_username ||
    `User ${member.user}`
  );
}

function getSearchUserDisplayName(user) {
  return user.display_name || user.username || `User ${user.id}`;
}

function getSearchUserUsername(user) {
  return user.username || "";
}

function getInitials(name) {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function StatusPill({ children, tone = "inactive" }) {
  return (
    <span className={`pod-status-pill pod-status-pill--${tone}`}>
      {children}
    </span>
  );
}

function HeroStat({ label, value }) {
  return (
    <div className="pod-hero-stat">
      <span className="pod-hero-stat__label">{label}</span>
      <strong className="pod-hero-stat__value">{value}</strong>
    </div>
  );
}

export default function PodMembersPage() {
  const { podId } = useParams();

  const [pod, setPod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [invitingUserId, setInvitingUserId] = useState(null);

  const loadPod = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await authFetch(`pods/${podId}/`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to load pod members.");
      }

      setPod(data);
    } catch (err) {
      setError(err.message || "Something went wrong while loading members.");
    } finally {
      setLoading(false);
    }
  }, [podId]);

  useEffect(() => {
    loadPod();
  }, [loadPod]);

  const activeMembers = useMemo(() => {
    const memberships = pod?.memberships ?? [];
    return memberships.filter((member) => member.status === "ACTIVE");
  }, [pod?.memberships]);

  const invitedMembers = useMemo(() => {
    const memberships = pod?.memberships ?? [];
    return memberships.filter((member) => member.status === "INVITED");
  }, [pod?.memberships]);

  const ownerCount = useMemo(() => {
    return activeMembers.filter((member) => member.role === "OWNER").length;
  }, [activeMembers]);

  const adminCount = useMemo(() => {
    return activeMembers.filter((member) => member.role === "ADMIN").length;
  }, [activeMembers]);

  useEffect(() => {
    const trimmed = searchTerm.trim();

    if (trimmed.length < 2) {
      setSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError("");

        const response = await authFetch(
          `pods/${podId}/invite-candidates/?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );

        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(data?.detail || "Could not search connections.");
        }

        setSearchResults(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name === "AbortError") return;
        setSearchError(err.message || "Could not search connections.");
        setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [podId, searchTerm]);

  async function handleInviteUser(userId) {
    try {
      setInvitingUserId(userId);
      setInviteError("");
      setInviteSuccess("");

      const response = await authFetch("pod-memberships/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pod: Number(pod.id),
          user: Number(userId),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Could not send invite.");
      }

      setInviteSuccess("Invite sent.");
      setSearchTerm("");
      setSearchResults([]);
      await loadPod();
    } catch (err) {
      setInviteError(err.message || "Could not send invite.");
    } finally {
      setInvitingUserId(null);
    }
  }

  if (loading) {
    return (
      <section className="page-shell pod-members-page">
        <div className="pod-members-topbar">
          <Link to={`/pods/${podId}`} className="pod-detail-backlink">
            <span aria-hidden="true">←</span>
            <span>Back to Pod</span>
          </Link>
        </div>

        <div className="pod-card">
          <p className="pod-empty-text">Loading members...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-shell pod-members-page">
        <div className="pod-members-topbar">
          <Link to={`/pods/${podId}`} className="pod-detail-backlink">
            <span aria-hidden="true">←</span>
            <span>Back to Pod</span>
          </Link>
        </div>

        <div className="pod-card">
          <p className="pod-empty-text">{error}</p>
        </div>
      </section>
    );
  }

  if (!pod) {
    return (
      <section className="page-shell pod-members-page">
        <div className="pod-members-topbar">
          <Link to={`/pods/${podId}`} className="pod-detail-backlink">
            <span aria-hidden="true">←</span>
            <span>Back to Pod</span>
          </Link>
        </div>

        <div className="pod-card">
          <p className="pod-empty-text">Pod not found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell pod-members-page">
      <div className="pod-members-topbar">
        <Link to={`/pods/${pod.id}`} className="pod-detail-backlink">
          <span aria-hidden="true">←</span>
          <span>Back to Pod</span>
        </Link>
      </div>

      <header className="pod-card pod-members-hero">
        <div className="pod-members-hero__eyebrow">Manage Members</div>
        <h1>{pod.name}</h1>
        <p className="pod-members-hero__summary">
          Invite accepted connections, view active members, and keep track of
          pending invites.
        </p>

        <div className="pod-members-hero__stats">
          <HeroStat label="Active members" value={activeMembers.length} />
          <HeroStat label="Pending invites" value={invitedMembers.length} />
          <HeroStat label="Owners" value={ownerCount} />
          <HeroStat label="Admins" value={adminCount} />
        </div>
      </header>

      <section className="pod-members-grid">
        <div className="pod-members-main">
          <article className="pod-card">
            <div className="pod-card__header">
              <h2 className="pod-card__title pod-card__title--accent">
                Invite from Connections
              </h2>
              <p>Search your accepted connections and invite them into this pod.</p>
            </div>

            <div className="pod-membership-search">
              <label className="pod-field-label" htmlFor="pod-member-search">
                Search your connections
              </label>

              <input
                id="pod-member-search"
                className="pod-input"
                type="text"
                placeholder="Search by name or username"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setInviteError("");
                  setInviteSuccess("");
                }}
              />
            </div>

            {searchLoading ? (
              <p className="pod-feedback">Searching connections...</p>
            ) : null}

            {searchError ? (
              <p className="pod-feedback pod-feedback--error">{searchError}</p>
            ) : null}

            {!searchLoading &&
            !searchError &&
            searchTerm.trim().length >= 2 &&
            !searchResults.length ? (
              <p className="pod-feedback">
                No matching accepted connections are available to invite.
              </p>
            ) : null}

            {searchResults.length ? (
              <div className="pod-search-results">
                {searchResults.map((user) => {
                  const displayName = getSearchUserDisplayName(user);
                  const username = getSearchUserUsername(user);

                  return (
                    <div key={user.id} className="pod-search-result">
                      <div className="pod-search-result__identity">
                        <div className="pod-member-avatar" aria-hidden="true">
                          {getInitials(displayName)}
                        </div>

                        <div className="pod-search-result__content">
                          <strong>{displayName}</strong>

                          <div className="pod-search-result__metaRow">
                            {username ? (
                              <span className="pod-search-result__meta">
                                @{username}
                              </span>
                            ) : null}

                            {user.connection_status === "ACCEPTED" ? (
                              <span className="pod-search-result__badge">
                                Connected
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn secondary"
                        disabled={invitingUserId === user.id}
                        onClick={() => handleInviteUser(user.id)}
                      >
                        {invitingUserId === user.id ? "Inviting..." : "Invite"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {inviteError ? (
              <p className="pod-feedback pod-feedback--error">{inviteError}</p>
            ) : null}

            {inviteSuccess ? (
              <p className="pod-feedback pod-feedback--success">
                {inviteSuccess}
              </p>
            ) : null}
          </article>

          <article className="pod-card">
            <div className="pod-card__header pod-card__header--split">
              <div>
                <h2 className="pod-card__title pod-card__title--accent">
                  Active Members
                </h2>
                <p>These members are currently active in the pod.</p>
              </div>

              <span className="pod-card__count">
                {activeMembers.length}{" "}
                {activeMembers.length === 1 ? "member" : "members"}
              </span>
            </div>

            {activeMembers.length ? (
              <div className="pod-member-list">
                {activeMembers.map((member) => {
                  const displayName = getDisplayName(member);

                  return (
                    <div key={member.id} className="pod-member-row">
                      <div className="pod-member-row__identity">
                        <div className="pod-member-avatar" aria-hidden="true">
                          {getInitials(displayName)}
                        </div>

                        <div className="pod-member-row__content">
                          <strong>{displayName}</strong>
                          <span className="pod-member-row__meta">
                            Joined {formatDate(member.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="pod-member-row__pills">
                        <StatusPill tone={getRoleTone(member.role)}>
                          {formatStatus(member.role)}
                        </StatusPill>
                        <StatusPill tone={getStatusTone(member.status)}>
                          {formatStatus(member.status)}
                        </StatusPill>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="pod-empty-text">No active members yet.</p>
            )}
          </article>

          <article className="pod-card">
            <div className="pod-card__header pod-card__header--split">
              <div>
                <h2 className="pod-card__title pod-card__title--accent">
                  Pending Invites
                </h2>
                <p>These people have been invited but haven’t responded yet.</p>
              </div>

              <span className="pod-card__count">
                {invitedMembers.length}{" "}
                {invitedMembers.length === 1 ? "invite" : "invites"}
              </span>
            </div>

            {invitedMembers.length ? (
              <div className="pod-member-list">
                {invitedMembers.map((member) => {
                  const displayName = getDisplayName(member);

                  return (
                    <div key={member.id} className="pod-member-row">
                      <div className="pod-member-row__identity">
                        <div className="pod-member-avatar" aria-hidden="true">
                          {getInitials(displayName)}
                        </div>

                        <div className="pod-member-row__content">
                          <strong>{displayName}</strong>
                          <span className="pod-member-row__meta">
                            Invited {formatDate(member.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="pod-member-row__pills">
                        <StatusPill tone={getRoleTone(member.role)}>
                          {formatStatus(member.role)}
                        </StatusPill>
                        <StatusPill tone="planned">
                          {formatStatus(member.status)}
                        </StatusPill>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="pod-empty-text">No pending invites right now.</p>
            )}
          </article>
        </div>

        <aside className="pod-members-side">
          <article className="pod-card">
            <div className="pod-card__header">
              <h2 className="pod-card__title">Membership Rules</h2>
            </div>

            <div className="pod-summary-list">
              <div className="pod-summary-row">
                <span>Invite source</span>
                <strong>Accepted connections only</strong>
              </div>

              <div className="pod-summary-row">
                <span>Already active</span>
                <strong>Cannot be invited again</strong>
              </div>

              <div className="pod-summary-row">
                <span>Already invited</span>
                <strong>Cannot be invited again</strong>
              </div>

              <div className="pod-summary-row">
                <span>Former members</span>
                <strong>Can be re-invited</strong>
              </div>
            </div>

            <p className="pod-side-note">
              Connections are your broader network across the app. Pod members
              are people inside this specific pod.
            </p>
          </article>
        </aside>
      </section>
    </section>
  );
}