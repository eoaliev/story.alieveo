import React from 'react';
import ListItem from './ListItem';
import {connect} from 'react-redux';
import {fetchArticles} from 'Reducer/Action/Articles'
import './List.css';

class List extends React.Component {
  // После загрузки компонента загрузим статьи
  componentDidMount(){
    this.props.fetchArticles();
  }

  render(){
    // Получим статьи которые нужно отобразить
    const articles = this.props.articles;

    const template = [];

    // Разобъем статьи на чанки по 3 статьи
    // У нас в строке будет ровна по столько
    for (let i = 0; i < articles.length; i += 3) {
      const list = articles.slice(i, i + 3).map(
        (article) => (<ListItem article={article} key={article.external_id} />)
      );

      // Шаблон для одной строки статей
      template.push(
        (<div className="article-list" key={`article-row-${i}`}>{list}</div>)
      );
    }

    return template;
  }
}

// Настраиваем зависимость от стора
export default connect(
  (state) => ({
    articles: state.articles.articles,
  }),
  {
    fetchArticles
  }
)(List);
