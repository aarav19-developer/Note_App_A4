import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          {/* S Letter SVG Symbol */}
          <svg className="brand-svg" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="#e53935" />
            <path
              d="M26 13C26 13 22 11 18 13C14 15 15 19 18 20.5C21 22 25 22.5 25 26C25 29.5 21 31 17 29"
              stroke="white"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <span className="brand-name">ShoutHub</span>
        </div>
        <div className="navbar-links">
          <a href="#" className="nav-link">Home</a>
          <a href="#" className="nav-link">Notes</a>
          <a href="#" className="nav-link">About</a>
          <a href="#" className="nav-btn">Get Started</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
