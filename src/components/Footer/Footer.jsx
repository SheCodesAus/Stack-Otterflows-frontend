import "./Footer.css"; // footer styles

/* Images of our heads from img folder */
import inano from "../../img/1 (1).png"; // Inano image
import mahounda from "../../img/2 (1).png"; // Mahounda image
import becky from "../../img/3 (1).png"; // Becky image
import nancy from "../../img/4 (1).png"; // Nancy image

import { Link } from "react-router-dom"; // (not used here but available if needed)

export default function Footer() {
  const year = new Date().getFullYear(); // current year

  return (
    <footer className="bf-footer">
      <div className="bf-footer__inner">
        <div className="bf-footer__loveRow">
          {/* Footer message */}
          <p className="bf-footer__loveText">Made with a whole OTTER love</p>

          {/* Team member links */}
          <div className="bf-footer__socialMinimal" aria-label="Social links">
            
            <a
              className="bf-footer__iconMinimal"
              href="https://www.linkedin.com/in/inanoknowles/" // LinkedIn profile
              target="_blank" // open in new tab
              rel="noopener noreferrer" // security best practice
              aria-label="inano"
              title="inano"
            >
              <img src={inano} alt="inano" /> {/* profile image */}
            </a>

            <a
              className="bf-footer__iconMinimal"
              href="https://www.linkedin.com/in/mahounda-poinsonnet-971a4115/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="mahounda"
              title="mahounda"
            >
              <img src={mahounda} alt="mahounda" />
            </a>

            <a
              className="bf-footer__iconMinimal"
              href="https://www.linkedin.com/in/rebecca-c-52141625/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="becky"
              title="becky"
            >
              <img src={becky} alt="becky" />
            </a>

            <a
              className="bf-footer__iconMinimal"
              href="https://www.linkedin.com/in/nancyvalentind/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="nancy"
              title="nancy"
            >
              <img src={nancy} alt="nancy" />
            </a>

          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="bf-footer__bottom">
        <div className="bf-footer__bottomInner">
          <span>© {year} PodFlow Team</span> {/* dynamic year */}
          <span className="bf-footer__sep" aria-hidden="true">•</span>
        </div>
      </div>
    </footer>
  );
}