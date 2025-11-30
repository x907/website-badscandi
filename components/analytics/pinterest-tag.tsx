"use client";

import Script from "next/script";

export function PinterestTag() {
  const TAG_ID = process.env.NEXT_PUBLIC_PINTEREST_TAG_ID;

  if (!TAG_ID) {
    return null;
  }

  return (
    <Script id="pinterest-tag" strategy="afterInteractive">
      {`
        !function(e){if(!window.pintrk){window.pintrk = function () {
        window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
        n=window.pintrk;n.queue=[],n.version="3.0";var
        t=document.createElement("script");t.async=!0,t.src=e;var
        r=document.getElementsByTagName("script")[0];
        r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
        pintrk('load', '${TAG_ID}', {em: '<user_email_address>'});
        pintrk('page');
      `}
    </Script>
  );
}
