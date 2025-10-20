import { NavLink } from 'react-router-dom';

export const Navigation = () => {
  return (
    <nav className="nav">
      <div className="nav__brand">
        <h1>PilotGB Control Tower</h1>
        <p>Coordinate data initiatives, safeguard scope, and track delivery health.</p>
      </div>
      <ul className="nav__menu">
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav__link nav__link--active' : 'nav__link'}>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/projects" className={({ isActive }) => isActive ? 'nav__link nav__link--active' : 'nav__link'}>
            Projects
          </NavLink>
        </li>
        <li>
          <NavLink to="/team" className={({ isActive }) => isActive ? 'nav__link nav__link--active' : 'nav__link'}>
            Team
          </NavLink>
        </li>
        <li>
          <NavLink to="/scope" className={({ isActive }) => isActive ? 'nav__link nav__link--active' : 'nav__link'}>
            Scope
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};