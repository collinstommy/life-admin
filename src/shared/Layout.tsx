import type { FC, PropsWithChildren } from "hono/jsx";
import { HtmlEscapedString } from "hono/utils/html";

const Head: FC<{ title: string }> = ({ title }) => {
  return (
    <head>
      <meta
        name="viewport"
        content="initial-scale=1,maximum-scale=1,user-scalable=no"
      />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link href="/static/styles.css" rel="stylesheet" />

      {/* <meta name="htmx-config" content='{"defaultSwapStyle":"outerHTML"}' />
      <script src="https://unpkg.com/htmx.org@1.9.3"></script>
      <script src="https://unpkg.com/hyperscript.org@0.9.9"></script> */}

      <script src="/static/index.js"></script>

      <title>{title}</title>
    </head>
  );
};

export const Layout = ({
  children,
}: PropsWithChildren<{ script?: HtmlEscapedString }>) => {
  return (
    <html>
      <Head title="" />
      <body hx-boost="true" class="bg-gray-50">
        {children}
      </body>
    </html>
  );
};
