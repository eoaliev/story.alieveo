import React from 'react';
import {BrowserRouter} from 'react-router-dom'
import {useRoutes} from "./routes";

function App() {
  const routes = useRoutes();

  return (
    <div className="app-container">
      <nav>
        <div className="nav-wrapper main-navigation">
          <div className="container">
            <a href="/" className="brand-logo">Story.Alieveo</a>
          </div>
        </div>
      </nav>
      <main className="container">
        <BrowserRouter>
          {routes}
        </BrowserRouter>
      </main>
      <footer className="page-footer">
        <div className="footer-copyright">
          <div className="container">
            <span>© 2019 Emil Aliev</span>
            <span className="grey-text text-lighten-4 right">
              Копирование материалов сайта, без указания источника, запрещено!
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
