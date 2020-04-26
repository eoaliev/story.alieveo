import {FETCH_ARTICLES} from "./Action/Type/Articles";

// Состояние по умолчанию
const defaultState = {
  articles: [],
  limit: 21,
  offset: 0,
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case FETCH_ARTICLES:
      return {...state, articles: action.payload};
    default:
      return state;
  }
}
