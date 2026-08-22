import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";

export default function App () {
  return (
    <Suspense>
      <Routes>
        <Route path="/" />
      </Routes>
    </Suspense>
  )
}