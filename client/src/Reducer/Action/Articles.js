import {FETCH_ARTICLES} from './Type/Articles';
import axios from 'axios';

export function fetchArticles() {
  return async (dispatch, getState) => {
    const {limit, offset} = getState().articles;

    const response = await axios.get(
      '/api/articles',
      {
        params: {limit, offset},
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    dispatch({
      type: FETCH_ARTICLES,
      payload: response.data.items,
    });
  }
}
