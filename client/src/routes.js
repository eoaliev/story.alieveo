import React from 'react';
import {Routes, Route} from 'react-router-dom';
import {IndexView} from "./View/IndexView";

export const useRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<IndexView />} />
    </Routes>
  )
}
