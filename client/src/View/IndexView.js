import React from 'react';
import ArticleList from 'Component/Article/List';

export const IndexView = () => {
  const articles = [{
    created: (new Date()).toISOString(),
    name: 'Test article',
    preview: 'https://materializecss.com/images/sample-1.jpg',
    external_id: 11,
  }];
  return (<ArticleList articles={articles} />);
}
