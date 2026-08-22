import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./pages/layout";

export default function App() {
  return (
    <Suspense>
      <Routes>
        <Route path="/" element={<Layout />} />
      </Routes>
    </Suspense>
  );
}
