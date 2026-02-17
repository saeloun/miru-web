import {
  MIRU_APP_SUPPORT_EMAIL_ID,
  GOOGLE_PRIVACY_URL,
  AWS_PRIVACY_URL,
  STRIPE_PRIVACY_URL,
} from "constants/index";

import React from "react";

import { XIcon } from "miruIcons";
import { Modal } from "StyledComponents";

const PrivacyPolicyModal = ({ isOpen, onClose }) => (
  <Modal customStyle="max-w-screen-xl" isOpen={isOpen} onClose={onClose}>
    <div className="">
      <div className="mt-2 mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold">Privacy Policy for Miru Inc</h2>
        <button
          className="left-0 text-miru-gray-1000"
          type="button"
          onClick={onClose}
        >
          <XIcon size={32} weight="bold" />
        </button>
      </div>
      <p className="text-justify text-sm">Last Updated on 26th April 2023</p>
      <p className="mt-2 text-justify text-sm">
        At Miru, accessible from www.miru.so, one of our main priorities is the
        privacy of our visitors. This Privacy Policy document contains types of
        information that is collected and recorded by Miru and how we use it.
      </p>
      <p className="mt-2 text-justify text-sm">
        If you have additional questions or require more information about our
        Privacy Policy, do not hesitate to contact us
      </p>
      <p className="mt-2 text-justify text-sm">
        This Privacy Policy applies only to our online activities and is valid
        for visitors to our website with regards to the information that they
        shared and/or collected in Miru. This policy is not applicable to any
        information collected offline or via channels other than this website.
        Our Privacy Policy was created with the help of the Free Privacy Policy
        Generator
      </p>
      <h3 className="mt-2 text-lg font-semibold">Consent</h3>
      <p className="text-jus mt-2 text-sm">
        By using our website, you hereby consent to our Privacy Policy and agree
        to its terms
      </p>
      <h3 className="mt-2 text-lg font-semibold">
        Information we collect & How we collect it{" "}
      </h3>
      <p className="mt-2 text-justify text-sm">
        The personal information that you are asked to provide, and the reasons
        why you are asked to provide it, will be made clear to you at the point
        we ask you to provide your personal information. We collect information
        from and about users of our Platform:
      </p>
      <ol className="ml-10 list-decimal">
        <li className="text-justify text-sm">
          Directly from you when you provide it to us, such as when you make a
          purchase, visit or use our website, place an order with us, contact us
          by email, by phone, or by online chat, register for an online account,
          participate in a contest or sweepstakes, respond to a survey, comment
          on blog posts, engage in a promotional activity, or sign up for
          emails, newsletters, or marketing.
        </li>
        <li className="text-justify text-sm">
          Automatically when you use the Platform, including automatically
          collected information, but which generally does not include personal
          information unless you provide it through the Platform or you choose
          to share it with us.{" "}
        </li>
        <li className="text-justify text-sm">
          Certain information from third parties, such as social media platforms
          and networks that you use in connection with our website, or that
          share or allow you to share information with us; service providers
          that we use that provide us with information about you and the devices
          you use online; and other third parties that we choose to collaborate
          with in order to make the Platform and its services available for your
          use.
        </li>
      </ol>
      <h3 className="mt-2 text-lg font-semibold">
        Information You Provide to Us
      </h3>
      <p className="mt-2 text-justify text-sm">
        When you download, register with, or use this Platform, we may ask you
        provide information:
      </p>
      <ol className="ml-10 list-decimal">
        <li className="text-justify text-sm">
          By which you may be personally identified, such as name, postal
          address, email address, telephone number, or any other identifier by
          which you may be contacted online or offline(“
          <b> personal information</b>”).
        </li>
        <li className="text-justify text-sm">
          That is about you but individually does not identify you, such as
          anonymized data relating to your use of the Platform.
        </li>
      </ol>
      <p className="mt-2 text-justify text-sm">This information includes:</p>
      <ol className="ml-10 list-decimal">
        <li className="text-justify text-sm">
          Information that you provide by filling in forms in the Platform,
          creating or bidding on Platform contracts, or otherwise interacting
          with other users on the Platform. This includes information provided
          at the time of registering to use the Platform, subscribing to or
          utilizing our services, posting materials in or related to the
          Platform, and requesting further services. We may also ask you for
          information when you enter a contest or promotion sponsored by us, and
          when you report a problem with the Platform
        </li>
        <li className="text-justify text-sm">
          Records and copies of your correspondence (including email addresses
          and phone numbers) if you contact us.
        </li>
        <li className="text-justify text-sm">
          Your responses to surveys that we might ask you to complete for
          research purposes.
        </li>
        <li className="text-justify text-sm">
          Details of transactions you carry out through the Platform and of the
          fulfillment of your orders. You may be required to provide financial
          information before placing an order through the Platform.
        </li>
        <li className="text-justify text-sm">
          Your search queries on the Platform.
        </li>
        <li className="text-justify text-sm">Employment information.</li>
      </ol>
      <h3 className="mt-2 text-lg font-semibold">
        How we use your information
      </h3>
      <p className="mt-2 text-justify text-sm">
        We use the information we collect in various ways, including to:
      </p>
      <ol className="ml-10 list-decimal">
        <li className="text-justify text-sm">
          Provide, operate, and maintain our website .
        </li>
        <li className="text-justify text-sm">
          Improve, personalize, and expand our website
        </li>
        <li className="text-justify text-sm">
          Understand and analyze how you use our website
        </li>
        <li className="text-justify text-sm">
          Develop new products, services, features, and functionality
        </li>
        <li className="text-justify text-sm">
          Communicate with you, either directly or through one of our partners,
          including for customer service, to provide you with updates and other
          information relating to the website, and for marketing and promotional
          purposes
        </li>
        <li className="text-justify text-sm">Send you emails</li>
        <li className="text-justify text-sm">Find and prevent fraud</li>
        <li className="text-justify text-sm">
          Provide Miru with marketing analytics and insights
        </li>
      </ol>
      <p className="mt-2 text-justify text-sm">
        We may also use your information to contact you about goods and services
        that may be of interest to you. If you do not want us to use your
        information in this way, contact Miru support at{" "}
        <a
          className="form__link inline cursor-pointer"
          href={MIRU_APP_SUPPORT_EMAIL_ID}
        >
          hello@saeloun.com.
        </a>
      </p>
      <h3 className="mt-2 text-lg font-semibold">
        Disclosure of Your Information
      </h3>
      <p className="mt-2 text-justify text-sm">
        We may disclose aggregated information about our users, and information
        that does not identify any individual or device, without restriction. We
        do not sell, trade or otherwise transfer Personal Information to outside
        parties (except to the third parties with whom we have contracted to
        provide services to us, as detailed in the applicable section below).
      </p>
      <p className="mt-2 text-justify text-sm">
        {" "}
        In addition, we may disclose personal information that we collect or you
        provide:
      </p>
      <ol className="ml-10 list-decimal">
        <li className="text-justify text-sm">
          To our subsidiaries and affiliates to perform any of the actions or
          activities allowed under this policy.
        </li>
        <li className="text-justify text-sm">
          To contractors, service providers, and other third parties we use to
          support our business and who are bound by contractual obligations to
          keep personal information confidential and use it only for the
          purposes for which we disclose it to them.
        </li>
        <li className="text-justify text-sm">
          To fulfill the purpose for which you provide it.
        </li>
        <li className="text-justify text-sm">
          For any other purpose disclosed by us when you provide the
          information.
        </li>
        <li className="text-justify text-sm">With your consent.</li>
        <li className="text-justify text-sm">
          To third party service providers in connection with the Platform’s
          services, which utilize their own terms and conditions and privacy
          policies:
          <ol className="ml-4 list-lower">
            <li>
              <a
                className="form__link inline cursor-pointer"
                href={GOOGLE_PRIVACY_URL}
              >
                Google
              </a>
            </li>
            <li>
              <a
                className="form__link inline cursor-pointer"
                href={AWS_PRIVACY_URL}
              >
                Amazon Web Services
              </a>
            </li>
            <li>
              <a
                className="form__link inline cursor-pointer"
                href={STRIPE_PRIVACY_URL}
              >
                Stripe
              </a>
            </li>
          </ol>
        </li>
        <li className="text-justify text-sm">Find and prevent fraud</li>
        <li className="text-justify text-sm">
          Provide Miru with marketing analytics and insights
        </li>
        <li className="text-justify text-sm">
          To enforce our rights arising from any contracts entered into between
          you and us, including, as applicable, the Platform EULA, terms of
          sale, Terms and Conditions of Use, and for billing and collection.
        </li>
        <li className="text-justify text-sm">
          If we believe disclosure is necessary or appropriate to protect the
          rights, property, or safety of Miru, our customers or others. This
          includes exchanging information with other companies and organizations
          for the purposes of fraud protection and credit risk reduction.
        </li>
      </ol>
      <h3 className="mt-2 text-lg font-semibold">Log files</h3>
      <p className="mt-2 text-justify text-sm">
        Miru follows a standard procedure of using log files. These files log
        visitors when they visit websites. All hosting companies do this as part
        of hosting services&apos; analytics. The information collected by log
        files include internet protocol (IP) addresses, browser type, Internet
        Service Provider (ISP), date and time stamp, referring/exit pages, and
        possibly the number of clicks. These are not linked to any information
        that is personally identifiable. The purpose of the information is for
        analyzing trends, administering the site, tracking users&apos; movement
        on the website, and gathering demographic information.
      </p>
      <h3 className="mt-2 text-lg font-semibold">
        Advertising Partners Privacy Policies
      </h3>
      <p className="mt-2 text-justify text-sm">
        You may consult this list to find the Privacy Policy for each of the
        advertising partners of Miru.
      </p>
      <p className="mt-2 text-justify text-sm">
        Third-party ad servers or ad networks use technologies like cookies,
        JavaScript, or Web Beacons that are used in their respective
        advertisements and links that appear on Miru, which are sent directly to
        users&apos; browsers. They automatically receive your IP address when
        this occurs. These technologies are used to measure the effectiveness of
        their advertising campaigns and/or to personalize the advertising
        content that you see on websites that you visit.
      </p>
      <p className="mt-2 text-justify text-sm">
        Note that Miru has no access to or control over these cookies that are
        used by third-party advertisers.
      </p>
      <h3 className="mt-2 text-lg font-semibold">
        Third Party Privacy Policies
      </h3>
      <p className="mt-2 text-justify text-sm">
        Miru&apos;s Privacy Policy does not apply to other advertisers or
        websites. Thus, we are advising you to consult the respective Privacy
        Policies of these third-party ad servers for more detailed information.
        It may include their practices and instructions about how to opt-out of
        certain options.
      </p>
      <p className="mt-2 text-justify text-sm">
        You can choose to disable cookies through your individual browser
        options. To know more detailed information about cookie management with
        specific web browsers, it can be found at the browsers&apos; respective
        websites.
      </p>
      <h3 className="mt-2 text-lg font-semibold">
        CCPA Privacy Rights (Do Not Sell My Personal Information)
      </h3>
      <p className="mt-2 text-justify text-sm">
        Under the CCPA, among other rights, California consumers have the right
        to:
      </p>
      <ol className="ml-10 list-decimal">
        <li className="text-justify text-sm">
          Request that a business that collects a consumer&apos;s personal data
          disclose the categories and specific pieces of personal data that a
          business has collected about consumers.
        </li>
        <li className="text-justify text-sm">
          Request that a business delete any personal data about the consumer
          that a business has collected.
        </li>
        <li className="text-justify text-sm">
          Request that a business that sells a consumer&apos;s personal data,
          not sell the consumer&apos;s personal data.
        </li>
        <li className="text-justify text-sm">
          If you make a request, we have one month to respond to you. If you
          would like to exercise any of these rights, please contact us.
        </li>
      </ol>
      <h3 className="mt-2 text-lg font-semibold">
        Third Party Privacy Policies
      </h3>
      <p className="mt-2 text-justify text-sm">
        We would like to make sure you are fully aware of all of your data
        protection rights. Every user is entitled to the following:
      </p>
      <ol className="ml-10 list-decimal">
        <li className="text-justify text-sm">
          The right to access – You have the right to request copies of your
          personal data. We may charge you a small fee for this service.
        </li>
        <li className="text-justify text-sm">
          The right to rectification – You have the right to request that we
          correct any information you believe is inaccurate. You also have the
          right to request that we complete the information you believe is
          incomplete.
        </li>
        <li className="text-justify text-sm">
          The right to erasure – You have the right to request that we erase
          your personal data, under certain conditions.
        </li>
        <li className="text-justify text-sm">
          The right to restrict processing – You have the right to request that
          we restrict the processing of your personal data, under certain
          conditions.
        </li>
        <li className="text-justify text-sm">
          The right to object to processing – You have the right to object to
          our processing of your personal data, under certain conditions.
        </li>
        <li className="text-justify text-sm">
          The right to data portability – You have the right to request that we
          transfer the data that we have collected to another organization, or
          directly to you, under certain conditions.
        </li>
        <li className="text-justify text-sm">
          If you make a request, we have one month to respond to you. If you
          would like to exercise any of these rights, please contact us.
        </li>
      </ol>
      <h3 className="mt-2 text-lg font-semibold">
        Children&apos;s Information
      </h3>
      <p className="mt-2 text-justify text-sm">
        Another part of our priority is adding protection for children while
        using the internet. We encourage parents and guardians to observe,
        participate in, and/or monitor and guide their online activity.
      </p>
      <p className="mt-2 text-justify text-sm">
        Miru does not knowingly collect any Personal Identifiable Information
        from children under the age of 13. If you think that your child provided
        this kind of information on our website, we strongly encourage you to
        contact us immediately and we will do our best efforts to promptly
        remove such information from our records.
      </p>
      <h3 className="mt-2 text-lg font-semibold">
        Integration and Links to Other Websites
      </h3>
      <p className="mt-2 text-justify text-sm">
        Our website and our product may contain links and provide integrations
        to other sites and products of other organizations. We offer these links
        and integrations as a convenience to you; we do not operate, control, or
        endorse these websites or products. It is your choice whether to utilize
        these links and integrations or not. These external websites and
        products are subject to their own privacy policies.
      </p>
      <h3 className="mt-2 text-lg font-semibold">
        How will I know if there are any changes to this Privacy Policy?
      </h3>
      <p className="mt-2 text-justify text-sm">
        This Privacy Policy is effective as of the “Last Updated” date specified
        at the top of this Privacy Policy and will remain in effect except with
        respect to any changes in its provisions in the future, which will be in
        effect immediately after being posted on this page.
      </p>
      <p className="mt-2 text-justify text-sm">
        We reserve the right to update or change our Privacy Policy at any time
        and you should check this Privacy Policy periodically. Your continued
        use of the Service after we post any modifications to the Privacy Policy
        on this page will constitute your acknowledgment of the modifications
        and your consent to abide and be bound by the modified Privacy Policy.
      </p>
      <p className="mt-2 text-justify text-sm">
        If we make any material changes to this Privacy Policy, we will notify
        you either through the email address you have provided us, and/or by
        placing a prominent notice on the Site and/or Service.
      </p>
      <h3 className="mt-2 text-lg font-semibold">Contact us</h3>
      <p className="mt-2 text-justify text-sm">
        If you have any questions, you can contact us at{" "}
        <a
          className="form__link inline cursor-pointer"
          href={MIRU_APP_SUPPORT_EMAIL_ID}
        >
          hello@saeloun.com.
        </a>
      </p>
    </div>
  </Modal>
);

export default PrivacyPolicyModal;
