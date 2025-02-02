import fs from "fs";
import { BlogProps }  from '@/lib/contentful/api/props/blog';
var RSS = require('rss');

export default async function generateRssFeed(allPosts: [BlogProps]) {
  const site_url = "https://cr0ss.org";

  const feedOptions = {
    title: "cr0ss.org",
    description: "Personal and professional website on cr0ss.org!",
    site_url: site_url,
    feed_url: `${site_url}/rss.xml`,
    // image_url: `${site_url}/logo.jpeg`,
    pubDate: new Date(),
    copyright: `All rights reserved ${new Date().getFullYear()}`,
  };

  const feed = new RSS(feedOptions);

  // Add each individual post to the feed.
  allPosts.map((post) => {
    feed.item({
      title: post.title,
      description: post.summary,
      url: `${site_url}/blog/${post.slug}`,
      date: post.sys.createdAt,
    });
  });

  // Write the RSS feed to a file as XML.
  fs.writeFileSync("./public/rss.xml", feed.xml({ indent: true }));
}