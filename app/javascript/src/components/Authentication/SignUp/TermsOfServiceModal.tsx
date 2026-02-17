import React from "react";

import { XIcon } from "miruIcons";
import { Modal } from "StyledComponents";

const TermsOfServiceModal = ({ isOpen, onClose }) => (
  <Modal customStyle="max-w-screen-xl" isOpen={isOpen} onClose={onClose}>
    <div className="">
      <div className="mt-2 mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold">Terms of Service</h2>
        <button
          className="left-0 text-miru-gray-1000"
          type="button"
          onClick={onClose}
        >
          <XIcon size={32} weight="bold" />
        </button>
      </div>
      <p className="text-justify text-sm">
        Welcome to our online open source B2B SAAS Application
        (&quot;Service&quot;). By accessing or using our Service, you agree to
        be bound by these Terms of Service (&quot;Terms&quot;)
      </p>
      <ol className="ml-4 mt-4 list-decimal">
        <li className="mt-4 text-justify text-sm font-bold">Use of Service</li>
        <p className="mt-2 text-justify text-sm">
          Our Service is designed to help businesses track employee time, create
          and send invoices to clients, and allow clients to make payments
          against those invoices. You must be a registered user to access and
          use our Service. You may use our Service only for lawful purposes and
          in accordance with these Terms.
        </p>
        <li className="mt-4 text-justify text-sm font-bold">User Accounts</li>
        <p className="mt-2 text-justify text-sm">
          To access our Service, you must create a user account. You agree to
          provide accurate, current, and complete information during the
          registration process and to update such information as necessary to
          keep it accurate, current, and complete. You are responsible for
          safeguarding the password that you use to access the Service and for
          any activities or actions under your password.
        </p>
        <li className="mt-4 text-justify text-sm font-bold">Payment Terms</li>
        <p className="mt-2 text-justify text-sm">
          Our Service offers different payment plans for businesses. By
          subscribing to our Service, you agree to pay the fees associated with
          the plan that you have selected. Fees are billed in advance on a
          monthly or annual basis and are non-refundable.
        </p>
        <li className="mt-4 text-justify text-sm font-bold">
          Intellectual Property Rights
        </li>
        <p className="mt-2 text-justify text-sm">
          Our Service and its entire contents, features, and functionality are
          owned by us or our licensors and are protected by United States and
          international copyright, trademark, patent, trade secret, and other
          intellectual property or proprietary rights laws.
        </p>
        <li className="mt-4 text-justify text-sm font-bold">
          Disclaimer of Warranties
        </li>
        <p className="mt-2 text-justify text-sm">
          Our Service is provided &quot;as is&quot; and &quot;as available&quot;
          without any representation or warranty, express or implied. We do not
          warrant that the Service will be uninterrupted, error-free, or
          completely secure.
        </p>
        <li className="mt-4 text-justify text-sm font-bold">
          Limitation of Liability
        </li>
        <p className="mt-2 text-justify text-sm">
          Under no circumstances shall we be liable for any direct, indirect,
          incidental, consequential, special, or exemplary damages arising from
          the use or inability to use our Service.
        </p>
        <li className="mt-4 text-justify text-sm font-bold">Governing Law</li>
        <p className="mt-2 text-justify text-sm">
          These Terms shall be governed by and construed in accordance with the
          laws of the United States.
        </p>
        <li className="mt-4 text-justify text-sm font-bold">
          Changes to Terms
        </li>
        <p className="mt-2 text-justify text-sm">
          We reserve the right to modify these Terms at any time. We will post
          the current version of these Terms on our website and notify you of
          any material changes. Your continued use of our Service after any
          changes to these Terms constitutes your acceptance of such changes.
        </p>
      </ol>
      <p className="ml-4 mt-2 text-justify text-sm">
        If you have any questions about these Terms, please contact us at
        <a
          className="form__link ml-2 inline cursor-pointer"
          href="mailto:hello@saeloun.com"
        >
          hello@saeloun.com
        </a>
      </p>
    </div>
  </Modal>
);

export default TermsOfServiceModal;
