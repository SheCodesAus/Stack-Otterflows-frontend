import "./LoadingState.css";

export default function LoadingState({
  title = "Loading",
  message = "Just a moment while we get things ready.",
  inline = false,
}) {
  return (
    <div className={inline ? "loading-state loading-state--inline" : "loading-state"}>
      <div className="loading-state__spinner" aria-hidden="true" />
      <div className="loading-state__content">
        <p className="loading-state__title">{title}</p>
        {message ? <p className="loading-state__message">{message}</p> : null}
      </div>
    </div>
  );
}