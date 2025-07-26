import React from 'react';

const articles = [
  {
    id: 1,
    title: 'Getting Started with Stock Investing',
    summary: 'Learn the basics of stock investing, portfolio management, and risk assessment.',
    link: '#',
  },
  {
    id: 2,
    title: 'Understanding Financial Metrics',
    summary: 'A guide to key financial metrics like P/E ratio, market cap, and volume.',
    link: '#',
  },
  {
    id: 3,
    title: 'AI in Finance: Opportunities & Risks',
    summary: 'Explore how AI is transforming financial analysis and trading.',
    link: '#',
  },
];

export default function EducationHub() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Education Hub</h1>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <div key={article.id} className="glassmorphic-card p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">{article.title}</h2>
              <p className="text-gray-700 mb-4">{article.summary}</p>
            </div>
            <a href={article.link} className="gradient-btn w-fit">Read More</a>
          </div>
        ))}
      </div>
    </div>
  );
}
