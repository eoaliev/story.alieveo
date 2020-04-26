import React from 'react';
import {Link} from 'react-router-dom';
import './ListItem.css';

class ListItem extends React.Component {
  render(){
    // Получим статью которую нужно отобразить
    const article = this.props.article;

    // Отформатируем дату создания
    let created = article.created;
    if (created) {
      created = (new Date(created)).toLocaleDateString();
    }

    // Отформатируем имя
    const name = article.name.replace(/\.docx$/, '');

    return (
      <div className="card">
        <div className="card-image">
          <span className="card-date">{created}</span>
        </div>
        <div className="card-content">
          <Link to={`/articles/${article.external_id}`}>{name}</Link>
        </div>
      </div>
    );
  }
}

export default ListItem;
