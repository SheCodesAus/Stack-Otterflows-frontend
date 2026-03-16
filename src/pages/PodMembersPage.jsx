import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";
import getCurrentUser from "../api/getCurrentUser";
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

function RowActionButton({
  children,
  onClick,
  danger = false,
  disabled = false,
}) {
  return (
    <button
      type="button"
      className={`pod-row-action ${danger ? "pod-row-action--danger" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default function PodMembersPage() {
  const { podId } = useParams();

  const [pod, setPod] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [invitingUserId, setInvitingUserId] = useState(null);

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionState, setActionState] = useState({
    membershipId: null,
    type: "",
  });

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

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const user = await getCurrentUser();
        if (isMounted) {
          setCurrentUser(user);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
        }
      }
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeMembers = useMemo(() => {
    const memberships = pod?.memberships ?? [];
    return memberships.filter((member) => member.status === "ACTIVE");
  }, [pod?.memberships]);

  const invitedMembers = useMemo(() => {
    const memberships = pod?.memberships ?? [];
    return memberships.filter((member) => member.status === "INVITED");
  }, [pod?.memberships]);

const adminCount = useMemo(() => {
  return activeMembers.filter((member) => member.role === "ADMIN").length;
}, [activeMembers]);

  const viewerMembership = useMemo(() => {
    if (!currentUser || !pod?.memberships?.length) return null;

    return (
      pod.memberships.find((member) => member.user === currentUser.id) ||
      pod.memberships.find(
        (member) =>
          currentUser.username &&
          member.user_username &&
          member.user_username === currentUser.username
      ) ||
      null
    );
  }, [currentUser, pod?.memberships]);

  const viewerRole = viewerMembership?.role || null;
  const canManageInvites = viewerRole === "OWNER" || viewerRole === "ADMIN";

  function isSelf(member) {
    if (!currentUser) return false;

    return (
      member.user === currentUser.id ||
      (currentUser.username &&
        member.user_username &&
        member.user_username === currentUser.username)
    );
  }

  function canChangeRole(member) {
    return (
      viewerRole === "OWNER" &&
      member.role !== "OWNER" &&
      !isSelf(member) &&
      member.status === "ACTIVE"
    );
  }

  function canRemoveMember(member) {
    if (member.status !== "ACTIVE") return false;
    if (member.role === "OWNER") return false;
    if (isSelf(member)) return false;

    if (viewerRole === "OWNER") return true;
    if (viewerRole === "ADMIN") return member.role === "MEMBER";

    return false;
  }

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
      setActionError("");
      setActionSuccess("");

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

  async function runMembershipAction({
    membershipId,
    type,
    endpoint,
    method = "POST",
    body = null,
    successMessage,
  }) {
    try {
      setActionState({ membershipId, type });
      setActionError("");
      setActionSuccess("");
      setInviteError("");
      setInviteSuccess("");

      const response = await authFetch(endpoint, {
        method,
        headers: body
          ? {
              "Content-Type": "application/json",
            }
          : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "That action could not be completed.");
      }

      setActionSuccess(successMessage);
      await loadPod();
    } catch (err) {
      setActionError(err.message || "That action could not be completed.");
    } finally {
      setActionState({ membershipId: null, type: "" });
    }
  }

  function isBusy(membershipId, type) {
    return (
      actionState.membershipId === membershipId && actionState.type === type
    );
  }

  function handleToggleRole(member) {
    const nextRole = member.role === "ADMIN" ? "MEMBER" : "ADMIN";

    runMembershipAction({
      membershipId: member.id,
      type: "role",
      endpoint: `pod-memberships/${member.id}/role/`,
      method: "PATCH",
      body: { role: nextRole },
      successMessage: `${getDisplayName(member)} is now ${formatStatus(nextRole)}.`,
    });
  }

  function handleRemoveMember(member) {
    const confirmed = window.confirm(
      `Remove ${getDisplayName(member)} from this pod?`
    );

    if (!confirmed) return;

    runMembershipAction({
      membershipId: member.id,
      type: "remove",
      endpoint: `pod-memberships/${member.id}/remove/`,
      successMessage: `${getDisplayName(member)} was removed from the pod.`,
    });
  }

  function handleCancelInvite(member) {
    const confirmed = window.confirm(
      `Cancel the invite for ${getDisplayName(member)}?`
    );

    if (!confirmed) return;

    runMembershipAction({
      membershipId: member.id,
      type: "cancel",
      endpoint: `pod-memberships/${member.id}/cancel/`,
      successMessage: `Invite cancelled for ${getDisplayName(member)}.`,
    });
  }

  function handleResendInvite(member) {
    runMembershipAction({
      membershipId: member.id,
      type: "resend",
      endpoint: `pod-memberships/${member.id}/resend/`,
      successMessage: `Invite resent to ${getDisplayName(member)}.`,
    });
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

      <header className="pod-card pod-members-header">
        <div className="pod-members-header__top">
          <div className="pod-members-header__copy">
            <p className="pod-members-header__section-label">Manage members</p>
            <h1>{pod.name}</h1>
            <p className="pod-members-header__summary">
              Invite people, manage roles, and keep this pod tidy.
            </p>
          </div>
        </div>

        <div className="pod-members-header__stats">
          <HeroStat label="Active members" value={activeMembers.length} />
          <HeroStat label="Pending invites" value={invitedMembers.length} />
          <HeroStat label="Admins" value={adminCount} />
        </div>
      </header>

      {actionError ? (
        <div className="pod-card pod-members-inline-message">
          <p className="pod-feedback pod-feedback--error">{actionError}</p>
        </div>
      ) : null}

      {actionSuccess ? (
        <div className="pod-card pod-members-inline-message">
          <p className="pod-feedback pod-feedback--success">{actionSuccess}</p>
        </div>
      ) : null}

      <section className="pod-members-intro">
        <article className="pod-card">
          <div className="pod-card__header">
            <h2 className="pod-card__title pod-card__title--accent">
              Invite from Connections
            </h2>
            <p>
              Search accepted connections and invite them into this pod.
            </p>
          </div>

          {canManageInvites ? (
            <>
              <div className="pod-membership-search">
                <label className="pod-field-label" htmlFor="pod-member-search">
                  Search your connections
                </label>

                <p className="pod-members-inline-help">
                  Accepted connections only. Existing members and pending invites
                  are excluded automatically.
                </p>

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
                    setActionError("");
                    setActionSuccess("");
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

                            <div className="pod-search-result__meta-row">
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
            </>
          ) : (
            <p className="pod-side-note">
              Only pod owners and admins can invite people into this pod.
            </p>
          )}
        </article>
      </section>

      <article className="pod-card">
        <div className="pod-card__header pod-card__header--split">
          <div>
            <h2 className="pod-card__title pod-card__title--accent">
              Active Members
            </h2>
            <p>These people are currently active in the pod.</p>
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
              const showRoleButton = canChangeRole(member);
              const showRemoveButton = canRemoveMember(member);

              return (
                <div key={member.id} className="pod-member-row">
                  <div className="pod-member-row__main">
                    <div className="pod-member-avatar" aria-hidden="true">
                      {getInitials(displayName)}
                    </div>

                    <div className="pod-member-row__content">
                      <div className="pod-member-row__headline">
                        <strong>{displayName}</strong>

                        <div className="pod-member-row__pills">
                          <StatusPill tone={getRoleTone(member.role)}>
                            {formatStatus(member.role)}
                          </StatusPill>
                          <StatusPill tone={getStatusTone(member.status)}>
                            {formatStatus(member.status)}
                          </StatusPill>
                        </div>
                      </div>

                      <div className="pod-member-row__meta-line">
                        {member.user_username ? (
                          <span>@{member.user_username}</span>
                        ) : null}
                        <span>Joined {formatDate(member.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {(showRoleButton || showRemoveButton) && (
                    <div className="pod-member-row__actions">
                      {showRoleButton ? (
                        <RowActionButton
                          disabled={isBusy(member.id, "role")}
                          onClick={() => handleToggleRole(member)}
                        >
                          {isBusy(member.id, "role")
                            ? "Saving..."
                            : member.role === "ADMIN"
                            ? "Make member"
                            : "Make admin"}
                        </RowActionButton>
                      ) : null}

                      {showRemoveButton ? (
                        <RowActionButton
                          danger
                          disabled={isBusy(member.id, "remove")}
                          onClick={() => handleRemoveMember(member)}
                        >
                          {isBusy(member.id, "remove")
                            ? "Removing..."
                            : "Remove"}
                        </RowActionButton>
                      ) : null}
                    </div>
                  )}
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
            <p>These invites are still waiting for a response.</p>
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
                  <div className="pod-member-row__main">
                    <div className="pod-member-avatar" aria-hidden="true">
                      {getInitials(displayName)}
                    </div>

                    <div className="pod-member-row__content">
                      <div className="pod-member-row__headline">
                        <strong>{displayName}</strong>

                        <div className="pod-member-row__pills">
                          <StatusPill tone={getRoleTone(member.role)}>
                            {formatStatus(member.role)}
                          </StatusPill>
                          <StatusPill tone="planned">
                            {formatStatus(member.status)}
                          </StatusPill>
                        </div>
                      </div>

                      <div className="pod-member-row__meta-line">
                        {member.user_username ? (
                          <span>@{member.user_username}</span>
                        ) : null}
                        <span>Invited {formatDate(member.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {canManageInvites ? (
                    <div className="pod-member-row__actions">
                      <RowActionButton
                        disabled={isBusy(member.id, "resend")}
                        onClick={() => handleResendInvite(member)}
                      >
                        {isBusy(member.id, "resend")
                          ? "Resending..."
                          : "Resend"}
                      </RowActionButton>

                      <RowActionButton
                        danger
                        disabled={isBusy(member.id, "cancel")}
                        onClick={() => handleCancelInvite(member)}
                      >
                        {isBusy(member.id, "cancel")
                          ? "Cancelling..."
                          : "Cancel"}
                      </RowActionButton>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="pod-empty-text">No pending invites right now.</p>
        )}
      </article>
    </section>
  );
}