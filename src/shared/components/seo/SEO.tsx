
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author = 'DigiBook Team',
}) => {
  const siteName = 'DigiBook';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const siteUrl = 'https://tienxdun.github.io/DigiBook/';
  const fullUrl = url ? `${siteUrl.replace(/\/$/, '')}${url}` : siteUrl;
  const defaultDescription = 'DigiBook - Nhà sách trực tuyến hiện đại, cung cấp hàng ngàn đầu sách bản quyền với sự hỗ trợ của AI.';
  const defaultImage = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop';

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || 'sách, mua sách online, bookstore, digibook, nhà sách trực tuyến, sách AI'} />
      <meta name="author" content={author} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title || siteName} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || siteName} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={image || defaultImage} />
    </Helmet>
  );
};

export default SEO;
