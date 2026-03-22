import "./Footer.css";

import inano from "../../../img/1 (1).png";
import mahounda from "../../../img/2 (1).png";
import becky from "../../../img/3 (1).png";
import nancy from "../../../img/4 (1).png";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bf-footer">
      <div className="bf-footer__inner">
        <p className="bf-footer__loveText">Made with a whole OTTER love</p>

        <div className="bf-footer__socialMinimal" aria-label="Team links">
          <a
            className="bf-footer__iconMinimal"
            href="https://www.linkedin.com/in/inanoknowles/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Inano"
            title="Inano"
          >
            <img src={inano} alt="Inano" />
          </a>

          <a
            className="bf-footer__iconMinimal"
            href="https://www.linkedin.com/in/mahounda-poinsonnet-971a4115/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Mahounda"
            title="Mahounda"
          >
            <img src={mahounda} alt="Mahounda" />
          </a>

          <a
            className="bf-footer__iconMinimal"
            href="https://www.linkedin.com/in/rebecca-c-52141625/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Becky"
            title="Becky"
          >
            <img src={becky} alt="Becky" />
          </a>

          <a
            className="bf-footer__iconMinimal"
            href="https://www.linkedin.com/in/nancyvalentind/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nancy"
            title="Nancy"
          >
            <img src={nancy} alt="Nancy" />
          </a>
        </div>

        <p className="bf-footer__copyright">© {year} PodFlow Team</p>
      </div>
    </footer>
  );
}