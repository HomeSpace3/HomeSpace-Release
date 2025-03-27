import '../styles/Button.css'; // Import the CSS file

export const Button = ({ children, className, disabled, onClick }) => {
  return (
    <button
      className={`btn ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};