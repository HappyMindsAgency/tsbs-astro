import { e as createComponent, g as addAttribute, k as renderScript, r as renderTemplate, h as createAstro, s as spreadAttributes, u as unescapeHTML, l as renderComponent, m as maybeRenderHead, n as renderHead } from '../chunks/astro/server_tFPxkzTL.mjs';
import 'piccolore';
import 'clsx';
/* empty css                                 */
import { strapi } from '@strapi/client';
export { renderers } from '../renderers.mjs';

const $$Astro$a = createAstro();
const $$ClientRouter = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$a, $$props, $$slots);
  Astro2.self = $$ClientRouter;
  const { fallback = "animate" } = Astro2.props;
  return renderTemplate`<meta name="astro-view-transitions-enabled" content="true"><meta name="astro-view-transitions-fallback"${addAttribute(fallback, "content")}>${renderScript($$result, "C:/Users/vitol/Documents/MyRepo/tsbs-astro/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/vitol/Documents/MyRepo/tsbs-astro/node_modules/astro/components/ClientRouter.astro", void 0);

const $$Astro$9 = createAstro();
const $$OpenGraphArticleTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$9, $$props, $$slots);
  Astro2.self = $$OpenGraphArticleTags;
  const { publishedTime, modifiedTime, expirationTime, authors, section, tags } = Astro2.props.openGraph.article;
  return renderTemplate`${publishedTime ? renderTemplate`<meta property="article:published_time"${addAttribute(publishedTime, "content")}>` : null}${modifiedTime ? renderTemplate`<meta property="article:modified_time"${addAttribute(modifiedTime, "content")}>` : null}${expirationTime ? renderTemplate`<meta property="article:expiration_time"${addAttribute(expirationTime, "content")}>` : null}${authors ? authors.map((author) => renderTemplate`<meta property="article:author"${addAttribute(author, "content")}>`) : null}${section ? renderTemplate`<meta property="article:section"${addAttribute(section, "content")}>` : null}${tags ? tags.map((tag) => renderTemplate`<meta property="article:tag"${addAttribute(tag, "content")}>`) : null}`;
}, "C:/Users/vitol/Documents/MyRepo/tsbs-astro/node_modules/astro-seo/src/components/OpenGraphArticleTags.astro", void 0);

const $$Astro$8 = createAstro();
const $$OpenGraphBasicTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$8, $$props, $$slots);
  Astro2.self = $$OpenGraphBasicTags;
  const { openGraph } = Astro2.props;
  return renderTemplate`<meta property="og:title"${addAttribute(openGraph.basic.title, "content")}><meta property="og:type"${addAttribute(openGraph.basic.type, "content")}><meta property="og:image"${addAttribute(openGraph.basic.image, "content")}><meta property="og:url"${addAttribute(openGraph.basic.url || Astro2.url.href, "content")}>`;
}, "C:/Users/vitol/Documents/MyRepo/tsbs-astro/node_modules/astro-seo/src/components/OpenGraphBasicTags.astro", void 0);

const $$Astro$7 = createAstro();
const $$OpenGraphImageTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$7, $$props, $$slots);
  Astro2.self = $$OpenGraphImageTags;
  const { image } = Astro2.props.openGraph.basic;
  const { secureUrl, type, width, height, alt } = Astro2.props.openGraph.image;
  return renderTemplate`<meta property="og:image:url"${addAttribute(image, "content")}>${secureUrl ? renderTemplate`<meta property="og:image:secure_url"${addAttribute(secureUrl, "content")}>` : null}${type ? renderTemplate`<meta property="og:image:type"${addAttribute(type, "content")}>` : null}${width ? renderTemplate`<meta property="og:image:width"${addAttribute(width, "content")}>` : null}${height ? renderTemplate`<meta property="og:image:height"${addAttribute(height, "content")}>` : null}${alt ? renderTemplate`<meta property="og:image:alt"${addAttribute(alt, "content")}>` : null}`;
}, "C:/Users/vitol/Documents/MyRepo/tsbs-astro/node_modules/astro-seo/src/components/OpenGraphImageTags.astro", void 0);

const $$Astro$6 = createAstro();
const $$OpenGraphOptionalTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots);
  Astro2.self = $$OpenGraphOptionalTags;
  const { optional } = Astro2.props.openGraph;
  return renderTemplate`${optional.audio ? renderTemplate`<meta property="og:audio"${addAttribute(optional.audio, "content")}>` : null}${optional.description ? renderTemplate`<meta property="og:description"${addAttribute(optional.description, "content")}>` : null}${optional.determiner ? renderTemplate`<meta property="og:determiner"${addAttribute(optional.determiner, "content")}>` : null}${optional.locale ? renderTemplate`<meta property="og:locale"${addAttribute(optional.locale, "content")}>` : null}${optional.localeAlternate?.map((locale) => renderTemplate`<meta property="og:locale:alternate"${addAttribute(locale, "content")}>`)}${optional.siteName ? renderTemplate`<meta property="og:site_name"${addAttribute(optional.siteName, "content")}>` : null}${optional.video ? renderTemplate`<meta property="og:video"${addAttribute(optional.video, "content")}>` : null}`;
}, "C:/Users/vitol/Documents/MyRepo/tsbs-astro/node_modules/astro-seo/src/components/OpenGraphOptionalTags.astro", void 0);

const $$Astro$5 = createAstro();
const $$ExtendedTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$ExtendedTags;
  const { props } = Astro2;
  return renderTemplate`${props.extend.link?.map((attributes) => renderTemplate`<link${spreadAttributes(attributes)}>`)}${props.extend.meta?.map(({ content, httpEquiv, media, name, property }) => renderTemplate`<meta${addAttribute(name, "name")}${addAttribute(property, "property")}${addAttribute(content, "content")}${addAttribute(httpEquiv, "http-equiv")}${addAttribute(media, "media")}>`)}`;
}, "C:/Users/vitol/Documents/MyRepo/tsbs-astro/node_modules/astro-seo/src/components/ExtendedTags.astro", void 0);

const $$Astro$4 = createAstro();
const $$TwitterTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$TwitterTags;
  const { card, site, title, creator, description, image, imageAlt } = Astro2.props.twitter;
  return renderTemplate`${card ? renderTemplate`<meta name="twitter:card"${addAttribute(card, "content")}>` : null}${site ? renderTemplate`<meta name="twitter:site"${addAttribute(site, "content")}>` : null}${title ? renderTemplate`<meta name="twitter:title"${addAttribute(title, "content")}>` : null}${image ? renderTemplate`<meta name="twitter:image"${addAttribute(image, "content")}>` : null}${imageAlt ? renderTemplate`<meta name="twitter:image:alt"${addAttribute(imageAlt, "content")}>` : null}${description ? renderTemplate`<meta name="twitter:description"${addAttribute(description, "content")}>` : null}${creator ? renderTemplate`<meta name="twitter:creator"${addAttribute(creator, "content")}>` : null}`;
}, "C:/Users/vitol/Documents/MyRepo/tsbs-astro/node_modules/astro-seo/src/components/TwitterTags.astro", void 0);

const $$Astro$3 = createAstro();
const $$LanguageAlternatesTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$LanguageAlternatesTags;
  const { languageAlternates } = Astro2.props;
  return renderTemplate`${languageAlternates.map((alternate) => renderTemplate`<link rel="alternate"${addAttribute(alternate.hrefLang, "hreflang")}${addAttribute(alternate.href, "href")}>`)}`;
}, "C:/Users/vitol/Documents/MyRepo/tsbs-astro/node_modules/astro-seo/src/components/LanguageAlternatesTags.astro", void 0);

const $$Astro$2 = createAstro();
const $$SEO = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$SEO;
  Astro2.props.surpressWarnings = true;
  function validateProps(props) {
    if (props.openGraph) {
      if (!props.openGraph.basic || (props.openGraph.basic.title ?? void 0) == void 0 || (props.openGraph.basic.type ?? void 0) == void 0 || (props.openGraph.basic.image ?? void 0) == void 0) {
        throw new Error(
          "If you pass the openGraph prop, you have to at least define the title, type, and image basic properties!"
        );
      }
    }
    if (props.title && props.openGraph?.basic.title) {
      if (props.title == props.openGraph.basic.title && !props.surpressWarnings) {
        console.warn(
          "WARNING(astro-seo): You passed the same value to `title` and `openGraph.optional.title`. This is most likely not what you want. See docs for more."
        );
      }
    }
    if (props.openGraph?.basic?.image && !props.openGraph?.image?.alt && !props.surpressWarnings) {
      console.warn(
        "WARNING(astro-seo): You defined `openGraph.basic.image`, but didn't define `openGraph.image.alt`. This is strongly discouraged.'"
      );
    }
  }
  validateProps(Astro2.props);
  let updatedTitle = "";
  if (Astro2.props.title) {
    updatedTitle = Astro2.props.title;
    if (Astro2.props.titleTemplate) {
      updatedTitle = Astro2.props.titleTemplate.replace(/%s/g, updatedTitle);
    }
  } else if (Astro2.props.titleDefault) {
    updatedTitle = Astro2.props.titleDefault;
  }
  const baseUrl = Astro2.site ?? Astro2.url;
  const defaultCanonicalUrl = new URL(Astro2.url.pathname + Astro2.url.search, baseUrl);
  return renderTemplate`${updatedTitle ? renderTemplate`<title>${unescapeHTML(updatedTitle)}</title>` : null}${Astro2.props.charset ? renderTemplate`<meta${addAttribute(Astro2.props.charset, "charset")}>` : null}<link rel="canonical"${addAttribute(Astro2.props.canonical || defaultCanonicalUrl.href, "href")}>${Astro2.props.description ? renderTemplate`<meta name="description"${addAttribute(Astro2.props.description, "content")}>` : null}<meta name="robots"${addAttribute(`${Astro2.props.noindex ? "noindex" : "index"}, ${Astro2.props.nofollow ? "nofollow" : "follow"}`, "content")}>${Astro2.props.openGraph && renderTemplate`${renderComponent($$result, "OpenGraphBasicTags", $$OpenGraphBasicTags, { ...Astro2.props })}`}${Astro2.props.openGraph?.optional && renderTemplate`${renderComponent($$result, "OpenGraphOptionalTags", $$OpenGraphOptionalTags, { ...Astro2.props })}`}${Astro2.props.openGraph?.image && renderTemplate`${renderComponent($$result, "OpenGraphImageTags", $$OpenGraphImageTags, { ...Astro2.props })}`}${Astro2.props.openGraph?.article && renderTemplate`${renderComponent($$result, "OpenGraphArticleTags", $$OpenGraphArticleTags, { ...Astro2.props })}`}${Astro2.props.twitter && renderTemplate`${renderComponent($$result, "TwitterTags", $$TwitterTags, { ...Astro2.props })}`}${Astro2.props.extend && renderTemplate`${renderComponent($$result, "ExtendedTags", $$ExtendedTags, { ...Astro2.props })}`}${Astro2.props.languageAlternates && renderTemplate`${renderComponent($$result, "LanguageAlternatesTags", $$LanguageAlternatesTags, { ...Astro2.props })}`}`;
}, "C:/Users/vitol/Documents/MyRepo/tsbs-astro/node_modules/astro-seo/src/SEO.astro", void 0);

function getStrapiMediaUrl(mediaUrlString) {
  if (!mediaUrlString) return "";
  const mediaUrl = String(mediaUrlString).trim();
  if (/^https?:\/\//i.test(mediaUrl)) {
    return mediaUrl;
  }
  if (mediaUrl.startsWith("//")) {
    return `https:${mediaUrl}`;
  }
  const baseUrl = String("").replace(/\/+$/, "");
  const normalizedPath = mediaUrl.startsWith("/") ? mediaUrl : `/${mediaUrl}`;
  return `${baseUrl}${normalizedPath}`;
}

const $$Astro$1 = createAstro();
const $$Head = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Head;
  const { entita, documentId, lang = "it" } = Astro2.props;
  const defaultTitle = "The Secret Bookish Society - Biblioteca Classense";
  const client = strapi({
    baseURL: ""
  });
  let endpoint = "";
  let populate = [];
  let filters = {};
  if (documentId && entita) {
    endpoint = entita;
    filters = { documentId };
  } else if (!documentId && entita) {
    endpoint = entita;
  } else if (!entita) {
    endpoint = "pagina-home";
  }
  if (entita === "pagina-privacy-policy" || entita === "pagina-cookie-policy") {
    populate = [
      "seo"
    ];
  } else {
    if (documentId) {
      populate = [
        "seo",
        "seo.metaSocial",
        "seo.metaSocial.image"
      ];
    } else {
      populate = [
        "seo",
        "seo.metaSocial",
        "seo.metaSocial.image"
      ];
    }
  }
  let getSEOdataFetch;
  let getSEORawData;
  let seo;
  if (documentId) {
    getSEOdataFetch = client.collection(endpoint);
    getSEORawData = await getSEOdataFetch.find({
      populate,
      locale: lang,
      filters
    });
    seo = getSEORawData.data[0].seo;
  } else {
    getSEOdataFetch = client.single(endpoint);
    getSEORawData = await getSEOdataFetch.find({
      populate,
      locale: lang
    });
    seo = getSEORawData.data.seo;
  }
  const defaultSEORawData = await client.single("pagina-home").find({
    populate: [
      "seo",
      "seo.metaSocial",
      "seo.metaSocial.image"
    ],
    locale: "it"
  });
  const defaultSEO = defaultSEORawData.data.seo;
  const titleDefault = seo ? seo.metaTitle ? seo.metaTitle : documentId ? seo && seo.titolo ? seo.titolo : defaultTitle : seo && seo.headerHero && seo.headerHero.titolo ? seo.headerHero.titolo : defaultTitle : documentId ? seo && seo.titolo ? seo.titolo : defaultTitle : seo && seo.headerHero && seo.headerHero.titolo ? seo.headerHero.titolo : defaultTitle;
  let metaSocialGeneric = seo?.metaSocial && seo.metaSocial[0] ? seo.metaSocial[0] : defaultSEO.metaSocial[0];
  let metaSocialTwitter = seo?.metaSocial && seo.metaSocial[1] ? seo.metaSocial[1] : defaultSEO.metaSocial[1];
  if (typeof metaSocialGeneric !== "object" || metaSocialGeneric === null) metaSocialGeneric = {};
  if (typeof metaSocialTwitter !== "object" || metaSocialTwitter === null) metaSocialTwitter = {};
  metaSocialGeneric.title = metaSocialGeneric.title || titleDefault;
  metaSocialGeneric.description = metaSocialGeneric.description || "";
  metaSocialTwitter.title = metaSocialTwitter.title || titleDefault;
  metaSocialTwitter.description = metaSocialTwitter.description || "";
  return renderTemplate`<head><!-- SEO DA INSERIRE -->${renderComponent($$result, "SEO", $$SEO, { "title": titleDefault, "titleDefault": titleDefault, "description": seo ? seo.metaDescription : "", "noindex": seo ? seo && seo.metaRobots && seo.metaRobots.includes("noindex") ? true : false : true, "nofollow": seo ? seo && seo.metaRobots && seo.metaRobots.includes("nofollow") ? true : false : true, "openGraph": {
    basic: {
      title: metaSocialGeneric ? metaSocialGeneric.title : "",
      type: "website",
      image: metaSocialGeneric && metaSocialGeneric.image ? getStrapiMediaUrl(metaSocialGeneric.image.url) : "",
      url: Astro2.url.href
    },
    optional: {
      description: metaSocialGeneric ? metaSocialGeneric.description : "",
      locale: "it"
    }
  }, "extend": {
    // extending the default link tags
    link: [{ rel: "image/x-icon", href: "/favicon.ico" }],
    // extending the default meta tags
    meta: [
      {
        name: "twitter:image",
        content: metaSocialTwitter && metaSocialTwitter.image ? getStrapiMediaUrl(metaSocialTwitter.image.url) : ""
      },
      { name: "twitter:title", content: metaSocialTwitter ? metaSocialTwitter.title : "" },
      { name: "twitter:description", content: metaSocialTwitter ? metaSocialTwitter.description : "" }
    ]
  } })}<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><!-- FAVICON DA INSERIRE --><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin><link rel="preload" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">${maybeRenderHead()}<noscript><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"></noscript><link rel="preload" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css"></noscript>${renderComponent($$result, "ClientRouter", $$ClientRouter, {})}${renderHead()}</head>`;
}, "C:/Users/vitol/Documents/MyRepo/tsbs-astro/src/components/Head.astro", void 0);

const $$Astro = createAstro();
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const { lang = "it " } = Astro2.props;
  return renderTemplate`<html${addAttribute(lang, "lang")}> ${renderComponent($$result, "Head", $$Head, { "lang": lang })}${maybeRenderHead()}<body> <h1>Astro</h1> </body></html>`;
}, "C:/Users/vitol/Documents/MyRepo/tsbs-astro/src/pages/index.astro", void 0);

const $$file = "C:/Users/vitol/Documents/MyRepo/tsbs-astro/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
