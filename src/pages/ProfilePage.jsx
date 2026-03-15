import { useEffect, useMemo, useState } from "react";
import { authFetch } from "../api/auth-fetch";
import "./ProfilePage.css";

function getInitials(name, username) {
  const source = (name || username || "").trim();

  if (!source) return "?";

  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await authFetch("profile/");
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.detail || "Failed to load profile.");
        }

        setProfile(data);
        setDisplayName(data.display_name || "");
        setRemoveAvatar(false);
      } catch (err) {
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const previewUrl = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }

    if (removeAvatar) {
      return "";
    }

    return profile?.avatar_url || profile?.avatar || "";
  }, [avatarFile, removeAvatar, profile]);

  useEffect(() => {
    return () => {
      if (avatarFile) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [avatarFile, previewUrl]);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("display_name", displayName.trim());
      formData.append("remove_avatar", String(removeAvatar));

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const response = await authFetch("profile/", {
        method: "PATCH",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const firstEntry = Object.entries(data)[0];

        if (firstEntry) {
          const [field, messages] = firstEntry;
          const message = Array.isArray(messages) ? messages[0] : messages;
          throw new Error(`${field}: ${message}`);
        }

        throw new Error(data?.detail || "Failed to save profile.");
      }

      setProfile(data);
      setDisplayName(data.display_name || "");
      setAvatarFile(null);
      setRemoveAvatar(false);
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0] || null;
    setAvatarFile(file);
    if (file) {
      setRemoveAvatar(false);
    }
  }

  function handleRemoveAvatar() {
    setAvatarFile(null);
    setRemoveAvatar(true);
    setSuccess("");
    setError("");
  }

  if (loading) {
    return (
      <section className="page-shell profile-page">
        <h1>Profile</h1>
        <p>Loading profile...</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="page-shell profile-page">
        <h1>Profile</h1>
        <p>Profile not found.</p>
      </section>
    );
  }

  return (
    <section className="page-shell profile-page">
      <header className="profile-page__header">
        <h1>Profile</h1>
        <p>Update your display name and photo.</p>
      </header>

      {error ? <p className="profile-feedback profile-feedback--error">{error}</p> : null}
      {success ? <p className="profile-feedback profile-feedback--success">{success}</p> : null}

      <article className="profile-card">
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-form__layout">
            <div className="profile-avatar-panel">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar profile-avatar--placeholder">
                  {getInitials(displayName, profile.username)}
                </div>
              )}

              <div className="profile-avatar-actions">
                <label className="btn secondary profile-upload-btn">
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    hidden
                  />
                </label>

                {(profile.avatar_url || avatarFile) && !removeAvatar ? (
                  <button
                    type="button"
                    className="btn ghost-danger"
                    onClick={handleRemoveAvatar}
                  >
                    Remove Photo
                  </button>
                ) : null}
              </div>

              <p className="profile-hint">
                Use a square photo for the cleanest result.
              </p>
            </div>

            <div className="profile-fields">
              <div className="profile-field">
                <label htmlFor="profile-display-name">Display name</label>
                <input
                  id="profile-display-name"
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Enter display name"
                  maxLength="100"
                />
              </div>

              <div className="profile-field">
                <label>Username</label>
                <div className="profile-readonly">{profile.username || "—"}</div>
              </div>

              <div className="profile-field">
                <label>Email</label>
                <div className="profile-readonly">{profile.email || "—"}</div>
              </div>

              <div className="profile-actions">
                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </article>
    </section>
  );
}