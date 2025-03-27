import "../Styles/NotFound.css"; // Import the CSS file
import LandingHeader from "../components/LandingHeader";
import Header from "../components/Header";
import '../styles/LandingHeader.css';
import { useAuth } from "./AuthContext"; 

const NotFound = () => {
  const { userData } = useAuth(); // Access userData from AuthContext
  const hasHome = userData?.homeId ? true : false;
  return (
    <>
      {hasHome ? <Header /> : <LandingHeader />}
      <div className="notfound-container">
        <h1 className="notfound-title">404 - Page Not Found</h1>
        <p className="notfound-description">Sorry, the page you are looking for does not exist.</p>
      </div>
    </>
  );
};

export default NotFound;