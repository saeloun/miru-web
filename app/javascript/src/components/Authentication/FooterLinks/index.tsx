import React from "react";

import FOOTER_LINKS from "./utils";

const FooterLinks = () => (
  <div className="absolute bottom-0 mx-auto mb-4 w-4/5 md:mb-10 md:w-full">
    <ul className="flex items-center justify-center">
      {FOOTER_LINKS?.map((footerLink, i) => (
        <li className="flex items-center" key={footerLink.text}>
          <a
            className="block font-manrope text-xs leading-4 text-miru-dark-purple-200"
            href={footerLink.link}
            rel="noreferrer noopener"
          >
            {footerLink.text}
          </a>
          {i < FOOTER_LINKS.length - 1 ? (
            <span className="mx-2 mb-2 block p-0 font-manrope text-base font-bold leading-4 text-miru-dark-purple-200">
              .
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  </div>
);

export default FooterLinks;
